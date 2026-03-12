import type { Report } from "../generated-client/models/Report";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useRepositoryReportsTableState } from "../hooks/useRepositoryReportsTableState";
import Finding from "./Finding";
import { getFindingForReportRow } from "../utils/findingDisplay";
import { useRepositoryReports } from "../hooks/useRepositoryReports";
import { REPORTS_TABLE_POLL_INTERVAL_MS } from "../utils/polling";

function renderFindingCell(report: Report) {
  const justificationStatus = report.vulns?.[0]?.justification?.status;
  return (
    <Finding
      finding={getFindingForReportRow(report.state, justificationStatus)}
    />
  );
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
  } = useRepositoryReports({    
    pollInterval: REPORTS_TABLE_POLL_INTERVAL_MS,
    page: tableState.page,
    perPage: tableState.perPage,
    sortColumn: tableState.sortColumn,
    sortDirection: tableState.sortDirection,
    findingFilter: tableState.findingFilter,
    repositorySearchValue: tableState.repositorySearchValue,
  });

  const getViewPath = (report: Report) => {
    const cveId = getCveIdForReport(report);
    return cveId ? `/reports/component/${cveId}/${report.id}` : '/reports/single-repositories';
  };

  return (
    <RepositoryReportsTableContent
      reports={reports}
      loading={loading}
      error={error}
      pagination={pagination}
      tableState={tableState}
      emptyStateTitle="No single repository reports found"
      renderFindingCell={renderFindingCell}
      getViewPath={getViewPath}
      showCveIdColumn={true}
      ariaLabel="Single repositories table"
    />
  );
};

export default SingleRepositoriesTable;
