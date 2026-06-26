import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import Product from '../models/product.model.js';
import PoojaBooking from '../models/poojaBooking.model.js';
import ChatSession from '../models/chatSession.model.js';
import { CallSession } from '../models/callSession.model.js';
import Order from '../models/order.model.js';
import Transaction from '../models/transaction.model.js';
import Celebrity from '../models/celebrity.model.js';
import Banner from '../models/banner.model.js';
import Rating from '../models/rating.model.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import WalletService from '../services/wallet.service.js';
import { uploadMedia, deleteMedia } from '../config/cloudinary.js';

// GET /api/user/profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -otpHash -otpExpires');
  if (!user) throw new ApiError(404, 'User not found');
  
  const SystemSettings = (await import('../models/systemSettings.model.js')).default;
  const settings = await SystemSettings.findOne({}) || new SystemSettings();
  
  return res.status(200).json(new ApiResponse(200, { user, settings: { minChatBalance: settings.minChatBalance, freeChatDuration: settings.freeChatDuration, astrologerBannerMessage: settings.astrologerBannerMessage, supportEmail: settings.supportEmail, supportPhone: settings.supportPhone, appName: settings.appName, appLogo: settings.appLogo } }, 'Profile fetched'));
});

// GET /api/settings/public
export const getPublicSettings = asyncHandler(async (req, res) => {
  const SystemSettings = (await import('../models/systemSettings.model.js')).default;
  const settings = await SystemSettings.findOne({}) || new SystemSettings();
  return res.status(200).json(new ApiResponse(200, { appName: settings.appName, appLogo: settings.appLogo, tagline: settings.tagline }, 'Public settings fetched'));
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
  
  if (avatar !== undefined) {
    if (avatar.startsWith('data:image')) {
      if (user.avatarPublicId) {
        await deleteMedia(user.avatarPublicId);
      }
      const uploadResult = await uploadMedia(avatar, 'astrotalk_users');
      user.avatar = uploadResult.url;
      user.avatarPublicId = uploadResult.publicId;
    } else {
      user.avatar = avatar;
    }
  }
  
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
  const [astrologers, products, celebrities, liveAstrologersRaw, storeCategories, banners] = await Promise.all([
    Astrologer.find({ isVerified: true, isTopVerified: true, name: { $ne: 'Temp Astrologer' } })
      .sort({ rating: -1 })
      .limit(10)
      .lean(),
    Product.find().sort({ inStock: -1, createdAt: -1 }).limit(6).lean(),
    Celebrity.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    Astrologer.find({ isVerified: true, onlineStatus: { $in: ['online', 'busy'] }, name: { $ne: 'Temp Astrologer' } })
      .sort({ rating: -1 })
      .limit(10)
      .lean(),
    Product.aggregate([
      { $match: {} }, // Include all products to determine categories
      { $group: { _id: '$category', img: { $first: { $cond: [ { $ifNull: ['$image', false] }, '$image', '$img' ] } } } },
      { $project: { _id: 0, name: '$_id', img: 1 } },
      { $limit: 6 }
    ]),
    Banner.find({ isActive: true, $or: [{ pages: 'Home' }, { pages: 'Home_Middle' }, { pages: { $exists: false } }, { pages: { $size: 0 } }] }).sort({ position: 1, createdAt: -1 }).lean()
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
        roomId: lastSession.roomId,
        astrologer: astroDoc ? { ...astroDoc, userId: lastSession.astrologerId } : null,
      };
    }
  }

    const SystemSettings = (await import('../models/systemSettings.model.js')).default;
    const settings = await SystemSettings.findOne({}) || new SystemSettings();

    return res.status(200).json(
      new ApiResponse(200, {
        user: user ? { name: user.name, wallet: user.wallet } : null,
        activeSession,
        featuredAstrologers: astrologers,
        liveAstrologers,
        featuredProducts: products,
        services: storeCategories,
        celebrities,
        banners: banners || [],
        settings: { minChatBalance: settings.minChatBalance, freeChatDuration: settings.freeChatDuration, astrologerBannerMessage: settings.astrologerBannerMessage, supportEmail: settings.supportEmail, supportPhone: settings.supportPhone },
      }, 'Homepage data fetched')
    );
});

// GET /api/astrologers
export const getAstrologers = asyncHandler(async (req, res) => {
  const { search, skill, category, language, sort } = req.query;
  let filter = { isVerified: true, name: { $ne: 'Temp Astrologer' } };

  if (skill) filter.skills = { $in: [skill] };
  if (category) filter.categories = { $in: [category] };
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

  const SystemSettings = (await import('../models/systemSettings.model.js')).default;
  const settings = await SystemSettings.findOne({}) || new SystemSettings();

  return res.status(200).json(new ApiResponse(200, { astrologers, settings: { astrologerBannerMessage: settings.astrologerBannerMessage } }, 'Astrologers fetched'));
});

// GET /api/astrologers/:id
export const getAstrologerById = asyncHandler(async (req, res) => {
  const astrologer = await Astrologer.findById(req.params.id).lean();
  if (!astrologer) {
    throw new ApiError(404, 'Astrologer not found');
  }
  return res.status(200).json(new ApiResponse(200, { astrologer }, 'Astrologer fetched'));
});

