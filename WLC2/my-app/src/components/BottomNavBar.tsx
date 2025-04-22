import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCalendarAlt, FaClock, FaUserCircle, FaBook, FaComments } from 'react-icons/fa';

const NavBar = styled.nav`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 95%;
  max-width: 600px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  padding: 15px 10px;
  z-index: 1002;
  display: flex;
  justify-content: space-around;
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
    <NavBar>
      <NavItem to="/events">
        <FaCalendarAlt />
        Events
      </NavItem>
      <NavItem to="/timeclock">
        <FaClock />
        Timeclock
      </NavItem>
      <NavItem to="/chat">
        <FaComments />
        Chat
      </NavItem>
      <NavItem to="/training">
        <FaBook />
        Training
      </NavItem>
      <NavItem to="/profile">
        <FaUserCircle />
        Profile
      </NavItem>
    </NavBar>
  );
};

export default BottomNavBar;
