/**
 * Import function triggers from their respective submodules:
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const https = require('https');
const functions = require("firebase-functions");
admin.initializeApp();

/**
 * This older function is now disabled to prevent duplicate notifications.
 * We are using sendChatNotificationV3 in Firebase Functions v2 instead.
 */
// exports.sendChatNotification = functions.firestore
//   .document("messages/{messageId}")
//   .onCreate(async (snapshot, context) => {
//     // disabled to prevent duplicate notifications
//   });

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
    
    // Skip test notifications to avoid duplicate notifications
    if (message.isNotificationTest === true) {
      logger.log("Skipping test notification message");
      return { success: true, skipped: true, reason: "test_notification" };
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
          tokens.push({
            token: doc.data().fcmToken,
            userId: doc.id
          });
        }
      });
      
      if (tokens.length === 0) {
        logger.log("No valid tokens found to send notifications");
        return null;
      }
      
      logger.log(`Found ${tokens.length} tokens to send notifications to`);
      
      // Get Firebase project ID for FCM
      const projectId = process.env.GCLOUD_PROJECT || 'gigfriend-9b3ea';
      
      // Fallback to using the Legacy HTTP API directly
      const getAccessToken = async () => {
        try {
          const accessToken = await admin.credential.applicationDefault().getAccessToken();
          return accessToken.access_token;
        } catch (error) {
          logger.error('Error getting access token:', error);
          throw error;
        }
      };
      
      const sendFcmMessage = async (fcmToken, title, body, data = {}) => {
        try {
          const accessToken = await getAccessToken();
          
          // Prepare the FCM message
          const message = {
            message: {
              token: fcmToken,
              notification: {
                title,
                body
              },
              data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK' // Helps mobile platforms
              }
            }
          };
          
          // Prepare the HTTP request
          const options = {
            hostname: 'fcm.googleapis.com',
            path: `/v1/projects/${projectId}/messages:send`,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          };
          
          // Send the HTTP request
          return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
              let data = '';
              
              res.on('data', (chunk) => {
                data += chunk;
              });
              
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve({
                    success: true,
                    statusCode: res.statusCode,
                    response: data
                  });
                } else {
                  reject({
                    success: false,
                    statusCode: res.statusCode,
                    response: data
                  });
                }
              });
            });
            
            req.on('error', (error) => {
              reject({
                success: false,
                error: error.message
              });
            });
            
            req.write(JSON.stringify(message));
            req.end();
          });
        } catch (error) {
          logger.error('Error sending FCM message:', error);
          throw error;
        }
      };
      
      // Send notifications to each token
      const results = await Promise.all(tokens.map(async ({ token, userId }) => {
        try {
          const title = `New message from ${message.user.name || "Team Member"}`;
          const body = message.text.substring(0, 100) + (message.text.length > 100 ? "..." : "");
          const data = {
            type: 'chat',
            messageId: event.params.messageId,
            timestamp: Date.now().toString(),
            sender: message.user.name || 'Unknown'
          };
          
          const response = await sendFcmMessage(token, title, body, data);
          logger.log(`Successfully sent message to user ${userId}:`, response);
          return { success: true, token, userId };
        } catch (error) {
          logger.error(`Failed to send message to user ${userId}:`, error);
          return { success: false, token, userId, error: JSON.stringify(error) };
        }
      }));
      
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);
      
      logger.log(`${successes.length} notifications sent successfully out of ${tokens.length}`);
      
      // Remove invalid tokens
      for (const failure of failures) {
        try {
          const { token, userId } = failure;
          logger.log(`Removing invalid token from user ${userId}`);
          
          const userRef = admin.firestore().collection("userProfiles").doc(userId);
          await userRef.update({
            fcmToken: admin.firestore.FieldValue.delete()
          });
        } catch (error) {
          logger.error("Error removing token:", error);
        }
      }
      
      return { 
        success: true, 
        sent: successes.length, 
        failed: failures.length 
      };
    } catch (error) {
      logger.error("Error sending notification:", error);
      return { error: error.message };
    }
}); 