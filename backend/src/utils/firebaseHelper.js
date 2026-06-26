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
      const user = await User.findById(userId).select('fcmToken fcmTokenMobile');
      if (user) {
        if (user.fcmToken && user.fcmToken.length > 0) tokens.push(...user.fcmToken);
        if (user.fcmTokenMobile && user.fcmTokenMobile.length > 0) tokens.push(...user.fcmTokenMobile);
      }
    } else if (role === 'astrologer') {
      const astrologer = await Astrologer.findById(userId).select('fcmToken fcmTokenMobile');
      if (astrologer) {
        if (astrologer.fcmToken && astrologer.fcmToken.length > 0) tokens.push(...astrologer.fcmToken);
        if (astrologer.fcmTokenMobile && astrologer.fcmTokenMobile.length > 0) tokens.push(...astrologer.fcmTokenMobile);
      }
    }

    if (!tokens || tokens.length === 0) {
      console.warn(`No FCM token found for ${role} with ID ${userId}. Skipping push notification.`);
      return false;
    }

    // Use multicast helper which handles array of tokens
    const result = await sendMulticastPushNotification(tokens, title, body, data);
    
    if (result && result.failedTokens && result.failedTokens.length > 0) {
      const failedTokens = result.failedTokens;
      if (role === 'user') {
        await User.findByIdAndUpdate(userId, {
          $pull: { 
            fcmToken: { $in: failedTokens },
            fcmTokenMobile: { $in: failedTokens }
          }
        });
      } else if (role === 'astrologer') {
        await Astrologer.findByIdAndUpdate(userId, {
          $pull: { 
            fcmToken: { $in: failedTokens },
            fcmTokenMobile: { $in: failedTokens }
          }
        });
      }
      console.log(`Cleaned up ${failedTokens.length} dead FCM tokens for ${role} ${userId}`);
    }
    
    return result ? result.success : false;
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
    const validTokens = tokens?.filter(t => typeof t === 'string' && t.trim().length > 0) || [];
    if (validTokens.length === 0) return false;
    
    const adminSDK = getFirebaseAdmin();
    if (!adminSDK) {
      console.warn('Firebase Admin SDK is not initialized. Skipping push notification.');
      return false;
    }

    const formattedData = {};
    if (Object.keys(data).length > 0) {
      for (const [key, value] of Object.entries(data)) {
        formattedData[key] = String(value);
      }
    }

    const isUrgent = data.type === 'incoming_call' || data.type === 'incoming_chat';

    // Use a top-level notification object to ensure mobile devices automatically
    // display system notifications in the background.
    const dataWithNotifInfo = {
      ...formattedData,
      title: String(title),
      body: String(body),
    };

    const defaultIcon = 'https://res.cloudinary.com/dut8feomk/image/upload/v1781699113/astrotalk_branding/otdilt1kns6zctiud2wq.png';

    const payload = {
      tokens: validTokens,
      notification: {
        title: String(title),
        body: String(body),
        imageUrl: data.image || defaultIcon
      },
      data: dataWithNotifInfo,
      webpush: {
        fcmOptions: {
          link: data.url ? `${process.env.CLIENT_URL || 'http://localhost:5173'}${data.url}` : (process.env.CLIENT_URL || 'http://localhost:5173')
        },
        notification: {
          title: title,
          body: body,
          icon: defaultIcon,
          badge: defaultIcon,
          image: data.image || defaultIcon
        }
      },
      android: {
        priority: isUrgent ? 'high' : 'normal',
        notification: {
          title: title,
          body: body,
          sound: 'default',
          channelId: isUrgent ? 'high_importance_channel' : 'default_channel',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          imageUrl: data.image || defaultIcon
        }
      },
      apns: {
        headers: {
          'apns-priority': isUrgent ? '10' : '5'
        },
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await adminSDK.messaging().sendEachForMulticast(payload);
    console.log(`Multicast push sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
    
    let failedTokens = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/invalid-registration-token' || 
              errorCode === 'messaging/registration-token-not-registered') {
            failedTokens.push(validTokens[idx]);
          }
        }
      });
    }

    return { success: true, failedTokens };
  } catch (error) {
    console.error('Error sending multicast push notification:', error.message);
    return { success: false, failedTokens: [] };
  }
};
