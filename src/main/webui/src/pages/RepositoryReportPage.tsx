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
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Title,
  Grid,
  GridItem,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Alert,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { useRepositoryReport } from "../hooks/useRepositoryReport";
import { getErrorMessage } from "../utils/errorHandling";
import { isFailingState } from "../utils/findingDisplay";
import DetailsCard, {
  RPM_REPOSITORY_REPORT_DETAILS_CARD_TITLE,
} from "../components/DetailsCard";
import ChecklistCard from "../components/ChecklistCard";
import RepositoryAdditionalDetailsCard from "../components/RepositoryAdditionalDetailsCard";
import RepositoryReportPageSkeleton from "../components/RepositoryReportPageSkeleton";
import DownloadDropdown from "../components/DownloadVex";
import FeedbackReportCard from "../components/FeedbackReportCard";
import { getReportSummaryForFeedback } from "../utils/feedbackReportSummary";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  pageTitleRepositoryReport,
  pageTitleRepositoryReportInvalidUrl,
  pageTitleRepositoryReportLoadError,
  pageTitleRepositoryReportNotFound,
} from "./pageTitles";
import {
  formatRpmRepositoryReportDocumentTitleSuffix,
  getRpmPackageSourceUrl,
  isRpmPackageCheckerReport,
  repositoryReportSubtitleDisplay,
} from "../utils/rpmReport";
import { findAnalysisRowForRouteCve } from "../utils/repositoryReport";
import VulnerabilityPatchDetailsSection from "../components/VulnerabilityPatchDetailsSection";
import { RpmTargetPackageArtifactDetails } from "../components/RpmTargetPackageArtifactDetails";
import { ContainerRepositoryArtifactDetails } from "../components/ContainerRepositoryArtifactDetails";

interface RepositoryReportPageErrorProps {
  title: string;
  message: string | React.ReactNode;
}

const RepositoryReportPageError: React.FC<RepositoryReportPageErrorProps> = ({
  title,
  message,
}) => {
  return (
    <PageSection>
      <EmptyState
        headingLevel="h4"
        icon={ExclamationCircleIcon}
        titleText={title}
      >
        <EmptyStateBody>{message}</EmptyStateBody>
      </EmptyState>
    </PageSection>
  );
};


interface RepositoryReportPageApiErrorProps {
  error: Error;
  reportId: string;
}

const RepositoryReportPageApiError: React.FC<
  RepositoryReportPageApiErrorProps
> = ({ error, reportId }) => {
  const errorStatus = (error as { status?: number })?.status;
  const title =
    errorStatus === 404
      ? "Report not found"
      : "Could not retrieve the selected report";
  const message =
    errorStatus === 404 ? (
      `The selected report with id: ${reportId} has not been found.`
    ) : (
      <>
        <p>
          {errorStatus || "Error"}: {getErrorMessage(error)}
        </p>
        The selected report with id: {reportId} could not be retrieved.
      </>
    );

  return <RepositoryReportPageError title={title} message={message} />;
};

