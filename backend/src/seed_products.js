/**
 * Premium Product Seed Script
 * Run with: node src/seed_products.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/product.model.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jyotishlink';

const premiumProducts = [
  {
    name: 'Premium 5-Mukhi Rudraksha Mala (108 Beads)',
    price: 499,
    originalPrice: 999,
    discount: '50%',
    description: 'This authentic 5-Mukhi Rudraksha Mala contains 108+1 beads, hand-knotted by expert craftsmen. Rudraksha beads are known to align mind, body, and soul, lower blood pressure, and help in mantra chanting and meditation.',
    category: 'Mala',
    image: 'https://images.unsplash.com/photo-1602192103300-47e66756152e?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 50,
    minStock: 5,
    sku: 'RUD-MALA-108',
    sold: 120,
    featuredSection: 'top_selling',
    weight: 0.15,
    length: 10,
    breadth: 8,
    height: 3
  },
  {
    name: 'Pure Copper Shree Yantra (Energized)',
    price: 899,
    originalPrice: 1799,
    discount: '50%',
    description: 'This Shree Yantra is made of heavy gauge copper with deep, clear geometric engravings. It is energized through Vedic rituals to attract wealth, remove negative energies, and bring harmony and prosperity to your home or office.',
    category: 'Yantra',
    image: 'https://images.unsplash.com/photo-1609137144813-2d287f9850dc?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 30,
    minStock: 3,
    sku: 'COP-SHREE-YANTRA',
    sold: 85,
    featuredSection: 'top_selling',
    weight: 0.35,
    length: 12,
    breadth: 12,
    height: 1
  },
  {
    name: 'Certified Navgrah Gemstones Kit',
    price: 1999,
    originalPrice: 3999,
    discount: '50%',
    description: 'A premium astrological collection of nine natural, certified gemstones corresponding to the nine planets (Navgrah). Perfect for planetary remedies, balancing energy centers (chakras), and keeping in your puja room.',
    category: 'Gemstone',
    image: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 15,
    minStock: 2,
    sku: 'NAV-GEMS-KIT',
    sold: 45,
    featuredSection: 'top_selling',
    weight: 0.25,
    length: 15,
    breadth: 10,
    height: 4
  },
  {
    name: 'Natural Sphatik (Quartz Crystal) Mala',
    price: 799,
    originalPrice: 1599,
    discount: '50%',
    description: 'Made from premium, clear Himalayan quartz crystal beads. Sphatik is known to have cooling properties, reduce body heat, improve concentration, and enhance spiritual awareness during meditation.',
    category: 'Mala',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 25,
    minStock: 3,
    sku: 'SPH-MALA-108',
    sold: 60,
    featuredSection: 'newly_launch',
    weight: 0.12,
    length: 8,
    breadth: 8,
    height: 2
  },
  {
    name: 'Aura Cleansing Amethyst Bracelet',
    price: 349,
    originalPrice: 699,
    discount: '50%',
    description: 'Handcrafted with natural 8mm Amethyst beads. Amethyst is a powerful protective stone that helps relieve stress, anxiety, soothe irritability, balance mood swings, and activate spiritual awareness.',
    category: 'Crystal',
    image: 'https://images.unsplash.com/photo-1599708149868-04e0eb7552e0?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 40,
    minStock: 5,
    sku: 'AME-BRAC-8MM',
    sold: 95,
    featuredSection: 'newly_launch',
    weight: 0.08,
    length: 7,
    breadth: 7,
    height: 2
  },
  {
    name: 'Premium Puja Samagri Kit (All-in-One)',
    price: 1299,
    originalPrice: 2500,
    discount: '48%',
    description: 'A comprehensive kit containing 32 essential puja items including pure sandalwood paste, organic incense sticks, natural camphor, kumkum, turmeric, cotton wicks, and gangajal. Ideal for festive occasions, housewarmings, or daily home puja.',
    category: 'Puja Kit',
    image: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 20,
    minStock: 2,
    sku: 'PUJ-SAM-KIT',
    sold: 35,
    featuredSection: 'newly_launch',
    weight: 1.5,
    length: 25,
    breadth: 20,
    height: 10
  },
  {
    name: "Natural Pyrite Cluster (Fool's Gold)",
    price: 599,
    originalPrice: 1199,
    discount: '50%',
    description: "Raw, natural Pyrite cluster sourced directly from mines. Pyrite is a traditional stone for luck and wealth. Its shiny golden hues symbolize abundance, helping you stay grounded while attracting financial success.",
    category: 'Crystal',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 12,
    minStock: 2,
    sku: 'PYR-CLUST-RAW',
    sold: 28,
    featuredSection: 'none',
    weight: 0.4,
    length: 12,
    breadth: 10,
    height: 6
  },
  {
    name: 'Vedic Vastu Pyra Card for Wallet',
    price: 249,
    originalPrice: 499,
    discount: '50%',
    description: 'An innovative Vastu card featuring a 9x9 pyramid grid and gold-plated celestial symbols. Carry it in your wallet or purse to eliminate negative energies, block harmful EMF radiations, and invite positive luck.',
    category: 'Vastu',
    image: 'https://images.unsplash.com/photo-1608744882201-52a7f7f3dd60?auto=format&fit=crop&w=600&q=80',
    inStock: true,
    stock: 100,
    minStock: 10,
    sku: 'VAS-PYR-CARD',
    sold: 210,
    featuredSection: 'none',
    weight: 0.02,
    length: 8,
    breadth: 5,
    height: 0.1
  }
];

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing old products...');
    const result = await Product.deleteMany({});
    console.log(`Deleted ${result.deletedCount} products.`);

    console.log('Seeding new premium products...');
    const created = await Product.insertMany(premiumProducts);
    console.log(`Successfully seeded ${created.length} premium products.`);

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

run();
