import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { getAuthUrl, getAccessToken } from '../utils/currentRmsAuth';

const EventsContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-image: url(${require('../Background/86343.jpg')});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
`;

const EventsTitle = styled.h1`
  text-align: center;
  width: 100%;
  margin-top: 20px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const EventList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const EventItem = styled.li`
  background-color: rgba(255, 255, 255, 0.8);
  margin: 10px 0;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

interface Event {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
}

function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticate = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          const tokenData = await getAccessToken(code);
          localStorage.setItem('currentRmsToken', tokenData.access_token);
          fetchEvents(tokenData.access_token);
        } catch (err) {
          setError('Authentication failed');
          setLoading(false);
        }
      } else {
        const token = localStorage.getItem('currentRmsToken');
        if (token) {
          fetchEvents(token);
        } else {
          setLoading(false);
        }
      }
    };

    authenticate();
  }, []);

  const fetchEvents = async (token: string) => {
    try {
      const response = await axios.get('https://api.current-rms.com/api/v1/opportunities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-SUBDOMAIN': process.env.REACT_APP_CURRENT_RMS_SUBDOMAIN
        }
      });
      setEvents(response.data.opportunities);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = getAuthUrl();
  };

  if (loading) return <EventsTitle>Loading...</EventsTitle>;
  if (error) return <EventsTitle>{error}</EventsTitle>;

  if (events.length === 0) {
    return (
      <EventsContainer>
        <EventsTitle>No events found or not authenticated</EventsTitle>
        <button onClick={handleLogin}>Log in with Current RMS</button>
      </EventsContainer>
    );
  }

  return (
    <EventsContainer>
      <EventsTitle>Upcoming Events</EventsTitle>
      <EventList>
        {events.map((event) => (
          <EventItem key={event.id}>
            <h3>{event.name}</h3>
            <p>Starts: {new Date(event.starts_at).toLocaleString()}</p>
            <p>Ends: {new Date(event.ends_at).toLocaleString()}</p>
          </EventItem>
        ))}
      </EventList>
    </EventsContainer>
  );
}

export default Events;