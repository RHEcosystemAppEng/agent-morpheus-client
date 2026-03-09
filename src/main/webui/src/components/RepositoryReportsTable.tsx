import { useMemo } from "react";
import type { Report } from "../generated-client/models/Report";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import CveStatus from "./CveStatus";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useRepositoryReports } from "../hooks/useRepositoryReports";
import { useRepositoryReportsTableState } from "../hooks/useRepositoryReportsTableState";

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

  const scanStateOptions = useMemo(() => {
    const statusCounts = product.summary?.statusCounts || {};
    return Object.keys(statusCounts).sort();
  }, [product.summary?.statusCounts]);

  const {
    data: reports,
    loading,
    error,
    pagination,
  } = useRepositoryReports({
    productId,
    cveId,
    product,
    page: tableState.page,
    perPage: tableState.perPage,
    sortColumn: tableState.sortColumn,
    sortDirection: tableState.sortDirection,
    scanStateFilter: tableState.scanStateFilter,
    exploitIqStatusFilter: tableState.exploitIqStatusFilter,
    repositorySearchValue: tableState.repositorySearchValue,
  });

  const isComponentRoute = !product?.data?.id;

  const renderFindingCell = (report: Report) => {
    if (!report.vulns || !cveId) return null;
    const vuln = report.vulns.find((v) => v.vulnId === cveId);
    if (!vuln?.justification?.status) return null;
    return <CveStatus status={vuln.justification.status} />;
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
      scanStateOptions={scanStateOptions}
      emptyStateTitle="No repository reports found"
      renderFindingCell={renderFindingCell}
      getViewPath={getViewPath}
      ariaLabel="Repository reports table"
    />
  );
};

export default RepositoryReportsTable;
