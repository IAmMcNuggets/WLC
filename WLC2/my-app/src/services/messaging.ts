import { getMessaging, getToken, onMessage, isSupported, deleteToken } from 'firebase/messaging';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { getApp } from 'firebase/app';

interface MessagePayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    [key: string]: string | undefined;
    messageId?: string;
  };
  from: string;
  messageId?: string;
  collapseKey?: string;
}

// Check if the device is iOS
export const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Check if the app is installed as a PWA
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Initialize messaging
export const initializeMessaging = async () => {
  try {
    console.log('Initializing messaging...');
    
    // Check if messaging is supported
    const isSupported = await isSupported();
    console.log('Messaging supported:', isSupported);
    
    if (!isSupported) {
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
      await registerServiceWorker();
      return await getAndStoreToken();
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission === 'granted') {
      await registerServiceWorker();
      return await getAndStoreToken();
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  try {
    console.log('Registering service worker...');
    
    if ('serviceWorker' in navigator) {
      // Check for existing registrations
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      const hasFCMServiceWorker = existingRegistrations.some(
        reg => reg.active?.scriptURL.includes('firebase-messaging-sw.js')
      );
      
      if (hasFCMServiceWorker) {
        console.log('Firebase messaging service worker already registered');
        return existingRegistrations.find(
          reg => reg.active?.scriptURL.includes('firebase-messaging-sw.js')
        ) || null;
      }
      
      // Register the service worker
      console.log('Registering new Firebase messaging service worker');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      console.log('Service worker registration successful:', registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } else {
      console.error('Service workers are not supported in this browser');
      return null;
    }
  } catch (error) {
    console.error('Error registering service worker:', error);
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

// Test notification function
export const testNotification = async () => {
  try {
    const messaging = await initializeMessaging();
    if (!messaging) return false;
    
    // This only tests foreground notifications via the onMessage handler
    console.log('Sending test notification to yourself');
    
    // Create a test notification through the onForegroundMessage handler
    const testPayload = {
      notification: {
        title: 'Test Notification',
        body: 'This is a test notification. If you see this, foreground notifications are working.'
      }
    };
    
    // Manually trigger any registered onMessage handlers
    // This only works for the current session
    window.dispatchEvent(new CustomEvent('firebase-messaging-test', { 
      detail: testPayload 
    }));
    
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

// Handle foreground messages
export const onForegroundMessage = async (callback: (payload: MessagePayload) => void) => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);
    
    console.log('Setting up foreground message handler');
    
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Ensure messageId is consistently available
      if (payload.data && !payload.data.messageId && payload.messageId) {
        payload.data.messageId = payload.messageId;
      }
      
      callback(payload as MessagePayload);
    });
  } catch (error) {
    console.error('Error setting up foreground message handler:', error);
    return () => {}; // Return empty function as fallback
  }
}; 