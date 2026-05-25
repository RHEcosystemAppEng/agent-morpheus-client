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

import { useLocation, useNavigate } from "react-router";
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  TabContent,
  TabContentBody,
} from "@patternfly/react-core";
import SbomsTable from "./SbomsTable";
import SingleRepositoriesTable from "./SingleRepositoriesTable";
import RpmRepositoriesTable from "./RpmRepositoriesTable";

const TAB_CONTENT_0 = "reports-tab-content-0";
const TAB_CONTENT_1 = "reports-tab-content-1";
const TAB_CONTENT_2 = "reports-tab-content-2";

const ReportsPageContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  let activeTabKey = 0;
  if (location.pathname === "/reports/single-repositories") {
    activeTabKey = 1;
  } else if (location.pathname === "/reports/rpm") {
    activeTabKey = 2;
  }

  const handleTabClick = (
    _event: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>,
    tabIndex: string | number
  ) => {
    const idx = typeof tabIndex === "string" ? parseInt(tabIndex, 10) : tabIndex;
    if (idx === 0) navigate("/reports");
    else if (idx === 1) navigate("/reports/single-repositories");
    else if (idx === 2) navigate("/reports/rpm");
  };

  return (
    <>
      <PageSection type="tabs" aria-label="Reports navigation tabs">
        <Tabs
          activeKey={activeTabKey}
          onSelect={handleTabClick}
          usePageInsets
          id="reports-tabs"
        >
          <Tab
            eventKey={0}
            title={<TabTitleText>SBOMs</TabTitleText>}
            tabContentId={TAB_CONTENT_0}
          />
          <Tab
            eventKey={1}
            title={<TabTitleText>Single Repositories</TabTitleText>}
            tabContentId={TAB_CONTENT_1}
          />
          <Tab
            eventKey={2}
            title={<TabTitleText>RPM</TabTitleText>}
            tabContentId={TAB_CONTENT_2}
          />
        </Tabs>
      </PageSection>
      <PageSection aria-label="Reports content">
        <TabContent
          key={0}
          eventKey={0}
          id={TAB_CONTENT_0}
          activeKey={activeTabKey}
          hidden={0 !== activeTabKey}
        >
          <TabContentBody>
            {activeTabKey === 0 && <SbomsTable />}
          </TabContentBody>
        </TabContent>
        <TabContent
          key={1}
          eventKey={1}
          id={TAB_CONTENT_1}
          activeKey={activeTabKey}
          hidden={1 !== activeTabKey}
        >
          <TabContentBody>
            {activeTabKey === 1 && <SingleRepositoriesTable />}
          </TabContentBody>
        </TabContent>
        <TabContent
          key={2}
          eventKey={2}
          id={TAB_CONTENT_2}
          activeKey={activeTabKey}
          hidden={2 !== activeTabKey}
        >
          <TabContentBody>
            {activeTabKey === 2 && <RpmRepositoriesTable />}
          </TabContentBody>
        </TabContent>
      </PageSection>
    </>
  );
};

export default ReportsPageContent;
