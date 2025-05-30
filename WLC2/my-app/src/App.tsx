import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import './App.css';
import Events from './Pages/Events';
import Timeclock from './Pages/Timeclock';
import Profile from './Pages/Profile';
import Training from './Pages/Training';
import Chat from './Pages/Chat';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import ForgotPassword from './Pages/ForgotPassword';
import BottomNavBar from './components/BottomNavBar';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { signInWithGooglePopup } from './firebase';
import { GoogleUser } from './types/user';
import LoadingSpinner from './components/LoadingSpinner';
import backgroundImage from './Background/86343.jpg';
import Dashboard from './Pages/Dashboard';
import CompanySignup from './Pages/CompanySignup';
import CompanyManagement from './Pages/CompanyManagement';
import LandingPage from './Pages/LandingPage';
import SignupOptions from './Pages/SignupOptions';

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

const LoginOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  
  &::before, &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #ddd;
  }
  
  span {
    padding: 0 10px;
    color: #777;
  }
`;

function AppContent() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

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
      
      // If we're in the middle of company signup, don't redirect to dashboard
      const isCompanySignupProcess = window.location.pathname === '/company-signup' && 
        localStorage.getItem('shouldMoveToStep2') === 'true';
      
      if (!isCompanySignupProcess) {
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      }
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
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error with Google sign-in:', error);
      addToast('Login failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, navigate]);

  // Handle logout
  const handleLogout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCompanyId');
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
      <AppContainer>
        {isLoggedIn ? (
          <>
            <Routes>
            <Route path="/dashboard" element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            } />
            <Route path="/company-signup" element={
              <ErrorBoundary>
                <CompanySignup />
              </ErrorBoundary>
            } />
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
                  {user ? (
                    <Chat user={user} />
                  ) : (
                  <Navigate to="/dashboard" replace />
                  )}
                </ErrorBoundary>
              } />
            <Route path="/company-management" element={
              <ErrorBoundary>
                <CompanyManagement />
              </ErrorBoundary>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          <BottomNavBar />
          </>
        ) : (
        <Routes>
          <Route path="/login" element={
            <ErrorBoundary>
              <Login />
            </ErrorBoundary>
          } />
          <Route path="/signup" element={
            <ErrorBoundary>
              <Signup />
            </ErrorBoundary>
          } />
          <Route path="/signup-options" element={
            <ErrorBoundary>
              <SignupOptions />
            </ErrorBoundary>
          } />
          <Route path="/forgot-password" element={
            <ErrorBoundary>
              <ForgotPassword />
            </ErrorBoundary>
          } />
          <Route path="/company-signup" element={
            <ErrorBoundary>
              <CompanySignup />
            </ErrorBoundary>
          } />
          <Route path="*" element={
            <ErrorBoundary>
              <LandingPage />
            </ErrorBoundary>
          } />
        </Routes>
        )}
      </AppContainer>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <Router>
          <AppContent />
          </Router>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
