/**
 * Page header (masthead) component with branding and user toolbar
 * Based on reference implementation pattern
 */

import React from 'react';
import {
  Masthead,
  MastheadMain,
  MastheadToggle,
  MastheadBrand,
  MastheadContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Title,
} from '@patternfly/react-core';
import { PageToggleButton } from '@patternfly/react-core';
import BarsIcon from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import UserAvatarDropdown from './UserAvatarDropdown';
import redhatLogo from '../assets/redhat.svg?url';

/**
 * Brand component - displays Red Hat logo and product name
 */
const Brand: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'top', gap: '8px' }}>
      <img src={redhatLogo} alt="Red Hat" style={{ height: 24 }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Title headingLevel="h2" size="md">
          <strong>Red Hat</strong>
        </Title>
        <Title headingLevel="h6" size="md">
          Trusted Profile
        </Title>
        <Title headingLevel="h6" size="md">
          Analyzer ExploitIQ
        </Title>
      </div>
    </div>
  );
};

interface PageHeaderProps {
  isSidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ isSidebarOpen, onSidebarToggle }) => {
  const headerToolbar = (
    <Toolbar id="toolbar" isFullHeight isStatic>
      <ToolbarContent>
        <ToolbarGroup
          variant="action-group-plain"
          align={{ default: 'alignEnd' }}
          gap={{ default: 'gapNone', md: 'gapMd' }}
        >
          <ToolbarItem
            visibility={{
              default: 'hidden',
              md: 'visible',
              lg: 'hidden',
            }}
          />
          <ToolbarItem
            visibility={{
              md: 'hidden',
            }}
          />
        </ToolbarGroup>
        <ToolbarItem
          visibility={{
            default: 'hidden',
            md: 'visible',
          }}
        >
          <UserAvatarDropdown />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  return (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label="Global navigation"
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={onSidebarToggle}
            id="vertical-nav-toggle"
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <Brand />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{headerToolbar}</MastheadContent>
    </Masthead>
  );
};

export default PageHeader;

