import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, Timestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import { FaBuilding, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { GoogleUser } from '../types/user';
import backgroundImage from '../Background/86343.jpg';
import defaultAvatar from '../Logos/default-avatar.svg';
import { requestNotificationPermission } from '../services/messaging';
import { useNotifications } from '../contexts/NotificationContext';
import { FirebaseError } from 'firebase/app';

// Define company membership interface
interface CompanyMembership {
  id: string;
  companyId: string;
  status: string;
  company: {
    id: string;
    name: string;
    location: string;
  };
}

// Define the structure of a chat message
interface ChatMessage {
  id: string;
  text: string;
  createdAt: Timestamp;
  companyId: string | null;
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 100px; /* Increased from 90px to give more space above nav */
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.02); /* Almost fully transparent */
`;

const ChatInner = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0 auto;
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border-bottom: none;
  box-shadow: none;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const ChatTitle = styled.h1`
  text-align: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-size: 2.5rem;
`;

const CompanySelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
  overflow-x: auto;
  padding: 0 10px;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
`;

const CompanyTab = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin: 0 6px;
  background: ${props => props.isActive ? 'rgba(0, 132, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)'};
  color: ${props => props.isActive ? '#0084ff' : '#333'};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  border: 1px solid ${props => props.isActive ? 'rgba(0, 132, 255, 0.3)' : 'transparent'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: ${props => props.isActive ? '0 2px 10px rgba(0, 132, 255, 0.1)' : 'none'};
  
  &:hover {
    background: ${props => props.isActive ? 'rgba(0, 132, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)'};
    transform: translateY(-2px);
  }
  
  svg {
    margin-right: 8px;
  }
`;

const GlobalChatTab = styled(CompanyTab)`
  background: ${props => props.isActive ? 'rgba(75, 85, 99, 0.1)' : 'rgba(255, 255, 255, 0.4)'};
  color: ${props => props.isActive ? '#4b5563' : '#333'};
  border: 1px solid ${props => props.isActive ? 'rgba(75, 85, 99, 0.3)' : 'transparent'};
  box-shadow: ${props => props.isActive ? '0 2px 10px rgba(75, 85, 99, 0.1)' : 'none'};
  
  &:hover {
    background: ${props => props.isActive ? 'rgba(75, 85, 99, 0.15)' : 'rgba(255, 255, 255, 0.6)'};
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  padding-bottom: 100px; /* Increased to match input container height */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: 90px;
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
  background: ${props => props.isOwn ? 
    'linear-gradient(135deg, rgba(0, 132, 255, 0.85), rgba(0, 132, 255, 0.75))' : 
    'rgba(255, 255, 255, 0.4)'};
  color: ${props => props.isOwn ? 'white' : '#1a1a1a'};
  padding: 0.875rem 1.25rem;
  border-radius: 1.25rem;
  box-shadow: 0 2px 10px ${props => props.isOwn ? 
    'rgba(0, 132, 255, 0.1)' : 
    'rgba(0, 0, 0, 0.02)'};
  backdrop-filter: ${props => props.isOwn ? 'none' : 'blur(8px)'};
  -webkit-backdrop-filter: ${props => props.isOwn ? 'none' : 'blur(8px)'};
  border: 1px solid ${props => props.isOwn ? 
    'transparent' : 
    'rgba(255, 255, 255, 0.2)'};
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
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  position: absolute;
  bottom: 10px; /* Added space from bottom */
  left: 0;
  right: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.02);

  @media (max-width: 768px) {
    padding: 1rem;
    bottom: 8px;
  }
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.5rem;
  font-size: 16px; /* Minimum size to prevent zoom */
  outline: none;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: all 0.2s ease;
  color: #1a1a1a;
  -webkit-appearance: none; /* Prevent iOS default styles */
  appearance: none;
  
  &:focus {
    border-color: #0084ff;
    background: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.1);
  }
  
  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 768px) {
    font-size: 16px; /* Ensure minimum size on mobile */
    padding: 0.75rem 1rem; /* Slightly smaller padding on mobile */
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
  background: rgba(255, 255, 255, 0.7);
  color: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
  
  svg {
    font-size: 1.125rem;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  
  svg {
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
    color: #0084ff;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    color: #666;
  }
`;

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { notificationsEnabled, enableNotifications } = useNotifications();
  
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  
  // Load user's companies
  useEffect(() => {
    const loadUserCompanies = async () => {
      if (!auth.currentUser) {
        setIsLoadingCompanies(false);
        return;
      }
      
      try {
        // Get all companies the user is a member of with active status
        const membershipsQuery = query(
          collection(firestore, 'companyMembers'),
          where('userId', '==', auth.currentUser.uid),
          where('status', '==', 'active')
        );
        
        const snapshot = await getDocs(membershipsQuery);
        
        // Fetch company details for each membership
        const companiesData = await Promise.all(
          snapshot.docs.map(async (memberDoc) => {
            const memberData = memberDoc.data();
            const membership = { 
              id: memberDoc.id, 
              companyId: memberData.companyId,
              status: memberData.status
            } as Omit<CompanyMembership, 'company'>;
            
            const companyDoc = await getDoc(doc(firestore, 'companies', membership.companyId));
            
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              return {
                ...membership,
                company: { 
                  id: companyDoc.id, 
                  name: companyData.name || 'Unknown Company',
                  location: companyData.location || ''
                }
              } as CompanyMembership;
            }
            return null;
          })
        );
        
        // Filter out null values and set companies
        const validCompanies = companiesData.filter(c => c !== null) as CompanyMembership[];
        setCompanies(validCompanies);
        
        // Set selected company from localStorage or first company
        const storedCompanyId = localStorage.getItem('selectedChatCompanyId');
        if (storedCompanyId === 'global') {
          setSelectedCompanyId(null);
        } else if (storedCompanyId && validCompanies.some(c => c.companyId === storedCompanyId)) {
          setSelectedCompanyId(storedCompanyId);
        } else if (validCompanies.length > 0) {
          setSelectedCompanyId(validCompanies[0].companyId);
        } else {
          setSelectedCompanyId(null);
        }
      } catch (error) {
        console.error('Error loading user companies:', error);
        addToast('Error loading your companies', 'error');
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    
    loadUserCompanies();
  }, [addToast]);
  
  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Listen for new messages filtered by company
  useEffect(() => {
    if (!currentUser) return;
    
    let q;
    let unsubscribe = () => {};
    
    try {
      if (selectedCompanyId) {
        // Company specific chat
        q = query(
          collection(firestore, 'messages'),
          where('companyId', '==', selectedCompanyId),
          orderBy('createdAt', 'asc')
        );
      } else {
        // Global chat
        q = query(
          collection(firestore, 'messages'),
          where('companyId', '==', null),
          orderBy('createdAt', 'asc')
        );
      }
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          newMessages.push({
            id: doc.id,
            text: data.text,
            createdAt: data.createdAt,
            companyId: data.companyId || null,
            user: data.user
          });
        });
        setMessages(newMessages);
      }, (error: FirebaseError) => {
        console.error("Error in chat snapshot:", error);
        // Clear messages if permission denied
        if (error.code === 'permission-denied') {
          setMessages([]);
          addToast('You do not have permission to view these messages', 'error');
        }
      });
    } catch (error) {
      console.error("Error setting up chat listener:", error);
      setMessages([]);
    }
    
    return () => unsubscribe();
  }, [currentUser, selectedCompanyId, addToast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !currentUser || !user) return;
    
    try {
      // Create message data
      const messageData = {
        text: inputValue.trim(),
        createdAt: serverTimestamp(),
        companyId: selectedCompanyId,
        user: {
          uid: currentUser.uid,
          name: user.name,
          email: user.email,
          picture: user.picture || null // Ensure picture is not undefined
        }
      };
      
      await addDoc(collection(firestore, 'messages'), messageData);
      setInputValue('');
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        addToast('You do not have permission to send messages in this chat', 'error');
      } else {
        addToast('Failed to send message', 'error');
      }
    }
  };
  
  const handleCompanySelect = (companyId: string | null) => {
    setSelectedCompanyId(companyId);
    
    // Store selection in localStorage
    if (companyId === null) {
      localStorage.setItem('selectedChatCompanyId', 'global');
    } else {
      localStorage.setItem('selectedChatCompanyId', companyId);
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
  
  const getChannelTitle = () => {
    if (selectedCompanyId === null) {
      return 'Global Chat';
    }
    
    const company = companies.find(c => c.companyId === selectedCompanyId);
    return company ? `${company.company.name} Chat` : 'Company Chat';
  };
  
  return (
    <ChatContainer>
      <ChatInner>
        <Header>
          <ChatTitle>{getChannelTitle()}</ChatTitle>
          
          {isLoadingCompanies ? (
            <LoadingState>
              <FaSpinner size={24} />
              <p>Loading your companies...</p>
            </LoadingState>
          ) : (
            <CompanySelector>
              <GlobalChatTab 
                isActive={selectedCompanyId === null}
                onClick={() => handleCompanySelect(null)}
              >
                <FiMessageCircle /> Global
              </GlobalChatTab>
              
              {companies.map(company => (
                <CompanyTab
                  key={company.companyId}
                  isActive={selectedCompanyId === company.companyId}
                  onClick={() => handleCompanySelect(company.companyId)}
                >
                  <FaBuilding /> {company.company.name}
                </CompanyTab>
              ))}
            </CompanySelector>
          )}
          
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
                    src={message.user.picture || defaultAvatar} 
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
            placeholder={`Type a message in ${getChannelTitle()}...`}
            disabled={!currentUser || !user}
          />
          <SendButton type="submit" disabled={!inputValue.trim() || !currentUser || !user}>
            <FiSend size={20} />
          </SendButton>
        </InputContainer>
      </ChatInner>
    </ChatContainer>
  );
};

export default Chat; 