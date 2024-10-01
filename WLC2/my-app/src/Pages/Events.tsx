import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import backgroundImage from '../Background/86343.jpg';

const EventsContainer = styled.div`
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
  min-height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
`;

const EventsTitle = styled.h1`
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
`;

const ActivityItem = styled.li`
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
  padding: 12px;
`;

const ActivityTitle = styled.h3`
  margin: 0 0 8px 0;
  color: #333;
`;

const ActivityDetail = styled.p`
  margin: 4px 0;
  font-size: 0.9em;
`;

interface Activity {
  id: number;
  subject: string;
  description: string;
  activity_type_name: string;
  due_at: string;
  completed_at: string | null;
  opportunity_number: string;
  opportunity_subject: string;
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
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await currentRMSApi.get('/activities', {
          params: {
            'filter[due_at_gteq]': startDate,
            'filter[due_at_lteq]': endDate,
            'include[]': ['opportunity'],
            'per_page': 100,
          }
        });
        
        console.log('API Response:', response.data);

        if (response.data.activities && Array.isArray(response.data.activities)) {
          const formattedActivities = response.data.activities.map((activity: any) => ({
            id: activity.id,
            subject: activity.subject,
            description: activity.description,
            activity_type_name: activity.activity_type_name,
            due_at: activity.due_at,
            completed_at: activity.completed_at,
            opportunity_number: activity.opportunity?.number || 'N/A',
            opportunity_subject: activity.opportunity?.subject || 'N/A',
          }));
          setActivities(formattedActivities);
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

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <EventsContainer>
      <EventsTitle>Upcoming Activities (Next 7 Days)</EventsTitle>
      {loading ? (
        <p>Loading activities...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ActivityList>
          {activities.map((activity) => (
            <ActivityItem key={activity.id}>
              <ActivityTitle>{activity.subject}</ActivityTitle>
              <ActivityDetail><strong>Type:</strong> {activity.activity_type_name}</ActivityDetail>
              <ActivityDetail><strong>Due:</strong> {formatDate(activity.due_at)}</ActivityDetail>
              <ActivityDetail><strong>Status:</strong> {activity.completed_at ? 'Completed' : 'Pending'}</ActivityDetail>
              <ActivityDetail><strong>Opportunity:</strong> {activity.opportunity_number} - {activity.opportunity_subject}</ActivityDetail>
              {activity.description && <ActivityDetail><strong>Description:</strong> {activity.description}</ActivityDetail>}
            </ActivityItem>
          ))}
        </ActivityList>
      )}
    </EventsContainer>
  );
}

export default Events;