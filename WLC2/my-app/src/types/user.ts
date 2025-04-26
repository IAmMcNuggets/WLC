/**
 * User-related type definitions
 */

export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
  // Add additional properties as needed
}

export interface UserProfile extends GoogleUser {
  uid: string;
  role?: string;
  isAdmin?: boolean;
}

export interface MessageUser {
  uid: string;
  name: string;
  photoURL: string | null;
} 