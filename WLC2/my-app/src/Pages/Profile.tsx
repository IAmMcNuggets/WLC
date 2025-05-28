import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleUser } from '../types/user';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { FaBell, FaBellSlash, FaBuilding } from 'react-icons/fa';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../firebase';

const ProfileContainer = styled.div`
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

const ProfileTitle = styled.h1`
  text-align: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 30px;
  color: black;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-size: 2.5rem;
`;

const ProfileCard = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  margin-bottom: 20px;
  border: 3px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  object-fit: cover;
`;

const ProfileInfo = styled.div`
  width: 100%;
  margin-bottom: 20px;
`;

const InfoItem = styled.p`
  color: #555;
  margin: 10px 0;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const InfoLabel = styled.span`
  font-weight: bold;
  margin-bottom: 5px;
`;

const ActionButton = styled.button`
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  max-width: 200px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.9;
  }
`;

const ManageButton = styled(ActionButton)`
  background-color: #4a6cf7;
  margin-top: 10px;
  
  &:hover {
    background-color: #3451b2;
  }
`;

const NotificationButton = styled(ActionButton)`
  background-color: #4caf50;
  
  &:hover {
    background-color: #388e3c;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const NotificationIcon = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const InfoMessage = styled.p`
  font-size: 14px;
  color: #666;
  margin: 10px 0;
  text-align: center;
`;

const LogoutButton = styled(ActionButton)`
  background-color: #f44336;
  margin-top: 15px;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

interface ProfileProps {
  user: GoogleUser | null;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

function Profile({ user, setIsLoggedIn }: ProfileProps) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { 
    notificationsEnabled, 
    enableNotifications, 
    isIOS, 
    isPWA,
    showIOSInstructions 
  } = useNotifications();

  // Check if user is a company owner
  useEffect(() => {
    const checkIfCompanyOwner = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Check if user owns any companies
        const companiesQuery = query(
          collection(firestore, 'companies'),
          where('ownerId', '==', auth.currentUser.uid)
        );
        
        const snapshot = await getDocs(companiesQuery);
        setIsCompanyOwner(!snapshot.empty);
      } catch (error) {
        console.error('Error checking company ownership:', error);
      }
    };
    
    checkIfCompanyOwner();
  }, []);

  useEffect(() => {
    if (user && user.picture) {
      // Check localStorage cache first
      const cachedImage = localStorage.getItem(`profile-image-${user.email}`);
      if (cachedImage) {
        setImageDataUrl(cachedImage);
      } else {
        // Instead of fetching directly, which may cause CORS issues
        // Set a loading image first
        setImageDataUrl(null);
        
        // Create an Image object to test if the image can load
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        // Set up success handler
        img.onload = () => {
          // If it loads, we can use it directly
          if (user.picture) {
            setImageDataUrl(user.picture);
          }
        };
        
        // Set up error handler
        img.onerror = () => {
          setImageError(true);
        };
        
        // Start loading the image
        img.src = user.picture;
      }
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      // Log out from Firebase
      await logout();
      // Update local state
      setIsLoggedIn(false);
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true);
    try {
      await enableNotifications();
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  const handleManageCompanies = () => {
    navigate('/company-management');
  };

  if (!user) {
    return <ProfileContainer>No user data available</ProfileContainer>;
  }

  return (
    <ProfileContainer>
      <ProfileTitle>User Profile</ProfileTitle>
      <ProfileCard>
        {!imageError && imageDataUrl ? (
          <ProfileImage 
            src={imageDataUrl} 
            alt={user.name} 
          />
        ) : (
          <ProfileImage 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=120`} 
            alt={user.name} 
          />
        )}
        <ProfileInfo>
          <InfoItem>
            <InfoLabel>Name</InfoLabel> {user.name}
          </InfoItem>
          <InfoItem>
            <InfoLabel>Email</InfoLabel> {user.email}
          </InfoItem>
        </ProfileInfo>
        
        {showIOSInstructions && (
          <InfoMessage>
            To enable notifications on iOS, you must first add this app to your home screen.
          </InfoMessage>
        )}
        
        <NotificationButton 
          onClick={handleEnableNotifications}
          disabled={notificationsEnabled || isEnablingNotifications || (isIOS && !isPWA)}
        >
          <NotificationIcon>
            {notificationsEnabled ? <FaBell /> : <FaBellSlash />}
          </NotificationIcon>
          {notificationsEnabled 
            ? 'Notifications Enabled' 
            : isEnablingNotifications 
              ? 'Enabling...' 
              : 'Enable Notifications'
          }
        </NotificationButton>
        
        {isCompanyOwner && (
          <ManageButton onClick={handleManageCompanies}>
            <FaBuilding style={{ marginRight: '8px' }} /> Manage Companies
          </ManageButton>
        )}
        
        <LogoutButton onClick={handleLogout}>
          Logout
        </LogoutButton>
      </ProfileCard>
    </ProfileContainer>
  );
}

export default Profile;
