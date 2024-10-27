import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCalendarAlt, FaClock, FaUser, FaGraduationCap } from 'react-icons/fa';

const NavBar = styled.nav`
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
      <NavItem to="/training">
        <FaGraduationCap />
        Training
      </NavItem>
      <NavItem to="/profile">
        <FaUser />
        Profile
      </NavItem>
    </NavBar>
  );
};

export default BottomNavBar;
