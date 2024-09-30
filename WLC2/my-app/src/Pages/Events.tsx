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

const EventsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const EventCard = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const EventHeader = styled.div`
  background-color: #1e88e5; // Changed to a blue color
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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ModalBody = styled.div`
  flex-grow: 1;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  background-color: #1e88e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  align-self: center;

  &:hover {
    background-color: #1565c0;
  }
`;

const ResourceList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const ResourceItem = styled.li`
  margin-bottom: 10px;
`;

interface Participant {
  id: number;
  member_id: number;
  member_name: string;
  assignment_type: string;
}

interface OpportunityItem {
  id: number;
  item_id: number;
  name: string;
  quantity: number;
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
  opportunity_items?: OpportunityItem[];
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
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

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
            'include[]': ['participants', 'opportunity_items'],
            'per_page': 100,
          }
        });
        
        console.log('API Response:', response.data); // Log the API response

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

  const openModal = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  const closeModal = () => {
    setSelectedOpportunity(null);
  };

  return (
    <EventsContainer>
      <EventsTitle>Upcoming Opportunities</EventsTitle>
      {loading ? (
        <p>Loading Events...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <EventsList>
          {opportunities.map((opportunity) => (
            <EventCard key={opportunity.id} onClick={() => openModal(opportunity)}>
              <EventHeader>{opportunity.subject}</EventHeader>
              <EventBody>
                <EventDate>{formatDate(opportunity.starts_at)} - {formatDate(opportunity.ends_at)}</EventDate>
              </EventBody>
            </EventCard>
          ))}
        </EventsList>
      )}
      {selectedOpportunity && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalBody>
              <h2>{selectedOpportunity.subject}</h2>
              <p><strong>Date:</strong> {formatDate(selectedOpportunity.starts_at)} - {formatDate(selectedOpportunity.ends_at)}</p>
              <p><strong>Description:</strong> {selectedOpportunity.description || 'No description provided'}</p>
              <p><strong>Status:</strong> {selectedOpportunity.status_name}</p>
              {selectedOpportunity.custom_fields && (
                <>
                  <p><strong>Project Manager:</strong> {selectedOpportunity.custom_fields.project_manager}</p>
                  <p><strong>Dress Code:</strong> {selectedOpportunity.custom_fields.dress_code}</p>
                  <p><strong>On-site Contact:</strong> {selectedOpportunity.custom_fields['on-site_contact_phone'] || 'Not provided'}</p>
                  <p><strong>Event Time:</strong> {selectedOpportunity.custom_fields.event_start_time || 'Not provided'} - {selectedOpportunity.custom_fields.event_end_time || 'Not provided'}</p>
                </>
              )}
              {selectedOpportunity.participants && selectedOpportunity.participants.length > 0 && (
                <div>
                  <strong>Associated Members:</strong>
                  <ul>
                    {selectedOpportunity.participants.map((participant) => (
                      <li key={participant.id}>
                        {participant.member_name} - {participant.assignment_type}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedOpportunity.opportunity_items && selectedOpportunity.opportunity_items.length > 0 && (
                <div>
                  <strong>Allocated Resources:</strong>
                  <ul>
                    {selectedOpportunity.opportunity_items.map((item) => (
                      <li key={item.id}>
                        {item.name} - Quantity: {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ModalBody>
            <CloseButton onClick={closeModal}>Close</CloseButton>
          </ModalContent>
        </Modal>
      )}
    </EventsContainer>
  );
}

export default Events;