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
import CvssBanner from "./CvssBanner";
import Finding from "./Finding";
import IntelReliabilityScore from "./IntelReliabilityScore";
import NotAvailable from "./NotAvailable";
import { getFindingForReportRow } from "../utils/findingDisplay";
import { getPullImageReference } from "../utils/containerImageReference";

/** Base URL for .../commit/{ref} links: no trailing slash or `.git` suffix. */
function normalizeRepoBaseForCommitLink(repo: string): string {
  let s = repo;
  while (s.endsWith("/")) {
    s = s.slice(0, -1);
  }
  if (s.endsWith(".git")) {
    s = s.slice(0, -".git".length);
  }
  while (s.endsWith("/")) {
    s = s.slice(0, -1);
  }
  return s;
}

interface DetailsCardProps {
  report: FullReport;
  cveId: string;
  reportId: string;
  productId?: string;
  /** Report analysis state from API (e.g. completed, pending); used with justification to match table Finding column. */
  analysisState?: string;
  /** When true (failed or expired API status), show failure UI; omit agent output fields; CVE line shows Failed like Finding */
  isFailed?: boolean;
}

const DetailsCard: React.FC<DetailsCardProps> = ({
  report,
  cveId,
  reportId,
  productId,
  analysisState,
  isFailed = false,
}) => {
  const image = report.input?.image;
  const sourceInfo = image?.source_info || [];
  const codeSource = Array.isArray(sourceInfo)
    ? sourceInfo.find((s) => s?.type === "code")
    : undefined;
  const codeRepository = codeSource?.git_repo;
  const codeRef = codeSource?.ref;
  const repositorySnapshotUrl =
    codeRepository && codeRef
      ? `${normalizeRepoBaseForCommitLink(codeRepository)}/commit/${codeRef}`
      : undefined;
  const imagePullRef = getPullImageReference(image);
  const output = report.output?.analysis || [];
  const vuln = report.input?.scan?.vulns?.find((v) => v.vuln_id === cveId);
  const outputVuln = output.find((v) => v.vuln_id === cveId);
  const finding = getFindingForReportRow(
    analysisState ?? "",
    outputVuln?.justification?.status,
  );

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          CVE repository report details
        </Title>
      </CardTitle>
      <CardBody>
        {vuln && (
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
                      {vuln.vuln_id}
                    </Link>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Repository URL</DescriptionListTerm>
              <DescriptionListDescription>
                {repositorySnapshotUrl ? (
                  <a
                    href={repositorySnapshotUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {repositorySnapshotUrl}
                  </a>
                ) : codeRepository ? (
                  <a href={codeRepository} target="_blank" rel="noreferrer">
                    {codeRepository}
                  </a>
                ) : (
                  <NotAvailable />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Image</DescriptionListTerm>
              <DescriptionListDescription>
                {imagePullRef ?? <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {!isFailed && (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>CVSS Score</DescriptionListTerm>
                  <DescriptionListDescription>
                    <CvssBanner cvss={outputVuln?.cvss ?? null} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    Intel Reliability Score
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    <IntelReliabilityScore score={outputVuln?.intel_score} />
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
        )}
      </CardBody>
    </Card>
  );
};

export default DetailsCard;
