import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import logo from './Logos/Logo Color.png';
import './App.css';
import Events from './Pages/Events';
import Timeclock from './Pages/Timeclock';
import Profile from './Pages/Profile';
import Training from './Pages/Training';
import BottomNavBar from './components/BottomNavBar';
import { QueryClient, QueryClientProvider } from 'react-query'
import backgroundImage from './Background/86343.jpg';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Define the GoogleUser interface to maintain compatibility with existing components
export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
}

const AppContainer = styled.div`
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LoginContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
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

const LoginButton = styled.button`
  background-color: #4285F4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background-color: #3367D6;
  }
`;

const GoogleLogo = styled.div`
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const queryClient = new QueryClient()

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Separate component to use auth context
function AppContent() {
  const { currentUser, signInWithGoogle } = useAuth();
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

  // Convert Firebase user to GoogleUser format for compatibility
  useEffect(() => {
    if (currentUser) {
      const user: GoogleUser = {
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        picture: currentUser.photoURL || undefined
      };
      setGoogleUser(user);
    } else {
      setGoogleUser(null);
    }
  }, [currentUser]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Router>
      <AppContainer>
        {currentUser ? (
          <Routes>
            <Route path="/events" element={<Events user={googleUser} />} />
            <Route path="/timeclock" element={<Timeclock />} />
            <Route 
              path="/profile" 
              element={
                <Profile 
                  user={googleUser} 
                  setIsLoggedIn={() => {}} // This will be updated
                />
              } 
            />
            <Route path="/training" element={<Training user={googleUser} />} />
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Routes>
        ) : (
          <LoginContainer>
            <Logo src={logo} alt="Gigfriend Logo" />
            <AppTitle>Gigfriend</AppTitle>
            <LoginButton onClick={handleLogin}>
              <GoogleLogo>G</GoogleLogo>
              Sign in with Google
            </LoginButton>
          </LoginContainer>
        )}
        {currentUser && <BottomNavBar />}
      </AppContainer>
    </Router>
  );
}

export default App;
