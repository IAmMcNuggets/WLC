import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import backgroundImage from '../Background/86343.jpg';
import { GoogleUser } from '../App';

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
  baseURL: `${corsProxy}https://api.current-rms.com/api/v1`,
  headers: {
    'X-SUBDOMAIN': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN,
    'X-AUTH-TOKEN': process.env.REACT_APP_CURRENT_RMS_API_KEY,
    'Content-Type': 'application/json'
  }
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
  color: #333;
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

const Events: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [openSubCategories, setOpenSubCategories] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Get the user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchActivities = async () => {
    if (!user || !user.name) {
      setError('User not logged in or name not available');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      const response = await currentRMSApi.get('/activities', {
        params: {
          'filter[starts_at_gteq]': now.toISOString(),
          'filter[starts_at_lteq]': oneMonthLater.toISOString(),
          'include[]': 'participants',
          'per_page': 100,
          'sort': 'starts_at'
        }
      });

      console.log('API Response:', response.data);

      // Filter activities based on the logged-in user's name
      const filteredActivities = response.data.activities.filter((activity: Activity) => {
        return activity.participants.some(participant => 
          participant.member_name.toLowerCase() === user.name.toLowerCase()
        );
      });

      console.log('Filtered Activities:', filteredActivities);
      setActivities(filteredActivities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError('Failed to load activities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.name) {
      fetchActivities();
    }
  }, [user]);

  const fetchOpportunityDetails = async (regardingId: number) => {
    setOpportunityLoading(true);
    try {
      const [opportunityResponse, itemsResponse, attachmentsResponse] = await Promise.all([
        currentRMSApi.get(`/opportunities/${regardingId}`),
        currentRMSApi.get(`/opportunities/${regardingId}/opportunity_items`),
        currentRMSApi.get('/attachments', {
          params: { 
            'q[attachable_id_eq]': regardingId,
            'q[attachable_type_eq]': 'Opportunity'
          }
        })
      ]);

      console.log('Opportunity API Response:', opportunityResponse.data);
      console.log('Opportunity Items API Response:', itemsResponse.data);
      console.log('Attachments API Response:', attachmentsResponse.data);

      if (opportunityResponse.data && opportunityResponse.data.opportunity) {
        const opportunityWithItemsAndAttachments = {
          ...opportunityResponse.data.opportunity,
          opportunity_items: itemsResponse.data.opportunity_items || [],
          attachments: attachmentsResponse.data.attachments || []
        };
        console.log('Combined Opportunity with Items and Attachments:', opportunityWithItemsAndAttachments);
        setSelectedOpportunity(opportunityWithItemsAndAttachments);
      } else {
        console.error('Unexpected API response format for opportunity details');
        setError('Unexpected API response format for opportunity details');
      }
    } catch (err) {
      console.error('Failed to fetch opportunity details:', err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          console.error('Error response:', err.response.data);
          console.error('Error status:', err.response.status);
        } else if (err.request) {
          console.error('Error request:', err.request);
        } else {
          console.error('Error message:', err.message);
        }
      } else if (err instanceof Error) {
        console.error('Error message:', err.message);
      } else {
        console.error('Unknown error:', err);
      }
      setError('Failed to load opportunity details. Please try again later.');
    } finally {
      setOpportunityLoading(false);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.regarding_type === 'Opportunity') {
      fetchOpportunityDetails(activity.regarding_id);
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
        <p>Loading activities...</p>
      ) : error ? (
        <p>{error}</p>
      ) : activities.length === 0 ? (
        <p>No upcoming activities found for {user.name}.</p>
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
            {opportunityLoading ? (
              <p>Loading opportunity details...</p>
            ) : (
              <>
                <h2>{selectedOpportunity.subject}</h2>
                <p><strong>Starts:</strong> {formatDateTime(selectedOpportunity.starts_at)}</p>
                <p><strong>Ends:</strong> {formatDateTime(selectedOpportunity.ends_at)}</p>
                <p><strong>Venue:</strong> {selectedOpportunity.venue?.name || 'N/A'}</p>
                
                {selectedOpportunity.destination && selectedOpportunity.destination.address && (
                  <>
                    <h3>Destination Address:</h3>
                    <p>{selectedOpportunity.destination.address.street}</p>
                    <p>{`${selectedOpportunity.destination.address.city}, ${selectedOpportunity.destination.address.county} ${selectedOpportunity.destination.address.postcode}`}</p>
                  </>
                )}

                {selectedOpportunity.custom_fields && selectedOpportunity.custom_fields['on-site_contact_phone'] && (
                  <p><strong>Onsite Contact Phone:</strong> {selectedOpportunity.custom_fields['on-site_contact_phone']}</p>
                )}

                <h3>Items:</h3>
                {selectedOpportunity.opportunity_items && selectedOpportunity.opportunity_items.length > 0 ? (
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
                          output.push(
                            <AccessoryList 
                              key={`acclist-${item.id}`} 
                              className={openSubCategories[item.name] ? 'open' : ''}
                            >
                              {selectedOpportunity.opportunity_items
                                .filter(subItem => 
                                  subItem.opportunity_item_type_name === 'Accessory' && 
                                  selectedOpportunity.opportunity_items.indexOf(subItem) > index &&
                                  (selectedOpportunity.opportunity_items[selectedOpportunity.opportunity_items.indexOf(subItem) - 1].opportunity_item_type_name === 'Principal' ? 
                                    selectedOpportunity.opportunity_items[selectedOpportunity.opportunity_items.indexOf(subItem) - 1].name === currentSubCategory : 
                                    true
                                  )
                                )
                                .map(accessory => (
                                  <AccessoryItem key={`acc-${accessory.id}`}>
                                    <ItemName as="span" isZeroQuantity={parseFloat(accessory.quantity.toString().trim()) === 0 || isNaN(parseFloat(accessory.quantity.toString().trim()))}>
                                      {accessory.name}
                                    </ItemName>
                                    : {accessory.quantity}
                                  </AccessoryItem>
                                ))
                              }
                            </AccessoryList>
                          );
                        }
                        
                        return output;
                      });
                    })()}
                  </div>
                ) : (
                  <p>No items associated with this opportunity.</p>
                )}

                <h3>Attachments:</h3>
                {selectedOpportunity.attachments && selectedOpportunity.attachments.length > 0 ? (
                  <DocumentList>
                    {selectedOpportunity.attachments.map((attachment) => (
                      <DocumentItem key={attachment.id}>
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
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </EventsContainer>
  );
};

export default Events;
