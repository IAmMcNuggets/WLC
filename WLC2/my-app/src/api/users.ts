import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore, auth } from '../firebase';

/**
 * Save the user's FCM token to their Firestore document
 * @param token The FCM token to save
 * @returns Promise that resolves when the token is saved
 */
export const saveUserFCMToken = async (token: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No authenticated user to save FCM token');
      throw new Error('User not authenticated');
    }

    const userId = currentUser.uid;
    console.log('Saving FCM token for user:', userId);
    
    const userProfileRef = doc(firestore, 'userProfiles', userId);
    
    // Check if user profile exists
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (!userProfileSnap.exists()) {
      // Create a basic user profile if it doesn't exist
      console.log('Creating new user profile with FCM token');
      await setDoc(userProfileRef, {
        displayName: currentUser.displayName || 'User',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        fcmToken: token
      });
    } else {
      // Just update the token if profile exists
      console.log('Updating existing profile with FCM token');
      await setDoc(userProfileRef, {
        fcmToken: token
      }, { merge: true });
    }
    
    console.log('FCM token saved successfully');
    
  } catch (error) {
    console.error('Error saving FCM token to user profile:', error);
    throw error;
  }
};

/**
 * Remove the FCM token from the user's Firestore document
 * @returns Promise that resolves when the token is removed
 */
export const removeFCMToken = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No authenticated user to remove FCM token');
      return;
    }

    const userId = currentUser.uid;
    const userProfileRef = doc(firestore, 'userProfiles', userId);
    
    await setDoc(userProfileRef, {
      fcmToken: null
    }, { merge: true });
    
    console.log('FCM token removed successfully');
    
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
};

/**
 * Get the user's profile data
 * @returns Promise that resolves to the user's profile data
 */
export const getUserProfile = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No authenticated user');
      throw new Error('User not authenticated');
    }

    const userId = currentUser.uid;
    const userProfileRef = doc(firestore, 'userProfiles', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (userProfileSnap.exists()) {
      return userProfileSnap.data();
    } else {
      return null;
    }
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}; 