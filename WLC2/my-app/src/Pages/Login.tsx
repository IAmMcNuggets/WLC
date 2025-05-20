import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaGoogle, FaEnvelope } from 'react-icons/fa';
import { signInWithGooglePopup, signInWithEmailAndPassword } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import logo from '../Logos/Logo Color.png';

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

const ForgotPassword = styled.div`
  text-align: right;
  margin-top: -0.5rem;

  a {
    color: #4A90E2;
    text-decoration: none;
    font-size: 0.85rem;

    &:hover {
      text-decoration: underline;
    }
  }
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

const SignupPrompt = styled.p`
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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await signInWithEmailAndPassword(email, password);
      
      if (result.user) {
        const userData = {
          name: result.user.displayName || 'User',
          email: result.user.email || 'No email',
          picture: result.user.photoURL || undefined
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        addToast('Successfully logged in', 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again later.';
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await signInWithGooglePopup();
      
      if (result.user) {
        const userData = {
          name: result.user.displayName || 'User',
          email: result.user.email || 'No email',
          picture: result.user.photoURL || undefined
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        addToast('Successfully logged in', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
      addToast('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Logo src={logo} alt="Gigfriend Logo" />
      <AppTitle>Sign In</AppTitle>
      
      <Form onSubmit={handleEmailLogin}>
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
        </InputGroup>
        
        <ForgotPassword>
          <Link to="/forgot-password">Forgot password?</Link>
        </ForgotPassword>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Button
          type="submit"
          variant="primary"
          size="large"
          leftIcon={<FaEnvelope />}
          isLoading={loading}
          fullWidth
        >
          Sign in with Email
        </Button>
      </Form>
      
      <OrDivider><span>OR</span></OrDivider>
      
      <Button
        onClick={handleGoogleLogin}
        variant="secondary"
        size="large"
        leftIcon={<FaGoogle />}
        isLoading={loading}
        fullWidth
      >
        Sign in with Google
      </Button>
      
      <SignupPrompt>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </SignupPrompt>
    </LoginContainer>
  );
};

export default Login; 