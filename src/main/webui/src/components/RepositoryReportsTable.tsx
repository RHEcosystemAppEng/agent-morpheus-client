import { useState, useMemo } from "react";
import {
  Pagination,
  Spinner,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  Title,
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@patternfly/react-table";
import { useApi } from "../hooks/useApi";
import { ReportEndpointService, Report } from "../generated-client";
import { getErrorMessage } from "../utils/errorHandling";

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

  const { data: reports, loading, error } = useApi<Array<Report>>(() =>
    ReportEndpointService.getApiReports({ page: page - 1, pageSize: PER_PAGE })
  );

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter((report) => {
      const reportProductId = report.metadata?.productId || report.metadata?.id;
      const hasCve = report.vulns?.some((vuln) => vuln.vulnId === cveId);
      return reportProductId === productId && hasCve;
    });
  }, [reports, productId, cveId]);

  const paginatedReports = filteredReports.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <Spinner aria-label="Loading repository reports" />;
  }

  if (error) {
    return (
      <Alert variant={AlertVariant.danger} title="Error loading reports">
        {getErrorMessage(error)}
      </Alert>
    );
  }

  if (filteredReports.length === 0) {
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
            <Th>ID</Th>
            <Th>Product Name</Th>
            <Th>Version</Th>
            <Th>CVEs</Th>
            <Th>Completed At</Th>
            <Th>Submitted At</Th>
            <Th>State</Th>
          </Tr>
        </Thead>
        <Tbody>
          {paginatedReports.map((report) => (
            <Tr key={report.id}>
              <Td>{report.id}</Td>
              <Td>{report.name}</Td>
              <Td>{report.metadata?.version || "-"}</Td>
              <Td>{report.vulns?.length || 0}</Td>
              <Td>{formatDate(report.completedAt)}</Td>
              <Td>{formatDate(report.startedAt)}</Td>
              <Td>{report.state}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Pagination
        itemCount={filteredReports.length}
        page={page}
        perPage={PER_PAGE}
        onSetPage={(_, newPage) => setPage(newPage)}
        onPerPageSelect={() => {}}
      />
    </>
  );
};

export default RepositoryReportsTable;

