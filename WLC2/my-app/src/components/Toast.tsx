import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
  visible?: boolean;
}

const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-20px);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ type: ToastType; isVisible: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 16px;
  animation: ${props => props.isVisible ? css`${slideIn} 0.3s ease-out` : css`${slideOut} 0.3s ease-in forwards`};
  position: relative;
  min-width: 300px;
  max-width: 500px;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return css`
          background-color: #f0fff4;
          border-left: 4px solid #48bb78;
          color: #2f855a;
        `;
      case 'error':
        return css`
          background-color: #fff5f5;
          border-left: 4px solid #f56565;
          color: #c53030;
        `;
      case 'info':
      default:
        return css`
          background-color: #ebf8ff;
          border-left: 4px solid #4299e1;
          color: #2b6cb0;
        `;
    }
  }}
`;

const IconWrapper = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
  font-size: 20px;
`;

const MessageText = styled.p`
  margin: 0;
  flex: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  
  &:hover {
    opacity: 1;
  }
`;

const ToastComponent: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
  visible = true
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 300); // Match the animation duration
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300); // Match the animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaExclamationCircle />;
      case 'info':
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <ToastContainer type={type} isVisible={isVisible}>
      <IconWrapper>{getIcon()}</IconWrapper>
      <MessageText>{message}</MessageText>
      <CloseButton onClick={handleClose} aria-label="Close notification">
        <FaTimes size={16} />
      </CloseButton>
    </ToastContainer>
  );
};

export default ToastComponent; 