import { Card, CardTitle, CardBody, DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, Flex, FlexItem, Title } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import CvssBanner from "./CvssBanner";
import CveStatus from "./CveStatus";
import IntelReliabilityScore from "./IntelReliabilityScore";
/** @typedef {import('../types').Report} Report */
/** @typedef {import('../types').Vuln} Vuln */

/**
 * @param {Object} props
 * @param {Report} props.report
 */
export default function DetailsCard({ report }) {
  const image = report.input.image;
  const sourceInfo = image?.source_info || [];
  const codeSource = Array.isArray(sourceInfo) ? sourceInfo.find(s => s?.type === 'code') : undefined;
  const codeRepository = codeSource?.git_repo;
  const codeTag = codeSource?.ref;
  const output = report.output;
  const vuln = output?.[0] || {};
  const intelScore = vuln?.intel_score;
  return (
    <Card>
      <CardTitle><Title headingLevel="h4" size="xl">CVE repository report details</Title></CardTitle>
      <CardBody>
        {vuln && (
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>CVE</DescriptionListTerm>
              <DescriptionListDescription>
                <Flex>
                  <FlexItem>
                    <Link to={`/reports?vulnId=${vuln.vuln_id}`}>{vuln.vuln_id}</Link>
                  </FlexItem>
                  <FlexItem>
                    <CveStatus vuln={vuln} />
                  </FlexItem>
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Repository</DescriptionListTerm>
              <DescriptionListDescription>
                {codeRepository ? (
                  <a href={codeRepository} target="_blank" rel="noreferrer">{codeRepository}</a>
                ) : (
                  image?.name
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Commit ID</DescriptionListTerm>
              <DescriptionListDescription>
                {codeRepository && codeTag ? (
                  <a href={`${(codeRepository.endsWith('/') ? codeRepository.slice(0, -1) : codeRepository)}/commit/${codeTag}`} target="_blank" rel="noreferrer">{codeTag}</a>
                ) : (
                  image?.tag
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>CVSS Score</DescriptionListTerm>
              <DescriptionListDescription><CvssBanner cvss={vuln.cvss ?? null} /></DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Intel Reliability Score</DescriptionListTerm>
              <DescriptionListDescription>
                <IntelReliabilityScore score={intelScore} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Reason</DescriptionListTerm>
              <DescriptionListDescription>{vuln.justification?.reason}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Summary</DescriptionListTerm>
              <DescriptionListDescription>{vuln.summary}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        )}
      </CardBody>
    </Card>
  );
} 