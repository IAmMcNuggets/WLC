import React from 'react';
import styled from 'styled-components';
import { GoogleUser } from '../App'; // Import the GoogleUser type

// Define the Props interface
interface Props {
  user: GoogleUser | null;
}

const TrainingContainer = styled.div`
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

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 90%;
  max-width: 400px;
`;

const TrainingButton = styled.a`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-decoration: none;
  color: #444;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0,0,0,0.2);
  }
`;

// Update the component declaration to use the Props interface
const Training: React.FC<Props> = ({ user }) => {
  return (
    <TrainingContainer>
      <TrainingTitle>Training Materials</TrainingTitle>
      <ButtonContainer>
        <TrainingButton 
          href="https://drive.google.com/drive/folders/1NXsFR1TRTqLCRA5FvlOrrkco8pmpE7Yy?usp=sharing" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          How-To Guides
        </TrainingButton>
        <TrainingButton 
          href="https://drive.google.com/drive/folders/1n880Sx9TwfN3lUWPUQpOTBsQsW28wEwF?usp=sharing" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Manuals
        </TrainingButton>
        <TrainingButton 
          href="https://drive.google.com/drive/folders/1mUIROETA4DGH8XXhRui872cion9A801o?usp=sharing" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          Training Videos
        </TrainingButton>
      </ButtonContainer>
    </TrainingContainer>
  );
};

export default Training;
