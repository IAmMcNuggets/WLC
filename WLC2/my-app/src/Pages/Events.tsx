import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const EventsContainer = styled.div`
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
`;

const EventsTitle = styled.h2`
  color: #333;
  text-align: center;
  margin-bottom: 30px;
`;

const EventsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const EventCard = styled.div`
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const EventHeader = styled.div`
  background-color: #4CAF50;
  color: white;
  padding: 15px;
  font-weight: bold;
`;

const EventBody = styled.div`
  padding: 15px;
`;

const EventDate = styled.p`
  color: #666;
  font-size: 0.9em;
  margin-bottom: 10px;
`;

const ExpandButton = styled.button`
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #45a049;
  }
`;

const EventDetails = styled.div`
  margin-top: 15px;
  border-top: 1px solid #ddd;
  padding-top: 15px;
`;

interface Participant {
  id: number;
  member_name: string;
  assignment_type: string;
}

interface Opportunity {
  id: number;
  subject: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status_name: string;
  member_id: number;
  venue_id: number | null;
  custom_fields: {
    project_manager?: string;
    dress_code?: string;
    'on-site_contact_phone'?: string;
    event_start_time?: string;
    event_end_time?: string;
  };
  participants?: Participant[];
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
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await currentRMSApi.get('/opportunities', {
          params: {
            'filter[starts_at_gteq]': startDate,
            'filter[starts_at_lteq]': endDate,
            'filter[status]': '0,1,5,20',
            'include[]': 'participants',
            'per_page': 100,
          }
        });
        
        if (response.data.opportunities && Array.isArray(response.data.opportunities)) {
          setOpportunities(response.data.opportunities);
        } else {
          setError('Unexpected API response format');
        }

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
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <EventsContainer>
      <EventsTitle>Upcoming Opportunities</EventsTitle>
      {loading ? (
        <p>Loading opportunities...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <EventsList>
          {opportunities.map((opportunity) => (
            <EventCard key={opportunity.id}>
              <EventHeader>{opportunity.subject}</EventHeader>
              <EventBody>
                <EventDate>{formatDate(opportunity.starts_at)} - {formatDate(opportunity.ends_at)}</EventDate>
                <ExpandButton onClick={() => toggleExpand(opportunity.id)}>
                  {expandedId === opportunity.id ? 'Hide Details' : 'Show Details'}
                </ExpandButton>
                {expandedId === opportunity.id && (
                  <EventDetails>
                    <p><strong>Description:</strong> {opportunity.description || 'No description provided'}</p>
                    <p><strong>Status:</strong> {opportunity.status_name}</p>
                    {opportunity.custom_fields && (
                      <>
                        <p><strong>Project Manager:</strong> {opportunity.custom_fields.project_manager}</p>
                        <p><strong>Dress Code:</strong> {opportunity.custom_fields.dress_code}</p>
                        <p><strong>On-site Contact:</strong> {opportunity.custom_fields['on-site_contact_phone'] || 'Not provided'}</p>
                        <p><strong>Event Time:</strong> {opportunity.custom_fields.event_start_time || 'Not provided'} - {opportunity.custom_fields.event_end_time || 'Not provided'}</p>
                      </>
                    )}
                    {opportunity.participants && opportunity.participants.length > 0 && (
                      <div>
                        <strong>Participants:</strong>
                        <ul>
                          {opportunity.participants.map((participant) => (
                            <li key={participant.id}>
                              {participant.member_name} - {participant.assignment_type}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </EventDetails>
                )}
              </EventBody>
            </EventCard>
          ))}
        </EventsList>
      )}
    </EventsContainer>
  );
}

export default Events;