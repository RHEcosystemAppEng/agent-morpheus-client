import { useState, useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Alert,
  AlertVariant,
  Label,
  Icon,
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
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import { Report } from "../generated-client";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import RepositoryTableToolbar from "./RepositoryTableToolbar";
import TableEmptyState from "./TableEmptyState";
import { useRepositoryReports } from "../hooks/useRepositoryReports";

const PER_PAGE = 10;

type SortColumn = "gitRepo" | "completedAt" | "state";
type SortDirection = "asc" | "desc";

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

  const getVulnerabilityStatus = (report: Report) => {
    if (!report.vulns || !cveId) return null;
    const vuln = report.vulns.find((v) => v.vulnId === cveId);
    return vuln?.justification?.status;
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

  const renderAnalysisState = (report: Report) => {
    const state = report.state?.toLowerCase();

    if (state === "completed") {
      return (
        <Label
          variant="outline"
          color="green"
          icon={
            <Icon status="success">
              <CheckCircleIcon />
            </Icon>
          }
        >
          {report.state}
        </Label>
      );
    }

    if (state === "expired") {
      return (
        <Label
          variant="outline"
          color="orange"
          icon={
            <Icon status="warning">
              <ExclamationTriangleIcon />
            </Icon>
          }
        >
          {report.state}
        </Label>
      );
    }

    return (
      <Label variant="outline" icon={<CheckCircleIcon />}>
        {report.state}
      </Label>
    );
  };

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
              <Td dataLabel="Repository" style={getEllipsisStyle(15)}>
                {report.gitRepo ? (
                  <a
                    href={report.gitRepo}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {report.gitRepo}
                  </a>
                ) : (
                  <span
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {report.gitRepo || ""}
                  </span>
                )}
              </Td>
              <Td dataLabel="Commit ID" style={getEllipsisStyle(15)}>
                {report.gitRepo && report.ref ? (
                  <a
                    href={`${
                      report.gitRepo.endsWith("/")
                        ? report.gitRepo.slice(0, -1)
                        : report.gitRepo
                    }/commit/${report.ref}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {report.ref.substring(0, 7)}
                  </a>
                ) : (
                  <span
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {report.ref ? report.ref.substring(0, 7) : ""}
                  </span>
                )}
              </Td>
              <Td dataLabel="ExploitIQ Status" style={{ width: "10%" }}>
                {renderExploitIqStatus(report)}
              </Td>
              <Td
                dataLabel="Completed"
                style={{
                  width: "22%",
                  paddingLeft: "0.5rem",
                  ...getEllipsisStyle(22),
                }}
              >
                <FormattedTimestamp date={report.completedAt} />
              </Td>
              <Td dataLabel="Analysis state">{renderAnalysisState(report)}</Td>
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
