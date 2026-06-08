import mongoose from 'mongoose';
import 'dotenv/config';

import connectDB from './src/config/db.js';
import ChatSession from './src/models/chatSession.model.js';

async function cleanupSessions() {
  try {
    await connectDB();
    const result = await ChatSession.updateMany(
      { status: 'ongoing', isBotSession: true }, 
      { $set: { status: 'completed', durationSeconds: 60 } }
    );
    console.log(`Cleaned up ${result.modifiedCount} stuck bot sessions!`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanupSessions();
