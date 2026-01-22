import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Page, PageSection, PageSidebar } from '@patternfly/react-core';
import PageHeader from './PageHeader';
import Navigation from './Navigation';

/**
 * AppLayout component - provides the page structure with header, navigation, and outlet for content
 */
const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const sidebar = (
    <PageSidebar isSidebarOpen={isSidebarOpen} id="vertical-sidebar">
      <Navigation />
    </PageSidebar>
  );

  return (
    <Page
      masthead={<PageHeader isSidebarOpen={isSidebarOpen} onSidebarToggle={onSidebarToggle} />}
      sidebar={sidebar}
    >
      <PageSection>
        <Outlet />
      </PageSection>
    </Page>
  );
};

export default AppLayout;

