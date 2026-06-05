import mongoose from 'mongoose';
import Astrologer from './src/models/astrologer.model.js';
import dotenv from 'dotenv';

dotenv.config();

const dummyProfiles = [
  {
    name: 'Astro Rahul',
    avatar: 'https://res.cloudinary.com/drd6brkpt/image/upload/v1717424687/dummy1.jpg',
    skills: ['Vedic', 'Numerology'],
    experience: 8,
    about: 'Expert in Vedic astrology with 8 years of experience.',
    pricing: { chat: 10, audioCall: 15, videoCall: 20 }
  },
  {
    name: 'Tarot Priya',
    avatar: 'https://res.cloudinary.com/drd6brkpt/image/upload/v1717424687/dummy2.jpg',
    skills: ['Tarot', 'Vastu'],
    experience: 5,
    about: 'Guiding lives through Tarot card readings.',
    pricing: { chat: 8, audioCall: 12, videoCall: 18 }
  },
  {
    name: 'Pandit Sharma',
    avatar: 'https://res.cloudinary.com/drd6brkpt/image/upload/v1717424687/dummy3.jpg',
    skills: ['Vedic', 'Prashna Kundli'],
    experience: 15,
    about: 'Renowned Pandit with deep knowledge of ancient scriptures.',
    pricing: { chat: 20, audioCall: 30, videoCall: 50 }
  },
  {
    name: 'Astro Sneha',
    avatar: '', // Test fallback
    skills: ['Numerology', 'Palmistry'],
    experience: 3,
    about: 'Modern approach to numerology and career guidance.',
    pricing: { chat: 5, audioCall: 5, videoCall: 10 }
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const astrologers = await Astrologer.find({ name: 'Temp Astrologer', isVerified: true });
    console.log(`Found ${astrologers.length} Temp Astrologers to update.`);
    
    for (let i = 0; i < Math.min(astrologers.length, dummyProfiles.length); i++) {
      const astro = astrologers[i];
      const profile = dummyProfiles[i];
      
      astro.name = profile.name;
      astro.avatar = profile.avatar;
      astro.skills = profile.skills;
      astro.experience = profile.experience;
      astro.about = profile.about;
      astro.pricing = profile.pricing;
      
      await astro.save();
      console.log(`Updated ${astro._id} to ${astro.name}`);
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
