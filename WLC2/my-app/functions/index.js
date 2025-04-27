const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Cloud function that sends notifications when new chat messages are created
 */
exports.sendChatNotification = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    
    // Skip if message doesn't have the required data
    if (!message || !message.user || !message.text) {
      console.log("Message data is incomplete:", message);
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
        console.log("No valid tokens found to send notifications");
        return null;
      }
      
      // Create notification payload
      const notification = {
        title: `New message from ${message.user.name || "Team Member"}`,
        body: message.text.substring(0, 100) + (message.text.length > 100 ? "..." : "")
      };
      
      // Send notifications to all valid tokens
      const response = await admin.messaging().sendMulticast({
        tokens,
        notification
      });
      
      console.log(`${response.successCount} messages were sent successfully`);
      
      // For tokens that caused errors, we should remove them from the database
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
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
            await userDoc.ref.update({
              fcmToken: admin.firestore.FieldValue.delete()
            });
          });
        }));
      }
      
      return { success: true, sent: response.successCount };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { error: error.message };
    }
  }); 