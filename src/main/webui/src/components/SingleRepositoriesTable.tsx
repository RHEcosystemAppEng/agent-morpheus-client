import type { Report } from "../generated-client/models/Report";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useTableParams } from "../hooks/useTableParams";
import {
  REPOSITORY_REPORTS_VALID_SORT_COLUMNS,
  REPOSITORY_REPORTS_VALID_FILTER_KEYS,
} from "../hooks/repositoryReportsTableParams";
import { useRepositoryReports } from "../hooks/useRepositoryReports";
import { REPORTS_TABLE_POLL_INTERVAL_MS } from "../utils/polling";

function getCveIdForReport(report: Report): string | undefined {
  return report.vulns?.[0]?.vulnId;
}

const SingleRepositoriesTable: React.FC = () => {
  const params = useTableParams({
    validSortColumns: REPOSITORY_REPORTS_VALID_SORT_COLUMNS,
    validFilterKeys: REPOSITORY_REPORTS_VALID_FILTER_KEYS,
  });

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = useRepositoryReports({
    tableData: params.data,
    pollInterval: REPORTS_TABLE_POLL_INTERVAL_MS,
  });

  const getViewPath = (report: Report) => {
    const cveId = getCveIdForReport(report);
    return cveId
      ? `/reports/component/${cveId}/${report.scanId}`
      : "/reports/single-repositories";
  };

  return (
    <RepositoryReportsTableContent
      reports={reports}
      loading={loading}
      error={error}
      pagination={pagination}
      tableParams={params}
      getViewPath={getViewPath}
      showCveIdColumn={true}
      ariaLabel="Single repositories table"
    />
  );
};

export default SingleRepositoriesTable;
