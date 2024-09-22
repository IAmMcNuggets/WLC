import React, { useState } from 'react';
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
  email: string;
  name: string;
  picture: string;
}

const AppContainer = styled.div`
  background-image: url('/path/to/your/background-image.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
`;

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);

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
                  onSuccess={(credentialResponse: CredentialResponse) => {
                    if (credentialResponse.credential) {
                      const decoded: any = jwtDecode(credentialResponse.credential);
                      const googleUser: GoogleUser = {
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture
                      };
                      setUser(googleUser);
                      setIsLoggedIn(true);
                    } else {
                      console.error('No credential received');
                    }
                  }}
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
                <Route path="/profile" element={<Profile user={user} setIsLoggedIn={setIsLoggedIn} />} />
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
