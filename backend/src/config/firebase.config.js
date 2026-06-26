import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let firebaseApp = null;

export const initFirebase = () => {
  try {
    let credential;

    // Try reading from individual environment variables first
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else {
      // Fallback to reading from file if variables are not set
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      
      if (!serviceAccountPath) {
        console.warn('⚠️ Firebase credentials not set in .env (either via FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_PATH). Push notifications will not work.');
        return null;
      }

      const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
      
      if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️ Firebase service account file not found at: ${absolutePath}. Push notifications disabled.`);
        return null;
      }

      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    }

    firebaseApp = admin.initializeApp({
      credential: credential
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
};

export const getFirebaseAdmin = () => {
  return firebaseApp ? admin : null;
};

export const isFirebaseReady = () => {
  return firebaseApp !== null;
};
