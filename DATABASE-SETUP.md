# Setting Up Firebase Database for Multi-Company Model

This guide will help you set up your Firebase Firestore database to support the multi-company model in your application.

## Prerequisites

1. Firebase project setup (already completed)
2. Firebase CLI installed globally (`npm install -g firebase-tools`)
3. Firebase Admin SDK service account key

## Steps to Initialize Database

### 1. Get Your Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`gigfriendv2-3079b`)
3. Navigate to Project Settings > Service accounts
4. Click on "Generate new private key"
5. Save the JSON file as `service-account-key.json` in the root directory of your project

### 2. Run the Initialization Script

```bash
node firestore-init.js
```

This script will:
- Create sample user profiles
- Create a sample company
- Set up company memberships (owner and worker)
- Create sample events (upcoming and past)
- Create a sample training material
- Set up chat functionality with rooms and messages
- Create time entries for the time clock feature
- Add notifications for events

### 3. Update Sample Data After User Signup

After the first user signs up through your application:
1. Go to Firebase Console > Firestore Database
2. Find the companies collection and update the owner ID with the real user's ID
3. Delete or update the sample company membership documents
4. The user will automatically be added as a company owner when they sign up or create a company

## Database Schema Overview

### Collections

1. **companies**
   - `name`: String - Company name
   - `location`: String - Company location
   - `currentRmsApiKey`: String - API key for integration
   - `ownerId`: String - UID of the company owner
   - `createdAt`: Timestamp - When company was created
   - `status`: String - Company status (active/inactive)

2. **companyMembers**
   - Document ID format: `{userId}_{companyId}`
   - `userId`: String - The user's UID
   - `companyId`: String - The company's ID
   - `role`: String - User's role (owner/admin/worker)
   - `status`: String - Membership status (active/pending/rejected)
   - `joinedAt`: Timestamp - When membership was activated
   - `requestedAt`: Timestamp - When membership was requested

3. **events**
   - `companyId`: String - Associated company
   - `title`: String - Event name
   - `description`: String - Event details
   - `startDate`: Timestamp - Event start time
   - `endDate`: Timestamp - Event end time
   - `location`: String - Event location
   - `status`: String - Event status (upcoming/in_progress/completed/cancelled)
   - `createdAt`: Timestamp - Creation time
   - `createdBy`: String - Creator's ID

4. **userProfiles**
   - Document ID is the user's UID
   - `displayName`: String - User's name
   - `email`: String - User's email
   - `photoURL`: String - Profile picture URL
   - `createdAt`: Timestamp - Account creation time
   - `userType`: String - Type of user (company_owner/worker)

5. **trainingMaterials**
   - `companyId`: String - Associated company (null for global materials)
   - `title`: String - Material title
   - `description`: String - Brief description
   - `content`: String - Content or URL to content
   - `createdAt`: Timestamp - Creation time
   - `status`: String - Published status

6. **chatRooms**
   - `companyId`: String - Associated company
   - `name`: String - Chat room name
   - `description`: String - Chat room description
   - `createdAt`: Timestamp - Creation time
   - `createdBy`: String - Creator's ID
   - `isActive`: Boolean - Whether the chat room is active
   - `memberCount`: Number - Number of members in the chat room

7. **chatRoomMembers**
   - Document ID format: `{chatRoomId}_{userId}`
   - `chatRoomId`: String - The chat room's ID
   - `userId`: String - The user's UID
   - `joinedAt`: Timestamp - When user joined
   - `isAdmin`: Boolean - Whether the user is a chat room admin

8. **messages**
   - `chatRoomId`: String - Associated chat room
   - `senderId`: String - Sender's UID
   - `senderName`: String - Sender's display name
   - `content`: String - Message content
   - `createdAt`: Timestamp - When message was sent

9. **timeEntries**
   - `userId`: String - User who logged the time
   - `companyId`: String - Associated company
   - `eventId`: String - Associated event (optional)
   - `startTime`: Timestamp - When work started
   - `endTime`: Timestamp - When work ended (null if in progress)
   - `duration`: Number - Duration in seconds (calculated)
   - `status`: String - Status (in_progress/completed)
   - `notes`: String - Optional notes about the work
   - `createdAt`: Timestamp - Entry creation time

10. **notifications**
    - `userId`: String - Target user
    - `title`: String - Notification title
    - `message`: String - Notification message
    - `type`: String - Type of notification (e.g., event_assignment, chat_message)
    - `relatedId`: String - ID of related entity (e.g., eventId, chatRoomId)
    - `isRead`: Boolean - Whether the notification has been read
    - `createdAt`: Timestamp - When notification was created

## Security Rules

The Firestore security rules have been set up to handle proper access control for the multi-company model. The rules ensure:

1. Users can only read/write data relevant to their companies
2. Company owners have elevated privileges for their companies
3. Chat room members can access messages in their chat rooms
4. Users can only track time for companies they are members of
5. Notifications are properly scoped to individual users

## Indexing

The necessary composite indexes have been created to support efficient queries on:

1. Time entries by user and company
2. Events by company and date
3. Company members by status
4. Chat messages by chat room and timestamp
5. Notifications by user and read status

## Cloud Functions

Two Firebase cloud functions have been deployed:

1. `logNewMessagesV3`: Logs new chat messages for analytics
2. `sendChatNotificationV3`: Sends push notifications for new chat messages 