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
console.log('Firebase service worker initialized');

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
  
  // Extract message ID from payload (check both top-level and data)
  const messageId = payload.messageId || payload.data?.messageId || `fallback-${Date.now()}`;
  
  // Check for duplicates
  if (recentNotificationIds.has(messageId)) {
    console.log('[firebase-messaging-sw.js] Duplicate notification skipped (exact ID match):', messageId);
    return;
  }
  
  // Also check any ID that starts with this messageId (different timestamp)
  const isDuplicate = Array.from(recentNotificationIds).some(id => 
    id.split('|')[0] === messageId
  );
  
  if (isDuplicate) {
    console.log('[firebase-messaging-sw.js] Duplicate notification skipped (ID prefix match):', messageId);
    return;
  }
  
  // Add to tracking with timestamp
  const uniqueId = `${messageId}|${Date.now()}`;
  recentNotificationIds.add(uniqueId);
  console.log('[firebase-messaging-sw.js] Added notification ID to tracking:', uniqueId);
  
  // Schedule cleanup
  setTimeout(cleanupNotificationIds, 30000);
  
  // Check if the app is in focus - don't show background notification if app is in focus
  self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clients => {
    // Check if at least one window is focused and visible
    const appIsInFocus = clients.some(client => 
      client.visibilityState === 'visible' && client.focused
    );
    
    // Skip background notification if app is in focus
    if (appIsInFocus) {
      console.log('[firebase-messaging-sw.js] App is in focus, skipping background notification');
      return;
    }
    
    // Otherwise proceed with showing the notification
    if (payload.notification) {
      // Standard notification format from FCM
      const notificationTitle = payload.notification.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification.body || '',
        icon: "/logo192.png",
        badge: "/logo192.png",
        timestamp: Date.now(),
        tag: messageId, // Use message ID as tag to replace duplicates
        data: {
          ...payload.data,
          messageId  // Ensure messageId is included in data
        }
      };

      console.log("[firebase-messaging-sw.js] Showing notification with title:", notificationTitle);
      return self.registration.showNotification(notificationTitle, notificationOptions);
    } else if (payload.data) {
      // Custom data message format
      const notificationTitle = payload.data.title || 'New Message';
      const notificationOptions = {
        body: payload.data.body || '',
        icon: "/logo192.png",
        badge: "/logo192.png",
        timestamp: Date.now(),
        tag: messageId, // Use message ID as tag to replace duplicates
        data: {
          ...payload.data,
          messageId  // Ensure messageId is included in data
        }
      };

      console.log("[firebase-messaging-sw.js] Showing notification from data with title:", notificationTitle);
      return self.registration.showNotification(notificationTitle, notificationOptions);
    } else {
      console.log("[firebase-messaging-sw.js] Received payload without notification or data:", payload);
    }
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