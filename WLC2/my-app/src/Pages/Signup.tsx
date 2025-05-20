import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaUser } from 'react-icons/fa';
import { registerWithEmailAndPassword } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import logo from '../Logos/Logo Color.png';

const SignupContainer = styled.div`
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

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #555;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4A90E2;
    outline: none;
  }
`;

const PasswordRequirements = styled.ul`
  font-size: 0.8rem;
  color: #777;
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
`;

const Requirement = styled.li`
  margin-bottom: 0.2rem;
`;

const LoginPrompt = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #555;

  a {
    color: #4A90E2;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.2rem;
`;

const Signup: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Password validation
  const isPasswordValid = () => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  };

  // Form validation
  const validateForm = () => {
    if (!displayName) {
      setError('Please enter your name');
      return false;
    }

    if (!email) {
      setError('Please enter your email');
      return false;
    }

    if (!password) {
      setError('Please enter a password');
      return false;
    }

    if (!isPasswordValid()) {
      setError('Password must be at least 8 characters with a number and uppercase letter');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await registerWithEmailAndPassword(email, password, displayName);
      
      if (result.user) {
        const userData = {
          name: displayName,
          email: result.user.email || email,
          picture: result.user.photoURL || undefined
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        addToast('Account created successfully! Welcome to Gigfriend.', 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Please use a different email or sign in.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupContainer>
      <Logo src={logo} alt="Gigfriend Logo" />
      <AppTitle>Create Account</AppTitle>
      
      <Form onSubmit={handleSignup}>
        <InputGroup>
          <Label htmlFor="displayName">Your Name</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Full Name"
            required
          />
        </InputGroup>
        
        <InputGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </InputGroup>
        
        <InputGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <PasswordRequirements>
            <Requirement>At least 8 characters</Requirement>
            <Requirement>At least one uppercase letter</Requirement>
            <Requirement>At least one number</Requirement>
          </PasswordRequirements>
        </InputGroup>
        
        <InputGroup>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </InputGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Button
          type="submit"
          variant="primary"
          size="large"
          leftIcon={<FaUser />}
          isLoading={loading}
          fullWidth
        >
          Create Account
        </Button>
      </Form>
      
      <LoginPrompt>
        Already have an account? <Link to="/login">Sign in</Link>
      </LoginPrompt>
    </SignupContainer>
  );
};

export default Signup; 