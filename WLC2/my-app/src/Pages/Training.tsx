import React, { useState } from 'react';
import styled from 'styled-components';
import { PageContainer } from '../components/CommonStyles';
import { GoogleUser } from '../App';

// Define the structure for training materials with public links
const TRAINING_MATERIALS: FileItem[] = [
  {
    id: '1',
    name: 'How-to Guides',
    type: 'folder' as const,
    link: 'https://drive.google.com/drive/folders/1NXsFR1TRTqLCRA5FvlOrrkco8pmpE7Yy?usp=drive_link',
    contents: []
  },
  {
    id: '2',
    name: 'Manuals',
    type: 'folder' as const,
    link: 'https://drive.google.com/drive/folders/1n880Sx9TwfN3lUWPUQpOTBsQsW28wEwF?usp=drive_link',
    contents: []
  },
  {
    id: '3',
    name: 'Training Videos',
    type: 'folder' as const,
    link: 'https://drive.google.com/drive/folders/1mUIROETA4DGH8XXhRui872cion9A801o?usp=drive_link',
    contents: []
  }
];

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  link: string;
  contents?: FileItem[];
}

const FileList = styled.div`
  list-style-type: none;
  padding: 0;
  width: 90%;
  max-width: 600px;
  margin: 0 auto;
`;

const FileCard = styled.a<{ isfolder?: boolean }>`
  background-color: rgba(255, 255, 255, 0.95);
  margin: 15px 0;
  padding: 20px 44px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-decoration: none;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  font-size: 16px;
  transition: all 0.3s ease;
  font-weight: ${props => props.isfolder ? 'bold' : 'normal'};
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0,0,0,0.2);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  text-align: center;

  > * {
    margin-bottom: 16px;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 24px;
    color: #333;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  }
`;

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

interface TrainingProps {
  user: GoogleUser | null;
}

const Training: React.FC<TrainingProps> = ({ user }) => {
  const [selectedFolder, setSelectedFolder] = useState<FileItem | null>(null);

  const handleFileClick = (file: FileItem, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(file.link, '_blank');
  };

  return (
    <TrainingContainer>
      <TrainingTitle>Training Materials</TrainingTitle>
      <FileList>
        {TRAINING_MATERIALS.map((file) => (
          <FileCard 
            key={file.id} 
            href={file.link}
            onClick={(e) => handleFileClick(file, e)}
            isfolder={file.type === 'folder'}
          >
            {file.name}
          </FileCard>
        ))}
      </FileList>
    </TrainingContainer>
  );
};

export default Training;
