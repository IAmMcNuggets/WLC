import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import backgroundImage from '../Background/86343.jpg';
import { GoogleUser } from '../App';
import { FaMapMarkerAlt, FaPhone, FaClock, FaChevronDown, FaChevronRight, FaBuilding } from 'react-icons/fa';
import { debounce } from 'lodash';
import { useQuery, UseQueryResult } from 'react-query';

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
  // Add other properties as needed
}

interface Attachment {
  id: number;
  attachable_id: number;
  attachable_type: string;
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
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative; // Add this to ensure it's above the overlay
  z-index: 1004; // Add this to ensure it's above the overlay
  padding-bottom: 80px; // Adjust this value based on the height of your bottom nav bar
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
  margin-bottom: 20px;
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
  margin-left: 20px;
  font-size: 0.9em;
  color: #666;
`;

const ModalHeader = styled.h2`
  color: #333;
  border-bottom: 2px solid #4CAF50;
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
  color: #4CAF50;
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

const fetchOpportunity = async (id: number): Promise<Opportunity> => {
  try {
    console.log(`Fetching opportunity with ID: ${id}`);
    const opportunityResponse = await currentRMSApi.get(`/opportunities/${id}?include[]=opportunity_items`);
    console.log('Opportunity response:', opportunityResponse.data);
    return opportunityResponse.data.opportunity;
  } catch (error) {
    console.error(`Error fetching opportunity ${id}:`, error);
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
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ItemRow = styled.div<{ isGroup: boolean; isAccessory: boolean }>`
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

const Events: React.FC<EventsProps> = ({ user }) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const fetchActivities = async (startDate: string, endDate: string): Promise<Activity[]> => {
    console.log('Fetching activities:', startDate, endDate);
    try {
      const response = await currentRMSApi.get('/activities', {
        params: {
          'q[starts_at_gteq]': startDate,
          'q[starts_at_lt]': endDate,
          'per_page': 100
        }
      });
      console.log('Activities response:', response.data);
      return response.data.activities;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  };

  const { data: activities, isLoading, error } = useQuery<Activity[], Error>(
    ['activities', today.toISOString(), nextMonth.toISOString()],
    () => fetchActivities(today.toISOString(), nextMonth.toISOString()),
    {
      enabled: !!user,
      retry: 3,
      retryDelay: 1000,
      onError: (error) => console.error('Query error:', error)
    }
  );

  const filteredActivities = useMemo(() => {
    if (!activities || !user) return [];
    return activities.filter(activity => 
      activity.participants.some(participant => 
        participant.member_name?.toLowerCase().includes(user.name?.toLowerCase() || '') ||
        participant.member_email?.toLowerCase() === user.email?.toLowerCase()
      )
    );
  }, [activities, user]);

  const handleActivityClick = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    // Fetch opportunity details here if needed
  }, []);

  const closeModal = useCallback(() => {
    setSelectedActivity(null);
    setSelectedOpportunity(null);
  }, []);

  const renderItems = useCallback((items: OpportunityItem[]) => {
    // Implement your item rendering logic here
    return items.map(item => (
      <div key={item.id}>
        {item.name} - Quantity: {item.quantity}
      </div>
    ));
  }, []);

  if (isLoading) return <div>Loading activities...</div>;
  if (error) return <div>Error loading activities: {error.message}</div>;
  if (!user) return <div>Please log in to view your activities.</div>;

  return (
    <EventsContainer>
      <EventsTitle>Your Upcoming Activities (Next 30 Days)</EventsTitle>
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
            <ModalGrid>
              <ModalSection>
                <InfoSection>
                  <Icon><FaClock /></Icon>
                  <div>
                    <p><strong>Starts:</strong> {new Date(selectedActivity.starts_at).toLocaleString()}</p>
                    <p><strong>Ends:</strong> {new Date(selectedActivity.ends_at).toLocaleString()}</p>
                  </div>
                </InfoSection>
                {selectedOpportunity && selectedOpportunity.venue && selectedOpportunity.venue.name && (
                  <InfoSection>
                    <Icon><FaBuilding /></Icon>
                    <p><strong>Venue:</strong> {selectedOpportunity.venue.name}</p>
                  </InfoSection>
                )}
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
                {selectedOpportunity.opportunity_items && selectedOpportunity.opportunity_items.length > 0 ? (
                  <ItemList>
                    {renderItems(selectedOpportunity.opportunity_items)}
                  </ItemList>
                ) : (
                  <p>No items found for this opportunity.</p>
                )}
              </ModalSection>
            )}
            <ButtonContainer>
              <CloseModalButton onClick={closeModal}>Close</CloseModalButton>
            </ButtonContainer>
          </ModalContent>
        </Modal>
      )}
    </EventsContainer>
  );
};

export default Events;
