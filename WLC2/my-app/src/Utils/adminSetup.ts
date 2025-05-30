import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase';

/**
 * Sets the first super admin in the system
 * This should be run once manually to bootstrap the super admin role
 * @param userId The user ID to set as the first super admin
 * @returns Promise that resolves when the operation is complete
 */
export const setFirstSuperAdmin = async (userId: string): Promise<void> => {
  try {
    console.log('Setting first super admin:', userId);
    
    // Get the user profile
    const userProfileRef = doc(firestore, 'userProfiles', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (!userProfileSnap.exists()) {
      throw new Error('User profile does not exist. User must sign in at least once before being set as super admin.');
    }
    
    // Update the user profile with super admin status
    await updateDoc(userProfileRef, {
      isSuperAdmin: true,
      role: 'admin'
    });
    
    console.log('First super admin set successfully');
    return;
  } catch (error) {
    console.error('Error setting first super admin:', error);
    throw error;
  }
}; 