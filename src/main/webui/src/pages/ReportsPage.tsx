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

import { PageSection, Title } from "@patternfly/react-core";
import { useLocation } from "react-router";
import ReportsPageContent from "../components/ReportsPageContent";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  PAGE_TITLE_REPORTS_SBOMS,
  PAGE_TITLE_REPORTS_SINGLE_REPOSITORIES,
} from "./pageTitles";

const ReportsPage: React.FC = () => {
  const location = useLocation();
  const documentTitle =
    location.pathname === "/reports/single-repositories"
      ? PAGE_TITLE_REPORTS_SINGLE_REPOSITORIES
      : PAGE_TITLE_REPORTS_SBOMS;
  useDocumentTitle(documentTitle);

  return (
    <>
      <PageSection isWidthLimited aria-label="Reports header">
        <Title headingLevel="h1" size="2xl">
          Reports
        </Title>
        <p className="pf-v6-u-mt-sm">
          View comprehensive report for your product and their security analysis.
          Reports include CVE exploitability assessments, VEX status
          justifications, and detailed analysis summaries.
        </p>
      </PageSection>
      <ReportsPageContent />
    </>
  );
};

export default ReportsPage;
