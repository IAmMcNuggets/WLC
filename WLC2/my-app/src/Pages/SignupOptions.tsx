import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import logo from '../Logos/Logo Color.png';
import backgroundImage from '../Background/86343.jpg';
import Button from '../components/Button';
import { FaUser, FaBuilding, FaArrowLeft } from 'react-icons/fa';

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
  position: relative;
`;

const Logo = styled.img`
  width: 150px;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: #333;
  text-align: center;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1.5rem;
`;

const BackButton = styled.button`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  background: none;
  border: none;
  color: #555;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    color: #333;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const CompanyOptionContainer = styled.div`
  margin-top: 1rem;
`;

const OrText = styled.div`
  text-align: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #777;
`;

const SignupOptions: React.FC = () => {
  const navigate = useNavigate();

  const handlePersonalSignup = () => {
    navigate('/signup');
  };

  const handleCompanySignup = () => {
    navigate('/company-signup');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <PageContainer>
      <ContentContainer>
        <BackButton onClick={handleBack}>
          <FaArrowLeft /> Back
        </BackButton>
        
        <Logo src={logo} alt="Gigfriend Logo" />
        <Title>Choose Account Type</Title>
        
        <OptionsContainer>
          <Button 
            onClick={handlePersonalSignup} 
            variant="primary" 
            size="large" 
            leftIcon={<FaUser />}
            fullWidth
          >
            Personal Account
          </Button>
          
          <OrText>or</OrText>
          
          <CompanyOptionContainer>
            <Button 
              onClick={handleCompanySignup} 
              variant="secondary" 
              size="medium" 
              leftIcon={<FaBuilding />}
              fullWidth
            >
              Company Account
            </Button>
          </CompanyOptionContainer>
        </OptionsContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default SignupOptions; 