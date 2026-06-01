import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import Product from '../models/product.model.js';
import PoojaBooking from '../models/poojaBooking.model.js';
import ChatSession from '../models/chatSession.model.js';
import Transaction from '../models/transaction.model.js';
import Celebrity from '../models/celebrity.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import WalletService from '../services/wallet.service.js';

// GET /api/user/profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -otpHash -otpExpires');
  if (!user) throw new ApiError(404, 'User not found');
  return res.status(200).json(new ApiResponse(200, { user }, 'Profile fetched'));
});

// PUT /api/user/profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, gender, dob, timeOfBirth, placeOfBirth, avatar, address, city, pincode } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (gender !== undefined) user.gender = gender;
  if (dob !== undefined) user.dob = dob;
  if (timeOfBirth !== undefined) user.timeOfBirth = timeOfBirth;
  if (placeOfBirth !== undefined) user.placeOfBirth = placeOfBirth;
  if (avatar !== undefined) user.avatar = avatar;
  if (address !== undefined) user.address = address;
  if (city !== undefined) user.city = city;
  if (pincode !== undefined) user.pincode = pincode;
  user.isNewUser = false;

  await user.save();
  return res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

// DELETE /api/user/profile/delete
export const deleteUserAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.clearCookie('refreshToken');
  return res.status(200).json(new ApiResponse(200, {}, 'Account deleted'));
});

// GET /api/user/homepage-data
export const getHomepageData = asyncHandler(async (req, res) => {
  const [astrologers, products, celebrities, liveAstrologersRaw, storeCategories] = await Promise.all([
    Astrologer.find({ isVerified: true })
      .sort({ rating: -1 })
      .limit(10)
      .lean(),
    Product.find({ inStock: true }).limit(6).lean(),
    Celebrity.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    Astrologer.find({ isVerified: true, onlineStatus: { $in: ['online', 'busy'] } })
      .sort({ rating: -1 })
      .limit(10)
      .lean(),
    Product.aggregate([
      { $match: { inStock: true } },
      { $group: { _id: '$category', img: { $first: { $cond: [ { $ifNull: ['$image', false] }, '$image', '$img' ] } } } },
      { $project: { _id: 0, name: '$_id', img: 1 } },
      { $limit: 6 }
    ])
  ]);

  const liveAstrologers = liveAstrologersRaw.map(astro => ({
    ...astro,
    img: astro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astro.name)}&background=ffedD5&color=f97316`
  }));

  let user = null;
  let activeSession = null;
  if (req.user && req.user._id) {
    user = await User.findById(req.user._id).select('wallet name');
    
    // Find the most recent chat session for this user
    const lastSession = await ChatSession.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('astrologerId', 'name avatar')
      .lean();

    if (lastSession && lastSession.astrologerId) {
      // Find the Astrologer's profile details (like name)
      const astroDoc = await Astrologer.findById(lastSession.astrologerId._id).lean();
      
      activeSession = {
        sessionId: lastSession._id,
        name: astroDoc?.name || lastSession.astrologerId.name || 'Astrologer',
        avatar: lastSession.astrologerId.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroDoc?.name || 'Astro')}&background=ffedD5&color=f97316`,
        date: new Date(lastSession.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        status: lastSession.status,
        astrologer: astroDoc ? { ...astroDoc, userId: lastSession.astrologerId } : null,
      };
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {
      user: user ? { name: user.name, wallet: user.wallet } : null,
      activeSession,
      featuredAstrologers: astrologers,
      liveAstrologers,
      featuredProducts: products,
      services: storeCategories,
      celebrities,
      banners: [
        { id: 1, title: 'First Chat Free!', subtitle: 'Get your first consultation free', tag: 'Limited' },
        { id: 2, title: 'Daily Horoscope', subtitle: 'Know what stars have in store', tag: 'Free' },
      ],
    }, 'Homepage data fetched')
  );
});

