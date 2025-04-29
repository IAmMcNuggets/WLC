import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { requestNotificationPermission } from '../services/messaging';

interface NotificationContextType {
  notificationsEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType>({
  notificationsEnabled: false,
  enableNotifications: async () => false
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
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
  
  // Enable notifications
  const enableNotifications = async (): Promise<boolean> => {
    try {
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
      enableNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}; 