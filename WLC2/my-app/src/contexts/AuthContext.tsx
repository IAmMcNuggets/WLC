import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';

// Define the shape of our context
interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: (googleIdToken: string) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signInWithGoogle: async () => {}
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
    });

    // Check if we have a stored Google ID token and sign in with it
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // If we have jti, it might be a Google credential token
        if (userData.jti) {
          const storedCredential = localStorage.getItem('google_credential');
          if (storedCredential) {
            // Sign in with the stored credential
            signInWithGoogle(storedCredential);
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Function to sign in with Google credentials
  const signInWithGoogle = async (googleIdToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(googleIdToken);
      await signInWithCredential(auth, credential);
      // Store the credential for future use
      localStorage.setItem('google_credential', googleIdToken);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 