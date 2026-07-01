import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const parthId = new mongoose.Types.ObjectId('6a43a80dc903e3677a909fbe');
  
  const ChatSession = mongoose.model('ChatSession', new mongoose.Schema({}, { strict: false }));

  const sessions = await ChatSession.find({ astrologerId: parthId, status: 'completed' }).lean();
  console.log(`Found ${sessions.length} completed sessions for Parth`);

  let totalNetBackfilled = 0;

  for (const s of sessions) {
    const existingLog = await mongoose.connection.db.collection('revenuelogs').findOne({ sessionId: s._id.toString() });
    if (existingLog) {
      console.log(`Session ${s._id} already has a RevenueLog. Skipping.`);
      continue;
    }

    const grossAmount = s.amountDeducted || 0;
    if (grossAmount <= 0) {
      console.log(`Session ${s._id} has zero gross amount. Skipping.`);
      continue;
    }

    const commissionPercent = 30;
    const netAmount = Number((grossAmount * (1 - commissionPercent / 100)).toFixed(2));
    const commissionAmount = Number((grossAmount - netAmount).toFixed(2));

    let sessionTypeLabel = 'Chat Session';
    if (s.type === 'audio_call' || s.type === 'audio') sessionTypeLabel = 'Audio Call';
    if (s.type === 'video_call' || s.type === 'video') sessionTypeLabel = 'Video Call';

    console.log(`Backfilling session ${s._id}: type=${s.type}, grossAmount=${grossAmount}, netAmount=${netAmount}, duration=${s.durationSeconds}`);

    // Update Astrologer
    const updateQuery = {
      $inc: {
        'earnings.total': netAmount,
        'earnings.available': netAmount,
        totalEarnings: netAmount,
      }
    };
    if (s.type === 'chat') {
      updateQuery.$inc.totalChats = 1;
    } else if (s.type === 'audio_call' || s.type === 'audio') {
      updateQuery.$inc.totalAudioCalls = 1;
    } else if (s.type === 'video_call' || s.type === 'video') {
      updateQuery.$inc.totalVideoCalls = 1;
    }

    await mongoose.connection.db.collection('astrologers').updateOne({ _id: parthId }, updateQuery);

    // Create Transaction
    await mongoose.connection.db.collection('transactions').insertOne({
      userId: parthId,
      type: 'recharge',
      amount: netAmount,
      desc: `[Earning] ${sessionTypeLabel} Earning (Backfill) | Gross: ₹${grossAmount} | Commission: ${commissionPercent}% | Net: ₹${netAmount.toFixed(2)}`,
      date: s.createdAt || new Date(),
      createdAt: s.createdAt || new Date(),
      updatedAt: new Date()
    });

    // Create RevenueLog
    await mongoose.connection.db.collection('revenuelogs').insertOne({
      sessionId: s._id.toString(),
      userId: s.userId,
      astrologerId: parthId,
      sessionType: s.type || 'chat',
      durationSeconds: s.durationSeconds || 0,
      totalCost: grossAmount,
      commissionPercent,
      adminShare: commissionAmount,
      astrologerShare: netAmount,
      date: s.createdAt || new Date(),
      createdAt: s.createdAt || new Date(),
      updatedAt: new Date()
    });

    totalNetBackfilled += netAmount;
  }

  // Update order count string for Parth
  const parth = await mongoose.connection.db.collection('astrologers').findOne({ _id: parthId });
  if (parth) {
    const totalOrdersNum = (parth.totalChats || 0) + (parth.totalAudioCalls || 0) + (parth.totalVideoCalls || 0);
    const ordersStr = totalOrdersNum > 999 ? `${Math.floor(totalOrdersNum/1000)}k+` : `${totalOrdersNum}`;
    await mongoose.connection.db.collection('astrologers').updateOne({ _id: parthId }, { $set: { orders: ordersStr } });
  }

  console.log(`Backfill finished. Total net amount backfilled: ₹${totalNetBackfilled}`);
  await mongoose.disconnect();
}

run().catch(console.error);
