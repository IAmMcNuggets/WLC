import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import backgroundImage from '../Background/86343.jpg';
import { GoogleUser } from '../App';
import { FaMapMarkerAlt, FaPhone, FaClock, FaChevronDown, FaChevronRight, FaBuilding, FaSync, FaFile } from 'react-icons/fa';
import { debounce } from 'lodash';
import { useQuery, UseQueryResult } from 'react-query';
import { gapi } from 'gapi-script';
import { useGoogleLogin } from '@react-oauth/google';
import EventChat from '../components/EventChat';
import { createEventGroup } from '../Utils/chatUtils'; // Adjust the path as needed


const EventsContainer = styled.div`
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  padding-bottom: 100px; // Add extra padding at the bottom
  box-sizing: border-box;
`;

const EventsTitle = styled.h1`
  color: #ffffff;
  text-align: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 30px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-size: 2.5rem;
`;

const ActivityList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;
`;

const ActivityItem = styled.li`
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ActivityTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #333;
`;

const ActivityDetail = styled.p`
  margin: 8px 0;
  font-size: 0.9em;
  color: #555;
`;

const ParticipantList = styled.ul`
  list-style-type: none;
  padding-left: 20px;
`;

interface Participant {
  id: number;
  member_id: number;
  member_name: string;
  member_email: string;
  assignment_type: string;
}

interface Activity {
  id: number;
  subject: string;
  description: string;
  location: string;
  regarding_id: number;
  regarding_type: string;
  starts_at: string;
  ends_at: string;
  activity_status_name: string;
  activity_type_name: string;
  completed: boolean;
  participants: Participant[];
  regarding?: {
    subject: string;
    number: string;
  };
}

interface OpportunityDocument {
  id: number;
  opportunity_id: number;
  document_id: number;
  status: number;
  view_count: number;
  uuid: string;
  created_at: string;
  updated_at: string;
  name: string; // Add this line
}

interface OpportunityItem {
  id: number;
  name: string;
  quantity: number;
  opportunity_item_type_name: string;
  price: string;
  description?: string;
  attachable_id?: number;
  item_id?: number;
  item_assets?: ItemAsset[];
  item_type?: string;  // Add this line
}

interface Attachment {
  id: number;
  attachable_id: number;
  name: string;
  description: string;
  attachment_file_name: string;
  attachment_content_type: string;
  attachment_file_size: number;
  attachment_url: string;
  attachment_thumb_url: string;
  created_at: string;
  updated_at: string;
}

interface Opportunity {
  id: number;
  subject: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status_name: string;
  number: string;
  venue: {
    name: string;
  };
  billing_address: {
    name: string;
    street: string;
    city: string;
    county: string;
    postcode: string;
    country_name: string;
  };
  custom_fields: {
    'on-site_contact_phone': string;
    // Add other custom fields as needed
  };
  opportunity_items: OpportunityItem[];
  destination: {
    address: {
      street: string;
      city: string;
      county: string;
      postcode: string;
    };
  };
  attachments: Attachment[];
}

interface ItemAsset {
  id: number;
  stock_level_asset_number: string;
  item_id: number;
}

const currentRMSApi = axios.create({
  baseURL: 'https://api.current-rms.com/api/v1',
  headers: {
    'X-SUBDOMAIN': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN,
    'X-AUTH-TOKEN': process.env.REACT_APP_CURRENT_RMS_API_KEY,
    'Content-Type': 'application/json',
  }
});

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1003; // Increased to be higher than the bottom nav bar
`;

const ModalContent = styled.div`
  background-color: #ffffff; // White background
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  z-index: 1004;
  padding-bottom: 80px;
  box-shadow: 0 4px 6px rgba(0, 0, 100, 0.1);
`;

const CloseButton = styled.button`
  float: right;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const CloseModalButton = styled.button`
  background-color: #ff0000; // Red background
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #cc0000; // Darker red on hover
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const ModalSection = styled.div`
  margin-bottom: 10px;
  
  h3 {
    margin-bottom: 8px;
  }
`;

const ItemTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 0.9rem;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const ItemName = styled.div<{ isGroup: boolean; isAccessory: boolean }>`
  flex: 1;
  font-weight: ${props => props.isGroup ? 'bold' : 'normal'};
  color: ${props => props.isGroup ? '#333' : '#555'};
  ${props => props.isAccessory && `
    padding-left: 20px;
    font-size: 0.95em;
  `}
`;

// Rename this to ItemNameCell
const ItemNameCell = styled.td<{ isGroup: boolean }>`
  font-weight: ${props => props.isGroup ? 'bold' : 'normal'};
`;

const CategoryHeader = styled.h4`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #4CAF50;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 5px;
`;

const SubCategoryHeader = styled.h5`
  cursor: pointer;
  &:before {
    content: '▶';
    display: inline-block;
    margin-right: 5px;
    transition: transform 0.3s ease;
  }
  &.open:before {
    transform: rotate(90deg);
  }
`;

const AccessoryList = styled.div`
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  &.open {
    max-height: 1000px;
  }
`;

const AccessoryItem = styled.div`
  padding-left: 40px;
  margin-bottom: 5px;
`;

const PrincipalDescription = styled.p`
  margin-top: 10px;
  font-size: 0.9em;
  color: #1e40af; // Dark blue
  padding: 10px;
  background-color: #f0f7ff; // Very light blue
  border-radius: 4px;
`;

const ModalHeader = styled.h2`
  color: #1e3a8a; // Dark blue
  border-bottom: 2px solid #3b82f6; // Medium blue
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const InfoSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const Icon = styled.span`
  margin-right: 10px;
  color: #3b82f6; // Medium blue
`;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface EventsProps {
  user: GoogleUser | null;
}

// Define a generic type for the API response
type ApiResponse<T> = {
  data: T;
  // Add other properties if needed
};

const fetchWithRetry = async <T,>(url: string, retries = 3, delay = 1000): Promise<T | null> => {
  try {
    console.log(`Attempting to fetch from ${url}`);
    const response = await currentRMSApi.get<ApiResponse<T>>(url);
    console.log(`Response received:`, response.data);
    return response.data.data;
  } catch (error) {
    if (retries > 0) {
      console.log(`Fetch failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry<T>(url, retries - 1, delay * 2);
    }
    console.error(`Failed to fetch data from ${url}:`, error);
    return null;
  }
};

