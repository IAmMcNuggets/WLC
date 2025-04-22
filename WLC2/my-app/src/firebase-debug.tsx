import React, { useEffect, useState } from 'react';
import { auth, firestore } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

interface DebugInfo {
  authStatus: string;
  userId: string | null;
  firestoreTest: string;
  firestoreWrite: string;
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
    firestoreWrite: 'Not tested',
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
          await testFirestoreRead(user.uid);
          await testFirestoreWrite(user.uid);
        } else {
          setDebugInfo(prev => ({
            ...prev,
            authStatus: 'Not authenticated - Please sign in with Google'
          }));
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
    
    const testFirestoreRead = async (userId: string) => {
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

    const testFirestoreWrite = async (userId: string) => {
      try {
        // Try to write to Firestore
        const testDoc = doc(firestore, 'test', userId);
        await setDoc(testDoc, { 
          lastChecked: new Date().toISOString(),
          userId: userId
        });
        setDebugInfo(prev => ({
          ...prev,
          firestoreWrite: 'Write successful!'
        }));
      } catch (error: any) {
        setDebugInfo(prev => ({
          ...prev,
          firestoreWrite: `Error: ${error.message}`
        }));
      }
    };
    
    checkAuth();

    // Re-check auth state every 5 seconds to handle updates
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
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
      <p><strong>Firestore Read:</strong> {debugInfo.firestoreTest}</p>
      <p><strong>Firestore Write:</strong> {debugInfo.firestoreWrite}</p>
      {debugInfo.googleUserInfo && (
        <div>
          <p><strong>Google User:</strong> {debugInfo.googleUserInfo.name}</p>
          <p><strong>Email:</strong> {debugInfo.googleUserInfo.email}</p>
        </div>
      )}
      <div style={{ marginTop: '10px', fontSize: '11px' }}>
        Note: If permissions still failing, check Firebase Console security rules.
      </div>
    </div>
  );
};

export default FirebaseDebug; 