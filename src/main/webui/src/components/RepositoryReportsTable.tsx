import { useState } from "react";
import {
  Pagination,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  Title,
  Label,
} from "@patternfly/react-core";
import { 
  Table,
  Thead,
  Tr, 
  Th, 
  Tbody, 
  Td 
} from "@patternfly/react-table"; 
import { CheckCircleIcon } from "@patternfly/react-icons";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import { useApi } from "../hooks/useApi";
import { ReportEndpointService, Report } from "../generated-client";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";

const PER_PAGE = 10;

interface RepositoryReportsTableProps {
  productId: string;
  cveId: string;
}

const RepositoryReportsTable: React.FC<RepositoryReportsTableProps> = ({
  productId,
  cveId,
}) => {
  const [page, setPage] = useState(1);

  const { data: reports, loading, error,} = useApi<Array<Report>>(
    () =>
      ReportEndpointService.getApiReports({
        page: page - 1,
        pageSize: PER_PAGE,
        productId: productId,
        vulnId: cveId,
      }),
    { deps: [page, productId, cveId] }
  );

  const getVulnerabilityStatus = (report: Report) => {
    if (!report.vulns || !cveId) return null;
    const vuln = report.vulns.find((v) => v.vulnId === cveId);
    return vuln?.justification?.status;
  };

  const renderExploitIqStatus = (report: Report) => {
    const status = getVulnerabilityStatus(report);
    if (!status) return "-";

    if (status === "TRUE") {
      return <Label color="red">vulnerable</Label>;
    }
    if (status === "FALSE") {
      return <Label color="green">Not vulnerable</Label>;
    }
    if (status === "UNKNOWN") {
      return <Label color="grey">Uncertain</Label>;
    }
    return "-";
  };

  if (loading) {
    return (
      <SkeletonTable
        rowsCount={10}
        columns={[
          "Repository",
          "Commit ID",
          "ExploitIQ Status",
          "Completed",
          "Scan state",
        ]}
      />
    );
  }

  if (error) {
    return (
      <Alert variant={AlertVariant.danger} title="Error loading reports">
        {getErrorMessage(error)}
      </Alert>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <EmptyState>
        <Title headingLevel="h4" size="lg">
          No repository reports found
        </Title>
        <EmptyStateBody>
          No repository reports found for this product and CVE combination.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <>
      <Table>
        <Thead>
          <Tr>
            <Th>Repository</Th>
            <Th>Commit ID</Th>
            <Th>ExploitIQ Status</Th>
            <Th>Completed</Th>
            <Th>Scan state</Th>
          </Tr>
        </Thead>
        <Tbody>
          {reports.map((report) => (
            <Tr key={report.id}>
              <Td dataLabel="Repository">{report.gitRepo || "-"}</Td>
              <Td dataLabel="Commit ID">{report.ref || "-"}</Td>
              <Td dataLabel="ExploitIQ Status">
                {renderExploitIqStatus(report)}
              </Td>
              <Td dataLabel="Completed">
                <FormattedTimestamp date={report.completedAt} />
              </Td>
              <Td dataLabel="Scan state">
                <Label variant="outline" icon={<CheckCircleIcon />}>
                  {report.state}
                </Label>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Pagination
        itemCount={reports.length}
        page={page}
        perPage={PER_PAGE}
        onSetPage={(_, newPage) => setPage(newPage)}
        onPerPageSelect={() => {}}
      />
    </>
  );
};

export default RepositoryReportsTable;
