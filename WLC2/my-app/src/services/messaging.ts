import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
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

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    console.log('Requesting notification permission...');
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return await getAndStoreToken();
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission === 'granted') {
      return await getAndStoreToken();
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get FCM token and store it
export const getAndStoreToken = async (): Promise<boolean> => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);
    
    console.log('Getting FCM token...');
    
    // Get service worker registration first
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      console.error('Failed to get service worker registration');
      return false;
    }
    
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      console.log('FCM token acquired:', currentToken.substring(0, 10) + '...');
      localStorage.setItem('notifications-enabled', 'true');
      
      // Store token in user document
      try {
        await storeTokenInUserDocument(currentToken);
        console.log('Token stored in user document');
        return true;
      } catch (error) {
        console.error('Error storing token in user document:', error);
        return false;
      }
    } else {
      console.error('No FCM token received');
      return false;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
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