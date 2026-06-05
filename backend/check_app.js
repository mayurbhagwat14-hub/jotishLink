import mongoose from 'mongoose';
import Astrologer from './src/models/astrologer.model.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const doc = await Astrologer.findOne({ phone: '1234567892' });
    console.log(doc);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
