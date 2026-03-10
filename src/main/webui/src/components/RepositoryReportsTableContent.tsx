import { useNavigate } from "react-router";
import { Button, Alert, AlertVariant } from "@patternfly/react-core";
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
import TableEmptyState from "./TableEmptyState";
import ReportStatusLabel from "./ReportStatusLabel";
import type { RepositoryReportsTableState } from "../hooks/useRepositoryReportsTableState";

const SKELETON_COLUMNS = [
  "Repository",
  "Commit ID",
  "Finding",
  "Completed",
  "Analysis state",
];

export interface RepositoryReportsTableContentProps {
  reports: Report[] | null;
  loading: boolean;
  error: Error | null;
  pagination: { totalElements: number; totalPages: number } | null;
  tableState: RepositoryReportsTableState;
  scanStateOptions: string[];
  emptyStateTitle: string;
  renderFindingCell: (report: Report) => React.ReactNode;
  getViewPath: (report: Report) => string | undefined;
  ariaLabel?: string;
}

const RepositoryReportsTableContent: React.FC<
  RepositoryReportsTableContentProps
> = ({
  reports,
  loading,
  error,
  pagination,
  tableState,
  scanStateOptions,
  emptyStateTitle,
  renderFindingCell,
  getViewPath,
  ariaLabel = "Repository reports table",
}) => {
  const navigate = useNavigate();
  const displayReports = reports || [];
  const totalFilteredCount = pagination?.totalElements ?? 0;

  const {
    page,
    perPage,
    scanStateFilter,
    exploitIqStatusFilter,
    repositorySearchValue,
    activeSortIndex,
    activeSortDirection,
    handleRepositorySearchChange,
    handleScanStateFilterChange,
    handleExploitIqStatusFilterChange,
    onSetPage,
    onPerPageSelect,
    handleSortToggle,
  } = tableState;

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
              perPage,
              onSetPage,
              onPerPageSelect,
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

  if (loading) {
    return (
      <>
        {toolbar}
        <SkeletonTable
          rowsCount={10}
          columns={[...SKELETON_COLUMNS, "CVE Repository Report"]}
        />
      </>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <>
        {toolbar}
        <TableEmptyState columnCount={6} titleText={emptyStateTitle} />
      </>
    );
  }

  return (
    <>
      {toolbar}
      <Table aria-label={ariaLabel}>
        <Thead>
          <Tr>
            <Th
              style={{ width: "28%" }}
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
            <Th style={{ width: "8%" }}>Commit ID</Th>
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
            <Th style={{ width: "14%" }}>Analysis state</Th>
            <Th style={{ width: "1%", whiteSpace: "nowrap" }}>
              CVE Repository Report
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {displayReports.map((report) => {
            const viewPath = getViewPath(report);
            return (
              <Tr key={report.id}>
                <Td dataLabel="Repository" style={{ width: "28%" }}>
                  <TableText wrapModifier="truncate">
                    {report.gitRepo ? (
                      <a href={report.gitRepo} target="_blank" rel="noreferrer">
                        {report.gitRepo}
                      </a>
                    ) : (
                      <span>{report.gitRepo || ""}</span>
                    )}
                  </TableText>
                </Td>
                <Td dataLabel="Commit ID" style={{ width: "8%" }}>
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
                      <span>
                        {report.ref ? report.ref.substring(0, 7) : ""}
                      </span>
                    )}
                  </TableText>
                </Td>
                <Td dataLabel="Finding" style={{ width: "10%" }}>
                  {renderFindingCell(report)}
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
                <Td dataLabel="Analysis state" style={{ width: "9%" }}>
                  <ReportStatusLabel state={report.state} />
                </Td>
                <Td dataLabel="CVE Repository Report" style={{ width: "13%" }}>
                  <TableText>
                    <Button
                      variant="primary"
                      onClick={() => viewPath && navigate(viewPath)}
                      isDisabled={!viewPath}
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
    </>
  );
};

export default RepositoryReportsTableContent;
