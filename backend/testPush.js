import mongoose from 'mongoose';
import Astrologer from './src/models/astrologer.model.js';
import { sendPushNotification } from './src/utils/firebaseHelper.js';
import { initFirebase } from './src/config/firebase.config.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkTokens() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/astrotalk_replica');
  initFirebase();
  
  const astros = await Astrologer.findOne({ name: 'mayur' });
  if (astros) {
    console.log(`Testing push to ${astros.name} (${astros._id})`);
    const success = await sendPushNotification({
      userId: astros._id.toString(),
      role: 'astrologer',
      title: 'Debug Push',
      body: 'Testing from script'
    });
    console.log(`Push success: ${success}`);
  }
  
  process.exit(0);
}

checkTokens();
