import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { GoogleUser } from '../types/user';
import backgroundImage from '../Background/86343.jpg';
import { requestNotificationPermission } from '../services/messaging';

// Define the structure of a chat message
interface ChatMessage {
  id: string;
  text: string;
  createdAt: Timestamp;
  user: {
    uid: string;
    name: string;
    email: string;
    picture?: string;
  };
}

interface ChatProps {
  user: GoogleUser;
}

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #e0e0e0;
`;

const ChatTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #333;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DateSeparator = styled.div`
  text-align: center;
  margin: 1rem 0;
  color: #666;
  font-size: 0.9rem;
`;

const Message = styled.div<{ isOwn: boolean }>`
  display: flex;
  flex-direction: ${props => props.isOwn ? 'row-reverse' : 'row'};
  align-items: flex-start;
  gap: 0.5rem;
  max-width: 70%;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div<{ isOwn: boolean }>`
  background-color: ${props => props.isOwn ? '#007bff' : '#f0f0f0'};
  color: ${props => props.isOwn ? 'white' : 'black'};
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageText = styled.p`
  margin: 0;
  word-wrap: break-word;
`;

const MessageTime = styled.span`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
  display: block;
`;

const UserAvatar = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
`;

const InputContainer = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-top: 1px solid #e0e0e0;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 1.5rem;
  font-size: 1rem;
  outline: none;
  
  &:focus {
    border-color: #007bff;
  }
`;

const SendButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const UserName = styled.span`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const NotificationButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-left: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #218838;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  // Check if notifications are enabled
  useEffect(() => {
    const checkNotifications = async () => {
      const enabled = localStorage.getItem('notifications-enabled') === 'true';
      setNotificationsEnabled(enabled);
    };
    
    checkNotifications();
  }, []);
  
  // Request notification permission
  const handleEnableNotifications = async () => {
    try {
      const enabled = await requestNotificationPermission();
      if (enabled) {
        setNotificationsEnabled(true);
        addToast('Notifications enabled successfully', 'success');
      } else {
        addToast('Failed to enable notifications', 'error');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      addToast('Error enabling notifications', 'error');
    }
  };
  
  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Listen for new messages
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(firestore, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt,
          user: data.user
        });
      });
      setMessages(newMessages);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !currentUser || !user) return;
    
    try {
      await addDoc(collection(firestore, 'messages'), {
        text: inputValue.trim(),
        createdAt: serverTimestamp(),
        user: {
          uid: currentUser.uid,
          name: user.name,
          email: user.email,
          picture: user.picture
        }
      });
      
      setInputValue('');
    } catch (error) {
      console.error("Error sending message:", error);
      addToast('Failed to send message', 'error');
    }
  };
  
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return format(date, 'h:mm a');
  };
  
  const formatDateSeparator = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };
  
  // Group messages by date
  const groupedMessages = messages.reduce<{[key: string]: ChatMessage[]}>((groups, message) => {
    if (!message.createdAt) return groups;
    
    const dateStr = message.createdAt.toDate().toDateString();
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(message);
    return groups;
  }, {});
  
  return (
    <ChatContainer>
      <Header>
        <ChatTitle>Chat</ChatTitle>
        {!notificationsEnabled && (
          <NotificationButton onClick={handleEnableNotifications}>
            Enable Notifications
          </NotificationButton>
        )}
      </Header>
      
      <MessagesContainer>
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <MessageGroup key={date}>
            <DateSeparator>
              {formatDateSeparator(messages[0].createdAt)}
            </DateSeparator>
            
            {messages.map((message) => (
              <Message 
                key={message.id} 
                isOwn={message.user.uid === currentUser?.uid}
              >
                <UserAvatar 
                  src={message.user.picture || 'https://via.placeholder.com/40'} 
                  alt={message.user.name}
                />
                <MessageContent isOwn={message.user.uid === currentUser?.uid}>
                  <UserName>{message.user.name}</UserName>
                  <MessageText>{message.text}</MessageText>
                  <MessageTime>{formatDate(message.createdAt)}</MessageTime>
                </MessageContent>
              </Message>
            ))}
          </MessageGroup>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer onSubmit={handleSubmit}>
        <MessageInput
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          disabled={!currentUser}
        />
        <SendButton type="submit" disabled={!inputValue.trim() || !currentUser}>
          <FiSend size={20} />
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat; 