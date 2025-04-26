import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import logo from './Logos/Logo Color.png';
import './App.css';
import Events from './Pages/Events';
import Timeclock from './Pages/Timeclock';
import Profile from './Pages/Profile';
import Training from './Pages/Training';
import Chat from './Pages/Chat';
import BottomNavBar from './components/BottomNavBar';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { signInWithGooglePopup } from './firebase';
import backgroundImage from './Background/86343.jpg';

// Define and export the GoogleUser interface
export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;  // Make it optional in case it's not always provided
  // ... any other properties
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

const LoginButton = styled.div`
  margin-top: 1.5rem;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const queryClient = new QueryClient()

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // Inner component to access useAuth within AuthProvider context
  const AppContent = () => {
    const { currentUser } = useAuth();
    
    // Effect to check Firebase authentication status
    useEffect(() => {
      // If we have Firebase auth but no local user data, update it
      if (currentUser && !user) {
        const userData: GoogleUser = {
          name: currentUser.displayName || 'User',
          email: currentUser.email || 'No email',
          picture: currentUser.photoURL || undefined
        };
        setUser(userData);
        setIsLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }, [currentUser]);
    
    const handleGoogleLogin = async () => {
      try {
        const result = await signInWithGooglePopup();
        
        if (result.user) {
          const userData: GoogleUser = {
            name: result.user.displayName || 'User',
            email: result.user.email || 'No email',
            picture: result.user.photoURL || undefined
          };
          
          setUser(userData);
          setIsLoggedIn(true);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error with Google sign-in:', error);
      }
    };

    // Handle logout
    const handleLogout = () => {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('user');
    };

    return (
      <Router>
        <AppContainer>
          {isLoggedIn ? (
            <>
              <Routes>
                <Route path="/events" element={<Events user={user} />} />
                <Route path="/timeclock" element={<Timeclock user={user} />} />
                <Route 
                  path="/profile" 
                  element={
                    <Profile 
                      user={user} 
                      setIsLoggedIn={handleLogout} 
                    />
                  } 
                />
                <Route path="/training" element={<Training user={user} />} />
                <Route path="/chat" element={<Chat user={user} />} />
                <Route path="*" element={<Navigate to="/events" replace />} />
              </Routes>
            </>
          ) : (
            <LoginContainer>
              <Logo src={logo} alt="Gigfriend Logo" />
              <AppTitle>Gigfriend</AppTitle>
              <LoginButton>
                <GoogleLoginButton onClick={handleGoogleLogin}>
                  Sign in with Google
                </GoogleLoginButton>
              </LoginButton>
            </LoginContainer>
          )}
          {isLoggedIn && <BottomNavBar />}
        </AppContainer>
      </Router>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Additional styled component for the Google login button
const GoogleLoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  transition: background-color 0.3s;

  &:hover {
    background-color: #357ae8;
  }

  &:before {
    content: "G";
    background-color: white;
    color: #4285f4;
    font-weight: bold;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
  }
`;

export default App;