const fetchActivities = async (startDate: string, endDate: string): Promise<Activity[]> => {
  try {
    const response = await currentRMSApi.get('/activities', {
      params: {
        'q[starts_at_gteq]': startDate,
        'q[starts_at_lt]': endDate,
        'per_page': 100 // Adjust this number as needed
      }
    });
    return response.data.activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

const PrincipalRow = styled.div<{ isGroup: boolean; isAccessory: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
`;

const AccessoryRow = styled.div<{ isGroup: boolean; isAccessory: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-left: 40px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }
`;

const AccessoryName = styled.td`
  padding-left: 20px;
`;

const ItemList = styled.div`
  // Remove these lines:
  // border: 1px solid #e0e0e0;
  // border-radius: 4px;
  // box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ItemRow = styled.div<{ isGroup?: boolean; isAccessory?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: ${props => 
    props.isGroup ? '#f5f5f5' : 
    props.isAccessory ? '#ffffff' : '#fafafa'};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemNameDiv = styled.div<{ isGroup: boolean; isAccessory: boolean }>`
  flex: 1;
  font-weight: ${props => props.isGroup ? 'bold' : 'normal'};
  color: ${props => props.isGroup ? '#333' : '#555'};
  ${props => props.isAccessory && `
    padding-left: 20px;
    font-size: 0.95em;
  `}
`;

const ItemQuantity = styled.div`
  width: 80px;
  text-align: right;
  color: #666;
`;

const ToggleIcon = styled.div`
  margin-right: 10px;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  margin-top: 20px;

  &:hover {
    background-color: #45a049;
  }

  svg {
    margin-right: 8px;
  }
`;

const GroupHeader = styled.div`
  font-weight: bold;
  font-size: 1.1em;
  margin-top: 15px;
  margin-bottom: 10px;
  background-color: #dbeafe; // Very light blue
  padding: 10px 15px;
  border-radius: 5px;
  color: #1e3a8a; // Dark blue
`;

const PrincipalItem = styled.div`
  margin: 10px 0;
  padding: 10px 15px;
  background-color: #f8fafc; // Very light blue-gray background
  border: 1px solid #e2e8f0; // Light gray border
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f0f7ff; // Light blue on hover
    box-shadow: 0 2px 5px rgba(59, 130, 246, 0.1);
  }
`;

const PrincipalName = styled.span`
  font-weight: bold;
  color: #2563eb; // Blue
`;

const ExpandIcon = styled.span`
  float: right;
  transition: transform 0.3s ease;
`;

const AccessoryItemDiv = styled.div`
  margin: 5px 0 5px 20px;
  padding: 8px 15px;
  background-color: #f8fafc; // Very light blue-gray
  border-left: 3px solid #60a5fa; // Medium blue
  font-size: 0.9em;
  color: #1e3a8a; // Dark blue
`;

const AttachmentSection = styled.div`
  margin-top: 20px;
`;

const AttachmentList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const AttachmentItem = styled.li`
  margin-bottom: 10px;
`;

const AttachmentLink = styled.a`
  color: #3b82f6;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

// Add this function to fetch attachments
const fetchAttachments = async (regardingId: number): Promise<Attachment[]> => {
  try {
    console.log(`Fetching attachments for regarding_id: ${regardingId}`);
    let allAttachments: Attachment[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await currentRMSApi.get(`/attachments`, {
        params: {
          'q[attachable_type]': 'Opportunity',
          'per_page': 100,
          'page': page
        }
      });
      
      const { attachments, meta } = response.data;
      allAttachments = [...allAttachments, ...attachments];
      
      console.log(`Fetched page ${page} of attachments`);
      
      if (meta.page * meta.per_page >= meta.total_row_count) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    console.log(`Total attachments fetched: ${allAttachments.length}`);

    // Filter attachments to only include those matching the regardingId
    const filteredAttachments = allAttachments.filter(
      (attachment: Attachment) => attachment.attachable_id === regardingId
    );
    
    console.log(`Filtered attachments for regarding_id ${regardingId}:`, filteredAttachments);
    return filteredAttachments;
  } catch (error) {
    console.error(`Error fetching attachments for regarding_id ${regardingId}:`, error);
    return [];
  }
};

const fetchItemAssets = async (itemId: number): Promise<ItemAsset[]> => {
  try {
    const response = await currentRMSApi.get(`/items/${itemId}/item_assets`);
    return response.data.item_assets;
  } catch (error) {
    console.error(`Error fetching item assets for item ${itemId}:`, error);
    return [];
  }
};

// Add these new styled components near your other styled components
const ServiceAssetList = styled.div`
  margin-left: 20px;
  font-size: 0.9em;
  color: #666;
`;

const AssetNumber = styled.div`
  padding: 4px 0;
  color: #4a5568;
`;

// Add this styled component with the other styled components
const PhotoUploadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #4CAF50;
  color: white;
  padding: 15px 24px;
  border-radius: 8px;
  border: none;
  text-decoration: none;
  font-weight: 800;
  font-size: 1.1em;
  transition: all 0.3s ease;
  margin: 5px 0;
  cursor: pointer;
  width: 90%;
  min-height: 52px;
  overflow: hidden;
  white-space: nowrap;
  
  &:hover {
    background-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FOLDER_ID = '1msII_15zUBa-LwTg44LRzpyotrOUXoth';

const PhotoUploadInput = styled.input`
  display: none;
`;

const PhotoUploadSection = styled.div`
  margin: 5px 0;
  display: flex;
  justify-content: center;
`;

const UploadStatus = styled.div`
  margin-top: 10px;
  color: #666;
  font-size: 0.9em;
`;

// Update the NotificationContainer styled component
const NotificationContainer = styled.div<{ type: 'success' | 'error' }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 8px;
  background-color: ${props => props.type === 'success' ? '#4CAF50' : '#f44336'};
  color: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 9999; // Increased z-index to appear above modal
  animation: slideIn 0.3s ease-out;
  font-weight: bold;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const EventChatContainer = styled.div`
  position: fixed;
  right: 20px;
  bottom: 80px; // Position above the bottom nav bar
  width: 300px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const ChatToggleButton = styled.button`
  position: fixed;
  right: 20px;
  bottom: 80px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  z-index: 999;

  &:hover {
    background: #0056b3;
  }
`;

// Add these styled components with your other styled components
const ChatSection = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
`;

const Events: React.FC<EventsProps> = ({ user }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [opportunityItems, setOpportunityItems] = useState<OpportunityItem[]>([]);
  const [expandedPrincipals, setExpandedPrincipals] = useState<{ [key: number]: boolean }>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGapiInitialized, setIsGapiInitialized] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Add useEffect to initialize Google API
  useEffect(() => {
    const initializeGapi = async () => {
      try {
        await new Promise((resolve) => gapi.load('client', resolve));
        await gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        setIsGapiInitialized(true);
        console.log('GAPI initialized successfully');
      } catch (error) {
        console.error('Error initializing GAPI:', error);
      }
    };

    initializeGapi();
  }, []);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      // Set the access token for GAPI
      gapi.client.setToken({
        access_token: tokenResponse.access_token
      });
      document.getElementById('photo-upload')?.click();
    },
    onError: (error) => console.log('Login Failed:', error)
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, activity: Activity | null) => {
    const files = event.target.files;
    if (!files || !activity) return;

    try {
      setIsUploading(true);
      let uploadedCount = 0;
      
      for (const file of Array.from(files)) {
        // Format current time
        const currentTime = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        const metadata = {
          // Include activity subject, user name, time, and original filename
          name: `${activity.regarding?.subject || 'Unknown'}_${activity.regarding?.number || 'No-Number'}_${user?.name || 'Unknown'}_${currentTime}_${file.name}`,
          parents: [FOLDER_ID],
          mimeType: file.type,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
          },
          body: form
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }

        uploadedCount++;
      }

      // Show success notification
      setNotification({
        message: `Successfully uploaded ${uploadedCount} photo${uploadedCount !== 1 ? 's' : ''}`,
        type: 'success'
      });

    } catch (error) {
      console.error('Error uploading photos:', error);
      // Show error notification
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to upload photos',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      // Clear notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  // Update the button click handler
  const handleUploadClick = () => {
    console.log('Upload button clicked');
    if (!isGapiInitialized) {
      console.log('GAPI not initialized yet');
      return;
    }

    const token = gapi.client.getToken();
    if (!token) {
      console.log('No token, starting login flow');
      login();
    } else {
      document.getElementById('photo-upload')?.click();
    }
  };

  const fetchActivities = async (startDate: string, endDate: string): Promise<void> => {
    console.log('Fetching activities:', startDate, endDate);
    try {
      const response = await currentRMSApi.get('/activities', {
        params: {
          'q[ends_at_gteq]': today.toISOString(),
          'q[starts_at_lt]': endDate,
          'per_page': 100
        }
      });
      console.log('Activities response:', response.data);
      setActivities(response.data.activities);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error as Error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActivities(today.toISOString(), nextMonth.toISOString());
    }
  }, [user]);

  const filteredActivities = useMemo(() => {
    if (!activities || !user) return [];
    return activities.filter(activity => 
      activity.participants.some(participant => 
        participant.member_name?.toLowerCase().includes(user.name?.toLowerCase() || '') ||
        participant.member_email?.toLowerCase() === user.email?.toLowerCase()
      )
    );
  }, [activities, user]);

  const fetchOpportunityDetails = useCallback(async (activity: Activity) => {
    try {
      const response = await currentRMSApi.get(`/opportunities/${activity.regarding_id}`);
      console.log('Opportunity response:', response.data);
      const opportunity = response.data.opportunity;
      setSelectedOpportunity(opportunity);
      
      // Fetch opportunity items
      const itemsResponse = await currentRMSApi.get(`/opportunities/${activity.regarding_id}/opportunity_items`);
      console.log('Opportunity items response:', itemsResponse.data);
      
      // The item_assets are already included in the response
      setOpportunityItems(itemsResponse.data.opportunity_items);

      // Fetch attachments
      const attachmentsData = await fetchAttachments(activity.regarding_id);
      setAttachments(attachmentsData);

    } catch (error) {
      console.error('Error fetching opportunity details:', error);
      setSelectedOpportunity(null);
      setOpportunityItems([]);
      setAttachments([]);
    }
  }, []);

  const handleActivityClick = useCallback(async (activity: Activity) => {
    console.log('Activity clicked:', activity);
    setSelectedActivity(activity);
    
    if (activity.regarding_id) {
      console.log(`Activity has regarding_id: ${activity.regarding_id}`);
      try {
        await createEventGroup(
          activity.regarding_id.toString(),
          activity.subject
        );
        fetchOpportunityDetails(activity);
      } catch (error) {
        console.error('Error creating chat group:', error);
      }
    } else {
      console.log('Activity has no regarding_id');
      setAttachments([]);
    }
  }, [fetchOpportunityDetails]);

  const closeModal = () => {
    setSelectedActivity(null);
    setSelectedOpportunity(null);
  };

  const togglePrincipal = (id: number) => {
    console.log('Toggling principal:', id);
    setExpandedPrincipals(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      console.log('New expanded state:', newState);
      return newState;
    });
  };

  // Move fetchOpportunity inside the component
  const fetchOpportunity = async (id: number): Promise<Opportunity & { attachments: Attachment[] }> => {
    try {
      console.log(`Fetching opportunity with ID: ${id}`);
      setIsLoading(true);
      const [opportunityResponse, attachmentsResponse] = await Promise.all([
        currentRMSApi.get(`/opportunities/${id}?include[]=opportunity_items`),
        fetchAttachments(id)
      ]);
      console.log('Opportunity response:', opportunityResponse.data);
      setIsLoading(false);
      return {
        ...opportunityResponse.data.opportunity,
        attachments: attachmentsResponse
      };
    } catch (error) {
      console.error(`Error fetching opportunity ${id}:`, error);
      setIsLoading(false);
      throw error;
    }
  };

  const handleEventClick = (eventId: string) => {
    console.log('Event clicked:', eventId);
    setSelectedEventId(eventId);
    setShowChat(true);
  };

  useEffect(() => {
    console.log('Selected Event ID:', selectedEventId);
  }, [selectedEventId]);

  if (isLoading) return <div>Loading activities...</div>;
  if (error) return <div>Error loading activities: {error.message}</div>;
  if (!user) return <div>Please log in to view your activities.</div>;

  return (
    <>
      <div>
        <EventsContainer>
          <EventsTitle>Your Current & Upcoming Activities</EventsTitle>
          {filteredActivities.length === 0 ? (
            <p>No upcoming activities found for {user.name || 'you'} in the next 30 days.</p>
          ) : (
            <ActivityList>
              {filteredActivities.map((activity) => (
                <ActivityItem key={activity.id} onClick={() => handleActivityClick(activity)}>
                  <ActivityTitle>{activity.subject}</ActivityTitle>
                  <ActivityDetail><strong>Starts:</strong> {new Date(activity.starts_at).toLocaleString()}</ActivityDetail>
                  <ActivityDetail><strong>Ends:</strong> {new Date(activity.ends_at).toLocaleString()}</ActivityDetail>
                  {activity.location && <ActivityDetail><strong>Location:</strong> {activity.location}</ActivityDetail>}
                </ActivityItem>
              ))}
            </ActivityList>
          )}
          {selectedActivity && (
            <Modal>
              <ModalContent>
                <CloseButton onClick={closeModal}>X</CloseButton>
                <ModalHeader>{selectedActivity.subject}</ModalHeader>
                
                {selectedActivity && (
                  <ModalSection>
                    <h3>Event Photos</h3>
                    <PhotoUploadSection>
                      <PhotoUploadInput 
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, selectedActivity)}
                      />
                      <PhotoUploadButton 
                        type="button"
                        onClick={handleUploadClick}
                        disabled={isUploading || !isGapiInitialized}
                      >
                        <FaFile /> {isUploading ? 'Uploading...' : 'Take Event Photos'}
                      </PhotoUploadButton>
                    </PhotoUploadSection>
                  </ModalSection>
                )}

                <ModalGrid>
                  <ModalSection>
                    <InfoSection>
                      <Icon><FaClock /></Icon>
                      <div>
                        <p><strong>Starts:</strong> {new Date(selectedActivity.starts_at).toLocaleString()}</p>
                        <p><strong>Ends:</strong> {new Date(selectedActivity.ends_at).toLocaleString()}</p>
                      </div>
                    </InfoSection>
                    {selectedActivity.location && (
                      <InfoSection>
                        <Icon><FaMapMarkerAlt /></Icon>
                        <p><strong>Location:</strong> {selectedActivity.location}</p>
                      </InfoSection>
                    )}
                  </ModalSection>
                </ModalGrid>
                {selectedActivity.description && (
                  <ModalSection>
                    <h3>Description:</h3>
                    <p>{selectedActivity.description}</p>
                  </ModalSection>
                )}
                {selectedOpportunity && (
                  <ModalSection>
                    {selectedOpportunity.venue && (
                      <InfoSection>
                        <Icon><FaBuilding /></Icon>
                        <p><strong>Venue:</strong> {selectedOpportunity.venue.name}</p>
                      </InfoSection>
                    )}
                    {selectedOpportunity.custom_fields && selectedOpportunity.custom_fields['on-site_contact_phone'] && (
                      <InfoSection>
                        <Icon><FaPhone /></Icon>
                        <p><strong>On-site Contact:</strong> {selectedOpportunity.custom_fields['on-site_contact_phone']}</p>
                      </InfoSection>
                    )}
                    <h4>Items:</h4>
                    <ItemList>
                      {(() => {
                        let currentGroup: string | null = null;
                        let currentPrincipal: OpportunityItem | null = null;

                        const principalsWithAccessories = new Set(
                          opportunityItems
                            .filter(item => item.opportunity_item_type_name === "Accessory")
                            .map(item => item.id - 1)
                        );

                        return opportunityItems.map((item, index) => {
                          if (item.opportunity_item_type_name === "Group") {
                            currentGroup = item.name;
                            return <GroupHeader key={item.id}>{item.name}</GroupHeader>;
                          } else if (item.item_type === "Service") { // Changed this condition
                            return (
                              <React.Fragment key={item.id}>
                                <PrincipalItem>
                                  <PrincipalName>{item.name}</PrincipalName>
                                  {item.description && (
                                    <PrincipalDescription>{item.description}</PrincipalDescription>
                                  )}
                                  {item.item_assets && item.item_assets.length > 0 && (
                                    <ServiceAssetList>
                                      {item.item_assets.map((asset) => (
                                        <AssetNumber key={asset.id}>
                                          {asset.stock_level_asset_number}
                                        </AssetNumber>
                                      ))}
                                    </ServiceAssetList>
                                  )}
                                </PrincipalItem>
                              </React.Fragment>
                            );
                          } else if (item.opportunity_item_type_name === "Principal") {
                            currentPrincipal = item;
                            const hasAccessories = principalsWithAccessories.has(item.id);
                            return (
                              <PrincipalItem key={item.id} onClick={() => hasAccessories && togglePrincipal(item.id)}>
                                <PrincipalName>{item.name}</PrincipalName>
                                {hasAccessories && (
                                  <ExpandIcon style={{ transform: expandedPrincipals[item.id] ? 'rotate(180deg)' : 'none' }}>
                                    ▼
                                  </ExpandIcon>
                                )}
                                {item.description && (
                                  <PrincipalDescription>{item.description}</PrincipalDescription>
                                )}
                              </PrincipalItem>
                            );
                          } else if (item.opportunity_item_type_name === "Accessory" && currentPrincipal) {
                            const isExpanded = expandedPrincipals[currentPrincipal.id];
                            return isExpanded ? (
                              <AccessoryItemDiv key={item.id}>
                                {item.name} (Qty: {item.quantity})
                              </AccessoryItemDiv>
                            ) : null;
                          }
                          return null;
                        });
                      })()}
                    </ItemList>
                    <AttachmentSection>
                      <h3>Attachments</h3>
                      {isLoading ? (
                        <p>Loading attachments...</p>
                      ) : attachments.length > 0 ? (
                        <AttachmentList>
                          {attachments.map((attachment) => (
                            <AttachmentItem key={attachment.id}>
                              <AttachmentLink href={attachment.attachment_url} target="_blank" rel="noopener noreferrer">
                                {attachment.name || attachment.attachment_file_name}
                              </AttachmentLink>
                              {attachment.description && <p>{attachment.description}</p>}
                            </AttachmentItem>
                          ))}
                        </AttachmentList>
                      ) : (
                        <p>No attachments available</p>
                      )}
                    </AttachmentSection>
                    <ButtonContainer>
                      <CloseModalButton onClick={closeModal}>Close</CloseModalButton>
                    </ButtonContainer>
                  </ModalSection>
                )}
                <ChatSection>
                  {selectedActivity && (
                    <>
                      {!showChat ? (
                        <ChatToggleButton onClick={() => setShowChat(true)}>
                          Open Event Chat
                        </ChatToggleButton>
                      ) : (
                        <>
                          <ChatToggleButton onClick={() => setShowChat(false)}>
                            Close Chat
                          </ChatToggleButton>
                          <EventChat 
                            groupId={`event_${selectedActivity.regarding_id}`} 
                          />
                        </>
                      )}
                    </>
                  )}
                </ChatSection>
              </ModalContent>
            </Modal>
          )}
          <RefreshButton onClick={() => fetchActivities(today.toISOString(), nextMonth.toISOString())}>
            <FaSync /> Refresh Activities
          </RefreshButton>
        </EventsContainer>
      </div>
      
      {/* Place notifications outside the main component structure */}
      <div style={{ position: 'fixed', zIndex: 9999 }}>
        {notification && (
          <NotificationContainer type={notification.type}>
            {notification.message}
          </NotificationContainer>
        )}
      </div>

      {selectedEventId && !showChat && (
        <ChatToggleButton onClick={() => setShowChat(true)}>
          Open Chat
        </ChatToggleButton>
      )}

      {selectedEventId && showChat && (
        <EventChatContainer>
          <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Event Chat</h3>
            <button 
              onClick={() => setShowChat(false)}
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <EventChat groupId={`event_${selectedEventId}`} />
        </EventChatContainer>
      )}
    </>
  );
};

export default Events;
