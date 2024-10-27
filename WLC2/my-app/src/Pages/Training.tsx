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

const TrainingContainer = styled.a`
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
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
      
      <TrainingContainer href="https://drive.google.com/drive/folders/1n880Sx9TwfN3lUWPUQpOTBsQsW28wEwF?usp=sharing" target="_blank" rel="noopener noreferrer">
        <ContainerTitle>Manuals</ContainerTitle>
        <p>Access our comprehensive collection of manuals and documentation.</p>
      </TrainingContainer>

      <TrainingContainer href="https://drive.google.com/drive/folders/1mUIROETA4DGH8XXhRui872cion9A801o?usp=sharing" target="_blank" rel="noopener noreferrer">
        <ContainerTitle>Training Videos</ContainerTitle>
        <p>Watch instructional videos to enhance your skills and knowledge.</p>
      </TrainingContainer>

      <TrainingContainer href="https://drive.google.com/drive/folders/1NXsFR1TRTqLCRA5FvlOrrkco8pmpE7Yy?usp=sharing" target="_blank" rel="noopener noreferrer">
        <ContainerTitle>How-to Guides</ContainerTitle>
        <p>Step-by-step guides for various processes and procedures.</p>
      </TrainingContainer>
    </TrainingPage>
  );
};

export default Training;
