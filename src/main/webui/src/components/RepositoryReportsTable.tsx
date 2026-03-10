import type { Report } from "../generated-client/models/Report";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useRepositoryReports } from "../hooks/useRepositoryReports";
import { POLL_INTERVAL_MS } from "../utils/polling";
import { useTableParams } from "../hooks/useTableParams";
import {
  REPOSITORY_REPORTS_VALID_SORT_COLUMNS,
  REPOSITORY_REPORTS_VALID_FILTER_KEYS,
} from "../hooks/repositoryReportsTableParams";

interface RepositoryReportsTableProps {
  cveId: string;
  product: ProductSummary;
}

const RepositoryReportsTable: React.FC<RepositoryReportsTableProps> = ({
  cveId,
  product,
}) => {
  const productId = product.data.id;
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
    productId,
    cveId,
    shouldContinuePolling: () =>
      product.summary?.productState !== "completed",
    pollInterval: POLL_INTERVAL_MS,
  });


  const getViewPath = (report: Report) => `/reports/product/${productId}/${cveId}/${report.id}`;

  return (
    <RepositoryReportsTableContent
      reports={reports}
      loading={loading}
      error={error}
      pagination={pagination}
      tableParams={params}
      getViewPath={getViewPath}
      showCveIdColumn={false}
      ariaLabel="Repository reports table"
    />
  );
};

export default RepositoryReportsTable;
