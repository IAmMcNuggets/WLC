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
        sound: 'default'
      };
      
      // Add data payload with extra info for foreground handling
      const data = {
        type: 'chat',
        messageId: event.params.messageId,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK' // This helps some mobile platforms
      };
      
      // Create a messaging payload for FCM
      const payload = {
        notification: notification,
        data: data,
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
      };
      
      // Process tokens in batches of 500 to avoid FCM limitations
      const batchSize = 500;
      const results = [];
      
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        
        try {
          // Use the multicast method to send to multiple tokens
          const batchResponse = await admin.messaging().sendMulticast({
            tokens: batch,
            ...payload
          });
          
          logger.log(`Batch ${i/batchSize + 1}: ${batchResponse.successCount} sent successfully out of ${batch.length}`);
          
          // Track failed tokens for cleanup
          if (batchResponse.failureCount > 0) {
            batchResponse.responses.forEach((resp, idx) => {
              if (!resp.success) {
                logger.error(`Failed to send to token ${batch[idx].substring(0, 10)}...: ${resp.error.message}`);
                results.push({ 
                  success: false, 
                  token: batch[idx], 
                  error: resp.error.message
                });
              } else {
                results.push({ success: true, token: batch[idx] });
              }
            });
          } else {
            // All successful
            batch.forEach(token => {
              results.push({ success: true, token });
            });
          }
        } catch (batchError) {
          logger.error(`Error sending batch ${i/batchSize + 1}:`, batchError);
          // Mark all as failed in this batch
          batch.forEach(token => {
            results.push({ 
              success: false, 
              token,
              error: batchError.message
            });
          });
        }
      }
      
      const successes = results.filter(r => r.success).length;
      const failures = results.filter(r => !r.success);
      
      logger.log(`${successes} messages were sent successfully out of ${tokens.length}`);
      
      // For tokens that caused errors, we should remove them from the database
      if (failures.length > 0) {
        const failedTokens = failures.map(f => f.token);
        
        // For each failed token, find the user and remove the token
        await Promise.all(failedTokens.map(async (token) => {
          try {
            const userQuery = await admin.firestore()
              .collection("userProfiles")
              .where("fcmToken", "==", token)
              .get();
            
            const updatePromises = [];
            userQuery.forEach((userDoc) => {
              logger.log(`Removing invalid token from user ${userDoc.id}`);
              updatePromises.push(userDoc.ref.update({
                fcmToken: admin.firestore.FieldValue.delete()
              }));
            });
            
            await Promise.all(updatePromises);
          } catch (error) {
            logger.error(`Error removing token ${token.substring(0, 10)}...: ${error.message}`);
          }
        }));
      }
      
      return { success: true, sent: successes, failed: failures.length };
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