// GET /api/astrologers
export const getAstrologers = asyncHandler(async (req, res) => {
  const { search, skill, language, sort } = req.query;
  let filter = { isVerified: true };

  if (skill) filter.skills = { $in: [skill] };
  if (language) filter.languages = { $in: [language] };

  let query = Astrologer.find(filter);

  if (sort === 'rating') query = query.sort({ rating: -1 });
  else if (sort === 'experience') query = query.sort({ experience: -1 });
  else if (sort === 'price_asc') query = query.sort({ 'pricing.chat': 1 });
  else if (sort === 'price_desc') query = query.sort({ 'pricing.chat': -1 });
  else query = query.sort({ rating: -1 });

  let astrologers = await query.lean();

  if (search) {
    const term = search.toLowerCase();
    astrologers = astrologers.filter(
      (a) =>
        a.name?.toLowerCase().includes(term) ||
        a.skills?.some((s) => s.toLowerCase().includes(term))
    );
  }

  return res.status(200).json(new ApiResponse(200, { astrologers }, 'Astrologers fetched'));
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return res.status(200).json(new ApiResponse(200, { product }, 'Product fetched'));
});

// GET /api/products
export const getStoreProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ inStock: { $ne: false } }).sort({ createdAt: -1 }).lean();
  
  // Calculate distinct categories with an image
  const categories = [];
  const catSet = new Set();
  products.forEach(p => {
    if (p.category && !catSet.has(p.category)) {
      catSet.add(p.category);
      categories.push({ name: p.category, img: p.image || p.img || '/store_bracelet.png' });
    }
  });

  // Manual Featured
  const manualTopSelling = products.filter(p => p.featuredSection === 'top_selling');
  const manualNewLaunch = products.filter(p => p.featuredSection === 'newly_launch');

  // Top Selling (Manual first, then Highest sold quantity, fallback to rating)
  const autoTopSelling = [...products]
    .filter(p => p.featuredSection !== 'top_selling')
    .sort((a, b) => (b.sold || 0) - (a.sold || 0) || (b.rating * b.reviews || 0) - (a.rating * a.reviews || 0));
  const topSelling = [...manualTopSelling, ...autoTopSelling].slice(0, 10);
  
  // New Launch (Manual first, then Latest createdAt)
  const autoNewLaunch = [...products]
    .filter(p => p.featuredSection !== 'newly_launch');
  // It's already sorted by createdAt -1 above
  const newLaunch = [...manualNewLaunch, ...autoNewLaunch].slice(0, 10);

  // Fetch Banners
  const Banner = (await import('../models/banner.model.js')).default;
  const banners = await Banner.find({ isActive: true }).sort({ position: 1, createdAt: -1 }).lean();

  return res.status(200).json(new ApiResponse(200, { products, categories, topSelling, newLaunch, banners }, 'Products fetched'));
});

// GET /api/pandits  (same as astrologers but filter by pandit skill)
export const getStorePandits = asyncHandler(async (req, res) => {
  const pandits = await Astrologer.find({
    isVerified: true,
    skills: { $in: ['Pandit', 'Vedic Rituals', 'Pooja'] },
  })
    .lean();

  // Extract unique poojas from pandit skills
  const poojaSet = new Set();
  pandits.forEach(p => {
    if (p.skills) {
      p.skills.forEach(s => {
        if (!['Pandit', 'Vedic Rituals', 'Pooja'].includes(s)) {
          poojaSet.add(s);
        }
      });
    }
  });

  const poojaTypes = Array.from(poojaSet);
  if (poojaTypes.length === 0) poojaTypes.push('General Pooja'); // fallback

  return res.status(200).json(new ApiResponse(200, { pandits, poojaTypes }, 'Pandits fetched'));
});

// POST /api/pooja/book
export const bookPooja = asyncHandler(async (req, res) => {
  const { poojaName, astrologerId, date, time, address, mode } = req.body;
  if (!poojaName || !astrologerId) throw new ApiError(400, 'poojaName and astrologerId required');

  const booking = await PoojaBooking.create({
    userId: req.user._id,
    astrologerId,
    poojaName,
    date,
    time,
    address,
    mode: mode || 'offline',
    status: 'pending',
  });

  return res.status(201).json(new ApiResponse(201, { booking }, 'Pooja booked successfully'));
});

// GET /api/user/poojas
export const getUserPoojas = asyncHandler(async (req, res) => {
  const poojas = await PoojaBooking.find({ userId: req.user._id })
    .populate('astrologerId', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { poojas }, 'User poojas fetched'));
});

// GET /api/user/sessions
export const getUserSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ userId: req.user._id })
    .populate('astrologerId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();

  return res.status(200).json(new ApiResponse(200, { sessions, transactions }, 'Sessions fetched'));
});
