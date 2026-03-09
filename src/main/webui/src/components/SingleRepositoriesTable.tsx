import type { Report } from "../generated-client/models/Report";
import type { ReactNode } from "react";
import CveStatus from "./CveStatus";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useSingleRepositoryReports } from "../hooks/useSingleRepositoryReports";
import { useRepositoryReportsTableState } from "../hooks/useRepositoryReportsTableState";

const SCAN_STATE_OPTIONS = [
  "completed",
  "failed",
  "queued",
  "sent",
  "pending",
  "expired",
];

function renderFindingCell(report: Report): ReactNode {
  const firstVuln = report.vulns?.[0];
  if (!firstVuln?.justification?.status) return null;
  return <CveStatus status={firstVuln.justification.status} />;
}

function getCveIdForReport(report: Report): string | undefined {
  return report.vulns?.[0]?.vulnId;
}

const SingleRepositoriesTable: React.FC = () => {
  const tableState = useRepositoryReportsTableState();

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = useSingleRepositoryReports({
    page: tableState.page,
    perPage: tableState.perPage,
    sortColumn: tableState.sortColumn,
    sortDirection: tableState.sortDirection,
    scanStateFilter: tableState.scanStateFilter,
    exploitIqStatusFilter: tableState.exploitIqStatusFilter,
    repositorySearchValue: tableState.repositorySearchValue,
  });

  const getViewPath = (report: Report) => {
    const cveId = getCveIdForReport(report);
    return cveId ? `/reports/component/${cveId}/${report.id}` : undefined;
  };

  return (
    <RepositoryReportsTableContent
      reports={reports}
      loading={loading}
      error={error}
      pagination={pagination}
      tableState={tableState}
      scanStateOptions={SCAN_STATE_OPTIONS}
      emptyStateTitle="No single repository reports found"
      renderFindingCell={renderFindingCell}
      getViewPath={getViewPath}
      ariaLabel="Single repositories table"
    />
  );
};

export default SingleRepositoriesTable;
