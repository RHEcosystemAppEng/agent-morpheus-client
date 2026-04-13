import {
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  Flex,
  FlexItem,
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
  const codeTag = codeSource?.ref;
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
            {finding && (
              <DescriptionListGroup>
                <DescriptionListTerm>Finding</DescriptionListTerm>
                <DescriptionListDescription>
                  <Finding finding={finding} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
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
              <Flex>
                  <FlexItem>
                    <Link
                      to={
                        productId
                          ? `/reports/product/cve/${productId}/${cveId}/${reportId}`
                          : `/reports/component/cve/${cveId}/${reportId}`
                      }
                    >
                      {vuln.vuln_id}
                    </Link>
                  </FlexItem>
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Repository</DescriptionListTerm>
              <DescriptionListDescription>
                {codeRepository ? (
                  <a href={codeRepository} target="_blank" rel="noreferrer">
                    {codeRepository}
                  </a>
                ) : (
                  <NotAvailable />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Commit ID</DescriptionListTerm>
              <DescriptionListDescription>
                {codeRepository && codeTag ? (
                  <a
                    href={`${normalizeRepoBaseForCommitLink(codeRepository)}/commit/${codeTag}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {codeTag}
                  </a>
                ) : (
                  <NotAvailable />
                )}
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
