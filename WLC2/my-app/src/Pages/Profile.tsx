import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleUser } from '../App';

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

  useEffect(() => {
    if (user && user.picture) {
      fetchImageAsDataUrl(user.picture);
    }
  }, [user]);

  const fetchImageAsDataUrl = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setImageDataUrl(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  if (!user) {
    return <ProfileContainer>No user data available</ProfileContainer>;
  }

  return (
    <ProfileContainer>
      <ProfileTitle>User Profile</ProfileTitle>
      <ProfileCard>
        {imageDataUrl && (
          <ProfileImage 
            src={imageDataUrl} 
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