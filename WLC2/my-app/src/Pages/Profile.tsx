import React from 'react';
import styled from 'styled-components';
import { GoogleUser } from '../App';

interface ProfileProps {
  user: GoogleUser | null;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-image: url(${require('../Background/86343.jpg')});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
`;

const ProfileTitle = styled.h1`
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
`;

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const ProfileCard = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const ProfileImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
`;

const ProfileName = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
`;

const ProfileEmail = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
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
      <ProfileTitle>Profile</ProfileTitle>
      <ProfileContent>
        <ProfileCard>
          <ProfileImage src={user.picture} alt="profile" />
          <ProfileName>{user.name}</ProfileName>
          <ProfileEmail>{user.email}</ProfileEmail>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </ProfileCard>
      </ProfileContent>
    </ProfileContainer>
  );
}

export default Profile;