import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
  fullPage?: boolean;
  message?: string;
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div<{ $fullPage: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${props => props.$fullPage ? `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 1000;
  ` : ''}
`;

const Spinner = styled.div<{ $size: number; $color: string; $thickness: number }>`
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border: ${props => props.$thickness}px solid rgba(0, 0, 0, 0.1);
  border-top: ${props => props.$thickness}px solid ${props => props.$color};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingMessage = styled.p`
  margin-top: 16px;
  font-size: 14px;
  color: #666;
`;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40, 
  color = '#0084ff', 
  thickness = 4,
  fullPage = false,
  message
}) => {
  return (
    <SpinnerContainer $fullPage={fullPage}>
      <Spinner $size={size} $color={color} $thickness={thickness} />
      {message && <LoadingMessage>{message}</LoadingMessage>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner; 