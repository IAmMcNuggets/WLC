import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  
  // Keep track of recently processed notification IDs to prevent duplicates
  const recentNotificationIds = useRef<Set<string>>(new Set());
  
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
  
  // Clean up old notification IDs periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Only keep IDs from the last 10 seconds
      const now = Date.now();
      const idsToRemove: string[] = [];
      
      recentNotificationIds.current.forEach(id => {
        const [messageId, timestamp] = id.split('|');
        if (now - parseInt(timestamp) > 10000) { // 10 seconds
          idsToRemove.push(id);
        }
      });
      
      idsToRemove.forEach(id => {
        recentNotificationIds.current.delete(id);
      });
      
      console.log(`Cleaned up ${idsToRemove.length} old notification IDs. Remaining: ${recentNotificationIds.current.size}`);
    }, 30000); // Run cleanup every 30 seconds
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);
  
  // Listen for foreground messages
  useEffect(() => {
    if (!currentUser || !notificationsEnabled) return;
    
    const setupForegroundListener = async () => {
      console.log('Setting up foreground message listener');
      const unsubscribe = await onForegroundMessage((payload) => {
        console.log('Foreground message received in context:', payload);
        
        // Extract notification data
        const { title, body } = payload.notification || {};
        
        // Get messageId from either top-level or data property
        const messageId = payload.messageId || payload.data?.messageId || '';
        
        if (messageId) {
          console.log('Processing notification with ID:', messageId);
          
          // Check if we've recently shown this notification (by messageId alone)
          if (recentNotificationIds.current.has(messageId)) {
            console.log('Duplicate notification skipped (exact ID match):', messageId);
            return;
          }
          
          // Also check any ID that starts with this messageId (might have different timestamp)
          const isDuplicate = Array.from(recentNotificationIds.current).some(id => 
            id.split('|')[0] === messageId
          );
          
          if (isDuplicate) {
            console.log('Duplicate notification skipped (ID prefix match):', messageId);
            return;
          }
          
          // Add to recent notifications with timestamp to prevent duplicates
          const uniqueId = `${messageId}|${Date.now()}`;
          recentNotificationIds.current.add(uniqueId);
          
          console.log('Added notification ID to tracking:', uniqueId);
        } else {
          console.warn('Received notification without messageId');
        }
        
        // Show toast notification
        if (title) {
          addToast(title, 'info', body || '');
          console.log('Toast notification displayed:', title);
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