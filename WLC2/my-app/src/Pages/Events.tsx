import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const EventsContainer = styled.div`
  padding: 20px;
`;

const EventsTitle = styled.h2`
  color: #333;
`;

const EventsList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const EventItem = styled.li`
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  padding: 10px;
  cursor: pointer;
`;

const EventSummary = styled.div`
  display: flex;
  justify-content: space-between;
`;

const EventDetails = styled.div`
  margin-top: 10px;
  border-top: 1px solid #ddd;
  padding-top: 10px;
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
      <EventsTitle>Upcoming Opportunities (Next 30 Days)</EventsTitle>
      {loading ? (
        <p>Loading opportunities...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <EventsList>
          {opportunities.map((opportunity) => (
            <EventItem key={opportunity.id} onClick={() => toggleExpand(opportunity.id)}>
              <EventSummary>
                <span>{opportunity.subject}</span>
                <span>{formatDate(opportunity.starts_at)} - {formatDate(opportunity.ends_at)}</span>
              </EventSummary>
              {expandedId === opportunity.id && (
                <EventDetails>
                  <p><strong>Description:</strong> {opportunity.description || 'No description provided'}</p>
                  <p><strong>Status:</strong> {opportunity.status_name}</p>
                  <p><strong>Member ID:</strong> {opportunity.member_id}</p>
                  <p><strong>Venue ID:</strong> {opportunity.venue_id}</p>
                  {opportunity.custom_fields && (
                    <>
                      <p><strong>Project Manager:</strong> {opportunity.custom_fields.project_manager}</p>
                      <p><strong>Dress Code:</strong> {opportunity.custom_fields.dress_code}</p>
                      <p><strong>On-site Contact Phone:</strong> {opportunity.custom_fields['on-site_contact_phone'] || 'Not provided'}</p>
                      <p><strong>Event Start Time:</strong> {opportunity.custom_fields.event_start_time || 'Not provided'}</p>
                      <p><strong>Event End Time:</strong> {opportunity.custom_fields.event_end_time || 'Not provided'}</p>
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
            </EventItem>
          ))}
        </EventsList>
      )}
    </EventsContainer>
  );
}

export default Events;