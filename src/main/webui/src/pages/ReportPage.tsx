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

import { useMemo } from "react";
import { useParams, Link } from "react-router";
import {
  PageSection,
  Grid,
  GridItem,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  Title,
} from "@patternfly/react-core";
import { useReport } from "../hooks/useReport";
import ReportDetails from "../components/ReportDetails";
import ReportAdditionalDetails from "../components/ReportAdditionalDetails";
import ReportCveStatusPieChart from "../components/ReportCveStatusPieChart";
import ReportComponentStatesPieChart from "../components/ReportComponentStatesPieChart";
import RepositoryReportsTable from "../components/RepositoryReportsTable";
import ReportPageSkeleton from "../components/ReportPageSkeleton";
import { getErrorMessage } from "../utils/errorHandling";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  pageTitleProductReport,
  pageTitleReportInvalidParams,
  pageTitleReportLoadError,
  pageTitleReportLoading,
} from "./pageTitles";

const REPORT_CARD_HEIGHT = "15rem";

const ReportPage: React.FC = () => {
  const { productId, cveId } = useParams<{ productId: string; cveId: string }>();

  const { data, loading, error } = useReport(productId);

  const documentTitle = useMemo(() => {
    if (!productId || !cveId) {
      return pageTitleReportInvalidParams();
    }
    if (loading) {
      return pageTitleReportLoading(productId, cveId);
    }
    if (error) {
      return pageTitleReportLoadError(productId, cveId);
    }
    if (!data) {
      return pageTitleReportLoadError(productId, cveId);
    }
    return pageTitleProductReport(data.data.name, cveId);
  }, [productId, cveId, loading, error, data]);

  useDocumentTitle(documentTitle);

  if (loading) {
    return <ReportPageSkeleton />;
  }

  if (!productId || !cveId) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Invalid report">
          Invalid page parameters. Should be /reports/product/:productId/:cveId.
        </Alert>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Error loading report">
          {getErrorMessage(error)}
        </Alert>
      </PageSection>
    );
  }

  if (!data) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Report not found">
          Unexpected error: API returned no data.          
        </Alert>
      </PageSection>
    );
  }
  const productName = data.data.name;
  const breadcrumbText = `${productName}/${cveId}`;  

  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/reports">Reports</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{breadcrumbText}</BreadcrumbItem>
            </Breadcrumb>
          </GridItem>
          <GridItem>                          
            <Title headingLevel="h1" size="2xl">
              <strong>Report:</strong> {breadcrumbText}
            </Title>                                       
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <ReportDetails product={data} cveId={cveId} cardHeight={REPORT_CARD_HEIGHT} />
          </GridItem>
          <GridItem span={6}>
            <ReportAdditionalDetails product={data} cardHeight={REPORT_CARD_HEIGHT} />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <ReportComponentStatesPieChart product={data} cardHeight={REPORT_CARD_HEIGHT} />
          </GridItem>
          <GridItem span={6}>
            <ReportCveStatusPieChart product={data} cveId={cveId} cardHeight={REPORT_CARD_HEIGHT} />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <RepositoryReportsTable cveId={cveId} product={data} />
      </PageSection>
    </>
  );
};

export default ReportPage;
