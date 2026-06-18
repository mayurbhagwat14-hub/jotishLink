import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import api from '../api/axios';
import { useSelector } from 'react-redux';

export const usePushNotifications = () => {
  const { user } = useSelector(state => state.auth);
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const requestPermissionAndGetToken = async () => {
      try {
        if (!messaging) {
          console.warn('Firebase messaging is not supported or configured.');
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          // Replace with your actual VAPID key
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY';
          
          if (vapidKey === 'YOUR_VAPID_KEY') {
             console.warn('Please set VITE_FIREBASE_VAPID_KEY in your .env file to enable push notifications');
             return;
          }

          const token = await getToken(messaging, { vapidKey });
          
          if (token) {
            console.log('FCM Token:', token);
            setFcmToken(token);
            
            // Send token to backend if user is logged in
            if (user && user._id) {
               await syncTokenWithBackend(token);
            }
          } else {
            console.warn('No registration token available. Request permission to generate one.');
          }
        } else {
          console.warn('Notification permission denied by user.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token:', error);
      }
    };

    if (user && user._id) {
      requestPermissionAndGetToken();
    }
  }, [user]);

  useEffect(() => {
    if (!messaging) return;
    
    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground Message received. ', payload);
      // You can implement custom toast UI here
      const notificationTitle = payload.notification?.title || 'New Message';
      const notificationOptions = {
        body: payload.notification?.body,
        icon: '/vite.svg',
        tag: payload.messageId || 'jyotishlink-notification'
      };
      
      // Only show native notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(notificationTitle, notificationOptions);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const syncTokenWithBackend = async (token) => {
    try {
      await api.put('/user/fcm-token', { fcmToken: token });
      console.log('FCM Token synced with backend');
    } catch (error) {
      console.error('Failed to sync FCM token with backend:', error);
    }
  };

  return { fcmToken };
};
