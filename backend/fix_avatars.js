import mongoose from 'mongoose';
import Astrologer from './src/models/astrologer.model.js';
import dotenv from 'dotenv';

dotenv.config();

const dummyAvatars = [
  'https://i.pravatar.cc/150?img=11', // Astro Rahul
  'https://i.pravatar.cc/150?img=32', // Tarot Priya (female)
  'https://i.pravatar.cc/150?img=68', // Pandit Sharma (male)
  'https://i.pravatar.cc/150?img=47'  // Astro Sneha (female)
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    // Find the 4 astrologers we just updated (they have isVerified: true and are no longer 'Temp Astrologer')
    const astrologers = await Astrologer.find({ 
      name: { $in: ['Astro Rahul', 'Tarot Priya', 'Pandit Sharma', 'Astro Sneha'] }
    });
    
    console.log(`Found ${astrologers.length} Astrologers to fix avatars for.`);
    
    for (let i = 0; i < astrologers.length; i++) {
      const astro = astrologers[i];
      // assign a working pravatar image
      astro.avatar = dummyAvatars[i % dummyAvatars.length];
      await astro.save();
      console.log(`Updated Avatar for ${astro.name} -> ${astro.avatar}`);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