const RepositoryReportPage: React.FC = () => {
  // Support both new routes: /reports/product/:productId/:cveId/:reportId and /reports/component/:cveId/:reportId
  const params = useParams<{
    productId?: string;
    cveId: string;
    reportId: string;
  }>();

  const { productId, cveId, reportId } = params;
  const {
    data: report,
    status,
    loading,
    error,
  } = useRepositoryReport(reportId || "");

  const feedbackAiSummary = useMemo(
    () => (report ? getReportSummaryForFeedback(report) : ""),
    [report]
  );

  const documentTitle = useMemo(() => {
    if (!cveId) {
      return pageTitleRepositoryReportInvalidUrl();
    }
    if (loading) {
      return pageTitleRepositoryReport(cveId);
    }
    if (error) {
      const errorStatus = (error as { status?: number })?.status;
      return errorStatus === 404
        ? pageTitleRepositoryReportNotFound(reportId || "")
        : pageTitleRepositoryReportLoadError();
    }
    if (!report) {
      return pageTitleRepositoryReportNotFound(reportId || "");
    }
    const image = report.input?.image;
    const rpmId = isRpmPackageCheckerReport(report)
      ? formatRpmRepositoryReportDocumentTitleSuffix(image?.target_package)
      : undefined;
    return pageTitleRepositoryReport(
      cveId,
      image?.name,
      image?.tag,
      rpmId,
    );
  }, [cveId, loading, error, report, reportId]);

  useDocumentTitle(documentTitle);

  if (!cveId) {
    return (
      <RepositoryReportPageError
        title="Invalid URL format"
        message={`URL is invalid. Please use the format /reports/product/:productId/:cveId/:reportId or /reports/component/:cveId/:reportId.`}
      />
    );
  }

  if (loading) {
    return <RepositoryReportPageSkeleton />;
  }

  if (error) {
    return (
      <RepositoryReportPageApiError error={error} reportId={reportId || ""} />
    );
  }

  if (!report) {
    return (
      <RepositoryReportPageError
        title="Report not found"
        message={`The selected report with id: ${reportId} has not been found.`}
      />
    );
  }

  const outputVuln = findAnalysisRowForRouteCve(report, cveId);
  const isRpm = isRpmPackageCheckerReport(report);
  /** Terminal analysis failure: same UI as Finding "failed" (failed or expired; details in error.message). */
  const isFailed = isFailingState(status ?? "");
  const reportIdDisplay = repositoryReportSubtitleDisplay(report, cveId);

  const showReport = () => {
    return (
      <Grid hasGutter>
        <GridItem>
          <Flex
            alignItems={{ default: "alignItemsFlexStart" }}
            flexWrap={{ default: "nowrap" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
          >
            <FlexItem>
              <Title headingLevel="h1">
                {isRpm ? "CVE RPM Report:" : "CVE Repository Report:"}{" "}
                <span
                  style={{
                    fontSize: "var(--pf-t--global--font--size--heading--h6)",
                  }}
                >
                  {reportIdDisplay}
                </span>
              </Title>
            </FlexItem>
            <FlexItem>
              <DownloadDropdown
                report={report}
                analysisStatus={status}
                cveId={cveId}
                reportIdSegment={reportId || ""}
              />
            </FlexItem>
          </Flex>
        </GridItem>
        <GridItem>
          <Alert
            title="AI-generated report"
            variant="warning"
            isInline
            customIcon={
              <img
                src="/AI Icon.svg"
                alt="AI Icon"
                aria-hidden
                style={{
                  height: "1em",
                  width: "1em",
                  flexShrink: 0,
                  filter: "brightness(0)",
                }}
              />
            }
          >
            Always review AI generated content prior to use.
          </Alert>
        </GridItem>
        <GridItem>
          <DetailsCard
            report={report}
            cveId={cveId}
            reportId={reportId || ""}
            productId={productId}
            analysisState={status}
            isFailed={isFailed}
            cardTitle={
              isRpm ? RPM_REPOSITORY_REPORT_DETAILS_CARD_TITLE : undefined
            }
            artifactDetails={
              isRpm ? (
                <RpmTargetPackageArtifactDetails
                  targetPackage={report.input?.image?.target_package}
                  rpmPackageUrl={getRpmPackageSourceUrl(report)}
                />
              ) : (
                <ContainerRepositoryArtifactDetails
                  image={report.input?.image}
                />
              )
            }
          />
        </GridItem>
        {!isFailed && !isRpm && (
          <GridItem>
            <ChecklistCard vuln={outputVuln} />
          </GridItem>
        )}
        {!isFailed && outputVuln?.details?.trim() && (
          <GridItem>
            <VulnerabilityPatchDetailsSection detailsMarkdown={outputVuln.details} />
          </GridItem>
        )}
        <GridItem>
          <RepositoryAdditionalDetailsCard report={report} />
        </GridItem>
        {status === "completed" && (
          <GridItem>
            <FeedbackReportCard
              reportId={reportId || ""}
              aiResponse={feedbackAiSummary}
            />
          </GridItem>
        )}
      </Grid>
    );
  };

  return (
    <>
      <PageSection>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link
              to={
                report.metadata?.product_id
                  ? "/reports"
                  : isRpmPackageCheckerReport(report)
                    ? "/reports/rpm"
                    : "/reports/single-repositories"
              }
            >
              {"Reports"}
            </Link>
          </BreadcrumbItem>
          {productId && (
            <BreadcrumbItem>
              <Link to={`/reports/product/${productId}/${cveId}`}>
                {productId}
              </Link>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem isActive>{reportIdDisplay}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection>{showReport()}</PageSection>
    </>
  );
};

export default RepositoryReportPage;
