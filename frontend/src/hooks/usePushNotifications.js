import { useEffect, useRef, useCallback } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import api from '../api/axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { useLocation } from 'react-router-dom';

const FCM_TOKEN_STORAGE_KEY = 'jl_last_fcm_token';
const FCM_TOKEN_ROLE_KEY = 'jl_last_fcm_role';

/**
 * Determine the active role and user from Redux state.
 * Prioritizes astrologer auth if both are somehow logged in (edge case).
 */
const useActiveAuth = () => {
  const userAuth = useSelector((state) => state.auth) || {};
  const astrologerAuth = useSelector((state) => state.astrologerAuth) || {};
  const location = useLocation();

  const currentPath = location.pathname;
  
  if (currentPath.startsWith('/astrologer')) {
    if (astrologerAuth.isAuthenticated && astrologerAuth.user?._id) {
      return { user: astrologerAuth.user, role: 'astrologer', isAuthenticated: true };
    }
  } else {
    // Default to user for '/' or '/user' routes
    if (userAuth.isAuthenticated && userAuth.user?._id) {
      return { user: userAuth.user, role: 'user', isAuthenticated: true };
    }
  }

  return { user: null, role: null, isAuthenticated: false };
};

/**
 * Explicitly register the Firebase messaging service worker.
 * Returns the ServiceWorkerRegistration for use with getToken().
 */
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser.');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Firebase messaging SW registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Sync FCM token with the correct backend endpoint based on role.
 */
const syncTokenWithBackend = async (token, role) => {
  const endpoint = role === 'astrologer' ? '/astrologer/fcm-token' : '/user/fcm-token';
  try {
    await api.put(endpoint, { fcmToken: token, platform: 'web' });
    // Cache the synced token + role so we don't re-sync unnecessarily
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(FCM_TOKEN_ROLE_KEY, role);
    console.log(`FCM token synced with backend (${role} → ${endpoint})`);
  } catch (error) {
    console.error(`Failed to sync FCM token to ${endpoint}:`, error);
  }
};

export const usePushNotifications = () => {
  const { user, role, isAuthenticated } = useActiveAuth();
  const swRegistrationRef = useRef(null);
  const onMessageUnsubRef = useRef(null);

  /**
   * Core function: request notification permission, get FCM token, sync to backend.
   * Compares with cached token to avoid redundant API calls.
   */
  const requestAndSyncToken = useCallback(async () => {
    if (!messaging || !user?._id || !role) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied by user.');
        return;
      }

      // Ensure SW is registered
      if (!swRegistrationRef.current) {
        swRegistrationRef.current = await registerServiceWorker();
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
      if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY') {
        console.warn('VITE_FIREBASE_VAPID_KEY is not set. Push notifications will not work.');
        return;
      }

      const tokenOptions = { vapidKey };
      if (swRegistrationRef.current) {
        tokenOptions.serviceWorkerRegistration = swRegistrationRef.current;
      }

      const currentToken = await getToken(messaging, tokenOptions);
      if (!currentToken) {
        console.warn('No FCM registration token available.');
        return;
      }

      // Check if re-sync is needed (token changed, role changed, or user account changed)
      const cachedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
      const cachedRole = localStorage.getItem(FCM_TOKEN_ROLE_KEY);
      const cachedUserId = localStorage.getItem('jl_last_fcm_user_id');

      if (currentToken !== cachedToken || role !== cachedRole || user._id !== cachedUserId) {
        await syncTokenWithBackend(currentToken, role);
        localStorage.setItem('jl_last_fcm_user_id', user._id); // Update user ID cache
      } else {
        console.log('FCM token unchanged for this user — skipping sync.');
      }
    } catch (error) {
      console.error('Error during FCM token request/sync:', error);
    }
  }, [user, role]);

  // Initial token request on login / role change
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      requestAndSyncToken();
    }
  }, [isAuthenticated, user?._id, role, requestAndSyncToken]);

  // Re-sync on tab focus / visibility change (Bug #6)
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestAndSyncToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, user?._id, requestAndSyncToken]);

  // Foreground message listener with type differentiation (Bug #7)
  useEffect(() => {
    if (!messaging) return;

    // Clean up previous subscription
    if (onMessageUnsubRef.current) {
      onMessageUnsubRef.current();
    }

    onMessageUnsubRef.current = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);

      const title = payload.notification?.title || payload.data?.title || 'New Message';
      const body = payload.notification?.body || payload.data?.body || '';
      const type = payload.data?.type || '';

      // For incoming call / chat requests, dispatch a custom event
      if (type === 'incoming_call' || type === 'incoming_chat') {
        window.dispatchEvent(
          new CustomEvent('fcm_incoming_request', {
            detail: {
              type,
              title,
              body,
              ...payload.data,
            },
          })
        );
      }

      // Show a toast for all types
      const iconMap = {
        order_confirmed: '🎉',
        order_update: '📦',
        order_shipped: '🚚',
        order_delivered: '🎉',
        order_cancelled: '❌',
        withdrawal_processed: '💰',
        broadcast: '📢',
        call_accepted: '📞',
        incoming_call: '📞',
        incoming_chat: '💬',
        pooja_booking: '🙏',
      };

      toast(body || title, {
        icon: iconMap[type] || '🔔',
        duration: (type === 'incoming_call' || type === 'incoming_chat') ? 6000 : 5000,
      });

      // Skipping native OS notification in foreground to prevent duplicates.
      // The toast above is sufficient when the app is active.
    });

    return () => {
      if (onMessageUnsubRef.current) {
        onMessageUnsubRef.current();
        onMessageUnsubRef.current = null;
      }
    };
  }, []);
};
