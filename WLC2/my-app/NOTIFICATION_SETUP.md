# Push Notification Setup Guide

This guide explains how to set up and configure push notifications for the GigFriend app.

## Prerequisites

- Firebase account with Blaze plan (required for Cloud Functions)
- Firebase CLI installed (`npm install -g firebase-tools`)

## Steps to Configure Push Notifications

### 1. Generate VAPID Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project settings > Cloud Messaging
4. In the Web configuration section, click "Generate key pair"
5. Copy the generated key

### 2. Update the Messaging Service

1. Open `src/services/messaging.ts`
2. Replace the placeholder VAPID key with your generated key:
   ```javascript
   const token = await getToken(messaging, {
     vapidKey: "YOUR_GENERATED_VAPID_KEY_HERE"
   });
   ```

### 3. Deploy Firebase Cloud Functions

1. Login to Firebase CLI:
   ```bash
   firebase login
   ```

2. Initialize Firebase in your project (if not already done):
   ```bash
   cd WLC2/my-app
   firebase init
   ```
   - Select "Functions" when prompted
   - Choose your Firebase project
   - Select JavaScript for the language
   - Say Yes to ESLint
   - Say Yes to installing dependencies

3. Deploy the cloud functions:
   ```bash
   firebase deploy --only functions
   ```

### 4. Test Notifications

1. Open the GigFriend app in two different browsers or devices
2. Click "Enable Notifications" in the Chat page on both devices
3. Send a message from one device
4. You should receive a notification on the other device

## Troubleshooting

### Notifications Not Working

1. Make sure you're using HTTPS (required for web push notifications)
2. Check if you've accepted the notification permission
3. Verify in the browser console that you're getting an FCM token
4. Check Firebase Functions logs for errors

### CORS Issues

If you encounter CORS issues with the firebase-messaging-sw.js file:

1. Make sure the service worker is in the root of your public directory
2. Add proper CORS headers to your server configuration

### Notification Permission Denied

If the user denied notification permission:

1. The browser remembers this choice
2. User needs to reset permission in browser settings
3. You can detect this state and show a message to guide the user

## Security Best Practices

1. Never expose your Firebase server key
2. Implement proper authentication for your Cloud Functions
3. Set appropriate Firebase Security Rules to protect user tokens 