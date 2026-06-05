import mongoose from 'mongoose';
import Astrologer from './src/models/astrologer.model.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const res = await Astrologer.updateMany(
      { name: 'Temp Astrologer', approvalStatus: 'pending' }, 
      { $set: { approvalStatus: 'incomplete' } }
    );
    console.log('Fixed stuck astrologers:', res.modifiedCount);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
