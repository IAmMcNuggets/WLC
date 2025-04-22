import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser
} from 'firebase/auth';
import { auth, signInWithGoogleCredential } from '../firebase';

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
    console.log('AuthProvider initializing...');
    
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Firebase Auth state observer error:', error);
      setLoading(false);
    });

    // Check if we have a stored Google ID token and sign in with it
    const attemptSignInWithStoredCredential = async () => {
      try {
        const storedCredential = localStorage.getItem('google_credential');
        
        console.log('Stored credential exists:', !!storedCredential);
        
        if (storedCredential) {
          try {
            console.log('Attempting to sign in with stored credential');
            await signInWithGoogle(storedCredential);
            console.log('Successfully signed in with stored credential');
          } catch (error) {
            console.error('Error signing in with stored credential:', error);
            localStorage.removeItem('google_credential');
          }
        }
      } catch (error) {
        console.error('Error during automatic sign-in:', error);
      }
    };

    attemptSignInWithStoredCredential();

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up Auth state observer');
      unsubscribe();
    };
  }, []);

  // Function to sign in with Google credentials
  const signInWithGoogle = async (googleIdToken: string) => {
    try {
      console.log('Creating Google credential...');
      await signInWithGoogleCredential(googleIdToken);
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