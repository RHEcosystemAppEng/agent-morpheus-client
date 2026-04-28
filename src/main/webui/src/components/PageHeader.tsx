// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
  Flex,
  Stack,
  FlexItem,
} from '@patternfly/react-core';
import { PageToggleButton } from '@patternfly/react-core';
import BarsIcon from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import UserAvatarDropdown from './UserAvatarDropdown';

/**
 * Brand component - displays Red Hat logo and product name
 */
const Brand: React.FC = () => {
  return (
    <Flex gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsFlexStart" }}>
      <FlexItem>
          <img 
            src="/redhat.svg" 
            alt="Red Hat" 
            style={{ height: "var(--pf-t--global--spacer--lg)" }}
            aria-label="Red Hat logo"
          />
      </FlexItem>          
      <FlexItem>
        <Stack>
          <Title headingLevel="h6" >
          <strong>Red Hat</strong>
          </Title>
          <Title headingLevel="h6">
            exploit  
          </Title>
          <Title headingLevel="h6">
            intelligence
          </Title>
        </Stack>
      </FlexItem>
    </Flex>
  );
};

interface PageHeaderProps {
  isSidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ isSidebarOpen, onSidebarToggle }) => {
  const headerToolbar = (
    <Toolbar 
      id="toolbar" 
      isFullHeight 
      isStatic
      aria-label="Page header toolbar"
    >
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
        <MastheadBrand aria-label="Red Hat Trusted Profile Analyzer ExploitIQ">
          <Brand />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent aria-label="Page header content">
        {headerToolbar}
      </MastheadContent>
    </Masthead>
  );
};

export default PageHeader;