// GET /api/astrologers/:id/ratings
export const getAstrologerRatings = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Use MongoDB aggregation to match astrologerId and sample 3 random documents
  const ratings = await Rating.aggregate([
    { $match: { astrologerId: new mongoose.Types.ObjectId(id) } },
    { $sample: { size: 3 } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        rating: 1,
        review: 1,
        createdAt: 1,
        'user.name': 1,
        'user.avatar': 1
      }
    }
  ]);

  return res.status(200).json(new ApiResponse(200, { ratings }, 'Ratings fetched'));
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
  const products = await Product.find().sort({ inStock: -1, createdAt: -1 }).lean();
  
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

  // Only consider unassigned products for automatic filling
  const unassignedProducts = products.filter(p => p.featuredSection !== 'top_selling' && p.featuredSection !== 'newly_launch');

  // Top Selling (Manual first, then Highest sold quantity, fallback to rating)
  const autoTopSelling = [...unassignedProducts]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0) || (b.rating * b.reviews || 0) - (a.rating * a.reviews || 0));
  const topSelling = [...manualTopSelling, ...autoTopSelling].slice(0, 10);
  
  // New Launch (Manual first, then Latest createdAt)
  const autoNewLaunch = [...unassignedProducts]; // Already sorted by createdAt -1 above
  const newLaunch = [...manualNewLaunch, ...autoNewLaunch].slice(0, 10);

  // Fetch Banners
  const Banner = (await import('../models/banner.model.js')).default;
  const banners = await Banner.find({ isActive: true, pages: 'Store' }).sort({ position: 1, createdAt: -1 }).lean();

  return res.status(200).json(new ApiResponse(200, { products, categories, topSelling, newLaunch, banners }, 'Products fetched'));
});

// GET /api/pandits
export const getStorePandits = asyncHandler(async (req, res) => {
  const pandits = await Astrologer.find({
    isVerified: true,
    $or: [
      { isPandit: true },
      { skills: { $in: ['Pandit', 'Vedic Rituals', 'Pooja'] } }
    ]
  }).lean();

  // Extract unique poojas from pandit poojasOffered
  const poojaSet = new Set();
  pandits.forEach(p => {
    if (p.poojasOffered && p.poojasOffered.length > 0) {
      p.poojasOffered.forEach(pooja => {
        poojaSet.add(pooja.poojaName);
      });
    } else if (p.skills) {
      // Legacy fallback
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
  const { poojaName, astrologerId, date, time, address, mode, notes, price } = req.body;
  if (!poojaName || !astrologerId) throw new ApiError(400, 'poojaName and astrologerId required');

  const poojaPrice = price || 500;

  const { transaction } = await WalletService.deduct(
    req.user._id,
    poojaPrice,
    `Pooja Booking: ${poojaName}`
  );

  const booking = await PoojaBooking.create({
    userId: req.user._id,
    astrologerId,
    poojaName,
    date,
    time,
    address,
    proofNotes: notes || '',
    mode: mode || 'offline',
    status: 'Pending',
    price: poojaPrice,
    amountHold: poojaPrice,
    paymentStatus: 'held',
    paymentMethod: 'wallet'
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`astro_${astrologerId}`).emit('pooja_booking_created', { booking });
    io.to(`room_astro_${astrologerId}`).emit('pooja_booking_created', { booking });
    io.to('admin_room').emit('dashboard_updated');
  }

  try {
    const { sendPushNotification } = await import('../utils/firebaseHelper.js');
    await sendPushNotification({
      userId: astrologerId,
      role: 'astrologer',
      title: 'New Pooja Booking',
      body: `You have received a new booking for ${poojaName}.`,
      data: { type: 'pooja_booking', bookingId: booking._id.toString(), url: '/astrologer/pooja' }
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }

  return res.status(201).json(new ApiResponse(201, { booking, transaction }, 'Pooja booked successfully'));
});

// GET /api/user/poojas
export const getUserPoojas = asyncHandler(async (req, res) => {
  const poojas = await PoojaBooking.find({ userId: new mongoose.Types.ObjectId(req.user._id), deletedByUser: { $ne: true } })
    .populate('astrologerId', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { poojas }, 'User poojas fetched'));
});

// GET /api/user/poojas/:id
export const getUserPoojaById = asyncHandler(async (req, res) => {
  const pooja = await PoojaBooking.findOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user._id), deletedByUser: { $ne: true } })
    .populate('astrologerId', 'name avatar')
    .lean();

  if (!pooja) throw new ApiError(404, 'Pooja not found');
  
  return res.status(200).json(new ApiResponse(200, { pooja }, 'Pooja details fetched'));
});

// GET /api/user/sessions
export const getUserSessions = asyncHandler(async (req, res) => {
  const qObj = { 
    userId: req.user._id,
    type: 'chat',
    deletedByUser: { $ne: true }
  };
  const sessions = await ChatSession.find(qObj)
    .populate('userId', 'name avatar')
    .populate('astrologerId', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();

  const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  
  const allSessCount = await ChatSession.countDocuments({ userId: req.user._id });
  const allTxnCount = await Transaction.countDocuments({ userId: req.user._id });

  return res.status(200).json(new ApiResponse(200, { 
    sessions, 
    transactions, 
    debugMongoose: { 
      qObj, 
      allSessCount,
      allTxnCount,
      reqUserIdType: typeof req.user._id,
      reqUserIdStr: req.user._id.toString(),
      isObjectId: req.user._id instanceof mongoose.Types.ObjectId
    } 
  }, 'Sessions fetched'));
});

// GET /api/user/wallet
export const getUserWallet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('wallet');
  const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  
  return res.status(200).json(new ApiResponse(200, { wallet: user.wallet || 0, transactions }, 'Wallet fetched'));
});

