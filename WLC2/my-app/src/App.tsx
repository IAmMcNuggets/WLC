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

// Define and export the GoogleUser interface
export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;  // Make it optional in case it's not always provided
  // ... any other properties
}

const AppContainer = styled.div`
  background-image: url('./Background/86343.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
`;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    // Check if user is logged in when the app loads
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const googleUser: GoogleUser = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      };
      setUser(googleUser);
      setIsLoggedIn(true);
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(googleUser));
    } else {
      console.error('No credential received');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    // Remove user data from localStorage
    localStorage.removeItem('user');
  };

  return (
    <GoogleOAuthProvider clientId="1076922480921-d8vbuet2khv4ukp4je9st5bh7096ueit.apps.googleusercontent.com">
      <Router>
        <AppContainer>
          {!isLoggedIn ? (
            <header className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              <h1 className="App-title">GigFriend</h1>
              <div style={{ margin: '20px 0' }}>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => {
                    console.log('Login Failed');
                  }}
                  useOneTap
                />
              </div>
              <div style={{ flexGrow: 1, minHeight: '100px' }}></div>
              <a
                className="App-link"
                href="https://weddinglightingco.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                WeddingLightingCo.com
              </a>
            </header>
          ) : (
            <>
              <Routes>
                <Route path="/events" element={<Events />} />
                <Route path="/timeclock" element={<Timeclock />} />
                <Route path="/profile" element={<Profile user={user} setIsLoggedIn={handleLogout} />} />
                <Route path="*" element={<Navigate to="/events" replace />} />
              </Routes>
              <BottomNavBar />
            </>
          )}
        </AppContainer>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
