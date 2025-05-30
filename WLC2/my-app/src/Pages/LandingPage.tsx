import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import logo from '../Logos/Logo Color.png';
import backgroundImage from '../Background/86343.jpg';
import Button from '../components/Button';

const PageContainer = styled.div`
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
`;

const ContentContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  width: 100%;
`;

const Logo = styled.img`
  width: 180px;
  margin-bottom: 1.5rem;
`;

const AppTitle = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 1.5rem;
  text-align: center;
  font-weight: 600;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const SignUpText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: #555;

  button {
    color: #4A90E2;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font: inherit;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/signup-options');
  };

  return (
    <PageContainer>
      <ContentContainer>
        <Logo src={logo} alt="Gigfriend Logo" />
        <AppTitle>Gigfriend</AppTitle>
        
        <ButtonContainer>
          <Button 
            onClick={handleSignIn} 
            variant="primary" 
            size="large" 
            fullWidth
          >
            Sign In
          </Button>
        </ButtonContainer>
        
        <SignUpText>
          Don't have an account? <button onClick={handleSignUp}>Sign Up</button>
        </SignUpText>
      </ContentContainer>
    </PageContainer>
  );
};

export default LandingPage; 