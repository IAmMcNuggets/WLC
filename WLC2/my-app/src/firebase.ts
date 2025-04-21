import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// For development, use environment variables
// For production build on Netlify, use hardcoded values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBZt7OLIQO-DtLJSDMP8ZERRpIyHfCESkw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "gigfriend-9b3ea.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "gigfriend-9b3ea",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "gigfriend-9b3ea.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "457762949335",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:457762949335:web:b7023fd07a527bb6774892",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-47QE5FT56P"
};

// Log Firebase configuration for debugging (only apiKey prefix for security)
console.log('Firebase Configuration:', {
  apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + '...' : 'undefined',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  configSource: process.env.REACT_APP_FIREBASE_API_KEY ? 'Environment Variables' : 'Hardcoded Fallback'
});

let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;
let googleProvider: GoogleAuthProvider;

// Initialize Firebase
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Initialize Analytics only if supported
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
  
  googleProvider = new GoogleAuthProvider();
  
  // Add Google Drive scope to the provider
  googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { app as default, auth, analytics, googleProvider }; 