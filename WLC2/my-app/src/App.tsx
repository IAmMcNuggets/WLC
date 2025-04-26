import React, { useState, useEffect, useCallback } from 'react';
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
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { signInWithGooglePopup } from './firebase';
import { GoogleUser } from './types/user';
import LoadingSpinner from './components/LoadingSpinner';
import Button from './components/Button';
import { FaGoogle } from 'react-icons/fa';
import backgroundImage from './Background/86343.jpg';

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
  background-color: rgba(255, 255, 255, 0.95);
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

function AppContent() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    // Check for stored user info in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

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
  }, [currentUser, user]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoading(true);
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
        addToast('Successfully logged in', 'success');
      }
    } catch (error) {
      console.error('Error with Google sign-in:', error);
      addToast('Login failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Handle logout
  const handleLogout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    addToast('You have been logged out', 'info');
  }, [addToast]);

  if (isLoading) {
    return (
      <AppContainer>
        <LoadingSpinner size={60} message="Loading application..." />
      </AppContainer>
    );
  }

  return (
    <Router>
      <AppContainer>
        {isLoggedIn ? (
          <>
            <Routes>
              <Route path="/events" element={
                <ErrorBoundary>
                  <Events user={user} />
                </ErrorBoundary>
              } />
              <Route path="/timeclock" element={
                <ErrorBoundary>
                  <Timeclock user={user} />
                </ErrorBoundary>
              } />
              <Route path="/profile" element={
                <ErrorBoundary>
                  <Profile user={user} setIsLoggedIn={handleLogout} />
                </ErrorBoundary>
              } />
              <Route path="/training" element={
                <ErrorBoundary>
                  <Training user={user} />
                </ErrorBoundary>
              } />
              <Route path="/chat" element={
                <ErrorBoundary>
                  <Chat user={user} />
                </ErrorBoundary>
              } />
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Routes>
          </>
        ) : (
          <LoginContainer>
            <Logo src={logo} alt="Gigfriend Logo" />
            <AppTitle>Gigfriend</AppTitle>
            <Button 
              onClick={handleGoogleLogin} 
              variant="primary" 
              size="large" 
              leftIcon={<FaGoogle />}
              isLoading={isLoading}
              fullWidth
            >
              Sign in with Google
            </Button>
          </LoginContainer>
        )}
        {isLoggedIn && <BottomNavBar />}
      </AppContainer>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
