import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageContainer } from '../components/CommonStyles';

interface FileItem {
  id: string;
  name: string;
  webViewLink?: string;
}

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;

const FileCard = styled.a`
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-decoration: none;
  color: inherit;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const DRIVE_API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;
console.log('API Key loaded:', !!DRIVE_API_KEY);
const FOLDER_ID = '0AFSJxcbJ2fmyUk9PVA';

const Training: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoogleAPI = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = initializeGoogleAPI;
      document.body.appendChild(script);
    };

    const initializeGoogleAPI = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: DRIVE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.readonly'
          });
          fetchFiles();
        } catch (error) {
          console.error('Error initializing Google API:', error);
          setLoading(false);
        }
      });
    };

    const fetchFiles = async () => {
      try {
        const response = await window.gapi.client.drive.files.list({
          q: `'${FOLDER_ID}' in parents and trashed = false`,
          fields: 'files(id, name, webViewLink)',
          orderBy: 'name',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        setFiles(response.result.files);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoogleAPI();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      <h1>Training Materials</h1>
      <FileList>
        {files.map((file) => (
          <FileCard 
            key={file.id} 
            href={file.webViewLink} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {file.name}
          </FileCard>
        ))}
      </FileList>
    </PageContainer>
  );
};

export default Training;
