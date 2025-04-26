import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  Timestamp,
  QueryConstraint,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore, auth, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { ChatMessage } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

/**
 * Firestore Collection Names
 */
export const Collections = {
  MESSAGES: 'messages',
  TIME_ENTRIES: 'timeEntries',
  USER_PROFILES: 'userProfiles',
  TRAINING_MATERIALS: 'trainingMaterials',
};

/**
 * Message Service
 */
export const MessageService = {
  /**
   * Get messages query filtered by date
   */
  getMessagesQuery: (daysAgo: number = 7) => {
    const oldestDate = new Date();
    oldestDate.setDate(oldestDate.getDate() - daysAgo);
    
    const constraints: QueryConstraint[] = [
      where('createdAt', '>=', Timestamp.fromDate(oldestDate)),
      orderBy('createdAt', 'asc')
    ];
    
    return query(collection(firestore, Collections.MESSAGES), ...constraints);
  },
  
  /**
   * Send a new message
   */
  sendMessage: async (text: string, userData: { name: string; uid: string; photoURL: string | null }) => {
    if (!text.trim() || !userData) {
      throw new Error('Message text and user data are required');
    }
    
    const messageData: Omit<ChatMessage, 'id'> = {
      text: text.trim(),
      createdAt: serverTimestamp() as Timestamp,
      user: {
        uid: userData.uid,
        name: userData.name,
        photoURL: userData.photoURL
      }
    };
    
    return addDoc(collection(firestore, Collections.MESSAGES), messageData);
  }
};

/**
 * Time Entry Service
 */
export const TimeEntryService = {
  /**
   * Get time entries for a specific user
   */
  getUserTimeEntries: async (userId: string) => {
    const timeEntriesQuery = query(
      collection(firestore, Collections.TIME_ENTRIES),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );
    
    const snapshot = await getDocs(timeEntriesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  /**
   * Create a new time entry
   */
  createTimeEntry: async (timeEntryData: any) => {
    if (!timeEntryData.userId) {
      throw new Error('User ID is required for time entry');
    }
    
    return addDoc(collection(firestore, Collections.TIME_ENTRIES), {
      ...timeEntryData,
      createdAt: serverTimestamp()
    });
  },
  
  /**
   * Update a time entry
   */
  updateTimeEntry: async (timeEntryId: string, updateData: any) => {
    const docRef = doc(firestore, Collections.TIME_ENTRIES, timeEntryId);
    return updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  },
  
  /**
   * Delete a time entry
   */
  deleteTimeEntry: async (timeEntryId: string) => {
    const docRef = doc(firestore, Collections.TIME_ENTRIES, timeEntryId);
    return deleteDoc(docRef);
  }
};

/**
 * Storage Service
 */
export const StorageService = {
  /**
   * Upload a file to Firebase Storage
   */
  uploadFile: async (file: File, path: string = 'uploads'): Promise<string> => {
    if (!file) throw new Error('File is required');
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${path}/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
  },
  
  /**
   * Upload multiple files to Firebase Storage
   */
  uploadMultipleFiles: async (files: File[], path: string = 'uploads'): Promise<string[]> => {
    if (!files.length) throw new Error('At least one file is required');
    
    const uploadPromises = files.map(file => StorageService.uploadFile(file, path));
    return Promise.all(uploadPromises);
  }
};

/**
 * User Service
 */
export const UserService = {
  /**
   * Get current authenticated user ID
   */
  getCurrentUserId: (): string | null => {
    return auth.currentUser?.uid || null;
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!auth.currentUser;
  }
};

export default {
  MessageService,
  TimeEntryService,
  StorageService,
  UserService,
  Collections
}; 