// POST /api/user/history/delete
export const deleteUserHistory = asyncHandler(async (req, res) => {
  const { ids, type } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of ids to delete');
  }

  let Model;
  switch (type) {
    case 'chat':
      Model = ChatSession;
      break;
    case 'pooja':
      Model = PoojaBooking;
      break;
    case 'call':
      Model = CallSession;
      break;
    case 'order':
      Model = Order;
      break;
    default:
      throw new ApiError(400, 'Invalid history type for this endpoint');
  }

  await Model.updateMany(
    { _id: { $in: ids }, userId: req.user._id },
    { $set: { deletedByUser: true } }
  );

  // If type is call, it might also be a video/audio call stored in ChatSession
  if (type === 'call') {
    await ChatSession.updateMany(
      { _id: { $in: ids }, userId: req.user._id },
      { $set: { deletedByUser: true } }
    );
  }

  return res.status(200).json(new ApiResponse(200, {}, `${type} history deleted`));
});

// POST /api/user/rate-astrologer
export const rateAstrologer = asyncHandler(async (req, res) => {
  const { astrologerId, rating, review } = req.body;
  const userId = req.user._id;

  if (!astrologerId || !rating) {
    throw new ApiError(400, 'Astrologer ID and rating are required');
  }

  // Update or Create Rating Document
  await Rating.findOneAndUpdate(
    { userId, astrologerId },
    { rating, review },
    { upsert: true, new: true }
  );

  // Safely recalculate average rating using aggregation
  const stats = await Rating.aggregate([
    { $match: { astrologerId: new mongoose.Types.ObjectId(astrologerId) } },
    { $group: { _id: '$astrologerId', avgRating: { $avg: '$rating' }, numRatings: { $sum: 1 } } }
  ]);

  if (stats.length > 0) {
    await Astrologer.findByIdAndUpdate(astrologerId, {
      rating: Number(stats[0].avgRating.toFixed(1)),
      totalRatings: stats[0].numRatings
    });
  }

  // Mark user as rated this astrologer
  await User.findByIdAndUpdate(userId, {
    $addToSet: { ratedAstrologers: astrologerId }
  });

  return res.status(200).json(new ApiResponse(200, { rated: true }, 'Rating saved successfully'));
});

export const updateFcmToken = asyncHandler(async (req, res) => {
  const token = req.body.token || req.body.fcmToken;
  const platform = req.body.platform || 'mobile';
  
  if (!token) {
    throw new ApiError(400, 'FCM token is required');
  }

  // Determine target field based on platform
  const targetField = platform === 'web' ? 'fcmToken' : 'fcmTokenMobile';

  // Extract the device prefix (part before ':') to identify same-device tokens
  const devicePrefix = token.includes(':') ? token.split(':')[0] : null;

  // Remove the exact token if it exists (to prevent duplicates)
  await User.findByIdAndUpdate(req.user._id, { $pull: { [targetField]: token } });

  // Also remove all old tokens from the SAME device (prevents dead token buildup)
  if (devicePrefix) {
    const user = await User.findById(req.user._id).select(targetField);
    if (user && user[targetField]) {
      const staleTokens = user[targetField]
        .filter(t => typeof t === 'string' && t !== token && t.startsWith(devicePrefix + ':'));
      if (staleTokens.length > 0) {
        await User.findByIdAndUpdate(req.user._id, {
          $pull: { [targetField]: { $in: staleTokens } }
        });
        console.log(`Removed ${staleTokens.length} stale ${platform} FCM tokens for user ${req.user._id}`);
      }
    }
  }

  // Push the new token
  await User.findByIdAndUpdate(req.user._id, { $push: { [targetField]: token } });
  
  return res.status(200).json({
    success: true,
    message: `${platform === 'mobile' ? 'Mobile' : 'Web'} FCM token saved successfully`,
    data: {
      ownerType: 'USER',
      ownerId: req.user._id,
      platform
    }
  });
});

// POST /api/user/test-push
export const testPushNotification = asyncHandler(async (req, res) => {
  const { notify } = await import('../utils/notifyHelper.js');
  
  const success = await notify({
    userId: req.user._id,
    role: 'user',
    title: 'Test Notification',
    message: 'This is a test notification from your User Profile.',
    type: 'test',
    link: '/user/profile'
  });

  if (!success) {
    throw new ApiError(500, 'Failed to send push notification. Please check if your token is saved properly.');
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Test notification sent successfully'));
});
