import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  Auth
} from 'firebase/auth';
import { auth as firebaseAuth, googleProvider as firebaseGoogleProvider } from '../firebase';

// Define the shape of our AuthContext
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signInWithGoogle: async () => null,
  signOut: async () => {}
});

// Create a hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps your app and provides auth context
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google using popup
  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(firebaseAuth, firebaseGoogleProvider);
      // This gives you a Google Access Token
      // We're ignoring the credential in this code, but keeping for reference
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(firebaseAuth);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Store user in localStorage for persistence (similar to current implementation)
      if (user) {
        const userData = {
          name: user.displayName,
          email: user.email,
          picture: user.photoURL
        };
        localStorage.setItem('user', JSON.stringify(userData));
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
}; 