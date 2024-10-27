import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCalendarAlt, FaClock, FaUserCircle, FaBook } from 'react-icons/fa';

const NavBarContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  background-color: white;
  padding: 0.5rem;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 100vw;
  overflow-x: auto;

  /* Add responsive adjustments */
  @media (max-width: 480px) {
    padding: 0.5rem 0.25rem;
    gap: 0.5rem;
    justify-content: space-between;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #6c757d;
  font-size: 0.9rem;
  transition: color 0.3s ease;

  svg {
    font-size: 1.5rem;
    margin-bottom: 5px;
  }

  &.active {
    color: #007bff;
  }
`;

const BottomNavBar: React.FC = () => {
  return (
    <NavBarContainer>
      <NavItem to="/events">
        <FaCalendarAlt />
        Events
      </NavItem>
      <NavItem to="/timeclock">
        <FaClock />
        Timeclock
      </NavItem>
      <NavItem to="/training">
        <FaBook />
        Training
      </NavItem>
      <NavItem to="/profile">
        <FaUserCircle />
        Profile
      </NavItem>
    </NavBarContainer>
  );
};

export default BottomNavBar;
