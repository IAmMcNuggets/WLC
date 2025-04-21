# Firebase Authentication Setup Guide

This application has been updated to use Firebase Authentication. Follow these steps to set up Firebase for this application.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name and follow the setup steps
4. Enable Google Analytics if desired (recommended)

## 2. Set Up Authentication

1. In the Firebase Console, go to your project
2. Click "Authentication" in the left sidebar
3. Click "Get started"
4. Under "Sign-in method", enable "Google"
5. Add your authorized domain (usually `localhost` for development)
6. Save your changes

## 3. Get Firebase Configuration

1. In the Firebase Console, go to your project
2. Click the gear icon (⚙️) next to "Project Overview" and select "Project settings"
3. Scroll down to "Your apps" section
4. If you haven't added a web app yet, click the web icon (</>) to add one
5. Register the app with a nickname (e.g., "My React App")
6. Copy the Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 4. Create Environment Variables

1. Copy the `.env.example` file to a new file named `.env.local`
2. Fill in the Firebase configuration values from step 3
3. Make sure to also add your Current RMS API credentials

## 5. Set Up Google Drive API Access

Since this application uploads photos to Google Drive, you need to set up the Google Drive API:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Google Drive API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Create an OAuth 2.0 Client ID (if you haven't already)
7. Add the necessary scopes (https://www.googleapis.com/auth/drive.file)
8. Configure the OAuth consent screen with appropriate information

## 6. Update Firebase Authentication

1. In Firebase Console > Authentication > Sign-in method
2. Edit the Google sign-in provider
3. Make sure to add the same Google Cloud project that has the Drive API enabled
4. Save your changes

## 7. Final Steps

1. Run `npm install` to ensure all dependencies are installed
2. Start the development server with `npm start`
3. Test the authentication flow by signing in and uploading photos

## Troubleshooting

- If you encounter CORS issues, ensure your domain is added to the authorized domains in Firebase Authentication
- For Google Drive API access issues, verify that your Firebase project is correctly linked to the Google Cloud project with the Drive API enabled
- Check browser console for detailed error messages 