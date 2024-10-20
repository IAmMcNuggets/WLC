import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import backgroundImage from '../Background/86343.jpg';
import { GoogleUser } from '../App';
import { FaMapMarkerAlt, FaPhone, FaClock, FaFileAlt } from 'react-icons/fa';
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

interface Attachment {
  id: number;
  name: string;
  attachment_file_name: string;
  attachment_url: string;
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
  opportunity_documents: OpportunityDocument[];
  attachments: Attachment[];
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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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

const DocumentList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const DocumentItem = styled.li`
  margin-bottom: 8px;
`;

const DocumentLink = styled.a`
  color: #4CAF50;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
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
  font-size: 0.9rem; // Slightly smaller font size

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

const ItemName = styled.td<{ isZeroQuantity: boolean }>`
  font-weight: ${props => props.isZeroQuantity ? 'bold' : 'normal'};
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

const fetchActivities = async (): Promise<Activity[]> => {
  const response = await currentRMSApi.get('/activities');
  return response.data.activities;
};

const fetchOpportunity = async (id: number): Promise<Opportunity> => {
  const response = await currentRMSApi.get(`/opportunities/${id}?include[]=opportunity_items`);
  console.log('Fetched opportunity:', response.data.opportunity);
  return response.data.opportunity;
};

const Events: React.FC<EventsProps> = ({ user }) => {
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useQuery<Activity[], Error>('activities', fetchActivities);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const { data: opportunity, isLoading: opportunityLoading, error: opportunityError } = useQuery<Opportunity, Error>(
    ['opportunity', selectedActivity?.regarding_id],
    () => fetchOpportunity(selectedActivity?.regarding_id as number),
    { 
      enabled: !!selectedActivity && selectedActivity.regarding_type === 'Opportunity',
      onSuccess: (data) => {
        console.log('Opportunity data set:', data);
        setSelectedOpportunity(data);
      }
    }
  );

  useEffect(() => {
    if (opportunity) {
      setSelectedOpportunity(opportunity);
    }
  }, [opportunity]);

  const filteredActivities = useCallback(() => {
    if (!activities || !user) return [];

    console.log('All activities:', activities);
    console.log('Current user:', user);

    return activities.filter(activity => {
      const isParticipant = activity.participants.some(participant => {
        const participantNameMatch = user.name && participant.member_name
          ? participant.member_name.toLowerCase().includes(user.name.toLowerCase())
          : false;
        const participantEmailMatch = user.email && participant.member_email
          ? participant.member_email.toLowerCase() === user.email.toLowerCase()
          : false;
        
        console.log('Comparing:', {
          activitySubject: activity.subject,
          participantName: participant.member_name,
          userName: user.name,
          participantEmail: participant.member_email,
          userEmail: user.email,
          nameMatch: participantNameMatch,
          emailMatch: participantEmailMatch
        });

        return participantNameMatch || participantEmailMatch;
      });

      console.log(`Activity ${activity.subject} is ${isParticipant ? '' : 'not '}a match`);
      return isParticipant;
    });
  }, [activities, user]);

  const userActivities = filteredActivities();

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const closeModal = () => {
    setSelectedActivity(null);
  };

  const [openPrincipals, setOpenPrincipals] = useState<{ [key: number]: boolean }>({});

  const togglePrincipal = (id: number) => {
    setOpenPrincipals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderItems = (items: OpportunityItem[]) => {
    let currentGroup: OpportunityItem | null = null;
    let currentPrincipal: OpportunityItem | null = null;

    return items.map((item, index) => {
      if (item.opportunity_item_type_name === 'Group') {
        currentGroup = item;
        return <CategoryHeader key={item.id}>{item.name}</CategoryHeader>;
      } else if (item.opportunity_item_type_name === 'Principal') {
        currentPrincipal = item;
        return (
          <React.Fragment key={item.id}>
            <SubCategoryHeader 
              className={openPrincipals[item.id] ? 'open' : ''}
              onClick={() => togglePrincipal(item.id)}
            >
              {item.name} - Quantity: {item.quantity}, Price: {item.price}
            </SubCategoryHeader>
            <PrincipalDescription>{item.description}</PrincipalDescription>
          </React.Fragment>
        );
      } else if (item.opportunity_item_type_name === 'Accessory' && currentPrincipal) {
        return (
          <AccessoryList key={item.id} className={openPrincipals[currentPrincipal.id] ? 'open' : ''}>
            <AccessoryItem>
              {item.name} - Quantity: {item.quantity}, Price: {item.price}
            </AccessoryItem>
          </AccessoryList>
        );
      }
      return null;
    });
  };

  if (activitiesLoading) return <div>Loading activities...</div>;
  if (activitiesError) return <div>An error occurred: {activitiesError.message}</div>;
  if (!user) return <div>Please log in to view your activities.</div>;

  return (
    <EventsContainer>
      <EventsTitle>Your Upcoming Activities</EventsTitle>
      {userActivities.length === 0 ? (
        <p>No upcoming activities found for {user.name || 'you'}.</p>
      ) : (
        <ActivityList>
          {userActivities.map((activity) => (
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
                {selectedActivity.location && (
                  <InfoSection>
                    <Icon><FaMapMarkerAlt /></Icon>
                    <p><strong>Location:</strong> {selectedActivity.location}</p>
                  </InfoSection>
                )}
              </ModalSection>
              <ModalSection>
                <h3>Participants:</h3>
                <ParticipantList>
                  {selectedActivity.participants.map((participant, index) => (
                    <li key={index}>{participant.member_name} ({participant.member_email})</li>
                  ))}
                </ParticipantList>
              </ModalSection>
            </ModalGrid>
            {selectedActivity.description && (
              <ModalSection>
                <h3>Description:</h3>
                <p>{selectedActivity.description}</p>
              </ModalSection>
            )}
            {opportunityLoading ? (
              <p>Loading opportunity details...</p>
            ) : opportunityError ? (
              <p>Error loading opportunity details: {opportunityError.message}</p>
            ) : selectedOpportunity ? (
              <ModalSection>
                <h3>Opportunity Details:</h3>
                <p><strong>Number:</strong> {selectedOpportunity.number}</p>
                <p><strong>Status:</strong> {selectedOpportunity.status_name}</p>
                {selectedOpportunity.venue && (
                  <p><strong>Venue:</strong> {selectedOpportunity.venue.name}</p>
                )}
                <h4>Items:</h4>
                {selectedOpportunity.opportunity_items && selectedOpportunity.opportunity_items.length > 0 ? (
                  <ItemTable>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Type</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOpportunity.opportunity_items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.opportunity_item_type_name}</td>
                          <td>{item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </ItemTable>
                ) : (
                  <p>No items found for this opportunity.</p>
                )}
              </ModalSection>
            ) : (
              <p>No opportunity details available.</p>
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
