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

interface Opportunity {
  id: number;
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  opportunity_status: {
    name: string;
  };
  opportunity_type: {
    name: string;
  };
  // Add other fields as needed
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
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

function Events() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [opportunityLoading, setOpportunityLoading] = useState(false);

  useEffect(() => {
    // Get the user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      try {
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Fetch activities for the next 30 days

        const response = await currentRMSApi.get('/activities', {
          params: {
            'filter[starts_at_gteq]': startDate,
            'filter[starts_at_lteq]': endDate,
            'include[]': 'participants',
            'per_page': 100, // Increase this if needed to ensure we get all relevant activities
            'sort': 'starts_at'
          }
        });
        
        console.log('API Response:', response.data);

        if (response.data.activities && Array.isArray(response.data.activities)) {
          const filteredActivities = response.data.activities.filter((activity: Activity) => 
            activity.participants.some(participant => 
              participant.member_name.toLowerCase().includes(user.name.toLowerCase())
            )
          );
          setActivities(filteredActivities);
        } else {
          setError('Unexpected API response format');
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError('Failed to load activities. Please try again later.');
        setLoading(false);
      }
    };

    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchOpportunityDetails = async (regardingId: number) => {
    setOpportunityLoading(true);
    try {
      const response = await currentRMSApi.get(`/opportunities/${regardingId}`);
      console.log('Opportunity details:', response.data);
      if (response.data && response.data.opportunity) {
        setSelectedOpportunity(response.data.opportunity);
      } else {
        setError('Unexpected API response format for opportunity details');
      }
    } catch (err) {
      console.error('Failed to fetch opportunity details:', err);
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
                <h2>{selectedOpportunity.name}</h2>
                <p><strong>Description:</strong> {selectedOpportunity.description}</p>
                <p><strong>Starts:</strong> {formatDateTime(selectedOpportunity.starts_at)}</p>
                <p><strong>Ends:</strong> {formatDateTime(selectedOpportunity.ends_at)}</p>
                <p><strong>Status:</strong> {selectedOpportunity.opportunity_status.name}</p>
                <p><strong>Type:</strong> {selectedOpportunity.opportunity_type.name}</p>
                {/* Add more opportunity details here as needed */}
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </EventsContainer>
  );
}

export default Events;