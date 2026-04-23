import type { Report } from "../generated-client/models/Report";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import RepositoryReportsTableContent from "./RepositoryReportsTableContent";
import { useRepositoryReports } from "../hooks/useRepositoryReports";
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
    shouldContinueLiveRefresh: () =>
      product.summary?.productState !== "completed",
  });


  const getViewPath = (report: Report) => `/reports/product/${productId}/${cveId}/${report.scanId}`;

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
