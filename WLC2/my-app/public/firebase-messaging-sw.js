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

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 