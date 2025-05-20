import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaEnvelope } from 'react-icons/fa';
import { sendPasswordReset } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import logo from '../Logos/Logo Color.png';

const ForgotPasswordContainer = styled.div`
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
  margin: 0 0 1rem;
  text-align: center;
  font-weight: 600;
`;

const Description = styled.p`
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 1.5rem;
  text-align: center;
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

const BackToLogin = styled.p`
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

const SuccessMessage = styled.p`
  color: #27ae60;
  font-size: 0.85rem;
  margin-top: 0.2rem;
  text-align: center;
`;

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await sendPasswordReset(email);
      
      setSuccess(true);
      addToast('Password reset email sent. Check your inbox.', 'success');
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordContainer>
      <Logo src={logo} alt="Gigfriend Logo" />
      <AppTitle>Reset Password</AppTitle>
      <Description>
        Enter your email address below and we'll send you instructions to reset your password.
      </Description>
      
      {success ? (
        <>
          <SuccessMessage>
            Password reset email sent! Please check your inbox and follow the instructions.
          </SuccessMessage>
          <BackToLogin>
            <Link to="/login">Back to Sign In</Link>
          </BackToLogin>
        </>
      ) : (
        <>
          <Form onSubmit={handleResetPassword}>
            <InputGroup>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </InputGroup>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <Button
              type="submit"
              variant="primary"
              size="large"
              leftIcon={<FaEnvelope />}
              isLoading={loading}
              fullWidth
            >
              Send Reset Link
            </Button>
          </Form>
          
          <BackToLogin>
            <Link to="/login">Back to Sign In</Link>
          </BackToLogin>
        </>
      )}
    </ForgotPasswordContainer>
  );
};

export default ForgotPassword; 