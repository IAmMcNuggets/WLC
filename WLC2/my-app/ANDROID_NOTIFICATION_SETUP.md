# Android Push Notification Setup Guide

This guide explains how to properly configure push notifications for Android devices in your web app.

## Android-Specific Considerations

Android devices have some unique requirements when it comes to web push notifications:

1. **Service Worker Registration**: Android requires proper service worker registration with the correct scope
2. **Notification Format**: Android may receive notifications in a different format than iOS/desktop
3. **PWA Installation**: For more reliable notifications, users should install the app as a PWA

## Implementation Details

The following changes were made to support Android notifications:

### 1. Android Detection

Added Android device detection in `NotificationContext.tsx`:
```typescript
const isAndroidDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};
```

### 2. Service Worker Registration Improvements

Enhanced service worker registration in `messaging.ts`:
- Now checks for existing service worker registrations first
- Explicitly sets service worker scope to root ('/')
- Provides Android-specific error handling

### 3. Token Retrieval with Service Worker

Updated token retrieval process to properly use the service worker registration:
```typescript
const tokenOptions = {
  vapidKey,
  serviceWorkerRegistration: registration
};
```

### 4. Android-Specific Notification Handling

Modified the service worker to handle different notification formats:
```javascript
// Special handling for Android
if (payload.notification) {
  // If Firebase sends a notification object directly (common for Android)
  const { title, body, icon = "/logo192.png" } = payload.notification;
  
  const notificationOptions = {
    body,
    icon,
    badge: "/logo192.png",
    timestamp: Date.now(),
    tag: payload.data?.messageId || Date.now().toString(),
    renotify: false,
    data: payload.data || {}
  };
  
  return self.registration.showNotification(title || "New Message", notificationOptions);
}
```

## Troubleshooting Android Notifications

If notifications still don't work on Android:

1. **Check Chrome Flags**: On Chrome Android, go to `chrome://flags` and ensure "Web Push" is enabled
2. **Android System Settings**: Check that notifications are allowed for the browser in Android settings
3. **Install as PWA**: Ask users to add the app to their home screen for more reliable notification delivery
4. **Firebase Console Settings**: Make sure your FCM project has Android web push configured
5. **Android Manifest**: Ensure `firebase-messaging-sw.js` has appropriate caching headers

## Testing Android Notifications

To test Android notifications:

1. Use Chrome for Android (ensure it's up to date)
2. Visit your app site and click "Enable Notifications"
3. Accept the permission prompt
4. Check browser console for successful token registration logs
5. Send a test message from another device
6. If notifications still don't appear, check the browser's notification settings

## Android-Specific Debugging

To debug on Android devices:

1. Connect Android device to computer via USB
2. Enable USB debugging in developer options
3. Visit `chrome://inspect` on your desktop Chrome
4. Your Android device should appear in the list
5. Click "inspect" to open developer tools for your device's browser
6. Check the console for any errors related to FCM registration 