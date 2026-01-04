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
import { usePaginatedApi } from "../hooks/usePaginatedApi";
import { Report, ProductSummary } from "../generated-client";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import RepositoryTableToolbar from "./RepositoryTableToolbar";
import { mapDisplayLabelToApiValue } from "./Filtering";
import TableEmptyState from "./TableEmptyState";

const PER_PAGE = 10;

type SortColumn = "ref" | "completedAt" | "state";
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
  const [sortColumn, setSortColumn] = useState<SortColumn>("completedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [scanStateFilter, setScanStateFilter] = useState<string[]>([]);
  const [exploitIqStatusFilter, setExploitIqStatusFilter] = useState<string[]>(
    []
  );

  // Convert filter array to single API value (use first selected value)
  const exploitIqStatusApiValue = useMemo(() => {
    if (exploitIqStatusFilter.length === 0 || !exploitIqStatusFilter[0])
      return undefined;
    return mapDisplayLabelToApiValue(exploitIqStatusFilter[0]);
  }, [exploitIqStatusFilter]);

  const scanStateOptions = useMemo(() => {
    const componentStates = productSummary.summary.componentStates || {};
    return Object.keys(componentStates).sort();
  }, [productSummary.summary.componentStates]);

  const getVulnerabilityStatus = (report: Report) => {
    if (!report.vulns || !cveId) return null;
    const vuln = report.vulns.find((v) => v.vulnId === cveId);
    return vuln?.justification?.status;
  };

  // Build sortBy parameter for API
  const sortByParam = useMemo(() => {
    return [`${sortColumn}:${sortDirection.toUpperCase()}`];
  }, [sortColumn, sortDirection]);

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
        sortBy: sortByParam,
        ...(scanStateFilter.length > 0 &&
          scanStateFilter[0] && { status: scanStateFilter[0] }),
        ...(exploitIqStatusApiValue && {
          exploitIqStatus: exploitIqStatusApiValue,
        }),
      },
    }),
    {
      deps: [
        page,
        perPage,
        productId,
        cveId,
        scanStateFilter,
        exploitIqStatusApiValue,
        sortByParam,
      ],
    }
  );

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
      case "ref":
        return 1;
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
        <TableEmptyState
          columnCount={6}
          titleText="No repository reports found"
        />
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
        <TableEmptyState
          columnCount={6}
          titleText="No repository reports found"
        />
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
            <Th
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("ref"),
                columnIndex: 1,
              }}
            >
              Commit ID
            </Th>
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
            <Th
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("state"),
                columnIndex: 4,
              }}
            >
              Analysis state
            </Th>
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
