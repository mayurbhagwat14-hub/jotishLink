import mongoose from 'mongoose';
import Astrologer from './src/models/astrologer.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkTokens() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/astrotalk_replica');
  
  const astros = await Astrologer.find().select('name fcmToken fcmTokens updatedAt');
  astros.forEach(a => {
    console.log(`Astrologer: ${a.name} (Last Updated: ${a.updatedAt})`);
    if (a.fcmTokens && a.fcmTokens.length > 0) {
      console.log(`  Tokens array:`);
      a.fcmTokens.forEach(t => console.log(`   - ${t.token.substring(0, 30)}... [platform: ${t.platform}]`));
    } else if (a.fcmToken) {
      console.log(`  Legacy token: ${a.fcmToken.substring(0, 30)}...`);
    } else {
      console.log('  No tokens');
    }
  });
  
  process.exit(0);
}

checkTokens();
