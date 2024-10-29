import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageContainer } from '../components/CommonStyles';

interface FileItem {
  id: string;
  name: string;
  webViewLink?: string;
  mimeType?: string;
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

const Training: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderContents, setFolderContents] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoogleAPI = async () => {
      try {
        // Load the Google API client library
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });

        // Load and initialize the client
        await new Promise<void>((resolve) => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            resolve();
          });
        });

        // Load Google Identity Services
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        document.body.appendChild(gisScript);

        await new Promise((resolve) => {
          gisScript.onload = resolve;
        });

        // Initialize Google Identity Services
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: async (response: any) => {
            if (response.error) {
              throw response;
            }
            await fetchFiles();
          },
        });

        // Request access token
        tokenClient.requestAccessToken();

      } catch (error) {
        console.error('Error initializing Google API:', error);
        setLoading(false);
      }
    };

    const fetchFiles = async () => {
      try {
        const response = await window.gapi.client.drive.files.list({
          q: `'${FOLDER_ID}' in parents and trashed = false`,
          fields: 'files(id, name, webViewLink, mimeType)',
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
    <PageContainer>
      <h1>Training Materials</h1>
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
  );
};

export default Training;
