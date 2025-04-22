import React, { useEffect, useState } from 'react';
import { auth, firestore } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

interface DebugInfo {
  authStatus: string;
  userId: string | null;
  firestoreTest: string;
  googleUserInfo: any;
}

/**
 * This is a utility component to help debug Firebase Firestore permissions issues.
 * Place it somewhere in your app to see the current auth/firestore state.
 */
export const FirebaseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    authStatus: 'Checking...',
    userId: null,
    firestoreTest: 'Not tested',
    googleUserInfo: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check current auth state
        const user = auth.currentUser;
        
        if (user) {
          setDebugInfo(prev => ({
            ...prev,
            authStatus: 'Authenticated',
            userId: user.uid
          }));
          
          // Try to access Firestore
          testFirestore(user.uid);
        } else {
          setDebugInfo(prev => ({
            ...prev,
            authStatus: 'Not authenticated'
          }));
          
          // Try anonymous sign-in if not authenticated
          try {
            const result = await signInAnonymously(auth);
            setDebugInfo(prev => ({
              ...prev,
              authStatus: 'Anonymous auth success',
              userId: result.user.uid
            }));
            
            // Test Firestore with anonymous auth
            testFirestore(result.user.uid);
          } catch (error: any) {
            setDebugInfo(prev => ({
              ...prev,
              authStatus: `Anonymous auth failed: ${error.message}`
            }));
          }
        }
        
        // Check for Google user info in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const googleUserInfo = JSON.parse(storedUser);
            setDebugInfo(prev => ({
              ...prev,
              googleUserInfo
            }));
          } catch (e) {
            console.error('Error parsing stored user data', e);
          }
        }
      } catch (error: any) {
        setDebugInfo(prev => ({
          ...prev,
          authStatus: `Auth check error: ${error.message}`
        }));
      }
    };
    
    const testFirestore = async (userId: string) => {
      try {
        // Try to read from Firestore
        const testCollection = collection(firestore, 'test');
        await getDocs(testCollection);
        setDebugInfo(prev => ({
          ...prev,
          firestoreTest: 'Read successful!'
        }));
      } catch (error: any) {
        setDebugInfo(prev => ({
          ...prev,
          firestoreTest: `Error: ${error.message}`
        }));
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '100px', 
      right: '20px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h3>Firebase Debug</h3>
      <p><strong>Auth Status:</strong> {debugInfo.authStatus}</p>
      <p><strong>User ID:</strong> {debugInfo.userId || 'None'}</p>
      <p><strong>Firestore Test:</strong> {debugInfo.firestoreTest}</p>
      {debugInfo.googleUserInfo && (
        <div>
          <p><strong>Google User:</strong></p>
          <pre style={{ 
            maxHeight: '100px', 
            overflow: 'auto', 
            fontSize: '10px' 
          }}>
            {JSON.stringify(debugInfo.googleUserInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FirebaseDebug; 