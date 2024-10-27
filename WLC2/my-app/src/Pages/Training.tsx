import React from 'react';
import styled from 'styled-components';

const TrainingContainer = styled.div`
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  margin: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const TrainingTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  margin-bottom: 20px;
`;

const Training: React.FC = () => {
  return (
    <TrainingContainer>
      <TrainingTitle>Training</TrainingTitle>
      {/* Add your training content here */}
      <p>Welcome to the Training page. Content coming soon!</p>
    </TrainingContainer>
  );
};

export default Training;
