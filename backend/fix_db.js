import mongoose from 'mongoose';
import RevenueLog from './src/models/revenueLog.model.js';
import ChatSession from './src/models/chatSession.model.js';

const MONGODB_URI = 'mongodb://mayur:mayur1234@ac-0yynjcf-shard-00-00.vfq8tic.mongodb.net:27017,ac-0yynjcf-shard-00-01.vfq8tic.mongodb.net:27017,ac-0yynjcf-shard-00-02.vfq8tic.mongodb.net:27017/jotishlink?ssl=true&authSource=admin&replicaSet=atlas-1d9q3o-shard-0';

async function fixDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const logs = await RevenueLog.find({});
    let updatedCount = 0;

    for (let log of logs) {
      if (log.sessionId) {
        const session = await ChatSession.findById(log.sessionId);
        if (session && session.type && session.type !== log.sessionType) {
          console.log(`Fixing log ${log._id}: changing from ${log.sessionType} to ${session.type}`);
          log.sessionType = session.type;
          await log.save();
          updatedCount++;
        }
      }
    }

    console.log(`Successfully fixed ${updatedCount} old transactions!`);
  } catch (error) {
    console.error('Error fixing DB:', error);
  } finally {
    process.exit(0);
  }
}

fixDB();
