import admin from 'firebase-admin';

let firebaseApp = null;

export const initFirebase = () => {
  try {
    let credential;

    // Read the complete JSON object string from the environment variable
    const serviceAccountJsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountJsonStr) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJsonStr);
        credential = admin.credential.cert(serviceAccount);
      } catch (parseError) {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH found in .env, but it is not valid JSON. Ensure the JSON string is properly formatted and enclosed in single quotes if multiline.');
        return null;
      }
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Fallback to individual variables if present
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else {
      console.warn('⚠️ Firebase credentials not set in .env. Push notifications will not work.');
      return null;
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
