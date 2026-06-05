import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    const astrologers = await db.collection('astrologers').find({}).limit(5).toArray();
    console.log('Astrologers profile pics:');
    astrologers.forEach(a => console.log(a.name, a.profilePic));
    
    const users = await db.collection('users').find({}).limit(5).toArray();
    console.log('\nUsers profile pics:');
    users.forEach(u => console.log(u.name, u.profilePic));

    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
