import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { requestNotificationPermission, onForegroundMessage } from '../services/messaging';

interface NotificationContextType {
  notificationsEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
  isIOS: boolean;
  isPWA: boolean;
  showIOSInstructions: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationsEnabled: false,
  enableNotifications: async () => false,
  isIOS: false,
  isPWA: false,
  showIOSInstructions: false
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
    // Check if user is on iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosCheck);
    
    // Check if app is installed as PWA
    const isPwaCheck = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true || 
                      document.referrer.includes('android-app://');
    setIsPWA(isPwaCheck);
    
    // Show iOS instructions if on iOS but not in PWA mode
    setShowIOSInstructions(iosCheck && !isPwaCheck);
  }, []);
  
  // Check if notifications were previously enabled
  useEffect(() => {
    const checkNotificationStatus = async () => {
      // Check if permission is already granted
      if (Notification.permission === 'granted') {
        // Check local storage for token status
        const hasEnabledNotifications = localStorage.getItem('notifications-enabled') === 'true';
        setNotificationsEnabled(hasEnabledNotifications);
      }
    };
    
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
      setNotificationsEnabled(enabled);
      
      if (enabled) {
        localStorage.setItem('notifications-enabled', 'true');
        addToast('Notifications enabled successfully', 'success');
      } else {
        addToast('Failed to enable notifications. Please check your browser settings.', 'error');
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
      const unsubscribe = await onForegroundMessage((payload: any) => {
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
      showIOSInstructions 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 