import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const FloatingNavBar = styled.nav`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 10px;
  z-index: 1002; // Higher than the modal's z-index
  display: flex;
  justify-content: space-around;
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #6c757d;
  font-size: 0.8rem;
  transition: color 0.3s ease;

  &.active {
    color: #007bff;
  }
`;

const NavIcon = styled.span`
  font-size: 1.5rem;
  margin-bottom: 4px;
`;

function BottomNavBar() {
  const location = useLocation();

  const navItems = [
    { path: '/events', label: 'Events', icon: '📅' },
    { path: '/timeclock', label: 'Timeclock', icon: '⏱️' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <FloatingNavBar>
      {navItems.map((item) => (
        <NavItem
          key={item.path}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          <NavIcon>{item.icon}</NavIcon>
          {item.label}
        </NavItem>
      ))}
    </FloatingNavBar>
  );
}

export default BottomNavBar;
