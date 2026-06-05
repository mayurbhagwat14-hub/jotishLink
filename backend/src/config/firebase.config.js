import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let firebaseApp = null;

export const initFirebase = () => {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (!serviceAccountPath) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH is not set in .env. Push notifications will not work.');
      return null;
    }

    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ Firebase service account file not found at: ${absolutePath}. Push notifications disabled.`);
      return null;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
};

export const getFirebaseAdmin = () => {
  return admin;
};

export const isFirebaseReady = () => {
  return firebaseApp !== null;
};
