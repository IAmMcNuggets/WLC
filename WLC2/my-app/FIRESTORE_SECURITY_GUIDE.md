# Firestore Security Rules Guide

This guide explains how to set up security rules for your Firestore database to secure your chat application.

## Understanding the Security Rules

The security rules in `firestore.rules` do the following:

1. **Default Deny Rule**: Denies all access by default for maximum security
2. **Read Access**: Allows only authenticated users to read messages
3. **Create Access**: Allows authenticated users to create messages, but only with their own user ID
4. **Update/Delete Prevention**: Prevents anyone from updating or deleting messages

## How to Apply These Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`gigfriend-9b3ea`)
3. In the left sidebar, click on **Firestore Database**
4. Click on the **Rules** tab
5. Replace the existing rules with the content from the `firestore.rules` file
6. Click **Publish** to apply the rules

## Rule Breakdown

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default rule - deny all access unless explicitly allowed
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Messages collection rules
    match /messages/{messageId} {
      // Allow reading messages if user is authenticated
      allow read: if request.auth != null;
      
      // Allow creating messages if:
      // 1. User is authenticated
      // 2. The message's user.uid matches the authenticated user's ID
      // 3. The createdAt field is a valid timestamp
      allow create: if request.auth != null &&
                    request.resource.data.user.uid == request.auth.uid &&
                    request.resource.data.createdAt is timestamp;
      
      // Prevent updates and deletes entirely
      allow update, delete: if false;
    }
  }
}
```

## Security Considerations

### What These Rules Protect Against

1. **Unauthorized Access**: No one can read messages without being authenticated
2. **Message Spoofing**: Users can't create messages pretending to be someone else
3. **Message Tampering**: No one can modify or delete messages after they're sent
4. **Invalid Data**: Messages must have a valid timestamp

### Potential Future Enhancements

As your app grows, you might want to consider:

1. **User Profiles**: Add rules for user profile data
2. **Message Reporting**: Create a system for flagging inappropriate content
3. **Admin Access**: Create special rules for administrators
4. **Rate Limiting**: Limit how many messages a user can send in a given time period

## Testing Your Rules

You can test your security rules in the Firebase Console:

1. Go to the **Rules** tab in Firestore Database
2. Click on the **Rules Playground** button
3. Create test scenarios with different authentication states and operations
4. Run the simulations to verify your rules work as expected

## Remember

- Always test your security rules thoroughly before deploying to production
- Security rules are applied at the database level, so they protect your data even if there are bugs in your app
- Rules can be updated at any time without deploying a new version of your app 