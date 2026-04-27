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

import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Page, PageSidebar } from '@patternfly/react-core';
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
      <Outlet />
    </Page>
  );
};

export default AppLayout;

