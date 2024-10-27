import React from 'react';
import styled from 'styled-components';

const TrainingPage = styled.div`
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

const TrainingTitle = styled.h1`
  text-align: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 30px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-size: 2.5rem;
`;

const TrainingContainer = styled.div`
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
`;

const ContainerTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
`;

const Training: React.FC = () => {
  return (
    <TrainingPage>
      <TrainingTitle>Training</TrainingTitle>
      
      <TrainingContainer>
        <ContainerTitle>Manuals</ContainerTitle>
        <p>Access our comprehensive collection of manuals and documentation.</p>
        {/* Add content or links to manuals */}
      </TrainingContainer>

      <TrainingContainer>
        <ContainerTitle>Training Videos</ContainerTitle>
        <p>Watch instructional videos to enhance your skills and knowledge.</p>
        {/* Add content or links to training videos */}
      </TrainingContainer>

      <TrainingContainer>
        <ContainerTitle>How-to Guides</ContainerTitle>
        <p>Step-by-step guides for various processes and procedures.</p>
        {/* Add content or links to how-to guides */}
      </TrainingContainer>
    </TrainingPage>
  );
};

export default Training;
