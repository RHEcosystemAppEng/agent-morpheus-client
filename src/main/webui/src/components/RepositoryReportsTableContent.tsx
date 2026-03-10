import { useMemo } from "react";
import { Link } from "react-router";
import { Alert, AlertVariant } from "@patternfly/react-core";
import {
  Table,
  TableText,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ThProps,
} from "@patternfly/react-table";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import type { Report } from "../generated-client/models/Report";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import RepositoryTableToolbar from "./RepositoryTableToolbar";
import TableEmptyState from "./TableEmptyState";
import type { RepositoryReportsTableState } from "../hooks/useRepositoryReportsTableState";

type ColumnKey =
  | "id"
  | "repository"
  | "commitId"
  | "cveId"
  | "finding"
  | "dateRequested"
  | "dateCompleted";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortKey?: "gitRepo" | "submittedAt" | "completedAt";
  optional?: boolean;
  width?: ThProps["width"];
}

const REPOSITORY_REPORTS_COLUMNS: ColumnDef[] = [
  { key: "id", label: "ID", width: 10 },
  { key: "repository", label: "Repository", sortKey: "gitRepo", width: 25 },
  { key: "commitId", label: "Commit ID", width: 10 },
  { key: "cveId", label: "CVE ID", optional: true },
  { key: "finding", label: "Finding", width: 10 },
  { key: "dateRequested", label: "Date Requested", sortKey: "submittedAt", width: 15 },
  { key: "dateCompleted", label: "Date Completed", sortKey: "completedAt", width: 15 },
];

export interface RepositoryReportsTableContentProps {
  reports: Report[] | null;
  loading: boolean;
  error: Error | null;
  pagination: { totalElements: number; totalPages: number } | null;
  tableState: RepositoryReportsTableState;
  emptyStateTitle: string;
  renderFindingCell: (report: Report) => React.ReactNode;
  getViewPath: (report: Report) => string;
  showCveIdColumn?: boolean;
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
  emptyStateTitle,
  renderFindingCell,
  getViewPath,
  showCveIdColumn = false,
  ariaLabel = "Repository reports table",
}) => {
  const displayReports = reports || [];
  const totalFilteredCount = pagination?.totalElements ?? 0;

  const visibleColumns = useMemo(
    () =>
      REPOSITORY_REPORTS_COLUMNS.filter(
        (col) => !col.optional || showCveIdColumn
      ),
    [showCveIdColumn]
  );

  const activeSortIndex = useMemo(
    () =>
      Math.max(
        0,
        visibleColumns.findIndex((c) => c.sortKey === tableState.sortColumn)
      ),
    [visibleColumns, tableState.sortColumn]
  );

  const {
    page,
    perPage,
    findingFilter,
    repositorySearchValue,
    activeSortDirection,
    handleRepositorySearchChange,
    handleFindingFilterChange,
    onSetPage,
    onPerPageSelect,
    handleSortToggle,
  } = tableState;

  const toolbar = (
    <RepositoryTableToolbar
      repositorySearchValue={repositorySearchValue}
      onRepositorySearchChange={handleRepositorySearchChange}
      findingFilter={findingFilter}
      loading={loading}
      onFindingFilterChange={handleFindingFilterChange}
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
          columns={visibleColumns.map((c) => c.label)}
        />
      </>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <>
        {toolbar}
        <TableEmptyState
          columnCount={visibleColumns.length}
          titleText={emptyStateTitle}
        />
      </>
    );
  }

  const renderCell = (report: Report, col: ColumnDef) => {
    switch (col.key) {
      case "id":
        return (
          <TableText wrapModifier="truncate">
            <Link to={getViewPath(report)}>{report.id}</Link>
          </TableText>
        );
      case "repository":
        return (
          <TableText wrapModifier="truncate">{report.gitRepo || ""}</TableText>
        );
      case "commitId":
        return (
          <TableText wrapModifier="truncate">
            {report.ref ? report.ref.substring(0, 7) : ""}
          </TableText>
        );
      case "cveId":
        return (
          <TableText wrapModifier="truncate">
            {report.vulns?.[0]?.vulnId ?? ""}
          </TableText>
        );
      case "finding":
        return renderFindingCell(report);
      case "dateRequested":
        return (
          <TableText wrapModifier="truncate">
            <FormattedTimestamp date={report.submittedAt} />
          </TableText>
        );
      case "dateCompleted":
        return (
          <TableText wrapModifier="truncate">
            <FormattedTimestamp date={report.completedAt} />
          </TableText>
        );
    }
  };

  return (
    <>
      {toolbar}
      <Table aria-label={ariaLabel}>
        <Thead>
          <Tr>
            {visibleColumns.map((col, index) => (
              <Th
                key={col.key}
                width={col.width}
                sort={
                  col.sortKey
                    ? {
                        sortBy: {
                          index: activeSortIndex,
                          direction: activeSortDirection,
                        },
                        onSort: () => handleSortToggle(col.sortKey!),
                        columnIndex: index,
                      }
                    : undefined
                }
              >
                {col.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {displayReports.map((report) => (
            <Tr key={report.id}>
              {visibleColumns.map((col) => (
                <Td key={col.key} dataLabel={col.label}>
                  {renderCell(report, col)}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

export default RepositoryReportsTableContent;
