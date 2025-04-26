import React, { createContext, useCallback, useContext, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast interface
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Context interface
interface ToastContextData {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Creating the context with a default empty implementation
const ToastContext = createContext<ToastContextData>({} as ToastContextData);

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
`;

// Styled components
const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
`;

interface ToastItemProps {
  $type: ToastType;
  $removing: boolean;
}

const ToastItem = styled.div<ToastItemProps>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${fadeIn} 0.3s ease-in-out;
  position: relative;
  max-width: 100%;
  overflow: hidden;
  
  ${props => props.$removing && css`
    animation: ${fadeOut} 0.3s ease-in-out forwards;
  `}
  
  ${props => {
    switch (props.$type) {
      case 'success':
        return css`
          background-color: #e6f7e6;
          border-left: 4px solid #2e7d32;
          color: #2e7d32;
        `;
      case 'error':
        return css`
          background-color: #fdecea;
          border-left: 4px solid #d32f2f;
          color: #d32f2f;
        `;
      case 'info':
        return css`
          background-color: #e3f2fd;
          border-left: 4px solid #1976d2;
          color: #1976d2;
        `;
      case 'warning':
        return css`
          background-color: #fff8e1;
          border-left: 4px solid #ffa000;
          color: #ffa000;
        `;
      default:
        return css`
          background-color: #ffffff;
          border-left: 4px solid #757575;
          color: #757575;
        `;
    }
  }}
`;

const ToastContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToastMessage = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 1;
  }
`;

// Toast Icon component
const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <FaCheckCircle size={18} />;
    case 'error':
      return <FaTimesCircle size={18} />;
    case 'info':
      return <FaInfoCircle size={18} />;
    case 'warning':
      return <FaExclamationTriangle size={18} />;
    default:
      return <FaInfoCircle size={18} />;
  }
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<(Toast & { removing: boolean })[]>([]);
  
  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts(state => [...state, { id, message, type, duration, removing: false }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(state => state.map(toast => 
          toast.id === id ? { ...toast, removing: true } : toast
        ));
        
        setTimeout(() => {
          setToasts(state => state.filter(toast => toast.id !== id));
        }, 300); // Animation duration
      }, duration);
    }
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(state => state.map(toast => 
      toast.id === id ? { ...toast, removing: true } : toast
    ));
    
    setTimeout(() => {
      setToasts(state => state.filter(toast => toast.id !== id));
    }, 300); // Animation duration
  }, []);
  
  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastItem key={toast.id} $type={toast.type} $removing={toast.removing}>
            <ToastContent>
              <ToastIcon type={toast.type} />
              <ToastMessage>{toast.message}</ToastMessage>
            </ToastContent>
            <CloseButton onClick={() => removeToast(toast.id)}>
              <FaTimes size={14} />
            </CloseButton>
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextData => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}; 