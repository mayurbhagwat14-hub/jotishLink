import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Mock models and import WalletService
const ChatSession = mongoose.model('ChatSession', new mongoose.Schema({}, { strict: false }));
const PoojaBooking = mongoose.model('PoojaBooking', new mongoose.Schema({}, { strict: false }));
const RevenueLog = mongoose.model('RevenueLog', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const parthId = new mongoose.Types.ObjectId('6a43a80dc903e3677a909fbe');

  // Let's do the exact calculations in getAstrologerDashboard
  const astrologer = await mongoose.connection.db.collection('astrologers').findOne({ _id: parthId });
  
  const [recentSessions, recentBookings, allSessions, allPoojas, withdrawals] = await Promise.all([
    ChatSession.find({ astrologerId: parthId, isFreeChat: { $ne: true }, deletedByAstrologer: { $ne: true } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    PoojaBooking.find({ astrologerId: parthId, deletedByAstrologer: { $ne: true } })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    ChatSession.find({ astrologerId: parthId, status: 'completed', isFreeChat: { $ne: true }, deletedByAstrologer: { $ne: true } }).lean(),
    PoojaBooking.find({ astrologerId: parthId, status: { $in: ['Completed'] }, deletedByAstrologer: { $ne: true } }).lean(),
    mongoose.connection.db.collection('withdrawalrequests').find({ astrologerId: parthId, status: { $in: ['completed', 'pending'] } }).toArray()
  ]);

  const revenueLogs = await RevenueLog.find({ astrologerId: parthId }).lean();

  let totalEarnings = 0;
  let todayEarnings = 0;
  
  // IST conversion logic matching utils
  const getISTStartOfToday = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * 5.5)); // IST is UTC+5.5
    nd.setHours(0,0,0,0);
    return nd;
  };
  const startOfTodayIST = getISTStartOfToday();

  revenueLogs.forEach(log => {
    const amount = log.astrologerShare || 0;
    totalEarnings += amount;
    const logDate = new Date(log.date || log.createdAt);
    // Convert log date to IST for today check
    const logUtc = logDate.getTime() + (logDate.getTimezoneOffset() * 60000);
    const logIst = new Date(logUtc + (3600000 * 5.5));
    if (logIst >= startOfTodayIST) {
      todayEarnings += amount;
    }
  });

  const totalWithdraw = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  console.log('--- Parth Dashboard Simulated Output ---');
  console.log('astrologer.earnings:', astrologer.earnings);
  console.log('totalEarnings:', totalEarnings);
  console.log('todayEarnings:', todayEarnings);
  console.log('totalWithdraw:', totalWithdraw);
  console.log('totalSessions:', allSessions.length + allPoojas.length);

  await mongoose.disconnect();
}

run().catch(console.error);
