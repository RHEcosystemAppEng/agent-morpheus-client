import type { Report } from "../generated-client/models/Report";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useRepositoryReports } from "../hooks/useRepositoryReports";
import { POLL_INTERVAL_MS } from "../utils/polling";
import { useRepositoryReportsTableState } from "../hooks/useRepositoryReportsTableState";
import Finding from "./Finding";
import { getFindingForReportRow } from "../utils/findingDisplay";

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
  const tableState = useRepositoryReportsTableState();

  
  const {
    data: reports,
    loading,
    error,
    pagination,
  } = useRepositoryReports({
    productId,
    cveId,
    shouldContinuePolling: () =>
      product.summary?.productState !== "completed",
    pollInterval: POLL_INTERVAL_MS,
    page: tableState.page,
    perPage: tableState.perPage,
    sortColumn: tableState.sortColumn,
    sortDirection: tableState.sortDirection,
    findingFilter: tableState.findingFilter,
    repositorySearchValue: tableState.repositorySearchValue,
  });

  const isComponentRoute = !product?.data?.id;

  const renderFindingCell = (report: Report) => {
    const justificationStatus = report.vulns?.find(
      (v) => v.vulnId === cveId
    )?.justification?.status;
    return (
      <Finding
        finding={getFindingForReportRow(report.state, justificationStatus)}
      />
    );
  };

  const getViewPath = (report: Report) =>
    isComponentRoute
      ? `/reports/component/${cveId}/${report.id}`
      : `/reports/product/${productId}/${cveId}/${report.id}`;

  return (
    <RepositoryReportsTableContent
      reports={reports}
      loading={loading}
      error={error}
      pagination={pagination}
      tableState={tableState}
      emptyStateTitle="No repository reports found"
      renderFindingCell={renderFindingCell}
      getViewPath={getViewPath}
      showCveIdColumn={false}
      ariaLabel="Repository reports table"
    />
  );
};

export default RepositoryReportsTable;
