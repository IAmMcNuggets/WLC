import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { collection, addDoc, onSnapshot, query, orderBy, limit as firestoreLimit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { GoogleUser } from '../App';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import backgroundImage from '../Background/86343.jpg';

// Types for our messages
interface ChatMessage {
  id?: string;
  text: string;
  createdAt: Timestamp | null;
  user: {
    uid: string;
    name: string;
    photoURL: string | null;
  };
}

// Styled components
const ChatContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 80px; // Add space for bottom nav bar
`;

const ChatTitle = styled.h1`
  color: #ffffff;
  text-align: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 30px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-size: 2.5rem;
`;

const ChatBox = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  height: 70vh;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
`;

const MessageItem = styled.div<{ isCurrentUser: boolean }>`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 18px;
  margin-bottom: 10px;
  background-color: ${props => props.isCurrentUser ? '#007bff' : '#f1f1f1'};
  color: ${props => props.isCurrentUser ? 'white' : 'black'};
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
  word-break: break-word;
`;

const MessageForm = styled.form`
  display: flex;
  margin-top: 20px;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
  
  &:focus {
    border-color: #007bff;
  }
`;

const SendButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0 20px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const UserInfo = styled.div<{ isCurrentUser: boolean }>`
  font-size: 12px;
  margin-bottom: 5px;
  color: #666;
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
`;

const MessageTime = styled.span`
  font-size: 11px;
  color: #999;
  margin-top: 5px;
  display: block;
`;

interface ChatProps {
  user: GoogleUser | null;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const messageListRef = useRef<HTMLDivElement>(null);

  // Debug authentication state
  useEffect(() => {
    console.log('Auth Debug Info:');
    console.log('- currentUser from useAuth():', currentUser);
    console.log('- currentUser UID:', currentUser?.uid);
    console.log('- currentUser email:', currentUser?.email);
    console.log('- Is authenticated:', !!currentUser);
    console.log('- Google user prop:', user);
  }, [currentUser, user]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to Firestore for real-time updates
  useEffect(() => {
    if (!user) {
      console.log('Not fetching messages: No user prop provided');
      return;
    }

    if (!currentUser) {
      console.log('Not fetching messages: No Firebase authenticated user');
      return;
    }

    console.log('Attempting to connect to Firestore with auth:', !!currentUser);

    try {
      const messagesRef = collection(firestore, 'messages');
      const messagesQuery = query(
        messagesRef,
        orderBy('createdAt', 'asc'),
        firestoreLimit(100)
      );

      console.log('Setting up Firestore listener...');
      const unsubscribe = onSnapshot(messagesQuery, 
        (snapshot) => {
          console.log('Received Firestore snapshot with', snapshot.size, 'messages');
          const newMessages: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            newMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
          });
          setMessages(newMessages);
        },
        (error) => {
          console.error('Firestore snapshot error:', error);
          console.log('Error code:', error.code);
          console.log('Error message:', error.message);
        }
      );

      return () => {
        console.log('Cleaning up Firestore listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Firestore listener:', error);
    }
  }, [user, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUser || !user) return;

    setIsLoading(true);
    try {
      console.log('Attempting to add document to Firestore');
      await addDoc(collection(firestore, 'messages'), {
        text: inputValue,
        createdAt: serverTimestamp(),
        user: {
          uid: currentUser.uid,
          name: user.name,
          photoURL: user.picture || null
        }
      });
      console.log('Document added successfully');
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to access the chat.</div>;
  }

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <ChatContainer>
      <ChatTitle>Team Chat</ChatTitle>
      <ChatBox>
        <MessageList ref={messageListRef}>
          {messages.map((message) => {
            const isCurrentUser = currentUser?.uid === message.user.uid;
            return (
              <div key={message.id}>
                <UserInfo isCurrentUser={isCurrentUser}>
                  {!isCurrentUser && <b>{message.user.name}</b>}
                </UserInfo>
                <MessageItem isCurrentUser={isCurrentUser}>
                  {message.text}
                  <MessageTime>{formatDate(message.createdAt)}</MessageTime>
                </MessageItem>
              </div>
            );
          })}
        </MessageList>
        <MessageForm onSubmit={handleSubmit}>
          <MessageInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
          />
          <SendButton type="submit" disabled={isLoading || !inputValue.trim()}>
            Send
          </SendButton>
        </MessageForm>
      </ChatBox>
    </ChatContainer>
  );
};

export default Chat; 