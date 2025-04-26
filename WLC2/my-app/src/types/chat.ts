/**
 * Chat-related type definitions
 */

import { Timestamp } from 'firebase/firestore';
import { GoogleUser } from './user';

export interface ChatMessage {
  id?: string;
  text: string;
  createdAt: Timestamp | null;
  user: {
    uid: string;
    name: string;
    photoURL: string | null;
  };
}

export interface ChatProps {
  user: GoogleUser | null;
}

export interface GroupedMessages {
  [key: string]: ChatMessage[][];
} 