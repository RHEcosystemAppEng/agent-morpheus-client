import { useState, useMemo, type CSSProperties } from "react";
import type React from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  Title,
  Label,
} from "@patternfly/react-core";
import {
  Table,
  TableText,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@patternfly/react-table";
import { CheckCircleIcon } from "@patternfly/react-icons";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import { usePaginatedApi } from "../hooks/usePaginatedApi";
import { Report, ProductSummary } from "../generated-client";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import RepositoryTableToolbar from "./RepositoryTableToolbar";

const PER_PAGE = 10;

// Shared style function for table cells with ellipsis truncation
const getEllipsisStyle = (maxWidthRem: number): CSSProperties => ({
  maxWidth: `${maxWidthRem}rem`,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

interface RepositoryReportsTableProps {
  productId: string;
  cveId: string;
  productSummary: ProductSummary;
}

const RepositoryReportsTable: React.FC<RepositoryReportsTableProps> = ({
  productId,
  cveId,
  productSummary,
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE);
  const [scanStateFilter, setScanStateFilter] = useState<string[]>([]);
  const [exploitIqStatusFilter, setExploitIqStatusFilter] = useState<string[]>(
    []
  );

  const scanStateOptions = useMemo(() => {
    const componentStates = productSummary.summary.componentStates || {};
    return Object.keys(componentStates).sort();
  }, [productSummary.summary.componentStates]);

  const getVulnerabilityStatus = (report: Report) => {
    if (!report.vulns || !cveId) return null;
    const vuln = report.vulns.find((v) => v.vulnId === cveId);
    return vuln?.justification?.status;
  };

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = usePaginatedApi<Array<Report>>(
    () => ({
      method: "GET",
      url: "/api/reports",
      query: {
        page: page - 1,
        pageSize: perPage,
        productId: productId,
        vulnId: cveId,
        ...(scanStateFilter.length > 0 &&
          scanStateFilter[0] && { status: scanStateFilter[0] }),
      },
    }),
    {
      deps: [
        page,
        perPage,
        productId,
        cveId,
        scanStateFilter,
        exploitIqStatusFilter,
      ],
    }
  );

  // Filter reports by ExploitIQ status on the client side
  const filteredReports = useMemo(() => {
    if (!reports || exploitIqStatusFilter.length === 0) {
      return reports || [];
    }

    return reports.filter((report) => {
      const status = getVulnerabilityStatus(report);
      if (!status) return false;
      // Map status to filter format: TRUE -> Vulnerable, FALSE -> Not Vulnerable, UNKNOWN -> Uncertain
      const filterLabel =
        status === "TRUE"
          ? "Vulnerable"
          : status === "FALSE"
          ? "Not Vulnerable"
          : status === "UNKNOWN"
          ? "Uncertain"
          : "";
      return filterLabel && exploitIqStatusFilter.includes(filterLabel);
    });
  }, [reports, exploitIqStatusFilter, cveId]);

  const displayReports = filteredReports;
  const totalFilteredCount = pagination?.totalElements ?? 0;

  const handleScanStateFilterChange = (filters: string[]) => {
    setScanStateFilter(filters);
    setPage(1);
  };

  const handleExploitIqStatusFilterChange = (filters: string[]) => {
    setExploitIqStatusFilter(filters);
    setPage(1);
  };

  const onSetPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const onPerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number
  ) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const renderExploitIqStatus = (report: Report) => {
    const status = getVulnerabilityStatus(report);
    if (!status) return "";

    if (status === "TRUE") {
      return <Label color="red">vulnerable</Label>;
    }
    if (status === "FALSE") {
      return <Label color="green">Not vulnerable</Label>;
    }
    if (status === "UNKNOWN") {
      return <Label color="grey">Uncertain</Label>;
    }
    return "";
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
          "Analysis state",
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

  if (!reports || (reports.length === 0 && !loading)) {
    return (
      <>
        <RepositoryTableToolbar
          scanStateFilter={scanStateFilter}
          scanStateOptions={scanStateOptions}
          exploitIqStatusFilter={exploitIqStatusFilter}
          loading={loading}
          onScanStateFilterChange={handleScanStateFilterChange}
          onExploitIqStatusFilterChange={handleExploitIqStatusFilterChange}
          pagination={
            pagination
              ? {
                  itemCount: totalFilteredCount,
                  page,
                  perPage: perPage,
                  onSetPage: onSetPage,
                  onPerPageSelect: onPerPageSelect,
                }
              : undefined
          }
        />
        <EmptyState>
          <Title headingLevel="h4" size="lg">
            No repository reports found
          </Title>
          <EmptyStateBody>
            {scanStateFilter.length > 0 || exploitIqStatusFilter.length > 0
              ? "No repository reports found matching the selected filters."
              : "No repository reports found for this product and CVE combination."}
          </EmptyStateBody>
        </EmptyState>
      </>
    );
  }

  if (!displayReports || displayReports.length === 0) {
    return (
      <>
        <RepositoryTableToolbar
          scanStateFilter={scanStateFilter}
          scanStateOptions={scanStateOptions}
          exploitIqStatusFilter={exploitIqStatusFilter}
          loading={loading}
          onScanStateFilterChange={handleScanStateFilterChange}
          onExploitIqStatusFilterChange={handleExploitIqStatusFilterChange}
          pagination={{
            itemCount: totalFilteredCount,
            page,
            perPage: perPage,
            onSetPage: onSetPage,
            onPerPageSelect: onPerPageSelect,
          }}
        />
        <EmptyState>
          <Title headingLevel="h4" size="lg">
            No repository reports found
          </Title>
          <EmptyStateBody>
            {scanStateFilter.length > 0 || exploitIqStatusFilter.length > 0
              ? "No repository reports found matching the selected filters."
              : "No repository reports found for this product and CVE combination."}
          </EmptyStateBody>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <RepositoryTableToolbar
        scanStateFilter={scanStateFilter}
        scanStateOptions={scanStateOptions}
        exploitIqStatusFilter={exploitIqStatusFilter}
        loading={loading}
        onScanStateFilterChange={handleScanStateFilterChange}
        onExploitIqStatusFilterChange={handleExploitIqStatusFilterChange}
        pagination={{
          itemCount: totalFilteredCount,
          page,
          perPage: perPage,
          onSetPage: onSetPage,
          onPerPageSelect: onPerPageSelect,
        }}
      />
      <Table>
        <Thead>
          <Tr>
            <Th>Repository</Th>
            <Th>Commit ID</Th>
            <Th>ExploitIQ Status</Th>
            <Th>Completed</Th>
            <Th>Analysis state</Th>
            <Th>CVE Repository Report</Th>
          </Tr>
        </Thead>
        <Tbody>
          {displayReports.map((report) => (
            <Tr key={report.id}>
              <Td dataLabel="Repository" style={getEllipsisStyle(15)}>
                {report.gitRepo || ""}
              </Td>
              <Td dataLabel="Commit ID" style={getEllipsisStyle(15)}>
                {report.ref || ""}
              </Td>
              <Td dataLabel="ExploitIQ Status">
                {renderExploitIqStatus(report)}
              </Td>
              <Td dataLabel="Completed" style={getEllipsisStyle(10)}>
                <FormattedTimestamp date={report.completedAt} />
              </Td>
              <Td dataLabel="Analysis state">
                <Label variant="outline" icon={<CheckCircleIcon />}>
                  {report.state}
                </Label>
              </Td>
              <Td dataLabel="CVE Repository Report">
                <TableText>
                  <Button
                    variant="primary"
                    onClick={() =>
                      navigate(`/Reports/${productId}/${cveId}/${report.id}`)
                    }
                  >
                    View
                  </Button>
                </TableText>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

export default RepositoryReportsTable;
