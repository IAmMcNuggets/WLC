import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';

// Initialize messaging if it's supported
export const initializeMessaging = async () => {
  try {
    // Check if the browser supports FCM
    const isFCMSupported = await isSupported();
    if (!isFCMSupported) {
      console.log('Firebase Cloud Messaging is not supported in this browser');
      return null;
    }

    const app = (await import('../firebase')).default;
    const messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
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

    // Get messaging
    const messaging = await initializeMessaging();
    if (!messaging) return false;

    // Get token
    // Note: You need to generate a VAPID key in Firebase Console
    // Project Settings > Cloud Messaging > Web Push certificates
    const token = await getToken(messaging, {
      vapidKey: "BJWQUEOMjTk_Iw8jdsV-4Y8HXOkKP-NvYPw0yBn_rQGw1OitHb5Hchz_Qvaunq6gB8wjDdOEj_GJ4v_J5vr-_0Q"
    });

    if (!token) {
      console.log('No registration token available');
      return false;
    }

    console.log('FCM Registration Token:', token);

    // Save token to user's profile in Firestore
    if (auth.currentUser) {
      await setDoc(doc(firestore, 'userProfiles', auth.currentUser.uid), {
        fcmToken: token
      }, { merge: true });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Handle foreground messages
export const onForegroundMessage = (callback) => {
  const handleForegroundMessage = async () => {
    const messaging = await initializeMessaging();
    if (!messaging) return () => {};

    return onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
  };

  return handleForegroundMessage();
}; 