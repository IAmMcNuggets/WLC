/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * Cloud function that sends notifications when new chat messages are created
 */
exports.sendChatNotificationV3 = onDocumentCreated({
  document: 'messages/{messageId}',
  region: 'us-central1'
}, async (event) => {
    const message = event.data.data();
    logger.log('Processing message for notification:', message);
    
    // Skip if message doesn't have the required data
    if (!message || !message.user || !message.text) {
      logger.error("Message data is incomplete:", message);
      return null;
    }
    
    // Don't send notifications for your own messages
    const senderUid = message.user.uid;
    
    try {
      // Get all user profiles with FCM tokens
      const usersSnapshot = await admin.firestore()
        .collection("userProfiles")
        .where("fcmToken", "!=", null)
        .get();
      
      const tokens = [];
      usersSnapshot.forEach(doc => {
        // Don't send to sender
        if (doc.id !== senderUid && doc.data().fcmToken) {
          tokens.push(doc.data().fcmToken);
        }
      });
      
      if (tokens.length === 0) {
        logger.log("No valid tokens found to send notifications");
        return null;
      }
      
      logger.log(`Found ${tokens.length} tokens to send notifications to`);
      
      // Create notification payload
      const notification = {
        title: `New message from ${message.user.name || "Team Member"}`,
        body: message.text.substring(0, 100) + (message.text.length > 100 ? "..." : ""),
        // Add a sound for iOS
        sound: 'default'
      };
      
      // Add data payload with extra info for foreground handling
      const data = {
        type: 'chat',
        messageId: event.params.messageId,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK' // This helps some mobile platforms
      };
      
      // Send notifications to all valid tokens
      const response = await admin.messaging().sendMulticast({
        tokens,
        notification,
        data,
        // Critical for iOS background notifications
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default'
            }
          },
          headers: {
            'apns-priority': '10'
          }
        },
        // For Android
        android: {
          priority: 'high',
          notification: {
            sound: 'default'
          }
        }
      });
      
      logger.log(`${response.successCount} messages were sent successfully out of ${tokens.length}`);
      
      // For tokens that caused errors, we should remove them from the database
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.log(`Failed to send to token ${tokens[idx]}: ${resp.error?.message}`);
            failedTokens.push(tokens[idx]);
          }
        });
        
        // For each failed token, find the user and remove the token
        await Promise.all(failedTokens.map(async (token) => {
          const userQuery = await admin.firestore()
            .collection("userProfiles")
            .where("fcmToken", "==", token)
            .get();
          
          userQuery.forEach(async (userDoc) => {
            logger.log(`Removing invalid token from user ${userDoc.id}`);
            await userDoc.ref.update({
              fcmToken: admin.firestore.FieldValue.delete()
            });
          });
        }));
      }
      
      return { success: true, sent: response.successCount };
    } catch (error) {
      logger.error("Error sending notification:", error);
      return { error: error.message };
    }
});

/**
 * Cloud function that logs when new chat messages are created
 */
exports.logNewMessagesV3 = onDocumentCreated({
  document: 'messages/{messageId}',
  region: 'us-central1'
}, async (event) => {
  const message = event.data.data();
  logger.log('New message created:', message);
  return { success: true };
});
