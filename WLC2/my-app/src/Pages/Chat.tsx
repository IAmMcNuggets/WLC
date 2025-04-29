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
import { useNotifications } from '../contexts/NotificationContext';

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
  user: GoogleUser | null;
}

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  position: relative;
  padding-bottom: 120px; /* Increased padding */

  @media (max-width: 768px) {
    height: calc(100vh - 90px);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
`;

const ChatTitle = styled.h1`
  margin: 0;
  font-size: 1.75rem;
  color: #1a1a1a;
  font-weight: 600;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 1rem; /* Reduced padding since we have it on the container */
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DateSeparator = styled.div`
  text-align: center;
  margin: 1.5rem 0;
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 25%;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
  }
  
  &::before {
    left: 10%;
  }
  
  &::after {
    right: 10%;
  }
`;

const Message = styled.div<{ isOwn: boolean }>`
  display: flex;
  flex-direction: ${props => props.isOwn ? 'row-reverse' : 'row'};
  align-items: flex-end;
  gap: 0.75rem;
  max-width: min(75%, 600px); /* Responsive max-width */
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const MessageContent = styled.div<{ isOwn: boolean }>`
  background-color: ${props => props.isOwn ? '#0084ff' : 'white'};
  color: ${props => props.isOwn ? 'white' : '#1a1a1a'};
  padding: 0.875rem 1.25rem;
  border-radius: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid ${props => props.isOwn ? 'transparent' : 'rgba(0, 0, 0, 0.08)'};
`;

const MessageText = styled.p`
  margin: 0;
  word-wrap: break-word;
  font-size: 0.9375rem;
  line-height: 1.5;
`;

const MessageTime = styled.span`
  font-size: 0.75rem;
  color: ${props => props.color || 'rgba(0, 0, 0, 0.4)'};
  margin-top: 0.375rem;
  display: block;
`;

const UserAvatar = styled.img`
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const InputContainer = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1001;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 120px; /* Increased margin */

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 100px; /* Slightly less on mobile */
  }
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 1.5rem;
  font-size: 0.9375rem;
  outline: none;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #0084ff;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.1);
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

const SendButton = styled.button`
  background-color: #0084ff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 132, 255, 0.2);
  
  &:hover {
    background-color: #0073e6;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const UserName = styled.span`
  font-weight: 500;
  font-size: 0.8125rem;
  margin-bottom: 0.25rem;
  color: ${props => props.color || '#666'};
`;

const NotificationButton = styled.button`
  background-color: #f8f9fa;
  color: #1a1a1a;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 1rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: #e9ecef;
  }
  
  svg {
    font-size: 1.125rem;
  }
`;

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { notificationsEnabled, enableNotifications } = useNotifications();
  
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
          <NotificationButton onClick={enableNotifications}>
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
          disabled={!currentUser || !user}
        />
        <SendButton type="submit" disabled={!inputValue.trim() || !currentUser || !user}>
          <FiSend size={20} />
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat; 