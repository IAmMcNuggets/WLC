import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FiSend, FiMessageCircle, FiBell } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import { GoogleUser } from '../types/user';
import backgroundImage from '../Background/86343.jpg';

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

// Styled Components
const PageWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0; /* Ensure this doesn't cover the navigation */
`;

const ChatWrapper = styled.div`
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  height: 100%;
  padding: 20px 20px 120px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 20px;
  position: relative;
  overflow: hidden; /* Prevent container from scrolling */
`;

const ChatTitle = styled.h1`
  text-align: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 30px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-size: 2.5rem;
`;

const ChatBox = styled.div`
  flex: 1;
  overflow-y: auto; /* Only this element should scroll */
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

const NotificationButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.disabled ? '#90caf9' : '#3498db'};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  gap: 6px;
  
  &:hover {
    background-color: ${props => props.disabled ? '#90caf9' : '#2980b9'};
  }
`;

const InstallInstructions = styled.div`
  position: absolute;
  top: 70px;
  right: 20px;
  width: 250px;
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  font-size: 14px;
  z-index: 100;
`;

const InstructionStep = styled.div`
  margin: 10px 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const StepNumber = styled.div`
  background-color: #3498db;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
`;

const NotificationTestButton = styled.button`
  background-color: #5c6bc0;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-left: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #3f51b5;
  }
`;

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { 
    notificationsEnabled,
    enableNotifications,
    showIOSInstructions,
    isIOS,
    isPWA
  } = useNotifications();
  
  // Test notification function
  const testNotification = useCallback(async () => {
    if (!currentUser || !user) return;
    
    try {
      // Add a test message document with special flag
      await addDoc(collection(firestore, 'messages'), {
        text: `Test notification ${new Date().toLocaleTimeString()}`,
        createdAt: serverTimestamp(),
        isNotificationTest: true,
        user: {
          uid: currentUser.uid,
          name: user.name,
          email: user.email,
          picture: user.picture
        }
      });
      
      addToast('Test notification sent', 'info');
    } catch (error) {
      console.error("Error sending test notification:", error);
      addToast('Failed to send test notification', 'error');
    }
  }, [currentUser, user, addToast]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Query messages from Firestore
    const messagesQuery = query(
      collection(firestore, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList: ChatMessage[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          messageList.push({
            id: doc.id,
            text: data.text,
            createdAt: data.createdAt,
            user: {
              uid: data.user.uid,
              name: data.user.name,
              email: data.user.email,
              picture: data.user.picture
            }
          });
        }
      });
      
      setMessages(messageList);
      setLoading(false);
      
      // Scroll to bottom after messages are loaded and rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }, (error) => {
      console.error("Error fetching messages:", error);
      addToast('Failed to load messages', 'error');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser, addToast]);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading]);
  
  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
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
    <PageWrapper>
      <ChatWrapper>
        <ChatContainer>
          <ChatTitle>Team Chat</ChatTitle>
          <div style={{ display: 'flex' }}>
            <NotificationButton 
              onClick={enableNotifications}
              disabled={notificationsEnabled}
            >
              <FiBell size={16} />
              {notificationsEnabled 
                ? 'Notifications Enabled' 
                : isIOS && !isPWA 
                  ? 'Install App for Notifications' 
                  : 'Enable Notifications'}
            </NotificationButton>
            
            {notificationsEnabled && (
              <NotificationTestButton onClick={testNotification}>
                Test Notification
              </NotificationTestButton>
            )}
          </div>
          
          {showIOSInstructions && (
            <InstallInstructions>
              <h4>Enable Notifications on iOS</h4>
              <InstructionStep>
                <StepNumber>1</StepNumber>
                <div>Tap the share icon at the bottom of your browser</div>
              </InstructionStep>
              <InstructionStep>
                <StepNumber>2</StepNumber>
                <div>Select "Add to Home Screen"</div>
              </InstructionStep>
              <InstructionStep>
                <StepNumber>3</StepNumber>
                <div>Open the app from your home screen and enable notifications</div>
              </InstructionStep>
            </InstallInstructions>
          )}
          
          <ChatBox ref={chatBoxRef}>
            {loading ? (
              <EmptyMessagesContainer>Loading messages...</EmptyMessagesContainer>
            ) : messages.length === 0 ? (
              <EmptyMessagesContainer>
                <FiMessageCircle size={48} />
                <p>No messages yet. Start the conversation!</p>
              </EmptyMessagesContainer>
            ) : (
              <MessageList>
                {/* Group messages by date */}
                {(() => {
                  let lastMessageDate: string | null = null;
                  
                  return messages.map((message, index) => {
                    const messageDate = formatDateSeparator(message.createdAt);
                    const showDateSeparator = messageDate !== lastMessageDate;
                    
                    if (showDateSeparator) {
                      lastMessageDate = messageDate;
                    }
                    
                    const isMine = message.user.email === user?.email;
                    const isLastMessage = index === messages.length - 1;
                    
                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <DateSeparator>
                            <DateLabel>{messageDate}</DateLabel>
                          </DateSeparator>
                        )}
                        <MessageGroup $isMine={isMine}>
                          {!isMine && (
                            <UserInfo>
                              {message.user.picture ? (
                                <UserAvatar src={message.user.picture} alt={message.user.name} />
                              ) : (
                                <UserAvatar 
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(message.user.name)}&background=random&size=128`} 
                                  alt={message.user.name} 
                                />
                              )}
                              <UserName>{message.user.name}</UserName>
                            </UserInfo>
                          )}
                          <MessageItem $isMine={isMine}>
                            {message.text}
                          </MessageItem>
                          <MessageTime $isMine={isMine}>
                            {formatDate(message.createdAt)}
                          </MessageTime>
                          {isLastMessage && <div ref={messagesEndRef} />}
                        </MessageGroup>
                      </React.Fragment>
                    );
                  });
                })()}
              </MessageList>
            )}
          </ChatBox>
          <MessageForm onSubmit={handleSubmit}>
            <MessageInput
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <SendButton type="submit" disabled={!inputValue.trim()}>
              <FiSend />
            </SendButton>
          </MessageForm>
        </ChatContainer>
      </ChatWrapper>
    </PageWrapper>
  );
};

export default Chat; 