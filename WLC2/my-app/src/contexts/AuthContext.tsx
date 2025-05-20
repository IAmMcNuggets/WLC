import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut,
  UserCredential
} from 'firebase/auth';
import { auth } from '../firebase';
import { GoogleUser } from '../types/user';

// Define the shape of our context
interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  getUserData: (user: FirebaseUser) => GoogleUser;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  logout: async () => {},
  getUserData: () => ({ name: '', email: '' })
});

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Get standardized user data from Firebase User
  const getUserData = (user: FirebaseUser): GoogleUser => {
    return {
      name: user.displayName || 'User',
      email: user.email || 'No email',
      picture: user.photoURL || undefined
    };
  };

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Update localStorage with the latest user data
        const userData = getUserData(user);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Firebase Auth state observer error:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Function to log out
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 