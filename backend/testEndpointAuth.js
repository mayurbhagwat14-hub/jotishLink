import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    
    // Get any user
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.log('No user found');
      process.exit(1);
    }
    
    // Generate token
    const accessToken = jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
    
    try {
      const res = await axios.post('http://localhost:5000/api/payment/create-order', {
        amount: 50
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Success:', res.data);
    } catch (err) {
      console.error('API Error:', err.response ? err.response.data : err.message);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
