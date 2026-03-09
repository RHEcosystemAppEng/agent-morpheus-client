import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Alert,
  AlertVariant,
  Bullseye,
  EmptyState,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
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
import type { Report } from "../generated-client/models/Report";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import RepositoryTableToolbar from "./RepositoryTableToolbar";
import ReportStatusLabel from "./ReportStatusLabel";
import CveStatus from "./CveStatus";
import { useSingleRepositoryReports } from "../hooks/useSingleRepositoryReports";

const PER_PAGE = 10;
const SCAN_STATE_OPTIONS = [
  "completed",
  "failed",
  "queued",
  "sent",
  "pending",
  "expired",
];

type SortColumn = "gitRepo" | "completedAt" | "state";
type SortDirection = "asc" | "desc";

function renderFinding(report: Report): React.ReactNode {
  const firstVuln = report.vulns?.[0];
  if (!firstVuln?.justification?.status) return null;
  return <CveStatus status={firstVuln.justification.status} />;
}

function getCveIdForReport(report: Report): string | undefined {
  return report.vulns?.[0]?.vulnId;
}

const SingleRepositoriesTable: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE);
  const [sortColumn, setSortColumn] = useState<SortColumn>("state");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [scanStateFilter, setScanStateFilter] = useState<string[]>([]);
  const [exploitIqStatusFilter, setExploitIqStatusFilter] = useState<string[]>(
    []
  );
  const [repositorySearchValue, setRepositorySearchValue] = useState<string>("");

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = useSingleRepositoryReports({
    page,
    perPage,
    sortColumn,
    sortDirection,
    scanStateFilter,
    exploitIqStatusFilter,
    repositorySearchValue,
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

  const activeSortIndex = getColumnIndex(sortColumn);
  const activeSortDirection = sortDirection;

  const toolbar = (
    <RepositoryTableToolbar
      repositorySearchValue={repositorySearchValue}
      onRepositorySearchChange={handleRepositorySearchChange}
      scanStateFilter={scanStateFilter}
      scanStateOptions={SCAN_STATE_OPTIONS}
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

  let content: React.ReactNode;
  if (loading) {
    content = (
      <SkeletonTable
        rowsCount={10}
        columns={[
          "Repository",
          "Commit ID",
          "Finding",
          "Completed",
          "Analysis state",
        ]}
      />
    );
  } else if (!reports || reports.length === 0) {
    content = (
      <Table aria-label="Single repositories table">
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
            <Th style={{ width: "10%" }}>Finding</Th>
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
            <Th>Analysis state</Th>
            <Th>CVE Repository Report</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td colSpan={6}>
              <Bullseye>
                <EmptyState
                  headingLevel="h2"
                  titleText="No single repository reports found"
                  icon={SearchIcon}
                  variant={EmptyStateVariant.sm}
                />
              </Bullseye>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    );
  } else {
    content = (
      <Table aria-label="Single repositories table">
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
            <Th style={{ width: "10%" }}>Finding</Th>
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
            <Th>Analysis state</Th>
            <Th>CVE Repository Report</Th>
          </Tr>
        </Thead>
        <Tbody>
          {displayReports.map((report) => {
            const cveId = getCveIdForReport(report);
            return (
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
                <Td dataLabel="Finding" style={{ width: "10%" }}>
                  {renderFinding(report)}
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
                        cveId &&
                        navigate(`/reports/component/${cveId}/${report.id}`)
                      }
                    >
                      View
                    </Button>
                  </TableText>
                </Td>
              </Tr>
            );
          })}
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

export default SingleRepositoriesTable;
