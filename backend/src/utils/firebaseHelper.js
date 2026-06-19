import { getFirebaseAdmin } from '../config/firebase.config.js';
import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';

/**
 * Send a push notification to a specific user or astrologer
 * @param {Object} params
 * @param {String} params.userId - The ID of the target (User or Astrologer)
 * @param {String} params.role - 'user' or 'astrologer'
 * @param {String} params.title - Notification title
 * @param {String} params.body - Notification body
 * @param {Object} [params.data] - Optional custom data payload (values must be strings)
 */
export const sendPushNotification = async ({ userId, role, title, body, data = {} }) => {
  try {
    let tokens = [];

    if (role === 'user') {
      const user = await User.findById(userId).select('fcmTokens fcmToken');
      if (user) {
        if (user.fcmTokens && user.fcmTokens.length > 0) tokens = user.fcmTokens.map(t => t.token);
        else if (user.fcmToken) tokens = [user.fcmToken];
      }
    } else if (role === 'astrologer') {
      const astrologer = await Astrologer.findById(userId).select('fcmTokens fcmToken');
      if (astrologer) {
        if (astrologer.fcmTokens && astrologer.fcmTokens.length > 0) tokens = astrologer.fcmTokens.map(t => t.token);
        else if (astrologer.fcmToken) tokens = [astrologer.fcmToken];
      }
    }

    if (!tokens || tokens.length === 0) {
      console.warn(`No FCM token found for ${role} with ID ${userId}. Skipping push notification.`);
      return false;
    }

    // Use multicast helper which handles array of tokens
    return await sendMulticastPushNotification(tokens, title, body, data);
  } catch (error) {
    console.error(`Error sending push notification to ${role} (${userId}):`, error.message);
    return false;
  }
};

/**
 * Send a multicast push notification to multiple tokens
 * @param {Array<String>} tokens - Array of FCM tokens
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} [data] - Optional custom data payload
 */
export const sendMulticastPushNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens || tokens.length === 0) return false;
    
    const adminSDK = getFirebaseAdmin();
    if (!adminSDK) {
      console.warn('Firebase Admin SDK is not initialized. Skipping push notification.');
      return false;
    }

    const payload = {
      notification: {
        title: title,
        body: body
      },
      tokens: tokens
    };

    if (Object.keys(data).length > 0) {
      payload.data = {};
      for (const [key, value] of Object.entries(data)) {
        payload.data[key] = String(value);
      }
    }

    const response = await adminSDK.messaging().sendEachForMulticast(payload);
    console.log(`Multicast push sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
    return true;
  } catch (error) {
    console.error('Error sending multicast push notification:', error.message);
    return false;
  }
};
