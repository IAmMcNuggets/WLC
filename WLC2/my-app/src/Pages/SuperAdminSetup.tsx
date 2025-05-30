import React, { useState } from 'react';
import styled from 'styled-components';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { setFirstSuperAdmin } from '../Utils/adminSetup';

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1.5rem;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  margin: 1.5rem 0 1rem;
`;

const Text = styled.p`
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const CodeBlock = styled.pre`
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
  font-family: monospace;
`;

const Warning = styled.div`
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1rem;
  margin: 1.5rem 0;
`;

const ActionContainer = styled.div`
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SuperAdminSetup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const handleSetupSuperAdmin = async () => {
    if (!auth.currentUser) {
      addToast('You must be logged in to perform this action', 'error');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to set ${auth.currentUser.email} as the SUPER ADMIN?
This role has full system access and can manage all companies and users.`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await setFirstSuperAdmin(auth.currentUser.uid);
      
      addToast('Super admin setup complete!', 'success');
      setIsComplete(true);
    } catch (error: any) {
      console.error('Error setting up super admin:', error);
      addToast(`Failed to set up super admin: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <Card>
        <Title>Super Admin Setup</Title>
        <Text>
          This page allows you to set up the first super administrator for the system.
          The super admin will have full access to all features, including:
        </Text>
        <ul>
          <li>Generate company registration codes</li>
          <li>Manage all companies and users</li>
          <li>Access system-wide settings</li>
        </ul>
        
        <Warning>
          <strong>Important:</strong> Setting up a super admin should only be done once during initial system setup.
          After that, the super admin can designate other super admins through the dashboard.
        </Warning>
        
        <Subtitle>Before You Begin</Subtitle>
        <Text>
          Make sure you are logged in with the account you want to designate as the super admin.
          Currently logged in as: <strong>{auth.currentUser?.email || 'Not logged in'}</strong>
        </Text>
        
        {!auth.currentUser && (
          <Text>
            Please <a href="/login">log in</a> before continuing.
          </Text>
        )}
        
        <ActionContainer>
          {!isComplete ? (
            <Button 
              variant="primary" 
              size="large" 
              onClick={handleSetupSuperAdmin} 
              isLoading={isLoading}
              disabled={!auth.currentUser}
            >
              Set Current User as Super Admin
            </Button>
          ) : (
            <>
              <Text style={{ color: 'green', fontWeight: 'bold' }}>
                ✅ Setup Complete! You are now a super admin.
              </Text>
              <Button 
                variant="primary" 
                size="large" 
                onClick={() => navigate('/super-admin')}
              >
                Go to Super Admin Dashboard
              </Button>
            </>
          )}
          
          <Button 
            variant="text" 
            size="small" 
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </ActionContainer>
        
        <Subtitle>Alternative Setup Method</Subtitle>
        <Text>
          If you prefer, you can also set up the super admin by running the following code in your browser console:
        </Text>
        <CodeBlock>{`
// 1. Make sure you are logged in with the account you want to make super admin
// 2. Open your browser console (F12 or Ctrl+Shift+I) and paste:

(async () => {
  try {
    const { firestore } = await import('./firebase');
    const { doc, updateDoc } = await import('firebase/firestore');
    const userProfileRef = doc(firestore, 'userProfiles', auth.currentUser.uid);
    await updateDoc(userProfileRef, {
      isSuperAdmin: true,
      role: 'admin'
    });
    console.log('✅ Super admin setup complete!');
  } catch (error) {
    console.error('Error:', error);
  }
})();
        `}</CodeBlock>
      </Card>
    </Container>
  );
};

export default SuperAdminSetup; 