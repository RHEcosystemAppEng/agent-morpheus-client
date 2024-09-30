import { useNavigate, useParams } from "react-router-dom";
import { viewReport } from "./services/ReportClient";
import { Banner, Breadcrumb, BreadcrumbItem, Button, Divider, EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Grid, GridItem, PageSection, PageSectionVariants, Panel, PanelHeader, PanelMain, PanelMainBody, Text, TextContent, TextList, TextListItem, TextListItemVariants, TextListVariants, Title } from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

export default function Report() {

  const params = useParams()
  const navigate = useNavigate();
  const [report, setReport] = React.useState({});

  React.useEffect(() => {
    viewReport(params.id)
      .then(r => setReport(r));
  }, []);

  const showJustification = (justification) => {
    if(justification.status === "FALSE") {
      return <Banner variant="green">{justification.label}: {justification.reason}</Banner>
    }
    return  <Banner variant="red">{justification.label}: {justification.reason}</Banner>
  }

  const onDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${params.id}-output.json`;
    document.body.appendChild(element);
    element.click();
  }

  const showReport = () => {

    if (report.input === undefined) {
      return <EmptyState>
        <EmptyStateHeader titleText="No Report found" headingLevel="h4" icon={<EmptyStateIcon icon={CubesIcon} />} />
        <EmptyStateBody>
          The selected report with id: {params.id} has not been found. Go back to the reports page and select a different one.
        </EmptyStateBody>
      </EmptyState>
    }
    const scan = report.input.scan;
    const image = report.input.image
    const info = report.info;
    const output = report.output;

    return <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">{params.id}</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <Text><span className="pf-v5-u-font-weight-bold">Image:</span> {image.name}</Text>
        <Text><span className="pf-v5-u-font-weight-bold">Tag:</span> {image.tag}</Text>
      </GridItem>

      {output.map((vuln, v_idx) => {
        return <GridItem>
          <Panel>
            <PanelHeader>{vuln.vuln_id}</PanelHeader>
            <Divider />
            <PanelMain>
              <PanelMainBody>
                <TextList component={TextListVariants.ol}>
                  {vuln.checklist.map((item, i_idx) => {
                    return <TextListItem key={`${v_idx}_${i_idx}`}>
                      <TextList component={TextListVariants.dl}>
                        <TextListItem key={`${v_idx}_${i_idx}_question`} component={TextListItemVariants.dt}><Text className="pf-v5-u-font-weight-bold">Q: {item.input}</Text></TextListItem>
                        <TextListItem component={TextListItemVariants.dd}>A: {item.response}</TextListItem>
                      </TextList>
                    </TextListItem>
                  })}
                </TextList>
              </PanelMainBody>
            </PanelMain>
            <Text component="h3"><span className="pf-v5-u-font-weight-bold">Summary:</span> {vuln.summary}</Text>
            {showJustification(vuln.justification)}

          </Panel>
        </GridItem>
      })}
      <GridItem>
      <Button variant="secondary" onClick={onDownload}>Download</Button>
      </GridItem>
    </Grid>
  }
  return <PageSection variant={PageSectionVariants.light}>
    <Breadcrumb>
      <BreadcrumbItem className="pf-v5-u-primary-color-100" onClick={() => navigate("/reports")}>Reports</BreadcrumbItem>
      <BreadcrumbItem>{params.id}</BreadcrumbItem>
    </Breadcrumb>
    {showReport()}
  </PageSection>;

}