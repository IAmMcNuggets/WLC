# Firebase Authentication Issue Fix

## Error Diagnosis
The error message indicates a critical configuration mismatch:

```
Firebase: Invalid Idp Response: the Google id_token is not allowed to be used with this application. 
Its audience (OAuth 2.0 client ID) is 1076922480921-d8vbuet2khv4ukp4je9st5bh7096ueit.apps.googleusercontent.com, 
which is not authorized to be used in the project with project_number: 457762949335.
```

This means the Google OAuth client ID you're using with @react-oauth/google is different from what's configured in Firebase.

## Solution: Configure Firebase Authentication

1. **Go to the Firebase Console**:
   - https://console.firebase.google.com/
   - Select your project (gigfriend-9b3ea)

2. **Navigate to Authentication**:
   - In the left sidebar, select "Authentication"
   - Click on "Sign-in method" tab

3. **Configure Google Auth Provider**:
   - Find "Google" in the list of providers and click to edit
   - Enable it if not already enabled
   - In the "Web SDK configuration" section, add your OAuth client ID:
     `1076922480921-d8vbuet2khv4ukp4je9st5bh7096ueit.apps.googleusercontent.com`
   - Save the changes

## Alternative Solution: Use Firebase's Built-in Google Sign-in

If the above doesn't work, we can change the code to use Firebase's built-in Google authentication instead of @react-oauth/google:

1. Update the App.tsx file to use Firebase's signInWithPopup method
2. Remove the @react-oauth/google implementation

## Testing

After making either change:
1. Clear your browser's local storage and cookies
2. Try signing in again
3. Check the debug panel to confirm authentication success
4. Verify Firestore access is working

## Security Note

Remember to update your Firestore security rules to be more restrictive before deploying to production. The current rules allowing all access are for testing only. 