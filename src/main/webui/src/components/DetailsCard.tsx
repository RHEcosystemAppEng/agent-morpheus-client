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
} from "@patternfly/react-core";
import type { FullReport } from "../types/FullReport";
import CvssBanner from "./CvssBanner";
import CveStatus from "./CveStatus";
import IntelReliabilityScore from "./IntelReliabilityScore";
import NotAvailable from "./NotAvailable";
import ReportStatusLabel from "./ReportStatusLabel";

interface DetailsCardProps {
  report: FullReport;
  cveId: string;
  analysisState?: string;
  analysisStateLoading?: boolean;
}

const DetailsCard: React.FC<DetailsCardProps> = ({
  report,
  cveId,
  analysisState
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
  const outputVuln = output.find((v) => v.vuln_id === cveId);``

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
              <DescriptionListTerm>Analysis State</DescriptionListTerm>
              <DescriptionListDescription>
                <ReportStatusLabel state={analysisState} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>CVE</DescriptionListTerm>
              <DescriptionListDescription>
                <Flex>
                  <FlexItem>
                    {vuln.vuln_id}
                  </FlexItem>
                  <FlexItem>
                    {outputVuln?.justification?.status ? (
                      <CveStatus status={outputVuln.justification.status} />
                    ) : (
                      <NotAvailable />
                    )}
                  </FlexItem>
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Repository</DescriptionListTerm>
              <DescriptionListDescription>
                {codeRepository ? (
                  <a
                    href={codeRepository}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {codeRepository}
                  </a>
                ) : (
                  image?.name
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Commit ID</DescriptionListTerm>
              <DescriptionListDescription>
                {codeRepository && codeTag ? (
                  <a
                    href={`${
                      codeRepository.endsWith("/")
                        ? codeRepository.slice(0, -1)
                        : codeRepository
                    }/commit/${codeTag}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {codeTag}
                  </a>
                ) : (
                  image?.tag
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>CVSS Score</DescriptionListTerm>
              <DescriptionListDescription>
                <CvssBanner cvss={outputVuln?.cvss ?? null} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Intel Reliability Score</DescriptionListTerm>
              <DescriptionListDescription>
                <IntelReliabilityScore score={outputVuln?.intel_score} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Reason</DescriptionListTerm>
              <DescriptionListDescription>
                {outputVuln?.justification?.reason || <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Summary</DescriptionListTerm>
              <DescriptionListDescription>
                {outputVuln?.summary || <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        )}
      </CardBody>
    </Card>
  );
};

export default DetailsCard;

