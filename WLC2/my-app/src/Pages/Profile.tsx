import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleUser } from '../types/user';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

const LogoutButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  max-width: 200px;

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
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    if (user && user.picture) {
      // Check localStorage cache first
      const cachedImage = localStorage.getItem(`profile-image-${user.email}`);
      if (cachedImage) {
        setImageDataUrl(cachedImage);
      } else {
        fetchImageAsDataUrl(user.picture);
      }
    }
  }, [user]);

  const fetchImageAsDataUrl = async (url: string, retryCount = 0) => {
    if (retryCount > 2) {
      setImageError(true);
      return;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'max-age=3600',
        },
      });
      
      if (response.status === 429 && retryCount < 2) {
        // Rate limited, retry with exponential backoff
        console.log(`Rate limited, retrying in ${Math.pow(2, retryCount) * 1000}ms`);
        setTimeout(() => {
          fetchImageAsDataUrl(url, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageDataUrl(result);
        
        // Cache the image in localStorage
        if (user?.email) {
          try {
            localStorage.setItem(`profile-image-${user.email}`, result);
          } catch (e) {
            console.warn('Could not cache image in localStorage:', e);
          }
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error fetching image:', error);
      if (retryCount < 2) {
        // Retry with exponential backoff
        setTimeout(() => {
          fetchImageAsDataUrl(url, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        setImageError(true);
      }
    }
  };

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

  if (!user) {
    return <ProfileContainer>No user data available</ProfileContainer>;
  }

  return (
    <ProfileContainer>
      <ProfileTitle>User Profile</ProfileTitle>
      <ProfileCard>
        {imageDataUrl && !imageError ? (
          <ProfileImage 
            src={imageDataUrl} 
            alt={user.name} 
          />
        ) : imageError ? (
          <ProfileImage 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
            alt={user.name} 
          />
        ) : (
          <ProfileImage 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
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
        <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      </ProfileCard>
    </ProfileContainer>
  );
}

export default Profile;
