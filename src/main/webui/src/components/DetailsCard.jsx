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
              <DescriptionListTerm>Image</DescriptionListTerm>
              <DescriptionListDescription>
                <Link to={`/reports?imageName=${image.name}`}>{image.name}</Link>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Tag</DescriptionListTerm>
              <DescriptionListDescription>
                <Link to={`/reports?imageTag=${image.tag}`}>{image.tag}</Link>
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