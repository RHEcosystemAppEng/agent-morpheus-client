import React from 'react';
import { Nav, NavList, NavItem } from '@patternfly/react-core';
import { Link, useLocation } from 'react-router-dom';

/**
 * Navigation component with links to main application sections
 */
const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <Nav>
      <NavList>
        <NavItem itemId="home" isActive={location.pathname === '/'}>
          <Link to="/">Home</Link>
        </NavItem>
        <NavItem itemId="view-reports" isActive={location.pathname === '/view-reports'}>
          <Link to="/view-reports">View Reports</Link>
        </NavItem>
      </NavList>
    </Nav>
  );
};

export default Navigation;

