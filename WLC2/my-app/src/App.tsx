import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import styled from 'styled-components';
import logo from './Logos/Logo Color.png';
import './App.css';
import Events from './Pages/Events';
import Timeclock from './Pages/Timeclock';
import Profile from './Pages/Profile';
import Training from './Pages/Training';
import Chat from './Pages/Chat';
import BottomNavBar from './components/BottomNavBar';
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider } from './contexts/AuthContext';
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

  const handleLogin = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const credentialResponseDecoded = jwtDecode(credentialResponse.credential) as GoogleUser;
      setUser(credentialResponseDecoded);
      setIsLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(credentialResponseDecoded));
    } else {
      console.error('Credential is undefined');
      // Handle the error case
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider 
        clientId="1076922480921-d8vbuet2khv4ukp4je9st5bh7096ueit.apps.googleusercontent.com"
        onScriptLoadError={() => console.log('Failed to load Google OAuth script')}
      >
        <AuthProvider>
          <Router>
            <AppContainer>
              {isLoggedIn ? (
                <Routes>
                  <Route path="/events" element={<Events user={user} />} />
                  <Route path="/timeclock" element={<Timeclock />} />
                  <Route 
                    path="/profile" 
                    element={
                      <Profile 
                        user={user} 
                        setIsLoggedIn={setIsLoggedIn} 
                      />
                    } 
                  />
                  <Route path="/training" element={<Training user={user} />} />
                  <Route path="/chat" element={<Chat user={user} />} />
                  <Route path="*" element={<Navigate to="/events" replace />} />
                </Routes>
              ) : (
                <LoginContainer>
                  <Logo src={logo} alt="Gigfriend Logo" />
                  <AppTitle>Gigfriend</AppTitle>
                  <LoginButton>
                    <GoogleLogin
                      onSuccess={handleLogin}
                      onError={() => console.log('Login Failed')}
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      logo_alignment="left"
                    />
                  </LoginButton>
                </LoginContainer>
              )}
              {isLoggedIn && <BottomNavBar />}
            </AppContainer>
          </Router>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
