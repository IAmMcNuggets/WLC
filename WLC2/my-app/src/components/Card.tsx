import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'info' | 'success' | 'warning' | 'error';

interface CardProps {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  noPadding?: boolean;
}

const getVariantStyles = (variant: CardVariant) => {
  switch (variant) {
    case 'elevated':
      return css`
        background-color: white;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        border: none;
      `;
    case 'outlined':
      return css`
        background-color: transparent;
        border: 1px solid #e2e8f0;
        box-shadow: none;
      `;
    case 'info':
      return css`
        background-color: #ebf8ff;
        border: 1px solid #bee3f8;
        box-shadow: none;
      `;
    case 'success':
      return css`
        background-color: #f0fff4;
        border: 1px solid #c6f6d5;
        box-shadow: none;
      `;
    case 'warning':
      return css`
        background-color: #fffaf0;
        border: 1px solid #feebc8;
        box-shadow: none;
      `;
    case 'error':
      return css`
        background-color: #fff5f5;
        border: 1px solid #fed7d7;
        box-shadow: none;
      `;
    case 'default':
    default:
      return css`
        background-color: white;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      `;
  }
};

const CardContainer = styled.div<{
  $variant: CardVariant;
  $fullWidth: boolean;
  $hoverable: boolean;
  $clickable: boolean;
  $noPadding: boolean;
}>`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  width: ${props => (props.$fullWidth ? '100%' : 'auto')};
  transition: all 0.2s ease-in-out;
  ${props => getVariantStyles(props.$variant)}
  
  ${props =>
    props.$hoverable &&
    css`
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
    `}
  
  ${props =>
    props.$clickable &&
    css`
      cursor: pointer;
      &:active {
        transform: translateY(1px);
      }
    `}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const IconContainer = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
  font-size: 20px;
`;

const TitleContainer = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
`;

const CardSubtitle = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: #718096;
`;

const CardContent = styled.div<{ $noPadding: boolean }>`
  padding: ${props => (props.$noPadding ? '0' : '16px 20px')};
  flex: 1;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
`;

const Card: React.FC<CardProps> = ({
  variant = 'default',
  title,
  subtitle,
  icon,
  actions,
  children,
  fullWidth = false,
  className,
  onClick,
  hoverable = false,
  noPadding = false,
}) => {
  const hasHeader = title || subtitle || icon;
  const hasFooter = actions;

  return (
    <CardContainer
      $variant={variant}
      $fullWidth={fullWidth}
      $hoverable={hoverable}
      $clickable={!!onClick}
      $noPadding={noPadding}
      className={className}
      onClick={onClick}
    >
      {hasHeader && (
        <CardHeader>
          {icon && <IconContainer>{icon}</IconContainer>}
          <TitleContainer>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </TitleContainer>
        </CardHeader>
      )}
      <CardContent $noPadding={noPadding}>{children}</CardContent>
      {hasFooter && <CardFooter>{actions}</CardFooter>}
    </CardContainer>
  );
};

export default Card; 