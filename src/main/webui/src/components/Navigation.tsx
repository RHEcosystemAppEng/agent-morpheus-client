import React from 'react';
import { Nav, NavList, NavItem, PageSidebarBody } from '@patternfly/react-core';
import { useNavigate, useLocation } from 'react-router';

/**
 * Navigation component with links to main application sections
 */
const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <PageSidebarBody>
      <Nav aria-label="Nav">
        <NavList>
          <NavItem
            itemId="home"
            isActive={location.pathname === '/'}
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            Home
          </NavItem>
          <NavItem
            itemId="view-reports"
            isActive={location.pathname === '/view-reports'}
            onClick={() => navigate('/view-reports')}
            style={{ cursor: 'pointer' }}
          >
            View Reports
          </NavItem>
        </NavList>
      </Nav>
    </PageSidebarBody>
  );
};

export default Navigation;

