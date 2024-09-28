import React from 'react';
import styled from 'styled-components';
import { GoogleUser } from '../App';

interface ProfileProps {
  user: GoogleUser | null;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

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

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin-top: 5vh; // This will push the content up a bit
`;

const ProfileTitle = styled.h1`
  text-align: center;
  width: 100%;
  margin-top: 0; // Removed top margin
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
`;

const ProfileInfo = styled.div`
  margin-bottom: 20px;
  width: 100%;
`;

const InfoItem = styled.p`
  color: #555;
  margin: 10px 0;
  font-size: 16px;
`;

const InfoLabel = styled.span`
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
`;

const LogoutButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #d32f2f;
  }
`;

function Profile({ user, setIsLoggedIn }: ProfileProps) {
  if (!user) return null;

  const handleLogout = () => {
    setIsLoggedIn(false);
    // Add any additional logout logic here
  };

  return (
    <ProfileContainer>
      <ProfileContent>
        <ProfileTitle>Profile</ProfileTitle>
        <ProfileCard>
          <ProfileImage src={user.picture} alt="profile" />
          <ProfileInfo>
            <InfoLabel>Name:</InfoLabel>
            <InfoItem>{user.name}</InfoItem>
            <InfoLabel>Email:</InfoLabel>
            <InfoItem>{user.email}</InfoItem>
          </ProfileInfo>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </ProfileCard>
      </ProfileContent>
    </ProfileContainer>
  );
}

export default Profile;