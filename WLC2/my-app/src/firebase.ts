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
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDpuTcU4IeYnBS89VwjiMQlwT8KbFcQTrE",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "gigfriendv2-3079b.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "gigfriendv2-3079b",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "gigfriendv2-3079b.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "152295917608",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:152295917608:web:7f1c67ffcc82edf1460d1d",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-1B37W33FVF"
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