import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
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

    // Get token
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
            fcmToken: token
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
                fcmToken: token
              };
              await setDoc(userProfileRef, minimalData);
              console.log('Minimal profile created successfully');
            } catch (minimalError: any) {
              console.error('Error creating minimal profile:', minimalError);
              console.error('Error code:', minimalError.code);
              console.error('Error message:', minimalError.message);
              throw minimalError;
            }
          }
        } else {
          // Just update the token if profile exists
          console.log('Updating existing profile with token');
          try {
            console.log('Attempting to update FCM token in Firestore...');
            await setDoc(userProfileRef, {
              fcmToken: token
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
      } catch (firestoreError: any) {
        console.error('Firestore operation error:', firestoreError);
        console.error('Error code:', firestoreError.code);
        console.error('Error message:', firestoreError.message);
        
        if (firestoreError && typeof firestoreError === 'object' && 'code' in firestoreError && 
            firestoreError.code === 'permission-denied') {
          console.error('This is a permissions issue. Check Firestore security rules.');
          console.error('Make sure the userProfiles collection is properly configured in security rules.');
          
          // Print current auth state for debugging
          console.log('Current auth state:');
          console.log('- User logged in:', !!auth.currentUser);
          console.log('- User ID:', auth.currentUser?.uid);
          console.log('- User email:', auth.currentUser?.email);
        }
        throw firestoreError;
      }
    } else {
      console.error('No authenticated user');
      return false;
    }
  } catch (error: any) {
    console.error('Error requesting notification permission:', error);
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
    }
    return false;
  }
};

// Handle foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const handleForegroundMessage = async () => {
    const messaging = await initializeMessaging();
    if (!messaging) return () => {};

    console.log('Setting up foreground message handler');
    return onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
  };

  return handleForegroundMessage();
}; 