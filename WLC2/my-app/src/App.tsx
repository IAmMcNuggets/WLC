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

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId="1076922480921-d8vbuet2khv4ukp4je9st5bh7096ueit.apps.googleusercontent.com">
        <Router>
          <AppContainer>
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
            <BottomNavBar />
          </AppContainer>
        </Router>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
