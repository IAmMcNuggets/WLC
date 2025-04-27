import { getMessaging, getToken, onMessage, isSupported, deleteToken } from 'firebase/messaging';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from '../firebase';

// Check if the device is iOS
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Check if the app is installed as a PWA
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true || 
         document.referrer.includes('android-app://');
};

// Initialize messaging if it's supported
export const initializeMessaging = async () => {
  try {
    // Check if the browser supports FCM
    const isFCMSupported = await isSupported();
    if (!isFCMSupported) {
      console.log('Firebase Cloud Messaging is not supported in this browser');
      return null;
    }

    // iOS specific check - FCM only works in PWA mode
    if (isIOSDevice() && !isPWAInstalled()) {
      console.log('iOS device requires PWA installation for notifications');
      return null;
    }

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const hasMessagingSW = registrations.some(reg => 
        reg.scope.includes(window.location.origin) && 
        reg.active?.scriptURL.includes('firebase-messaging-sw.js')
      );
      
      if (!hasMessagingSW) {
        console.warn('Firebase messaging service worker not found. Attempting registration...');
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Firebase messaging service worker registered:', registration.scope);
        } catch (error) {
          console.error('Failed to register Firebase messaging service worker:', error);
        }
      } else {
        console.log('Firebase messaging service worker already registered');
      }
    }

    const app = (await import('../firebase')).default;
    const messaging = getMessaging(app);
    console.log('Firebase messaging initialized successfully');
    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
    return null;
  }
};

// Request permission for notifications
export const requestNotificationPermission = async () => {
  try {
    console.log('Starting notification permission request process');
    
    // Check if notifications are supported in this browser
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return false;
    }

    // iOS specific check - FCM only works in PWA mode
    if (isIOSDevice() && !isPWAInstalled()) {
      console.log('iOS device requires PWA installation for notifications');
      return false;
    }

    // Request permission
    console.log('Requesting notification permission from browser');
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission !== 'granted') {
      console.log('Notification permission denied by user');
      return false;
    }

    // Get messaging
    console.log('Initializing Firebase messaging');
    const messaging = await initializeMessaging();
    if (!messaging) {
      console.log('Failed to initialize messaging');
      return false;
    }

    // Try to get existing token first and delete it to ensure we get a fresh one
    try {
      const currentToken = await getToken(messaging);
      if (currentToken) {
        console.log('Found existing token, deleting to refresh');
        await deleteToken(messaging);
      }
    } catch (refreshError) {
      console.warn('Error refreshing token:', refreshError);
      // Continue anyway
    }

    // Get new token
    console.log('Requesting FCM token with VAPID key');
    const token = await getToken(messaging, {
      vapidKey: "BJWQUEOMjTk_Iw8jdsV-4Y8HXOkKP-NvYPw0yBn_rQGw1OitHb5Hchz_Qvaunq6gB8wjDdOEj_GJ4v_J5vr-_0Q"
    });

    if (!token) {
      console.log('No registration token available');
      return false;
    }

    console.log('FCM Registration Token:', token.substring(0, 10) + '...');

    // Save token to user's profile in Firestore
    if (auth.currentUser) {
      try {
        const userId = auth.currentUser.uid;
        console.log('Current user ID:', userId);
        
        const userProfileRef = doc(firestore, 'userProfiles', userId);
        console.log('User profile ref created for path:', `userProfiles/${userId}`);
        
        // Check if user profile exists
        console.log('Checking if user profile exists...');
        const userProfileSnap = await getDoc(userProfileRef);
        console.log('User profile exists:', userProfileSnap.exists());
        
        if (!userProfileSnap.exists()) {
          // Create a basic user profile if it doesn't exist
          console.log('Creating new user profile with these fields:');
          const profileData = {
            displayName: auth.currentUser.displayName || 'User',
            email: auth.currentUser.email || '',
            photoURL: auth.currentUser.photoURL || '',
            createdAt: serverTimestamp(),
            fcmToken: token,
            lastTokenUpdate: serverTimestamp()
          };
          console.log('Profile data:', { ...profileData, fcmToken: '(hidden)' });
          
          try {
            console.log('Attempting to create document in Firestore...');
            await setDoc(userProfileRef, profileData);
            console.log('New user profile created successfully');
          } catch (createError: any) {
            console.error('Error creating user profile:', createError);
            console.error('Error code:', createError.code);
            console.error('Error message:', createError.message);
            
            // Try with minimal fields
            try {
              console.log('Trying minimal profile creation with required fields only');
              const minimalData = {
                displayName: 'User',
                email: auth.currentUser.email || '',
                createdAt: serverTimestamp(),
                fcmToken: token,
                lastTokenUpdate: serverTimestamp()
              };
              await setDoc(userProfileRef, minimalData);
              console.log('Minimal profile created successfully');
            } catch (minimalError: any) {
              console.error('Error creating minimal profile:', minimalError);
              console.error('Error code:', minimalError.code);
              console.error('Error message:', minimalError.message);
              
              // Last resort: try with just the token
              try {
                console.log('Attempting to save just the token');
                await setDoc(userProfileRef, {
                  fcmToken: token,
                  lastTokenUpdate: serverTimestamp()
                }, { merge: true });
                console.log('Token saved successfully with merge');
              } catch (tokenError) {
                console.error('Failed to save token with merge:', tokenError);
                throw tokenError;
              }
            }
          }
        } else {
          // Just update the token if profile exists
          console.log('Updating existing profile with token');
          try {
            console.log('Attempting to update FCM token in Firestore...');
            await setDoc(userProfileRef, {
              fcmToken: token,
              lastTokenUpdate: serverTimestamp()
            }, { merge: true });
            console.log('Token updated successfully');
          } catch (updateError: any) {
            console.error('Error updating token:', updateError);
            console.error('Error code:', updateError.code);
            console.error('Error message:', updateError.message);
            throw updateError;
          }
        }
        
        return true;
      } catch (firestoreError) {
        console.error('Firestore operation error:', firestoreError);
        if (firestoreError instanceof Error && firestoreError.message.includes('permission-denied')) {
          console.error('This is a permissions issue. Check Firestore security rules.');
        }
        throw firestoreError;
      }
    } else {
      console.error('No authenticated user');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
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
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const handleForegroundMessage = async () => {
    const messaging = await initializeMessaging();
    if (!messaging) return () => {};

    console.log('Setting up foreground message handler');
    
    // Also listen for test notifications
    const testHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        console.log('Received test message:', customEvent.detail);
        callback(customEvent.detail);
      }
    };
    
    window.addEventListener('firebase-messaging-test', testHandler);
    
    const unsubscribeFirebase = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
    
    // Return a function that unsubscribes from both
    return () => {
      unsubscribeFirebase();
      window.removeEventListener('firebase-messaging-test', testHandler);
    };
  };

  return handleForegroundMessage();
}; 