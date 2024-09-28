import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const EventsContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-image: url(${require('../Background/86343.jpg')});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
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

const EventsCard = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const EventList = styled.ul`
  list-style-type: none;
  padding: 0;
  width: 100%;
`;

const EventItem = styled.li`
  background-color: #f0f0f0;
  border-radius: 5px;
  margin-bottom: 10px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LoadingMessage = styled.p`
  color: #666;
  font-style: italic;
`;

const ErrorMessage = styled.p`
  color: #D8000C;
  background-color: #FFBABA;
  border-radius: 5px;
  padding: 10px;
  margin-top: 20px;
`;

interface Event {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get('/api/current-rms/events');
        setEvents(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again later.');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <EventsContainer>
      <EventsTitle>Upcoming Events</EventsTitle>
      <EventsCard>
        {loading ? (
          <LoadingMessage>Loading events...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : events.length > 0 ? (
          <EventList>
            {events.map((event) => (
              <EventItem key={event.id}>
                <h3>{event.name}</h3>
                <p>Start: {formatDate(event.start_date)}</p>
                <p>End: {formatDate(event.end_date)}</p>
              </EventItem>
            ))}
          </EventList>
        ) : (
          <p>No upcoming events found.</p>
        )}
      </EventsCard>
    </EventsContainer>
  );
}

export default Events;