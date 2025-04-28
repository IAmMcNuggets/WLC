// Give the service worker access to Firebase Messaging.
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBZt7OLIQO-DtLJSDMP8ZERRpIyHfCESkw",
  authDomain: "gigfriend-9b3ea.firebaseapp.com",
  projectId: "gigfriend-9b3ea",
  storageBucket: "gigfriend-9b3ea.firebasestorage.app",
  messagingSenderId: "457762949335",
  appId: "1:457762949335:web:b7023fd07a527bb6774892",
  measurementId: "G-47QE5FT56P"
});

// Log service worker initialization
console.log('[firebase-messaging-sw.js] Service worker initialized');

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Set to track recently shown notifications by ID
const recentNotificationIds = new Set();

// Cleanup function for notification IDs
const cleanupNotificationIds = () => {
  const now = Date.now();
  const idsToRemove = [];
  
  recentNotificationIds.forEach(id => {
    const [messageId, timestamp] = id.split('|');
    if (now - parseInt(timestamp) > 10000) { // 10 seconds
      idsToRemove.push(id);
    }
  });
  
  idsToRemove.forEach(id => {
    recentNotificationIds.delete(id);
  });
  
  console.log(`[firebase-messaging-sw.js] Cleaned up ${idsToRemove.length} old notification IDs. Remaining: ${recentNotificationIds.size}`);
};

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  // Get messageId from either top-level or data property
  const messageId = payload.messageId || payload.data?.messageId || '';
  console.log('[firebase-messaging-sw.js] Processing message with ID:', messageId);
  
  // Check if the app is in focus - don't show background notification if app is in focus
  self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clients => {
    // Check if at least one window is focused and visible
    const appIsInFocus = clients.some(client => 
      client.visibilityState === 'visible' && client.focused
    );
    
    console.log('[firebase-messaging-sw.js] App focus state:', { 
      messageId,
      appIsInFocus,
      clientCount: clients.length,
      clientStates: clients.map(c => ({
        url: c.url,
        visibilityState: c.visibilityState,
        focused: c.focused
      }))
    });
    
    // Skip background notification if app is in focus
    if (appIsInFocus) {
      console.log('[firebase-messaging-sw.js] App is in focus, skipping background notification', { messageId });
      return;
    }
    
    // Get notification data from payload
    const title = payload.data?.title || 'New Message';
    const body = payload.data?.body || '';
    
    console.log('[firebase-messaging-sw.js] Preparing notification:', { 
      messageId,
      title,
      body,
      data: payload.data
    });
    
    const notificationOptions = {
      body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      timestamp: Date.now(),
      tag: messageId, // Use messageId as tag to replace duplicates
      renotify: false, // Don't renotify for same tag
      data: {
        ...payload.data,
        messageId  // Ensure messageId is included in data
      }
    };

    // Check if a notification with this tag already exists
    self.registration.getNotifications().then(notifications => {
      const existingNotification = notifications.find(n => n.tag === messageId);
      if (existingNotification) {
        console.log('[firebase-messaging-sw.js] Notification with this tag already exists, updating instead', { 
          messageId,
          existingNotificationId: existingNotification.id
        });
        existingNotification.close();
      }
      
      console.log("[firebase-messaging-sw.js] Showing notification", { 
        messageId,
        title,
        options: notificationOptions
      });
      return self.registration.showNotification(title, notificationOptions);
    });
  });
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click detected', event);
  
  // Close the notification
  event.notification.close();
  
  // This looks to see if the current is already open and focuses it
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // If a Window client is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no Window client is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/chat');
      }
    })
  );
});

// Log any errors that occur during installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  // Skip waiting to update service worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
}); 