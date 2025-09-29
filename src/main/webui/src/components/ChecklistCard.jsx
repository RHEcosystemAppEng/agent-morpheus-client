/** @typedef {import('../types').Vuln} Vuln */
import { Card, CardHeader, CardTitle, CardBody, Grid, GridItem, Content, ContentVariants, Title} from "@patternfly/react-core";

/**
 * @param {{ vulns: Vuln[] }} props
 */
export default function ChecklistCard({ vulns }) {
  return (
    <Card>
      <CardTitle><Title headingLevel="h4" size="xl">Analysis Q&A</Title></CardTitle>
      <CardBody>
        {Array.isArray(vulns) && vulns.map((vuln, v_idx) => (
          Array.isArray(vuln.checklist) && vuln.checklist.length > 0 ? (
            <Grid hasGutter key={`checklist_${v_idx}`}>
              {vuln.checklist.map((item, i_idx) => (
                <GridItem key={`${v_idx}_${i_idx}`} span={12}>
                    <Card isCompact variant="secondary">
                      <CardHeader>
                        <CardTitle>{item.input}</CardTitle>
                      </CardHeader>
                      <CardBody >
                        <Content component={ContentVariants.p} style={{backgroundColor: 'white', padding: '7px'}}>
                          {item.response}
                        </Content>
                      </CardBody>
                    </Card>
                </GridItem>
              ))}
            </Grid>
          ) : null
        ))}
      </CardBody>
    </Card>
  );
} 