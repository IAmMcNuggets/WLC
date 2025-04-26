import React, { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { FaSpinner } from 'react-icons/fa';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: #0084ff;
        color: white;
        border: 1px solid #0084ff;
        
        &:hover:not(:disabled) {
          background-color: #0073e6;
          border-color: #0073e6;
        }
        
        &:active:not(:disabled) {
          background-color: #0062c3;
          border-color: #0062c3;
        }
      `;
    case 'secondary':
      return css`
        background-color: #6c757d;
        color: white;
        border: 1px solid #6c757d;
        
        &:hover:not(:disabled) {
          background-color: #5a6268;
          border-color: #5a6268;
        }
        
        &:active:not(:disabled) {
          background-color: #4e555b;
          border-color: #4e555b;
        }
      `;
    case 'outline':
      return css`
        background-color: transparent;
        color: #0084ff;
        border: 1px solid #0084ff;
        
        &:hover:not(:disabled) {
          background-color: rgba(0, 132, 255, 0.1);
        }
        
        &:active:not(:disabled) {
          background-color: rgba(0, 132, 255, 0.2);
        }
      `;
    case 'danger':
      return css`
        background-color: #dc3545;
        color: white;
        border: 1px solid #dc3545;
        
        &:hover:not(:disabled) {
          background-color: #c82333;
          border-color: #c82333;
        }
        
        &:active:not(:disabled) {
          background-color: #bd2130;
          border-color: #bd2130;
        }
      `;
    case 'success':
      return css`
        background-color: #28a745;
        color: white;
        border: 1px solid #28a745;
        
        &:hover:not(:disabled) {
          background-color: #218838;
          border-color: #218838;
        }
        
        &:active:not(:disabled) {
          background-color: #1e7e34;
          border-color: #1e7e34;
        }
      `;
    case 'text':
      return css`
        background-color: transparent;
        color: #0084ff;
        border: none;
        
        &:hover:not(:disabled) {
          background-color: rgba(0, 132, 255, 0.1);
          text-decoration: underline;
        }
        
        &:active:not(:disabled) {
          background-color: rgba(0, 132, 255, 0.2);
        }
      `;
    default:
      return css``;
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'small':
      return css`
        font-size: 12px;
        padding: 6px 12px;
        height: 30px;
      `;
    case 'medium':
      return css`
        font-size: 14px;
        padding: 8px 16px;
        height: 38px;
      `;
    case 'large':
      return css`
        font-size: 16px;
        padding: 10px 20px;
        height: 46px;
      `;
    default:
      return css``;
  }
};

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
  $hasLeftIcon: boolean;
  $hasRightIcon: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  position: relative;
  ${props => getVariantStyles(props.$variant)}
  ${props => getSizeStyles(props.$size)}
  width: ${props => (props.$fullWidth ? '100%' : 'auto')};
  padding-left: ${props => (props.$hasLeftIcon ? '12px' : undefined)};
  padding-right: ${props => (props.$hasRightIcon ? '12px' : undefined)};
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.3);
  }
`;

const IconWrapper = styled.span<{ $position: 'left' | 'right' }>`
  display: flex;
  align-items: center;
  margin-left: ${props => (props.$position === 'right' ? '8px' : '0')};
  margin-right: ${props => (props.$position === 'left' ? '8px' : '0')};
`;

const LoadingSpinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  margin-right: 8px;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $hasLeftIcon={!!leftIcon}
      $hasRightIcon={!!rightIcon}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <LoadingSpinner size={size === 'small' ? 12 : size === 'large' ? 18 : 14} />}
      {!isLoading && leftIcon && <IconWrapper $position="left">{leftIcon}</IconWrapper>}
      {children}
      {!isLoading && rightIcon && <IconWrapper $position="right">{rightIcon}</IconWrapper>}
    </StyledButton>
  );
};

export default Button; 