import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Alert,
  AlertVariant,
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
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import { Report } from "../generated-client";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import RepositoryTableToolbar from "./RepositoryTableToolbar";
import TableEmptyState from "./TableEmptyState";
import ReportStatusLabel from "./ReportStatusLabel";
import CveStatus from "./CveStatus";
import { useRepositoryReports } from "../hooks/useRepositoryReports";

const PER_PAGE = 10;

type SortColumn = "gitRepo" | "completedAt" | "state";
type SortDirection = "asc" | "desc";

// Shared CSS class for table cells with ellipsis truncation
// Using PF6 TableText component with wrapModifier="truncate" is preferred

interface RepositoryReportsTableProps {
  productId: string;
  cveId: string;
  product: ProductSummary;
}

const RepositoryReportsTable: React.FC<RepositoryReportsTableProps> = ({
  productId,
  cveId,
  product,
}) => {
  const isComponentRoute = !product?.data?.id; // Component route doesn't have productId
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE);
  const [sortColumn, setSortColumn] = useState<SortColumn>("state");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [scanStateFilter, setScanStateFilter] = useState<string[]>([]);
  const [exploitIqStatusFilter, setExploitIqStatusFilter] = useState<string[]>(
    []
  );
  const [repositorySearchValue, setRepositorySearchValue] =
    useState<string>("");

  const scanStateOptions = useMemo(() => {
    const statusCounts = product.summary?.statusCounts || {};
    return Object.keys(statusCounts).sort();
  }, [product.summary?.statusCounts]);

  // Render ExploitIQ status using CveStatus component
  const renderExploitIqStatus = (report: Report) => {
    if (!report.vulns || !cveId) return null;
    const vuln = report.vulns.find((v) => v.vulnId === cveId);
    if (!vuln?.justification?.status) return null;
    
    return <CveStatus status={vuln.justification.status} />;
  };

  // Use the dedicated hook for repository reports with auto-refresh
  const {
    data: reports,
    loading,
    error,
    pagination,
  } = useRepositoryReports({
    productId,
    cveId,
    page,
    perPage,
    sortColumn,
    sortDirection,
    scanStateFilter,
    exploitIqStatusFilter,
    repositorySearchValue,
    product,
  });

  const displayReports = reports || [];
  const totalFilteredCount = pagination?.totalElements ?? 0;

  const handleScanStateFilterChange = (filters: string[]) => {
    setScanStateFilter(filters);
    setPage(1);
  };

  const handleExploitIqStatusFilterChange = (filters: string[]) => {
    setExploitIqStatusFilter(filters);
    setPage(1);
  };

  const handleRepositorySearchChange = (value: string) => {
    setRepositorySearchValue(value);
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

  const handleSortToggle = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
  };

  // Map sort columns to their column indices
  const getColumnIndex = (column: SortColumn): number => {
    switch (column) {
      case "gitRepo":
        return 0;
      case "completedAt":
        return 3;
      case "state":
        return 4;
      default:
        return 0;
    }
  };

  // Get the current sort index and direction for PatternFly
  const activeSortIndex = getColumnIndex(sortColumn);
  const activeSortDirection = sortDirection;
  // Use ReportStatusLabel component instead of reimplementing

  const toolbar = (
    <RepositoryTableToolbar
      repositorySearchValue={repositorySearchValue}
      onRepositorySearchChange={handleRepositorySearchChange}
      scanStateFilter={scanStateFilter}
      scanStateOptions={scanStateOptions}
      exploitIqStatusFilter={exploitIqStatusFilter}
      loading={loading}
      onScanStateFilterChange={handleScanStateFilterChange}
      onExploitIqStatusFilterChange={handleExploitIqStatusFilterChange}
      pagination={
        pagination
          ? {
              itemCount: pagination.totalElements ?? totalFilteredCount,
              page,
              perPage: perPage,
              onSetPage: onSetPage,
              onPerPageSelect: onPerPageSelect,
            }
          : undefined
      }
    />
  );

  if (error) {
    return (
      <>
        {toolbar}
        <Alert variant={AlertVariant.danger} title="Error loading reports">
          {getErrorMessage(error)}
        </Alert>
      </>
    );
  }

  let content;
  if (loading) {
    content = (
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
  } else if (!reports || reports.length === 0) {
    content = (
      <TableEmptyState
        columnCount={6}
        titleText="No repository reports found"
      />
    );
  } else {
    content = (
      <Table>
        <Thead>
          <Tr>
            <Th
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("gitRepo"),
                columnIndex: 0,
              }}
            >
              Repository
            </Th>
            <Th>Commit ID</Th>
            <Th style={{ width: "10%" }}>ExploitIQ Status</Th>
            <Th
              style={{ width: "22%", paddingLeft: "0.5rem" }}
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("completedAt"),
                columnIndex: 3,
              }}
            >
              Completed
            </Th>
            <Th>
              Analysis state
            </Th>
            <Th>CVE Repository Report</Th>
          </Tr>
        </Thead>
        <Tbody>
          {displayReports.map((report) => (
            <Tr key={report.id}>
              <Td dataLabel="Repository">
                <TableText wrapModifier="truncate">
                  {report.gitRepo ? (
                    <a
                      href={report.gitRepo}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {report.gitRepo}
                    </a>
                  ) : (
                    <span>{report.gitRepo || ""}</span>
                  )}
                </TableText>
              </Td>
              <Td dataLabel="Commit ID">
                <TableText wrapModifier="truncate">
                  {report.gitRepo && report.ref ? (
                    <a
                      href={`${
                        report.gitRepo.endsWith("/")
                          ? report.gitRepo.slice(0, -1)
                          : report.gitRepo
                      }/commit/${report.ref}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {report.ref.substring(0, 7)}
                    </a>
                  ) : (
                    <span>{report.ref ? report.ref.substring(0, 7) : ""}</span>
                  )}
                </TableText>
              </Td>
              <Td dataLabel="ExploitIQ Status" style={{ width: "10%" }}>
                {renderExploitIqStatus(report)}
              </Td>
              <Td
                dataLabel="Completed"
                style={{
                  width: "22%",
                  paddingLeft: "0.5rem",
                }}
              >
                <TableText wrapModifier="truncate">
                  <FormattedTimestamp date={report.completedAt} />
                </TableText>
              </Td>
              <Td dataLabel="Analysis state">
                <ReportStatusLabel state={report.state} />
              </Td>
              <Td dataLabel="CVE Repository Report">
                <TableText>
                  <Button
                    variant="primary"
                    onClick={() =>
                      isComponentRoute ?
                        navigate(`/reports/component/${cveId}/${report.id}`)
                      :
                        navigate(`/reports/product/${productId}/${cveId}/${report.id}`)
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
    );
  }

  return (
    <>
      {toolbar}
      {content}
    </>
  );
};

export default RepositoryReportsTable;
