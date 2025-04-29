import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { getApp } from 'firebase/app';

// Initialize messaging
export const initializeMessaging = async () => {
  try {
    console.log('Initializing messaging...');
    
    // Check if messaging is supported
    const messagingSupported = await isSupported();
    console.log('Messaging supported:', messagingSupported);
    
    if (!messagingSupported) {
      console.error('Messaging is not supported in this browser');
      return null;
    }
    
    // Get messaging instance
    const app = getApp();
    console.log('Firebase app initialized:', !!app);
    
    const messaging = getMessaging(app);
    console.log('Messaging instance created:', !!messaging);
    
    return messaging;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return null;
  }
};

// Get service worker registration
export const getServiceWorkerRegistration = async () => {
  try {
    console.log('Getting service worker registration...');
    
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers not supported');
      return null;
    }
    
    // Check if the service worker is already registered
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    const existingFCMServiceWorker = existingRegistrations.find(
      reg => reg.scope.includes(window.location.origin) && reg.active
    );
    
    if (existingFCMServiceWorker) {
      console.log('Using existing service worker registration:', existingFCMServiceWorker);
      return existingFCMServiceWorker;
    }
    
    // Register a new service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('Service worker registered:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service worker ready');
    
    return registration;
  } catch (error) {
    console.error('Error registering service worker:', error);
    return null;
  }
};

// Request permission for notifications
export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported in this browser
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Detect Android
    const isAndroid = /android/i.test(navigator.userAgent);
    
    // Get service worker registration first to ensure it's ready
    // This is particularly important for Android
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      console.error('Failed to get service worker registration');
      return false;
    }
    
    // Initialize Firebase Messaging
    const messaging = await initializeMessaging();
    if (!messaging) return false;

    // Get token with service worker registration (crucial for Android)
    const vapidKey = "BJWQUEOMjTk_Iw8jdsV-4Y8HXOkKP-NvYPw0yBn_rQGw1OitHb5Hchz_Qvaunq6gB8wjDdOEj_GJ4v_J5vr-_0Q";
    
    const tokenOptions = {
      vapidKey,
      serviceWorkerRegistration: registration
    };
    
    const token = await getToken(messaging, tokenOptions);

    if (!token) {
      console.log('No registration token available');
      return false;
    }

    console.log('FCM Registration Token:', token);

    // Save token to user's profile in Firestore
    if (auth.currentUser) {
      try {
        const userId = auth.currentUser.uid;
        console.log('Current user ID:', userId);
        
        const userProfileRef = doc(firestore, 'userProfiles', userId);
        console.log('User profile ref created');
        
        // Check if user profile exists
        console.log('Checking if user profile exists...');
        const userProfileSnap = await getDoc(userProfileRef);
        console.log('User profile exists:', userProfileSnap.exists());
        
        await storeTokenInUserDocument(token);
        console.log('Token stored in user document');
        return true;
      } catch (error) {
        console.error('Error storing token in user document:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Store token in user document
const storeTokenInUserDocument = async (token: string) => {
  if (!auth.currentUser) {
    console.error('No authenticated user');
    return;
  }
  
  try {
    const userId = auth.currentUser.uid;
    console.log('Storing token for user:', userId);
    
    const userProfileRef = doc(firestore, 'userProfiles', userId);
    await setDoc(userProfileRef, {
      fcmToken: token,
      lastTokenUpdate: serverTimestamp()
    }, { merge: true });
    
    console.log('Token stored successfully');
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
}; 