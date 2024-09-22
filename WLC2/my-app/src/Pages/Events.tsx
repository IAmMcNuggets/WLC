import React from 'react';
import styled from 'styled-components';

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
  color: black; // Adjust color if needed for visibility against the background
`;

function Events() {
  return (
    <EventsContainer>
      <EventsTitle>Events</EventsTitle>
      {/* Your other events content goes here */}
    </EventsContainer>
  );
}

export default Events;