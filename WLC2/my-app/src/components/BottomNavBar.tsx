import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaCalendarAlt, FaClock, FaUserCircle, FaBook, FaComments, FaTachometerAlt } from 'react-icons/fa';
import { auth, firestore } from '../firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
  padding: 12px 8px;
  z-index: 1002;
  display: flex;
  justify-content: space-between;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, opacity 0.3s ease;
  overflow-x: auto;
  
  &:hover {
    transform: translateX(-50%) translateY(-5px);
  }
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    
    &:hover {
      transform: translateX(-50%);
    }
  }
  
  /* Hide scrollbar */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  &::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }
  
  /* Mobile optimizations */
  @media (max-width: 480px) {
    padding: 10px 6px;
    width: 98%; /* Slightly wider on very small screens */
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
  font-size: 0.75rem;
  font-weight: ${props => props.$isActive ? '500' : '400'};
  padding: 6px 6px;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
  outline: none;
  min-width: 48px;
  flex: 1;
  
  svg {
    font-size: 1.25rem;
    margin-bottom: 4px;
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
  
  /* Mobile optimizations */
  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 4px 4px;
    min-width: 40px;
    
    svg {
      font-size: 1.2rem;
      margin-bottom: 3px;
    }
    
    &::after {
      width: 16px;
      height: 2px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 360px) {
    min-width: 36px;
    
    svg {
      font-size: 1.1rem;
      margin-bottom: 2px;
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
        to="/dashboard" 
        icon={<FaTachometerAlt aria-hidden="true" />} 
        label="Dashboard" 
      />
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
