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

import type { ReactNode } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  Content,
} from "@patternfly/react-core";
import { Link } from "react-router";
import ReactMarkdown from "react-markdown";
import type { FullReport } from "../types/FullReport";
import Finding from "./Finding";
import IntelReliabilityScore from "./IntelReliabilityScore";
import NotAvailable from "./NotAvailable";
import { getFindingForReportRow } from "../utils/findingDisplay";
import { findAnalysisRowForRouteCve } from "../utils/repositoryReport";

export const DEFAULT_REPOSITORY_REPORT_DETAILS_CARD_TITLE =
  "CVE repository report details";

export const RPM_REPOSITORY_REPORT_DETAILS_CARD_TITLE =
  "CVE RPM Report Details";

interface DetailsCardProps {
  report: FullReport;
  cveId: string;
  reportId: string;
  productId?: string;
  /** Report analysis state from API (e.g. completed, pending); used with justification to match table Finding column. */
  analysisState?: string;
  /** When true (failed or expired API status), show failure UI; omit agent output fields; CVE line shows Failed like Finding */
  isFailed?: boolean;
  /**
   * Artifact rows after **CVE** (e.g. {@link ContainerRepositoryArtifactDetails} or {@link RpmTargetPackageArtifactDetails}).
   */
  artifactDetails: ReactNode;
  /** Card heading; defaults to {@link DEFAULT_REPOSITORY_REPORT_DETAILS_CARD_TITLE}. */
  cardTitle?: string;
}

const DetailsCard: React.FC<DetailsCardProps> = ({
  report,
  cveId,
  reportId,
  productId,
  analysisState,
  isFailed = false,
  artifactDetails,
  cardTitle = DEFAULT_REPOSITORY_REPORT_DETAILS_CARD_TITLE,
}) => {
  const outputVuln = findAnalysisRowForRouteCve(report, cveId);
  const finding = getFindingForReportRow(
    analysisState ?? "",
    outputVuln?.justification?.status,
  );

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          {cardTitle}
        </Title>
      </CardTitle>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Finding</DescriptionListTerm>
            <DescriptionListDescription>
              {finding ? <Finding finding={finding} /> : <NotAvailable />}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {isFailed && (
            <DescriptionListGroup>
              <DescriptionListTerm>Failure reason</DescriptionListTerm>
              <DescriptionListDescription>
                {report.error?.message ?? <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          <DescriptionListGroup>
            <DescriptionListTerm>CVE</DescriptionListTerm>
            <DescriptionListDescription>
              <Link
                to={
                  productId
                    ? `/reports/product/cve/${productId}/${cveId}/${reportId}`
                    : `/reports/component/cve/${cveId}/${reportId}`
                }
              >
                {cveId}
              </Link>
            </DescriptionListDescription>
          </DescriptionListGroup>
          {artifactDetails}
          {!isFailed && (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  Intel Reliability Score
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <IntelReliabilityScore score={outputVuln?.intel_score} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Justification</DescriptionListTerm>
                <DescriptionListDescription>
                  {outputVuln?.justification?.label?.trim() ? (
                    outputVuln.justification.label
                  ) : (
                    <NotAvailable />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Reason</DescriptionListTerm>
                <DescriptionListDescription>
                  {outputVuln?.justification?.reason ? (
                    <Content>
                      <ReactMarkdown>
                        {outputVuln.justification.reason}
                      </ReactMarkdown>
                    </Content>
                  ) : (
                    <NotAvailable />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Summary</DescriptionListTerm>
                <DescriptionListDescription>
                  {outputVuln?.summary ? (
                    <Content>
                      <ReactMarkdown>{outputVuln.summary}</ReactMarkdown>
                    </Content>
                  ) : (
                    <NotAvailable />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default DetailsCard;
