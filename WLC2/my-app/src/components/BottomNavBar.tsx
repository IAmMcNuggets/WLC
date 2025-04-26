import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaCalendarAlt, FaClock, FaUserCircle, FaBook, FaComments } from 'react-icons/fa';

const NavBar = styled.nav`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  max-width: 600px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  padding: 15px 10px;
  z-index: 1002;
  display: flex;
  justify-content: space-around;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, opacity 0.3s ease;
  
  &:hover {
    transform: translateX(-50%) translateY(-5px);
  }
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    
    &:hover {
      transform: translateX(-50%);
    }
  }
`;

interface NavItemProps {
  $isActive: boolean;
}

const NavItem = styled(Link)<NavItemProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: ${props => props.$isActive ? '#0084ff' : '#6c757d'};
  font-size: 0.9rem;
  font-weight: ${props => props.$isActive ? '500' : '400'};
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
  outline: none;

  svg {
    font-size: 1.5rem;
    margin-bottom: 5px;
    transition: transform 0.2s ease;
  }
  
  &:hover, &:focus {
    color: #0084ff;
    
    svg {
      transform: ${props => props.$isActive ? 'scale(1.1)' : 'translateY(-2px)'};
    }
  }
  
  &:focus-visible {
    box-shadow: 0 0 0 2px #0084ff;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%) scaleX(${props => props.$isActive ? 1 : 0});
    width: 20px;
    height: 3px;
    background-color: #0084ff;
    border-radius: 3px;
    transition: transform 0.2s ease;
  }
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    
    &::after {
      transition: none;
    }
    
    svg {
      transition: none;
    }
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <NavItem to={to} $isActive={isActive} aria-current={isActive ? 'page' : undefined}>
      {icon}
      <span>{label}</span>
      {/* For screen readers to announce the current page */}
      {isActive && <VisuallyHidden>(current)</VisuallyHidden>}
    </NavItem>
  );
};

const BottomNavBar: React.FC = () => {
  return (
    <NavBar role="navigation" aria-label="Main Navigation">
      <NavLink 
        to="/events" 
        icon={<FaCalendarAlt aria-hidden="true" />} 
        label="Events" 
      />
      <NavLink 
        to="/timeclock" 
        icon={<FaClock aria-hidden="true" />} 
        label="Timeclock" 
      />
      <NavLink 
        to="/chat" 
        icon={<FaComments aria-hidden="true" />} 
        label="Chat" 
      />
      <NavLink 
        to="/training" 
        icon={<FaBook aria-hidden="true" />} 
        label="Training" 
      />
      <NavLink 
        to="/profile" 
        icon={<FaUserCircle aria-hidden="true" />} 
        label="Profile" 
      />
    </NavBar>
  );
};

export default BottomNavBar;
