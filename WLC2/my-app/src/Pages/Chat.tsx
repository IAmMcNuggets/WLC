import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { GoogleUser } from '../types/user';

// Define the structure of a chat message
interface ChatMessage {
  id: string;
  text: string;
  createdAt: Timestamp;
  user: {
    name: string;
    email: string;
    picture?: string;
  };
}

interface ChatProps {
  user: GoogleUser | null;
}

// Styled Components
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  max-width: 800px;
  margin: 0 auto;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 70px;
  position: relative;
`;

const ChatTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 15px;
  font-weight: 600;
`;

const ChatBox = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: #f8f9fa;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
`;

const EmptyMessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #95a5a6;
  gap: 15px;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MessageGroup = styled.div<{ $isMine: boolean }>`
  display: flex;
  flex-direction: column;
  align-self: ${({ $isMine }) => $isMine ? 'flex-end' : 'flex-start'};
  max-width: 70%;
`;

const MessageItem = styled.div<{ $isMine: boolean }>`
  padding: 12px 16px;
  border-radius: 18px;
  background-color: ${({ $isMine }) => $isMine ? '#3498db' : '#e9eaeb'};
  color: ${({ $isMine }) => $isMine ? '#fff' : '#333'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  margin-bottom: 4px;
  word-break: break-word;
  
  &:last-child {
    border-bottom-right-radius: ${({ $isMine }) => $isMine ? '4px' : '18px'};
    border-bottom-left-radius: ${({ $isMine }) => $isMine ? '18px' : '4px'};
  }
`;

const MessageForm = styled.form`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid #e1e1e1;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  border: none;
  background-color: transparent;
  outline: none;
  font-size: 16px;
  
  &::placeholder {
    color: #95a5a6;
  }
`;

const SendButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #2980b9;
    transform: scale(1.05);
  }
  
  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
    transform: none;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 13px;
  color: #7f8c8d;
`;

const UserAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 6px;
  object-fit: cover;
  border: 1px solid #eaeaea;
`;

const UserName = styled.span`
  font-weight: 600;
  color: #2c3e50;
`;

const MessageTime = styled.span<{ $isMine: boolean }>`
  font-size: 11px;
  color: ${({ $isMine }) => $isMine ? 'rgba(255, 255, 255, 0.8)' : '#95a5a6'};
  margin-top: 4px;
  align-self: ${({ $isMine }) => $isMine ? 'flex-end' : 'flex-start'};
`;

const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 15px 0;
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #e1e1e1;
  }
`;

const DateLabel = styled.span`
  font-size: 12px;
  background-color: #f8f9fa;
  color: #7f8c8d;
  padding: 0 10px;
`;

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Calculate timestamp for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const messagesRef = collection(firestore, 'messages');
    const q = query(
      messagesRef, 
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({
          id: doc.id,
          ...(doc.data() as Omit<ChatMessage, 'id'>)
        });
      });
      setMessages(fetchedMessages);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      addToast('Failed to load messages', 'error');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser, addToast]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
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
      <ChatTitle>
        <FiMessageCircle size={24} />
        Team Chat
      </ChatTitle>
      
      <ChatBox>
        {loading ? (
          <EmptyMessagesContainer>
            <div>Loading messages...</div>
          </EmptyMessagesContainer>
        ) : messages.length === 0 ? (
          <EmptyMessagesContainer>
            <FiMessageCircle size={50} />
            <div>No messages in the last 7 days</div>
            <div>Be the first to say hello!</div>
          </EmptyMessagesContainer>
        ) : (
          <MessageList>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <React.Fragment key={date}>
                <DateSeparator>
                  <DateLabel>
                    {formatDateSeparator(dateMessages[0].createdAt)}
                  </DateLabel>
                </DateSeparator>
                
                {dateMessages.map((message) => {
                  const isMine = currentUser?.email === message.user.email;
                  
                  return (
                    <MessageGroup key={message.id} $isMine={isMine}>
                      {!isMine && (
                        <UserInfo>
                          <UserAvatar 
                            src={message.user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user.name)}&background=random`} 
                            alt={message.user.name} 
                          />
                          <UserName>{message.user.name}</UserName>
                        </UserInfo>
                      )}
                      
                      <MessageItem $isMine={isMine}>
                        {message.text}
                      </MessageItem>
                      
                      <MessageTime $isMine={isMine}>
                        {formatDate(message.createdAt)}
                      </MessageTime>
                    </MessageGroup>
                  );
                })}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </MessageList>
        )}
      </ChatBox>
      
      <MessageForm onSubmit={handleSubmit}>
        <MessageInput
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading || !currentUser}
        />
        <SendButton 
          type="submit" 
          disabled={!inputValue.trim() || loading || !currentUser}
        >
          <FiSend size={20} />
        </SendButton>
      </MessageForm>
    </ChatContainer>
  );
};

export default Chat; 