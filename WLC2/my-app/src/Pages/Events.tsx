import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import backgroundImage from '../Background/86343.jpg';

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
  assignment_type: string;
}

interface Activity {
  id: number;
  subject: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  participants: Participant[];
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

function Events() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const response = await currentRMSApi.get('/activities', {
          params: {
            'filter[starts_at_gteq]': startDate,
            'filter[starts_at_lteq]': endDate,
            'include[]': 'participants',
            'per_page': 10,
            'sort': 'starts_at',
          }
        });
        
        console.log('API Response:', response.data);

        if (response.data.activities && Array.isArray(response.data.activities)) {
          setActivities(response.data.activities);
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

    fetchActivities();
  }, []);

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

  return (
    <EventsContainer>
      <EventsTitle>Upcoming Activities (Next 10)</EventsTitle>
      {loading ? (
        <p>Loading activities...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ActivityList>
          {activities.map((activity) => (
            <ActivityItem key={activity.id}>
              <ActivityTitle>{activity.subject}</ActivityTitle>
              <ActivityDetail><strong>Starts:</strong> {formatDateTime(activity.starts_at)}</ActivityDetail>
              <ActivityDetail><strong>Ends:</strong> {formatDateTime(activity.ends_at)}</ActivityDetail>
              {activity.location && <ActivityDetail><strong>Location:</strong> {activity.location}</ActivityDetail>}
              {activity.description && <ActivityDetail><strong>Description:</strong> {activity.description}</ActivityDetail>}
              {activity.participants && activity.participants.length > 0 && (
                <ActivityDetail>
                  <strong>Participants:</strong>
                  <ParticipantList>
                    {activity.participants.map((participant) => (
                      <li key={participant.id}>{participant.member_name}</li>
                    ))}
                  </ParticipantList>
                </ActivityDetail>
              )}
            </ActivityItem>
          ))}
        </ActivityList>
      )}
    </EventsContainer>
  );
}

export default Events;