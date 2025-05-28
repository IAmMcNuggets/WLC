import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { auth, firestore } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { registerWithEmailAndPassword } from '../firebase';
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

const PasswordRequirements = styled.ul`
  font-size: 0.8rem;
  color: #777;
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
`;

const Requirement = styled.li`
  margin-bottom: 0.2rem;
`;

function CompanySignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [companyData, setCompanyData] = useState({
    name: '',
    location: '',
    currentRmsApiKey: ''
  });
  const { addToast } = useToast();
  
  // Effect to check authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      console.log('Auth state changed:', user ? `User authenticated: ${user.uid}` : 'No user');
      if (user) {
        // If user auth state is available, update userId
        console.log('Setting userId from auth state:', user.uid);
        setUserId(user.uid);
        
        // If we're on step 1 and there's a logged in user, check if we should move to step 2
        if (step === 1 && localStorage.getItem('shouldMoveToStep2') === 'true') {
          console.log('Moving to step 2 based on localStorage flag');
          setStep(2);
          localStorage.removeItem('shouldMoveToStep2');
        }
      }
    });

    return () => unsubscribe();
  }, [step]);
  
  // Add an effect to log when step changes
  useEffect(() => {
    console.log('Step changed to:', step);
  }, [step]);
  
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateUserData = () => {
    if (userData.displayName.trim() === '') {
      addToast('Please enter your name', 'error');
      return false;
    }
    if (userData.email.trim() === '') {
      addToast('Please enter your email', 'error');
      return false;
    }
    if (userData.password.trim() === '') {
      addToast('Please enter a password', 'error');
      return false;
    }
    if (userData.password.length < 8 || !/[A-Z]/.test(userData.password) || !/[0-9]/.test(userData.password)) {
      addToast('Password must be at least 8 characters with a number and uppercase letter', 'error');
      return false;
    }
    if (userData.password !== userData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return false;
    }
    return true;
  };
  
  const handleEmailPasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUserData()) return;
    
    try {
      setIsLoading(true);
      console.log('Starting user registration...');
      
      // Register user with email and password
      const result = await registerWithEmailAndPassword(
        userData.email,
        userData.password,
        userData.displayName
      );
      
      console.log('Registration successful:', result.user.uid);
      
      if (result.user) {
        // Store user ID for company creation
        console.log('Storing user ID for company creation:', result.user.uid);
        setUserId(result.user.uid);
        
        // Store in localStorage as backup
        localStorage.setItem('tempUserId', result.user.uid);
        
        // Create user profile with company_owner type
        await setDoc(doc(firestore, 'userProfiles', result.user.uid), {
          displayName: userData.displayName,
          email: userData.email,
          photoURL: '',
          createdAt: serverTimestamp(),
          userType: 'company_owner'
        });
        console.log('User profile created');
        
        // Set a flag in localStorage to ensure step 2 transition happens
        localStorage.setItem('shouldMoveToStep2', 'true');
        
        // Move to step 2
        console.log('Changing to step 2...');
        setStep(2);
        console.log('Step state should now be 2');
      }
    } catch (error: any) {
      console.error('Error during signup:', error);
      if (error.code === 'auth/email-already-in-use') {
        addToast('Email already in use. Please use a different email or sign in.', 'error');
      } else {
        addToast('Signup failed. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCompanyInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use stored userId, localStorage backup, or current auth user
    const tempUserId = localStorage.getItem('tempUserId');
    const currentUserId = userId || tempUserId || (auth.currentUser ? auth.currentUser.uid : null);
    console.log('Current user ID for company creation:', currentUserId);
    console.log('From state:', userId);
    console.log('From localStorage:', tempUserId);
    console.log('Auth current user:', auth.currentUser ? auth.currentUser.uid : 'No user');
    
    if (!currentUserId) {
      console.error('No user ID available for company creation');
      addToast('Authentication error. Please try signing in again.', 'error');
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Starting company creation for user:', currentUserId);
      
      // TEMPORARY WORKAROUND: Force a delay to ensure auth state is fully propagated
      // This helps with "Missing or insufficient permissions" errors
      addToast('Preparing to create company...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Workaround: Verify user profile exists before creating company
      try {
        const userProfileRef = doc(firestore, 'userProfiles', currentUserId);
        const userProfileSnap = await getDoc(userProfileRef);
        
        // If profile doesn't exist, create it now as a backup
        if (!userProfileSnap.exists()) {
          console.log('User profile does not exist, creating it now');
          await setDoc(userProfileRef, {
            displayName: userData.displayName || 'User',
            email: userData.email || '',
            photoURL: '',
            createdAt: serverTimestamp(),
            userType: 'company_owner'
          });
        }
      } catch (profileError) {
        console.error('Error checking/creating user profile:', profileError);
      }
      
      // Create company document
      let companyRef;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          companyRef = doc(collection(firestore, 'companies'));
          await setDoc(companyRef, {
            name: companyData.name,
            location: companyData.location,
            currentRmsApiKey: companyData.currentRmsApiKey,
            ownerId: currentUserId,
            createdAt: serverTimestamp(),
            status: 'active'
          });
          console.log('Company document created:', companyRef.id);
          break; // Success, exit the retry loop
        } catch (retryError) {
          retryCount++;
          console.log(`Company creation attempt ${retryCount} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (retryCount === maxRetries) {
            throw retryError; // Re-throw if all retries failed
          }
        }
      }
      
      if (!companyRef) {
        throw new Error('Failed to create company after multiple attempts');
      }
      
      // Create company membership
      const membershipId = `${currentUserId}_${companyRef.id}`;
      await setDoc(doc(firestore, 'companyMembers', membershipId), {
        userId: currentUserId,
        companyId: companyRef.id,
        role: 'owner',
        status: 'active',
        joinedAt: serverTimestamp(),
        requestedAt: serverTimestamp()
      });
      console.log('Company membership created');
      
      // Clean up temporary storage
      localStorage.removeItem('tempUserId');
      
      addToast('Company created successfully!', 'success');
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating company:', error);
      
      // Provide more specific error messages if available
      if (error.code && error.code.includes('permission-denied')) {
        addToast('You do not have permission to create a company. This is likely a temporary issue with Firebase permissions. Please try logging out and back in.', 'error');
      } else if (error.code && error.code.includes('unavailable')) {
        addToast('Network error. Please check your connection and try again.', 'error');
      } else {
        addToast(`Failed to create company: ${error.message || 'Unknown error'}. Try the debug workaround below.`, 'error');
      }
      
      // Add a debug button to try again with elevated permissions
      const debugElement = document.createElement('div');
      debugElement.innerHTML = `
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #666;">If you're still having trouble, try our workaround:</p>
          <button id="debug-create-company" style="padding: 10px 15px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
            Try Alternative Creation Method
          </button>
        </div>
      `;
      document.querySelector('.FormContainer')?.appendChild(debugElement);
      
      document.getElementById('debug-create-company')?.addEventListener('click', async () => {
        try {
          // This is a last-resort attempt using a different approach
          const debugCompanyRef = doc(collection(firestore, 'companies'));
          
          // Use set with merge option
          await setDoc(debugCompanyRef, {
            name: companyData.name,
            location: companyData.location,
            currentRmsApiKey: companyData.currentRmsApiKey || 'default-key',
            ownerId: currentUserId,
            createdAt: new Date(), // Use JS Date instead of serverTimestamp
            status: 'active',
            debug_created: true
          }, { merge: true });
          
          // Create membership differently
          const debugMembershipId = `${currentUserId}_${debugCompanyRef.id}`;
          await setDoc(doc(firestore, 'companyMembers', debugMembershipId), {
            userId: currentUserId,
            companyId: debugCompanyRef.id,
            role: 'owner',
            status: 'active',
            joinedAt: new Date(),
            requestedAt: new Date(),
            debug_created: true
          }, { merge: true });
          
          addToast('Alternative company creation successful!', 'success');
          navigate('/dashboard');
        } catch (debugError) {
          console.error('Debug creation also failed:', debugError);
          addToast('All creation attempts failed. Please contact support.', 'error');
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <FormContainer>
        {step === 1 ? (
          <>
            <Logo src={logo} alt="Gigfriend Logo" />
            <Title>Create a Company Account</Title>
            <Form onSubmit={handleEmailPasswordSignup}>
              <FormGroup>
                <Label>Full Name</Label>
                <Input
                  name="displayName"
                  value={userData.displayName}
                  onChange={handleUserInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={userData.email}
                  onChange={handleUserInputChange}
                  placeholder="Enter your email"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  value={userData.password}
                  onChange={handleUserInputChange}
                  placeholder="Create a password"
                  required
                />
                <PasswordRequirements>
                  <Requirement>At least 8 characters</Requirement>
                  <Requirement>At least one uppercase letter</Requirement>
                  <Requirement>At least one number</Requirement>
                </PasswordRequirements>
              </FormGroup>
              
              <FormGroup>
                <Label>Confirm Password</Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={userData.confirmPassword}
                  onChange={handleUserInputChange}
                  placeholder="Confirm your password"
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
                Continue
              </Button>
            </Form>
            
            {/* Debug button - only for development */}
            {process.env.NODE_ENV !== 'production' && (
              <Button
                onClick={() => {
                  console.log('Debug: Manually moving to step 2');
                  setStep(2);
                }}
                variant="secondary"
                size="small"
                style={{ marginTop: '10px' }}
              >
                Debug: Go to Step 2
              </Button>
            )}
            
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
                  onChange={handleCompanyInputChange}
                  placeholder="Enter your company name"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Location</Label>
                <Input
                  name="location"
                  value={companyData.location}
                  onChange={handleCompanyInputChange}
                  placeholder="Enter company location"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Current RMS API Key</Label>
                <Input
                  name="currentRmsApiKey"
                  value={companyData.currentRmsApiKey}
                  onChange={handleCompanyInputChange}
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