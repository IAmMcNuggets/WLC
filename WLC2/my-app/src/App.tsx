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
import BottomNavBar from './components/BottomNavBar';
import { QueryClient, QueryClientProvider } from 'react-query'
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const LoginContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AppTitle = styled.h1`
  font-size: 2.5rem;
  color: #000000;
  margin: 1rem 0;
  text-align: center;
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
      <GoogleOAuthProvider clientId="1076922480921-d8vbuet2khv4ukp4je9st5bh7096ueit.apps.googleusercontent.com">
        <Router>
          <AppContainer>
            {isLoggedIn ? (
              <Routes>
                <Route path="/events" element={<Events />} />
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
                <Route path="*" element={<Navigate to="/events" replace />} />
              </Routes>
            ) : (
              <LoginContainer>
                <img src={logo} alt="Logo" style={{ width: '200px', marginBottom: '1rem' }} />
                <AppTitle>Gigfriend</AppTitle>
                <GoogleLogin
                  onSuccess={handleLogin}
                  onError={() => console.log('Login Failed')}
                />
              </LoginContainer>
            )}
            {isLoggedIn && <BottomNavBar />}
          </AppContainer>
        </Router>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
