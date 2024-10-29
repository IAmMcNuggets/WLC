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
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
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

  useEffect(() => {
    console.log('useEffect triggered, user:', user);
    
    const initializeGoogleAPI = async () => {
      try {
        console.log('Initializing Google API...');
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        document.body.appendChild(script);

        await new Promise<void>((resolve) => {
          script.onload = () => {
            console.log('Google API script loaded');
            window.gapi.load('client', async () => {
              console.log('Initializing GAPI client');
              await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              });
              
              const storedToken = localStorage.getItem('gapi_token');
              console.log('Stored token:', storedToken);
              
              if (storedToken) {
                console.log('Found stored token, attempting to use it');
                const parsedToken = JSON.parse(storedToken);
                window.gapi.client.setToken(parsedToken);
                
                const currentToken = window.gapi.client.getToken();
                console.log('Current token after setting:', currentToken);
                
                await fetchFiles();
                resolve();
                return;
              }
              
              console.log('No stored token, requesting new one');
              const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: async (response: any) => {
                  if (response.error !== undefined) {
                    throw response;
                  }
                  localStorage.setItem('gapi_token', JSON.stringify(response));
                  await fetchFiles();
                },
              });

              tokenClient.requestAccessToken();
              
              console.log('GAPI client initialized');
              resolve();
            });
          };
        });
      } catch (error) {
        console.error('Error initializing Google API:', error);
        setLoading(false);
      }
    };

    if (user) {
      initializeGoogleAPI();
    } else {
      console.log('No user, skipping API initialization');
      setLoading(false);
    }
  }, [user]);

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
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        localStorage.removeItem('gapi_token');
        window.location.reload();
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
      await fetchFolderContents(file.id);
    } else {
      window.open(file.webViewLink, '_blank');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <TrainingTitle>Training Materials</TrainingTitle>
      <PageContainer>
        <FileList>
          {files.map((file) => (
            <FileCard 
              key={file.id} 
              href={file.webViewLink} 
              onClick={(e) => handleFileClick(file, e)}
            >
              {file.name}
            </FileCard>
          ))}
        </FileList>

        {selectedFolderId && (
          <Modal onClick={() => setSelectedFolderId(null)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <h2>Folder Contents</h2>
              <FileList>
                {folderContents.map((file) => (
                  <FileCard
                    key={file.id}
                    href={file.webViewLink}
                    onClick={(e) => handleFileClick(file, e)}
                  >
                    {file.name}
                  </FileCard>
                ))}
              </FileList>
            </ModalContent>
          </Modal>
        )}
      </PageContainer>
    </>
  );
};

export default Training;
