import Notification from '../models/notification.model.js';
import { sendPushNotification } from './firebaseHelper.js';

/**
 * Creates an in-app (bell) notification AND sends an FCM push in one call.
 * Never throws — notification failures must never break the main business flow.
 */
export const notify = async ({ userId, role = 'user', title, message, type = 'info', link = null, data = {} }) => {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (err) {
    console.error('[notify] DB notification failed:', err.message);
  }

  try {
    await sendPushNotification({ 
      userId, 
      role, 
      title, 
      body: message, 
      data: { ...data, url: link || data.url } 
    });
  } catch (err) {
    console.error('[notify] Push notification failed:', err.message);
  }
};
