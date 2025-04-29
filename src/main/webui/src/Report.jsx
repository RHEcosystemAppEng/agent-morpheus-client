import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteReport, viewReport } from "./services/ReportClient";
import { getComments } from "./services/VulnerabilityClient";
import { Breadcrumb, BreadcrumbItem, Button, Divider, EmptyState, EmptyStateBody, Flex, Grid, GridItem, PageSection, Panel, Skeleton, Content, ContentVariants, getUniqueId, List, ListComponent, ListItem, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, DescriptionList, Label, Title } from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import JustificationBanner from "./components/JustificationBanner";
import CvssBanner from "./components/CvssBanner";
import { ConfirmationButton } from "./components/ConfirmationButton";
import { getMetadataColor } from "./Constants";

export default function Report() {

  const params = useParams();
  const [report, setReport] = React.useState({});
  const [errorReport, setErrorReport] = React.useState({});
  const [comments, setComments] = React.useState({});
  const [name, setName] = React.useState();
  const navigate = useNavigate();

  React.useEffect(() => {
    viewReport(params.id)
      .then(r => {

        setReport(r);
        setReportComments(r);
        setName(r.input.scan.id);
      })
      .then(r => setReportComments(r))
      .catch(e => setErrorReport(e));
  }, []);

  const onDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${name}.json`;
    document.body.appendChild(element);
    element.click();
  }

  const time_meta_fields = [
    "submitted_at",
    "sent_at"
  ];

  const time_scan_fields = [
    "started_at",
    "completed_at"
  ];

  const timestamp_labels = {
    "submitted_at": "Submitted",
    "sent_at": "Sent",
    "started_at": "Started",
    "completed_at": "Completed"
  };

  const onDelete = () => {
    deleteReport(params.id).then(() => navigate('/reports'));
  }

  const setReportComments = (report) => {
    report.input.scan.vulns.forEach(v => {
      getComments(v.vuln_id).then(c => {
        setComments(prevState => ({
          ...prevState,
          [v.vuln_id]: c,
        }));
      });
    });
  }

  const showReport = () => {
    if (errorReport.status !== undefined) {
      if (errorReport.status === 404) {
        return <EmptyState headingLevel="h4" icon={CubesIcon} titleText="Report not found">
          <EmptyStateBody>
            The selected report with id: {params.id} has not been found. Go back to the reports page and select a different one.
          </EmptyStateBody>
        </EmptyState>;
      } else {
        return <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Could not retrieve the selected report">
          <EmptyStateBody>
            <p>{errorReport.status}: {errorReport.message}</p>
            The selected report with id: {params.id} could not be retrieved. Go back to the reports page and select a different one.
          </EmptyStateBody>
        </EmptyState>;
      }
    }

    if (report.input === undefined) {
      return <>
        <Skeleton screenreaderText="Loading contents" />
        <br />
        <Skeleton width="40%" screenreaderText="Loading contents" />
        <Skeleton width="35%" screenreaderText="Loading contents" />
        <br />
        <Skeleton screenreaderText="Loading contents" />
        <br />
        <Skeleton screenreaderText="Loading contents" />
        <br />
        <Divider />
        <br />
        <Skeleton width="10%" screenreaderText="Loading contents" />
        <br />
        <Skeleton screenreaderText="Loading contents" />
        <Skeleton screenreaderText="Loading contents" />
      </>;
    }

    const image = report.input.image
    const output = report.output;
    let metadata = [];
    let timestamps = [];
    if (report.metadata !== undefined) {
      Object.keys(report.metadata).forEach(k => {
        if (time_meta_fields.includes(k)) {
          timestamps.push({ key: k, value: report.metadata[k]["$date"] });
        } else {
          metadata.push({ key: k, value: report.metadata[k] });
        }
      });
    }
    time_scan_fields.forEach(field => {
      if(report.input.scan[field] !== undefined) {
        timestamps.push({ key: field, value: report.input.scan[field] });
      }
    });

    return <Grid hasGutter>
      <Content component="h1">{name}</Content>
      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>Image</DescriptionListTerm>
          <DescriptionListDescription><Link to={`/reports?imageName=${image.name}`}>{image.name}</Link></DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Tag</DescriptionListTerm>
          <DescriptionListDescription><Link to={`/reports?imageTag=${image.tag}`}>{image.tag}</Link></DescriptionListDescription>
        </DescriptionListGroup>
        {
          timestamps.map(k => {
            return <DescriptionListGroup>
              <DescriptionListTerm>{timestamp_labels[k.key]}</DescriptionListTerm>
              <DescriptionListDescription>{k.value}</DescriptionListDescription>
            </DescriptionListGroup>
          })
        }
        <DescriptionListGroup>
          <DescriptionListTerm>Metadata</DescriptionListTerm>
          <DescriptionListDescription>{metadata?.map(k => <Label onClick={() => navigate(`/reports?${k.key}=${k.value}`)} color={getMetadataColor(k.key)}>{k.key}:{k.value}</Label>)}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      {output?.map((vuln, v_idx) => {
        const uid = getUniqueId();
        let userComments = '';
        if(comments[vuln.vuln_id] !== undefined) {
          userComments = <DescriptionListGroup>
          <DescriptionListTerm>User comments</DescriptionListTerm>
          <DescriptionListDescription>{comments[vuln.vuln_id]}</DescriptionListDescription>
        </DescriptionListGroup>
        }
        return <>
            <Title headingLevel="h2" size="lg">
              <Link to={`/reports?vulnId=${vuln.vuln_id}`} style={{ color: "black"}}>
                {vuln.vuln_id}
              </Link>
              <JustificationBanner justification={vuln.justification} />
            </Title>
            <DescriptionList isHorizontal isCompact>
              {userComments}
              <DescriptionListGroup>
                <DescriptionListTerm>Reason</DescriptionListTerm>
                <DescriptionListDescription>{vuln.justification.reason}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Summary</DescriptionListTerm>
                <DescriptionListDescription>{vuln.summary}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>CVSS Score</DescriptionListTerm>
                <DescriptionListDescription><CvssBanner cvss={vuln.cvss ?? null} /></DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            <Content component="h2">Checklist:</Content>
            <List component={ListComponent.ol}>
              {vuln.checklist.map((item, i_idx) => {
                return <ListItem className="pf-v6-u-pt-m" key={`${v_idx}_${i_idx}`}>
                  <Content key={`${v_idx}_${i_idx}_question`} component={ContentVariants.dt}>Q: {item.input}</Content>
                  <Content key={`${v_idx}_${i_idx}_response`} component={ContentVariants.dd}>A: {item.response}</Content>
                </ListItem>
              })}
            </List></>
      })}
      <GridItem>
        <Flex columnGap={{ default: 'columnGapSm' }}>
          <Button variant="secondary" onClick={onDownload}>Download</Button>
          <ConfirmationButton btnVariant="danger"
            onConfirm={() => onDelete()}
            message={`The report with id: ${name} will be permanently deleted.`}>Delete</ConfirmationButton>
          <Button variant="primary" onClick={() => navigate(-1)}>Back</Button>
        </Flex>
      </GridItem>
    </Grid>
  }
  return <PageSection hasBodyWrapper={false} >
    <Breadcrumb>
      <BreadcrumbItem to="#/reports">Reports</BreadcrumbItem>
      <BreadcrumbItem>{params.id}</BreadcrumbItem>
    </Breadcrumb>
    {showReport()}
  </PageSection>;

}