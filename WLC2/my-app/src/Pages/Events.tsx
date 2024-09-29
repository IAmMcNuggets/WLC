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
  max-width: 800px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const OpportunityList = styled.ul`
  list-style-type: none;
  padding: 0;
  width: 100%;
`;

const OpportunityItem = styled.li`
  background-color: #f0f0f0;
  border-radius: 5px;
  margin-bottom: 15px;
  padding: 20px;
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

interface Opportunity {
  id: number;
  subject: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status_name: string;
  member: {
    name: string;
  };
  venue: {
    name: string;
  } | null;
}

// Create an axios instance for Current RMS API
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
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const url = `${currentRMSApi.defaults.baseURL}/opportunities`;
        console.log('Requesting URL:', url);

        const response = await currentRMSApi.get('/opportunities', {
          params: {
            'filter[starts_at_gteq]': startDate,
            'filter[starts_at_lteq]': endDate,
            'filter[status]': '0,1,5,20', // Open, Provisional, Reserved, Active
            'include[]': 'member,venue',
            'per_page': 100, // Adjust as needed
          }
        });

        console.log('Response:', response.data);
        setOpportunities(response.data.opportunities);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch opportunities:', err);
        setError('Failed to load opportunities. Please try again later.');
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <EventsContainer>
      <EventsTitle>Upcoming Opportunities</EventsTitle>
      <EventsCard>
        {loading ? (
          <LoadingMessage>Loading opportunities...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : opportunities.length > 0 ? (
          <OpportunityList>
            {opportunities.map((opportunity) => (
              <OpportunityItem key={opportunity.id}>
                <h3>{opportunity.subject}</h3>
                <p><strong>Description:</strong> {opportunity.description}</p>
                <p><strong>Start:</strong> {formatDate(opportunity.starts_at)}</p>
                <p><strong>End:</strong> {formatDate(opportunity.ends_at)}</p>
                <p><strong>Status:</strong> {opportunity.status_name}</p>
                <p><strong>Client:</strong> {opportunity.member.name}</p>
                {opportunity.venue && <p><strong>Venue:</strong> {opportunity.venue.name}</p>}
              </OpportunityItem>
            ))}
          </OpportunityList>
        ) : (
          <p>No upcoming opportunities found for the next month.</p>
        )}
      </EventsCard>
    </EventsContainer>
  );
}

export default Events;