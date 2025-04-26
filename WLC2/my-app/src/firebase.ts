import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  Auth, 
  signInWithCredential,
  signInWithPopup,
  OAuthProvider 
} from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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
let firestore: Firestore;
let storage: FirebaseStorage;

// Initialize Firebase
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  
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

// Function to sign in with Google OAuth credential
export const signInWithGoogleCredential = async (idToken: string) => {
  try {
    // Create a Google Auth Provider credential with the token
    const credential = GoogleAuthProvider.credential(idToken);
    
    // Sign in with the credential
    const result = await signInWithCredential(auth, credential);
    return result;
  } catch (error) {
    console.error('Error signing in with Google credential:', error);
    throw error;
  }
};

// Function to sign in with a Google popup (alternative approach)
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error('Error signing in with Google popup:', error);
    throw error;
  }
};

export { app as default, auth, analytics, googleProvider, firestore, storage }; 