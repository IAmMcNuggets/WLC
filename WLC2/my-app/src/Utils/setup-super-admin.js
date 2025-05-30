// This script sets up the first super admin in the system
// Run this from the browser console after signing in with the account you want to make super admin

import { setFirstSuperAdmin } from './adminSetup';
import { auth } from '../firebase';

/**
 * This function sets the current logged in user as the first super admin
 */
export const setupCurrentUserAsSuperAdmin = async () => {
  try {
    // Check if a user is logged in
    if (!auth.currentUser) {
      console.error('No user is logged in. Please sign in first.');
      return;
    }
    
    // Get the current user ID
    const userId = auth.currentUser.uid;
    
    // Confirm with the user
    if (!confirm(`Are you sure you want to set user ${auth.currentUser.email} (${userId}) as the SUPER ADMIN?
This role has full system access and can manage all companies and users.`)) {
      console.log('Operation cancelled by user');
      return;
    }
    
    // Set the user as super admin
    await setFirstSuperAdmin(userId);
    
    console.log('✅ Super admin setup complete!');
    console.log('You can now access the super admin dashboard at /super-admin');
    
    // Ask if they want to navigate to the super admin dashboard
    if (confirm('Super admin setup successful! Would you like to go to the super admin dashboard now?')) {
      window.location.href = '/super-admin';
    }
    
  } catch (error) {
    console.error('Error setting up super admin:', error);
    alert(`Failed to set up super admin: ${error.message}`);
  }
};

// Instructions for the user
console.log(`
=== SUPER ADMIN SETUP ===
This script will set up the currently logged in user as the first super admin.
The super admin can generate company registration codes and has full system access.

To run this setup:
1. Make sure you are logged in with the account you want to make super admin
2. Run the following command in the console:
   
   setupCurrentUserAsSuperAdmin()
   
=========================
`);

// Make the function available in the global scope for easy access
window.setupCurrentUserAsSuperAdmin = setupCurrentUserAsSuperAdmin; 