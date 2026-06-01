import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import Admin from '../models/admin.model.js';
import { ApiError } from './apiError.js';

/**
 * Checks if a phone number already exists in ANY of the collections.
 * Returns the role of the existing user if found, otherwise null.
 */
export const checkGlobalMobileExists = async (phone) => {
  if (!phone) return null;

  const user = await User.findOne({ phone }).lean();
  if (user) return 'user';

  const astrologer = await Astrologer.findOne({ phone }).lean();
  if (astrologer) return 'astrologer';

  const admin = await Admin.findOne({ phone }).lean();
  if (admin) return 'admin';

  return null;
};
