import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import backgroundImage from '../Background/86343.jpg';
import { GoogleUser } from '../App';
import { FaMapMarkerAlt, FaPhone, FaClock, FaFileAlt } from 'react-icons/fa';

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
  quantity: number | string;
  opportunity_item_type_name: string;
  description?: string; // Add this line
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

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const currentRMSApi = axios.create({
  baseURL: '/.netlify/functions/current-rms-proxy',
  headers: {
    'Content-Type': 'application/json'
  },
  paramsSerializer: params => Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
});

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 80px); // Subtract the height of the bottom nav bar
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  padding: 60px 0 0; // Remove bottom padding
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: calc(100vh - 200px); // Adjust to account for top and bottom spaces
  overflow-y: auto;
  position: relative;
  margin: auto;
  margin-bottom: 100px; // Add margin at the bottom to avoid overlapping with the nav bar
`;

const CloseButton = styled.button`
  position: sticky;
  top: 10px;
  right: 10px;
  float: right;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1;
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

const Events: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [opportunities, setOpportunities] = useState<{ [id: number]: Opportunity }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [openSubCategories, setOpenSubCategories] = useState<{ [key: string]: boolean }>({});
  const [opportunityLoading, setOpportunityLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (!user || !user.name) {
      setError('User not logged in or name not available');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      const activitiesResponse = await currentRMSApi.get('/activities', {
        params: {
          'filter[starts_at_gteq]': now.toISOString(),
          'filter[starts_at_lteq]': oneMonthLater.toISOString(),
          'include[]': 'participants',
          'per_page': 100,
          'sort': 'starts_at'
        }
      });

      const filteredActivities = activitiesResponse.data.activities.filter((activity: Activity) => {
        return activity.participants.some(participant => 
          participant.member_name.toLowerCase() === user.name.toLowerCase()
        );
      });

      setActivities(filteredActivities);

      const opportunityIds = filteredActivities
        .filter((activity: Activity) => activity.regarding_type === 'Opportunity')
        .map((activity: Activity) => activity.regarding_id);

      const opportunitiesData = await Promise.all(
        opportunityIds.map((id: number) => 
          Promise.all([
            currentRMSApi.get(`/opportunities/${id}`),
            currentRMSApi.get(`/opportunities/${id}/opportunity_items`),
            currentRMSApi.get('/attachments', {
              params: { 
                'q[attachable_id_eq]': id,
                'q[attachable_type_eq]': 'Opportunity'
              }
            })
          ])
        )
      );

      const opportunitiesMap = opportunitiesData.reduce((acc, [opp, items, attachments], index) => {
        acc[opportunityIds[index]] = {
          ...opp.data.opportunity,
          opportunity_items: items.data.opportunity_items || [],
          attachments: attachments.data.attachments || []
        };
        return acc;
      }, {});

      setOpportunities(opportunitiesMap);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(`Failed to load data: ${err.response.status} ${err.response.statusText}`);
      } else {
        setError('Failed to load data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user && user.name) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const handleActivityClick = (activity: Activity) => {
    if (activity.regarding_type === 'Opportunity') {
      setOpportunityLoading(true);
      setSelectedOpportunity(opportunities[activity.regarding_id] || null);
      setOpportunityLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOpportunity(null);
  };

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const toggleSubCategory = (subCategory: string) => {
    setOpenSubCategories(prev => ({
      ...prev,
      [subCategory]: !prev[subCategory]
    }));
  };

  if (!user) {
    return <EventsContainer>Please log in to view your activities.</EventsContainer>;
  }

  return (
    <EventsContainer>
      <EventsTitle>Your Upcoming Activities</EventsTitle>
      {loading ? (
        <p>Loading your activities and opportunities...</p>
      ) : error ? (
        <p>{error}</p>
      ) : activities.length === 0 ? (
        <p>No upcoming activities found for {user?.name}.</p>
      ) : (
        <ActivityList>
          {activities.map((activity) => (
            <ActivityItem key={activity.id} onClick={() => handleActivityClick(activity)}>
              <ActivityTitle>{activity.subject}</ActivityTitle>
              <ActivityDetail><strong>Starts:</strong> {formatDateTime(activity.starts_at)}</ActivityDetail>
              <ActivityDetail><strong>Ends:</strong> {formatDateTime(activity.ends_at)}</ActivityDetail>
              {activity.location && <ActivityDetail><strong>Location:</strong> {activity.location}</ActivityDetail>}
            </ActivityItem>
          ))}
        </ActivityList>
      )}
      {selectedOpportunity && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
            <ModalHeader>{selectedOpportunity.subject}</ModalHeader>
            
            <InfoSection>
              <Icon><FaClock /></Icon>
              <div>
                <p><strong>Starts:</strong> {formatDateTime(selectedOpportunity.starts_at)}</p>
                <p><strong>Ends:</strong> {formatDateTime(selectedOpportunity.ends_at)}</p>
              </div>
            </InfoSection>
            
            <InfoSection>
              <Icon><FaMapMarkerAlt /></Icon>
              <div>
                <p><strong>Venue:</strong> {selectedOpportunity.venue?.name || 'N/A'}</p>
                {selectedOpportunity.destination && selectedOpportunity.destination.address && (
                  <>
                    <p>{selectedOpportunity.destination.address.street}</p>
                    <p>{`${selectedOpportunity.destination.address.city}, ${selectedOpportunity.destination.address.county} ${selectedOpportunity.destination.address.postcode}`}</p>
                  </>
                )}
              </div>
            </InfoSection>

            {selectedOpportunity.custom_fields && selectedOpportunity.custom_fields['on-site_contact_phone'] && (
              <InfoSection>
                <Icon><FaPhone /></Icon>
                <p><strong>Onsite Contact:</strong> {selectedOpportunity.custom_fields['on-site_contact_phone']}</p>
              </InfoSection>
            )}

            {selectedOpportunity.opportunity_items && selectedOpportunity.opportunity_items.length > 0 && (
              <div>
                {(() => {
                  let currentCategory: string | null = null;
                  let currentSubCategory: string | null = null;
                  
                  return selectedOpportunity.opportunity_items.map((item, index) => {
                    const quantity = parseFloat(item.quantity.toString().trim());
                    const isZeroQuantity = quantity === 0 || isNaN(quantity);
                    
                    let output = [];
                    
                    if (item.opportunity_item_type_name === 'Group' && item.name !== currentCategory) {
                      currentCategory = item.name;
                      currentSubCategory = null;
                      output.push(<CategoryHeader key={`cat-${item.id}`}>{item.name}</CategoryHeader>);
                    } else if (item.opportunity_item_type_name === 'Principal' && item.name !== currentSubCategory) {
                      currentSubCategory = item.name;
                      output.push(
                        <SubCategoryHeader 
                          key={`subcat-${item.id}`}
                          onClick={() => toggleSubCategory(item.name)}
                          className={openSubCategories[item.name] ? 'open' : ''}
                        >
                          {item.name}
                        </SubCategoryHeader>
                      );
                    }
                    
                    if (item.opportunity_item_type_name !== 'Group') {
                      output.push(
                        <AccessoryList key={`acc-${item.id}`} className={openSubCategories[currentSubCategory || ''] ? 'open' : ''}>
                          <AccessoryItem>
                            <ItemName isZeroQuantity={isZeroQuantity}>{item.name}</ItemName>
                            {!isZeroQuantity && <span> - Quantity: {item.quantity}</span>}
                            {item.description && (
                              <PrincipalDescription>{item.description}</PrincipalDescription>
                            )}
                          </AccessoryItem>
                        </AccessoryList>
                      );
                    }
                    
                    return output;
                  });
                })()}
              </div>
            )}

            <CategoryHeader>Attachments</CategoryHeader>
            {selectedOpportunity.attachments && selectedOpportunity.attachments.length > 0 ? (
              <DocumentList>
                {selectedOpportunity.attachments.map((attachment) => (
                  <DocumentItem key={attachment.id}>
                    <Icon><FaFileAlt /></Icon>
                    <DocumentLink 
                      href={attachment.attachment_url}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {attachment.name || attachment.attachment_file_name}
                    </DocumentLink>
                  </DocumentItem>
                ))}
              </DocumentList>
            ) : (
              <p>No attachments associated with this opportunity.</p>
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
