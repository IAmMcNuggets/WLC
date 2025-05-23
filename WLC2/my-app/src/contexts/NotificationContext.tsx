import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { requestNotificationPermission } from '../services/messaging';

// Check if the device is iOS
const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

// Check if the app is installed as a PWA
const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

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
  
  // Check if notifications are enabled
  React.useEffect(() => {
    const checkNotifications = async () => {
      const enabled = localStorage.getItem('notifications-enabled') === 'true';
      setNotificationsEnabled(enabled);
    };
    
    checkNotifications();
  }, []);
  
  // Detect iOS and PWA status
  React.useEffect(() => {
    const detectDeviceAndPWA = () => {
      const iosCheck = isIOSDevice();
      const isPwaCheck = isPWAInstalled();
      
      setIsIOS(iosCheck);
      setIsPWA(isPwaCheck);
      setShowIOSInstructions(iosCheck && !isPwaCheck);
    };
    
    detectDeviceAndPWA();
    
    // Also check when visibility changes (app might have been installed)
    document.addEventListener('visibilitychange', detectDeviceAndPWA);
    
    return () => {
      document.removeEventListener('visibilitychange', detectDeviceAndPWA);
    };
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