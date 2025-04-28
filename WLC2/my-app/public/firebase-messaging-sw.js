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

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  // Get messageId from payload
  const messageId = payload.data?.messageId || '';
  
  // Get notification data
  const title = payload.data?.title || 'New Message';
  const body = payload.data?.body || '';
  
  const notificationOptions = {
    body,
    icon: "/logo192.png",
    badge: "/logo192.png",
    timestamp: Date.now(),
    tag: messageId, // Use messageId as tag to replace duplicates
    renotify: false, // Don't renotify for same tag
    data: {
      ...payload.data,
      messageId
    }
  };

  // Show the notification
  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click
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