const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeFirestore() {
  try {
    console.log('Starting comprehensive Firestore initialization...');
    
    // Create sample user profile
    const userProfileRef = db.collection('userProfiles').doc('sample_user_id');
    await userProfileRef.set({
      displayName: 'Sample User',
      email: 'sample@example.com',
      photoURL: 'https://via.placeholder.com/150',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userType: 'worker'
    });
    
    console.log(`Created sample user profile with ID: sample_user_id`);
    
    // Create sample company owner profile
    const ownerProfileRef = db.collection('userProfiles').doc('sample_owner_id');
    await ownerProfileRef.set({
      displayName: 'Company Owner',
      email: 'owner@example.com',
      photoURL: 'https://via.placeholder.com/150',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userType: 'company_owner'
    });
    
    console.log(`Created sample company owner profile with ID: sample_owner_id`);
    
    // Create sample company
    const companyRef = db.collection('companies').doc();
    await companyRef.set({
      name: 'Sample Company',
      location: 'New York, USA',
      currentRmsApiKey: 'sample-api-key',
      ownerId: 'sample_owner_id', // Using our sample owner ID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    
    const companyId = companyRef.id;
    console.log(`Created sample company with ID: ${companyId}`);
    
    // Create company membership for owner
    const ownerMembershipRef = db.collection('companyMembers').doc(`sample_owner_id_${companyId}`);
    await ownerMembershipRef.set({
      userId: 'sample_owner_id',
      companyId: companyId,
      role: 'owner',
      status: 'active',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Created company owner membership record');
    
    // Create company membership for worker (pending status)
    const workerMembershipRef = db.collection('companyMembers').doc(`sample_user_id_${companyId}`);
    await workerMembershipRef.set({
      userId: 'sample_user_id',
      companyId: companyId,
      role: 'worker',
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Created worker membership request');
    
    // Create sample event for the company
    const eventRef = db.collection('events').doc();
    const eventId = eventRef.id;
    await eventRef.set({
      companyId: companyId,
      title: 'Sample Event',
      description: 'This is a sample event for testing',
      startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)), // Tomorrow
      endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 172800000)), // Day after tomorrow
      location: 'Sample Location',
      status: 'upcoming',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'sample_owner_id'
    });
    
    console.log(`Created sample event with ID: ${eventId}`);
    
    // Create another event in the past
    const pastEventRef = db.collection('events').doc();
    await pastEventRef.set({
      companyId: companyId,
      title: 'Past Event',
      description: 'This is a past event for testing',
      startDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 172800000)), // Two days ago
      endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000)), // Yesterday
      location: 'Past Location',
      status: 'completed',
      createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 432000000)), // 5 days ago
      createdBy: 'sample_owner_id'
    });
    
    console.log(`Created past event with ID: ${pastEventRef.id}`);
    
    // Create sample training material
    const trainingRef = db.collection('trainingMaterials').doc();
    await trainingRef.set({
      companyId: companyId,
      title: 'Getting Started',
      description: 'A guide for new team members',
      content: 'Welcome to the team! This guide will help you get started...',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'published'
    });
    
    console.log(`Created sample training material with ID: ${trainingRef.id}`);
    
    // Create a chat room for the company
    const chatRoomRef = db.collection('chatRooms').doc();
    const chatRoomId = chatRoomRef.id;
    await chatRoomRef.set({
      companyId: companyId,
      name: 'General',
      description: 'General company chat',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'sample_owner_id',
      isActive: true,
      memberCount: 2 // Owner and worker
    });
    
    console.log(`Created sample chat room with ID: ${chatRoomId}`);
    
    // Create chat room members
    await db.collection('chatRoomMembers').doc(`${chatRoomId}_sample_owner_id`).set({
      chatRoomId: chatRoomId,
      userId: 'sample_owner_id',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      isAdmin: true
    });
    
    await db.collection('chatRoomMembers').doc(`${chatRoomId}_sample_user_id`).set({
      chatRoomId: chatRoomId,
      userId: 'sample_user_id',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      isAdmin: false
    });
    
    console.log('Created chat room members');
    
    // Create sample messages in the chat room
    const messages = [
      {
        content: 'Welcome to the company chat!',
        senderId: 'sample_owner_id',
        senderName: 'Company Owner',
        chatRoomId: chatRoomId,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7200000)) // 2 hours ago
      },
      {
        content: 'Thank you! Happy to be here.',
        senderId: 'sample_user_id',
        senderName: 'Sample User',
        chatRoomId: chatRoomId,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3600000)) // 1 hour ago
      },
      {
        content: 'Let me know if you have any questions about the upcoming event.',
        senderId: 'sample_owner_id',
        senderName: 'Company Owner',
        chatRoomId: chatRoomId,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1800000)) // 30 minutes ago
      }
    ];
    
    const batch = db.batch();
    messages.forEach(message => {
      const messageRef = db.collection('messages').doc();
      batch.set(messageRef, message);
    });
    
    await batch.commit();
    console.log('Created sample chat messages');
    
    // Create time entries for the worker
    const today = new Date();
    
    // Create a completed time entry
    const completedTimeEntryRef = db.collection('timeEntries').doc();
    await completedTimeEntryRef.set({
      userId: 'sample_user_id',
      companyId: companyId,
      eventId: eventId,
      startTime: admin.firestore.Timestamp.fromDate(new Date(today.setHours(today.getHours() - 4))), // 4 hours ago
      endTime: admin.firestore.Timestamp.fromDate(new Date(today.setHours(today.getHours() + 2))), // 2 hours later (2 hours ago)
      duration: 7200, // 2 hours in seconds
      status: 'completed',
      notes: 'Setup for the event',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Created completed time entry with ID: ${completedTimeEntryRef.id}`);
    
    // Create an in-progress time entry
    const inProgressTimeEntryRef = db.collection('timeEntries').doc();
    await inProgressTimeEntryRef.set({
      userId: 'sample_user_id',
      companyId: companyId,
      eventId: eventId,
      startTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1800000)), // Started 30 minutes ago
      endTime: null, // Still in progress
      status: 'in_progress',
      notes: 'Working on final preparations',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Created in-progress time entry with ID: ${inProgressTimeEntryRef.id}`);
    
    // Create notifications
    const notificationRef = db.collection('notifications').doc();
    await notificationRef.set({
      userId: 'sample_user_id',
      title: 'New Event Assigned',
      message: 'You have been assigned to a new event: Sample Event',
      type: 'event_assignment',
      relatedId: eventId,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Created notification with ID: ${notificationRef.id}`);
    
    console.log('Firestore initialization completed successfully!');
    
    // Note for users
    console.log('\nIMPORTANT: The database has been initialized with comprehensive sample data.');
    console.log('You can now sign in with your own account and connect to the sample company,');
    console.log('or create your own company from scratch.');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

initializeFirestore(); 