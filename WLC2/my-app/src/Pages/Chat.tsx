import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { collection, addDoc, onSnapshot, query, orderBy, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { GoogleUser } from '../App';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import backgroundImage from '../Background/86343.jpg';
import { format } from 'date-fns';
import { FaPaperPlane, FaUser } from 'react-icons/fa';

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
  background-color: rgba(255, 255, 255, 0.95); // Slightly more opaque
  border-radius: 15px;
  padding: 20px;
  width: 95%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  height: 75vh;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); // Enhanced shadow
  border: 1px solid rgba(0, 0, 0, 0.05);
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  
  /* Customize scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const MessageGroup = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const MessageItem = styled.div<{ isCurrentUser: boolean }>`
  max-width: 75%;
  padding: 12px 16px;
  border-radius: ${props => props.isCurrentUser ? '18px 18px 0 18px' : '18px 18px 18px 0'};
  margin-bottom: 4px;
  background-color: ${props => props.isCurrentUser ? '#0084ff' : '#f0f0f0'};
  color: ${props => props.isCurrentUser ? 'white' : '#333'};
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MessageForm = styled.form`
  display: flex;
  margin-top: 20px;
  position: relative;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 14px 20px;
  border: 1px solid #ddd;
  border-radius: 30px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #0084ff;
    box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.2);
  }
`;

const SendButton = styled.button`
  background-color: #0084ff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  margin-left: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #0073e6;
    transform: scale(1.05);
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const UserInfo = styled.div<{ isCurrentUser: boolean }>`
  font-size: 13px;
  margin-bottom: 5px;
  color: #666;
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UserAvatar = styled.div<{ photoURL: string | null; isCurrentUser: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  background-color: ${props => props.isCurrentUser ? '#0084ff' : '#e1e1e1'};
  color: ${props => props.isCurrentUser ? 'white' : '#666'};
  background-image: ${props => props.photoURL ? `url(${props.photoURL})` : 'none'};
  background-size: cover;
  background-position: center;
  font-size: 14px;
  font-weight: bold;
  order: ${props => props.isCurrentUser ? 1 : 0};
`;

const MessageTime = styled.span<{ isCurrentUser: boolean }>`
  font-size: 11px;
  color: ${props => props.isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : '#999'};
  margin-top: 5px;
  display: block;
  text-align: ${props => props.isCurrentUser ? 'right' : 'left'};
`;

const DateDivider = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 15px 0;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #ddd;
  }
  
  span {
    margin: 0 10px;
    font-size: 12px;
    color: #888;
    background-color: white;
    padding: 3px 8px;
    border-radius: 10px;
  }
`;

const EmptyStateMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  text-align: center;
  padding: 20px;
  
  p {
    margin: 10px 0;
  }
  
  svg {
    font-size: 40px;
    color: #ccc;
    margin-bottom: 10px;
  }
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

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to Firestore for real-time updates - limited to last 7 days
  useEffect(() => {
    if (!user || !currentUser) return;

    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const messagesRef = collection(firestore, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, 
        (snapshot) => {
          const newMessages: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            newMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
          });
          setMessages(newMessages);
        },
        (error) => {
          console.error('Firestore snapshot error:', error);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up Firestore listener:', error);
    }
  }, [user, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUser || !user) return;

    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'messages'), {
        text: inputValue,
        createdAt: serverTimestamp(),
        user: {
          uid: currentUser.uid,
          name: user.name,
          photoURL: user.picture || null
        }
      });
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

  const formatMessageDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    
    // Same day
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    
    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    
    // Within the last 7 days
    return format(date, 'EEE, MMM d, h:mm a');
  };
  
  // Group messages by date and sender
  const groupedMessages: { [key: string]: ChatMessage[][] } = {};
  let currentDay = '';
  let currentSender = '';
  let currentGroup: ChatMessage[] = [];

  messages.forEach((message) => {
    if (!message.createdAt) return;
    
    const messageDate = message.createdAt.toDate();
    const messageDayKey = messageDate.toDateString();
    const senderId = message.user.uid;
    
    // If new day, start new day entry
    if (messageDayKey !== currentDay) {
      currentDay = messageDayKey;
      if (!groupedMessages[currentDay]) {
        groupedMessages[currentDay] = [];
      }
      currentSender = senderId;
      currentGroup = [message];
      groupedMessages[currentDay].push(currentGroup);
    } 
    // If new sender, start new group
    else if (senderId !== currentSender) {
      currentSender = senderId;
      currentGroup = [message];
      groupedMessages[currentDay].push(currentGroup);
    } 
    // Same sender, same day, add to current group
    else {
      currentGroup.push(message);
    }
  });

  return (
    <ChatContainer>
      <ChatTitle>Team Chat</ChatTitle>
      <ChatBox>
        <MessageList ref={messageListRef}>
          {Object.keys(groupedMessages).length > 0 ? (
            Object.entries(groupedMessages).map(([day, messageGroups]) => (
              <React.Fragment key={day}>
                <DateDivider>
                  <span>{new Date(day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </DateDivider>
                
                {messageGroups.map((group, groupIndex) => {
                  const isCurrentUser = currentUser?.uid === group[0].user.uid;
                  const firstMessage = group[0];
                  const initial = firstMessage.user.name.charAt(0).toUpperCase();
                  
                  return (
                    <MessageGroup key={`${day}-${groupIndex}`}>
                      <UserInfo isCurrentUser={isCurrentUser}>
                        {!isCurrentUser && (
                          <>
                            <UserAvatar 
                              photoURL={firstMessage.user.photoURL} 
                              isCurrentUser={isCurrentUser}
                            >
                              {!firstMessage.user.photoURL && initial}
                            </UserAvatar>
                            <span>{firstMessage.user.name}</span>
                          </>
                        )}
                        {isCurrentUser && (
                          <>
                            <span>You</span>
                            <UserAvatar 
                              photoURL={firstMessage.user.photoURL} 
                              isCurrentUser={isCurrentUser}
                            >
                              {!firstMessage.user.photoURL && initial}
                            </UserAvatar>
                          </>
                        )}
                      </UserInfo>
                      
                      {group.map((message, messageIndex) => (
                        <MessageItem key={message.id} isCurrentUser={isCurrentUser}>
                          {message.text}
                          {messageIndex === group.length - 1 && (
                            <MessageTime isCurrentUser={isCurrentUser}>
                              {formatMessageDate(message.createdAt)}
                            </MessageTime>
                          )}
                        </MessageItem>
                      ))}
                    </MessageGroup>
                  );
                })}
              </React.Fragment>
            ))
          ) : (
            <EmptyStateMessage>
              <FaUser />
              <p>No messages in the last 7 days</p>
              <p>Start a conversation with your team!</p>
            </EmptyStateMessage>
          )}
        </MessageList>
        
        <MessageForm onSubmit={handleSubmit}>
          <MessageInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
          />
          <SendButton type="submit" disabled={isLoading || !inputValue.trim()}>
            <FaPaperPlane />
          </SendButton>
        </MessageForm>
      </ChatBox>
    </ChatContainer>
  );
};

export default Chat; 