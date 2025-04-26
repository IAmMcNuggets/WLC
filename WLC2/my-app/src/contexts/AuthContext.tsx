import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';

// Define the shape of our context
interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  logout: async () => {}
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

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 