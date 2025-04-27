import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { requestNotificationPermission, onForegroundMessage, isIOSDevice, isPWAInstalled } from '../services/messaging';

interface NotificationContextType {
  notificationsEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
  isIOS: boolean;
  isPWA: boolean;
  showIOSInstructions: boolean;
  checkNotificationStatus: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationsEnabled: false,
  enableNotifications: async () => false,
  isIOS: false,
  isPWA: false,
  showIOSInstructions: false,
  checkNotificationStatus: async () => false
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isPWA, setIsPWA] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  // Detect iOS and PWA status
  useEffect(() => {
    const detectDeviceAndPWA = () => {
      const iosCheck = isIOSDevice();
      const isPwaCheck = isPWAInstalled();
      
      setIsIOS(iosCheck);
      setIsPWA(isPwaCheck);
      setShowIOSInstructions(iosCheck && !isPwaCheck);
      
      // Log status for debugging
      console.log('Device detection:', {
        isIOS: iosCheck,
        isPWA: isPwaCheck,
        userAgent: navigator.userAgent
      });
    };
    
    detectDeviceAndPWA();
    
    // Also check when visibility changes (app might have been installed)
    document.addEventListener('visibilitychange', detectDeviceAndPWA);
    
    return () => {
      document.removeEventListener('visibilitychange', detectDeviceAndPWA);
    };
  }, []);
  
  // Check if service worker is registered
  useEffect(() => {
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const hasMessagingSW = registrations.some(reg => 
            reg.active?.scriptURL.includes('firebase-messaging-sw.js')
          );
          
          console.log('Service worker check:', { 
            hasRegistrations: registrations.length > 0,
            hasMessagingSW,
            registrations: registrations.map(r => r.scope)
          });
          
          if (!hasMessagingSW) {
            console.warn('Firebase messaging service worker not found');
          }
        } catch (error) {
          console.error('Error checking service worker registration:', error);
        }
      } else {
        console.warn('Service workers not supported in this browser');
      }
    };
    
    checkServiceWorker();
  }, []);
  
  // Check notification status
  const checkNotificationStatus = async (): Promise<boolean> => {
    try {
      // Check permission status
      const permissionStatus = Notification.permission;
      console.log('Notification permission status:', permissionStatus);
      
      // Check if we have stored token status
      const hasStoredToken = localStorage.getItem('notifications-enabled') === 'true';
      console.log('Stored token status:', hasStoredToken);
      
      // Check service worker registration
      let hasServiceWorker = false;
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        hasServiceWorker = registrations.some(reg => 
          reg.active?.scriptURL.includes('firebase-messaging-sw.js')
        );
      }
      console.log('Has messaging service worker:', hasServiceWorker);
      
      // All conditions must be true for notifications to be enabled
      const isEnabled = permissionStatus === 'granted' && hasStoredToken && hasServiceWorker;
      setNotificationsEnabled(isEnabled);
      
      return isEnabled;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  };
  
  // Initial notification status check
  useEffect(() => {
    checkNotificationStatus();
  }, []);
  
  // Enable notifications
  const enableNotifications = async (): Promise<boolean> => {
    try {
      // If on iOS but not installed as PWA, show special instructions
      if (isIOS && !isPWA) {
        setShowIOSInstructions(true);
        addToast(
          'iOS requires installing as a PWA for notifications', 
          'info', 
          5000
        );
        return false;
      }
      
      const enabled = await requestNotificationPermission();
      
      if (enabled) {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications-enabled', 'true');
        addToast('Notifications enabled successfully', 'success');
      } else {
        // Check specifically why it failed
        if (Notification.permission === 'denied') {
          addToast('Notification permission denied. Please update your browser settings.', 'error', 8000);
        } else {
          addToast('Failed to enable notifications. Please try again.', 'error');
        }
      }
      
      return enabled;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      addToast('Error enabling notifications', 'error');
      return false;
    }
  };
  
  // Listen for foreground messages
  useEffect(() => {
    if (!currentUser || !notificationsEnabled) return;
    
    const setupForegroundListener = async () => {
      console.log('Setting up foreground message listener');
      const unsubscribe = await onForegroundMessage((payload: any) => {
        console.log('Foreground message received in context:', payload);
        const { title, body } = payload.notification || {};
        
        if (title) {
          addToast(title, 'info', body || '');
        }
      });
      
      return unsubscribe;
    };
    
    const unsubscribePromise = setupForegroundListener();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [currentUser, notificationsEnabled, addToast]);
  
  return (
    <NotificationContext.Provider value={{ 
      notificationsEnabled, 
      enableNotifications,
      isIOS,
      isPWA,
      showIOSInstructions,
      checkNotificationStatus
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 