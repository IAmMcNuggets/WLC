import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { auth, firestore } from '../firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { signInWithGooglePopup } from '../firebase';
import { FaGoogle, FaBuilding, FaMapMarkerAlt, FaKey } from 'react-icons/fa';
import Button from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import backgroundImage from '../Background/86343.jpg';
import logo from '../Logos/Logo Color.png';

const Container = styled.div`
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

const FormContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
`;

const Logo = styled.img`
  width: 150px;
  margin: 0 auto 1.5rem;
  display: block;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4a6cf7;
    box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #0066cc;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 1rem;
  align-self: center;
  display: block;
  margin: 1rem auto 0;
`;

function CompanySignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    location: '',
    currentRmsApiKey: ''
  });
  const { addToast } = useToast();
  
  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGooglePopup();
      if (result.user) {
        // Create user profile with company_owner type
        await setDoc(doc(firestore, 'userProfiles', result.user.uid), {
          displayName: result.user.displayName || 'User',
          email: result.user.email || '',
          photoURL: result.user.photoURL || '',
          createdAt: serverTimestamp(),
          userType: 'company_owner'
        });
        // Move to step 2
        setStep(2);
      }
    } catch (error) {
      console.error('Error during signup:', error);
      addToast('Signup failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCompanyInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Create company document
      const companyRef = doc(collection(firestore, 'companies'));
      await setDoc(companyRef, {
        name: companyData.name,
        location: companyData.location,
        currentRmsApiKey: companyData.currentRmsApiKey,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      
      // Create company membership
      const membershipId = `${auth.currentUser.uid}_${companyRef.id}`;
      await setDoc(doc(firestore, 'companyMembers', membershipId), {
        userId: auth.currentUser.uid,
        companyId: companyRef.id,
        role: 'owner',
        status: 'active',
        joinedAt: serverTimestamp(),
        requestedAt: serverTimestamp()
      });
      
      addToast('Company created successfully!', 'success');
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating company:', error);
      addToast('Failed to create company. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <Container>
      <FormContainer>
        {step === 1 ? (
          <>
            <Logo src={logo} alt="Gigfriend Logo" />
            <Title>Create a Company Account</Title>
            <Button
              onClick={handleGoogleSignup}
              variant="primary"
              size="large"
              leftIcon={<FaGoogle />}
              isLoading={isLoading}
              fullWidth
            >
              Sign up with Google
            </Button>
            <BackButton onClick={() => navigate('/')}>Back to Login</BackButton>
          </>
        ) : (
          <>
            <Logo src={logo} alt="Gigfriend Logo" />
            <Title>Company Information</Title>
            <Form onSubmit={handleCompanyInfoSubmit}>
              <FormGroup>
                <Label>Company Name</Label>
                <Input
                  name="name"
                  value={companyData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Location</Label>
                <Input
                  name="location"
                  value={companyData.location}
                  onChange={handleInputChange}
                  placeholder="Enter company location"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Current RMS API Key</Label>
                <Input
                  name="currentRmsApiKey"
                  value={companyData.currentRmsApiKey}
                  onChange={handleInputChange}
                  placeholder="Enter your Current RMS API key"
                  required
                />
              </FormGroup>
              
              <Button
                type="submit"
                variant="primary"
                size="large"
                isLoading={isLoading}
                fullWidth
              >
                Create Company
              </Button>
            </Form>
            <BackButton onClick={() => setStep(1)}>Back</BackButton>
          </>
        )}
      </FormContainer>
    </Container>
  );
}

export default CompanySignup; 