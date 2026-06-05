import mongoose from 'mongoose';
import Astrologer from './src/models/astrologer.model.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const astrologers = await Astrologer.find();
    console.log(`Total Astrologers: ${astrologers.length}`);
    for (const a of astrologers) {
      console.log(`Name: '${a.name}' | Verified: ${a.isVerified} | Avatar: ${a.avatar ? 'YES' : 'NO'}`);
    }
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
