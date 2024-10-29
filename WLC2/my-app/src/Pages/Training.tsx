import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageContainer } from '../components/CommonStyles';

interface FileItem {
  id: string;
  name: string;
  webViewLink?: string;
  mimeType?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  timestamp?: number;
  error?: string;
}

interface GoogleUser {
  email: string;
  name?: string;
  // Add other properties you need from the Google user object
}

const FileList = styled.div`
  list-style-type: none;
  padding: 0;
  width: 90%;
  max-width: 600px;
  margin: 0 auto;
`;

const FileCard = styled.a<{ isfolder?: boolean }>`
  background-color: rgba(255, 255, 255, 0.9);
  margin: 15px 0;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-decoration: none;
  color: #444;
  display: block;
  text-align: center;
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
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  text-align: center;

  h2 {
    margin-bottom: 20px;
    color: #333;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  }
`;

const CLIENT_ID = '1076922480921-d8vbuet2khv4ukp4je9st5bh7096ueit.apps.googleusercontent.com';
const FOLDER_ID = '0AFSJxcbJ2fmyUk9PVA';
const API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

interface Props {
  user: GoogleUser | null;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

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

const Training: React.FC<Props> = ({ user }) => {
  console.log('Training component rendered, user:', user);
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderContents, setFolderContents] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<FileItem | null>(null);

  useEffect(() => {
    console.log('useEffect triggered, user:', user);
    
    if (user) {
      initializeGoogleAPI();
    } else {
      console.log('No user, skipping API initialization');
      setLoading(false);
    }
  }, [user]);

  const initializeGoogleAPI = async () => {
    try {
      console.log('Initializing Google API...');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      document.body.appendChild(script);

      await new Promise<void>((resolve) => {
        script.onload = () => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            
            // Check for stored token
            const storedToken = localStorage.getItem('google_drive_token');
            if (storedToken) {
              try {
                window.gapi.client.setToken(JSON.parse(storedToken));
                await fetchFiles();
                resolve();
                return;
              } catch (error) {
                console.error('Error using stored token:', error);
                localStorage.removeItem('google_drive_token');
              }
            }

            // If no stored token or token failed, request new one
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: CLIENT_ID,
              scope: SCOPES,
              callback: async (response: any) => {
                if (response.error !== undefined) {
                  throw response;
                }
                // Store the new token
                localStorage.setItem('google_drive_token', JSON.stringify(response));
                await fetchFiles();
              },
            });

            tokenClient.requestAccessToken({ prompt: '' });
            resolve();
          });
        };
      });
    } catch (error) {
      console.error('Error initializing Google API:', error);
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      console.log('Fetching files...');
      const response = await window.gapi.client.drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed = false`,
        fields: 'files(id, name, webViewLink, mimeType)',
        orderBy: 'name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'drive',
        driveId: '0AFSJxcbJ2fmyUk9PVA',
      });
      console.log('Files fetched:', response.result.files);
      setFiles(response.result.files);
    } catch (error) {
      console.error('Error fetching files:', error);
      // If token is expired or invalid
      if ((error as any)?.status === 401) {
        localStorage.removeItem('google_drive_token');
        // Reinitialize the API to get a new token
        await initializeGoogleAPI();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderContents = async (folderId: string) => {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, webViewLink, mimeType)',
        orderBy: 'name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      setFolderContents(response.result.files);
    } catch (error) {
      console.error('Error fetching folder contents:', error);
    }
  };

  const handleFileClick = async (file: FileItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setSelectedFolderId(file.id);
      setSelectedFolder(file);
      await fetchFolderContents(file.id);
    } else {
      window.open(file.webViewLink, '_blank');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <TrainingContainer>
      <TrainingTitle>Training Materials</TrainingTitle>
      <FileList>
        {files.map((file) => (
          <FileCard 
            key={file.id} 
            href={file.webViewLink} 
            onClick={(e) => handleFileClick(file, e)}
            isfolder={file.mimeType === 'application/vnd.google-apps.folder'}
          >
            {file.name}
          </FileCard>
        ))}
      </FileList>

      {selectedFolderId && (
        <Modal onClick={() => {
          setSelectedFolderId(null);
          setSelectedFolder(null);
        }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>{selectedFolder?.name || 'Files'}</h2>
            <FileList>
              {folderContents.map((file) => (
                <FileCard
                  key={file.id}
                  href={file.webViewLink}
                  onClick={(e) => handleFileClick(file, e)}
                  isfolder={file.mimeType === 'application/vnd.google-apps.folder'}
                >
                  {file.name}
                </FileCard>
              ))}
            </FileList>
          </ModalContent>
        </Modal>
      )}
    </TrainingContainer>
  );
};

export default Training;
