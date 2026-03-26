import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Flex,
  FlexItem,
  Popover,
  Icon,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TableText,
  ThProps,
} from "@patternfly/react-table";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import {
  useReportsTableData,
  SortDirection,
  SortColumn,
} from "../hooks/useReportsTableData";
import { useTableParams } from "../hooks/useTableParams";
import Finding from "./Finding";
import ReportsToolbar from "./ReportsToolbar";
import FormattedTimestamp from "./FormattedTimestamp";
import TableEmptyState from "./TableEmptyState";
import { ReportEndpointService } from "../generated-client/services/ReportEndpointService";
import type { Report } from "../generated-client/models/Report";
import { useExecuteApi } from "../hooks/useExecuteApi";
import TableErrorState from "./TableErrorState";

const SBOM_VALID_SORT_COLUMNS = [
  "name",
  "submittedAt",
  "completedAt",
  "cveId",
] as const;
const SBOM_VALID_FILTER_KEYS = ["sbomName", "cveId"] as const;

type ColumnKey =
  | "productId"
  | "name"
  | "cveId"
  | "repositoriesAnalyzed"
  | "finding"
  | "submittedAt"
  | "completedAt";

function isSortableColumn(key: ColumnKey): key is SortColumn {
  return key === "name" || key === "cveId" || key === "submittedAt" || key === "completedAt";
}

interface ColumnDef {
  key: ColumnKey;
  label: string;
  width?: ThProps["width"];
}

const REPORTS_TABLE_COLUMNS: ColumnDef[] = [
  { key: "productId", label: "Report ID", width: 10 },
  { key: "name", label: "SBOM Name", width: 25 },
  { key: "cveId", label: "CVE ID", width: 10 },
  { key: "repositoriesAnalyzed", label: "Repositories Analyzed", width: 15 },
  { key: "finding", label: "Finding", width: 10 },
  { key: "submittedAt", label: "Date Requested", width: 15 },
  { key: "completedAt", label: "Date Completed", width: 15 },
];

const SbomsTable: React.FC = () => {
  const navigate = useNavigate();
  const tableParams = useTableParams({
    validSortColumns: SBOM_VALID_SORT_COLUMNS,
    validFilterKeys: SBOM_VALID_FILTER_KEYS,
  });

  const { data, handlers } = tableParams;
  const sortColumn: SortColumn = data.sortColumn ?? "submittedAt";
  const sortDirection: SortDirection = data.sortDirection ?? "desc";
  const page = data.page ?? 1;
  const perPage = data.perPage ?? 10;
  const searchValue = data.getFilterValue("sbomName") ?? "";
  const cveSearchValue = data.getFilterValue("cveId") ?? "";

  const [activeAttribute, setActiveAttribute] = useState<
    "SBOM Name" | "CVE ID"
  >("SBOM Name");
  const [loadingRow, setLoadingRow] = useState<{
    productId: string;
    cveId: string;
  } | null>(null);
  const currentProductIdRef = useRef<string | null>(null);

  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
    execute: executeReportsQuery,
  } = useExecuteApi<Array<Report>>(() => {
    if (!currentProductIdRef.current) {
      throw new Error("No product ID set for query");
    }
    return ReportEndpointService.getApiV1Reports({
      productId: currentProductIdRef.current,
      pageSize: 1,
    });
  });

  const { rows, loading, error, pagination } = useReportsTableData({
    page,
    perPage,
    sortColumn,
    sortDirection,
    name: searchValue,
    cveId: cveSearchValue,
  });

  const navigateToProductPage = (productId: string, cveId: string) => {
    setLoadingRow(null);
    currentProductIdRef.current = null;
    navigate(`/reports/product/${productId}/${cveId}`);
  };

  useEffect(() => {
    if (!reportsLoading && loadingRow) {
      const { productId, cveId } = loadingRow;
      if (reportsError) {
        navigateToProductPage(productId, cveId);
        return;
      }
      if (reportsData) {
        if (reportsData.length === 0) {
          navigateToProductPage(productId, cveId);
          return;
        }
        const firstReport = reportsData[0];
        if (!firstReport?.scanId) {
          navigateToProductPage(productId, cveId);
          return;
        }
        setLoadingRow(null);
        currentProductIdRef.current = null;
        navigate(`/reports/component/${cveId}/${firstReport.scanId}`);
      }
    }
  }, [reportsData, reportsLoading, reportsError, loadingRow, navigate]);

  const handleProductIdClick = (row: (typeof rows)[0]) => {
    if (!row.productId) return;
    if (row.submittedCount === 1) {
      currentProductIdRef.current = row.productId;
      setLoadingRow({ productId: row.productId, cveId: row.cveId });
      executeReportsQuery();
    } else {
      navigate(`/reports/product/${row.productId}/${row.cveId}`);
    }
  };

  const handleSortToggle = (column: SortColumn) => {
    handlers.handleSortToggle(column);
  };

  const handleSearchChange = (value: string) => {
    handlers.setFilterValue("sbomName", value);
  };

  const handleCveSearchChange = (value: string) => {
    handlers.setFilterValue("cveId", value);
  };

  const handleClearFilters = () => {
    handlers.clearAllFilters();
  };

  const activeSortIndex = Math.max(
    0,
    REPORTS_TABLE_COLUMNS.findIndex((c) => c.key === sortColumn)
  );
  const totalItems = pagination?.totalElements ?? 0;

  const toolbar = (
    <ReportsToolbar
      searchValue={searchValue}
      cveSearchValue={cveSearchValue}
      filters={{}}
      activeAttribute={activeAttribute}
      onSearchChange={handleSearchChange}
      onCveSearchChange={handleCveSearchChange}
      onActiveAttributeChange={setActiveAttribute}
      onClearFilters={handleClearFilters}
      pagination={{
        itemCount: totalItems,
        page,
        perPage,
        onSetPage: (_event: unknown, newPage: number) =>
          handlers.setPage(newPage),
        onPerPageSelect: (
          _event: unknown,
          newPerPage: number,
          newPage: number
        ) => {
          handlers.setPagination(newPerPage, newPage);
        },
      }}
    />
  );

  const renderCell = (
    row: (typeof rows)[0],
    col: ColumnDef
  ): React.ReactNode => {
    switch (col.key) {
      case "productId":
        return (
          <TableText wrapModifier="truncate">
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                handleProductIdClick(row);
              }}
            >
              {loadingRow?.productId === row.productId &&
              loadingRow?.cveId === row.cveId ? (
                <Spinner size="sm" />
              ) : (
                row.productId
              )}
            </Link>
          </TableText>
        );
      case "name":
        return <TableText wrapModifier="truncate">{row.productName}</TableText>;
      case "cveId":
        return row.cveId;
      case "repositoriesAnalyzed":
        return row.repositoriesAnalyzed;
      case "finding":
        return <Finding finding={row.finding} />;
      case "submittedAt":
        return <FormattedTimestamp date={row.submittedAt} />;
      case "completedAt":
        return <FormattedTimestamp date={row.completedAt} />;
    }
  };

  const getTable = () => (
    <Table aria-label="Reports table">
      <Thead>
        <Tr>
          {REPORTS_TABLE_COLUMNS.map((col, index) => (
            <Th
              key={col.key}
              width={col.width}
              sort={
                isSortableColumn(col.key)
                  ? {
                      sortBy: {
                        index: activeSortIndex,
                        direction: sortDirection,
                      },
                      onSort: () => handleSortToggle(col.key as SortColumn),
                      columnIndex: index,
                    }
                  : undefined
              }
            >
              {col.key === "finding" ? (
                <Flex
                  gap={{ default: "gapXs" as const }}
                  alignItems={{ default: "alignItemsCenter" as const }}
                >
                  <FlexItem>{col.label}</FlexItem>
                  <FlexItem>
                    <Popover
                      triggerAction="hover"
                      aria-label="Finding information"
                      bodyContent={
                        <div>
                          While any repository is still pending, queued, or
                          sent, the finding is In progress. After every
                          repository has finished, this shows the highest risk
                          level detected across all of them. Not Vulnerable
                          appears only when every repository is analyzed and
                          found to be not vulnerable.
                        </div>
                      }
                    >
                      <Icon
                        role="button"
                        tabIndex={0}
                        aria-label="Finding help"
                        style={{
                          cursor: "help",
                          color: "var(--pf-v6-global--Color--200)",
                          flexShrink: 0,
                        }}
                      >
                        <OutlinedQuestionCircleIcon />
                      </Icon>
                    </Popover>
                  </FlexItem>
                </Flex>
              ) : (
                col.label
              )}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((row, index) => (
          <Tr key={`${row.productId}-${row.cveId}-${index}`}>
            {REPORTS_TABLE_COLUMNS.map((col) => (
              <Td key={col.key} dataLabel={col.label}>
                {renderCell(row, col)}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  const renderContent = () => {
    if (loading)
      return (
        <SkeletonTable
          rowsCount={10}
          columns={REPORTS_TABLE_COLUMNS.map((c) => c.label)}
        />
      );
    if (error)
      return (
        <TableErrorState
          columnNames={REPORTS_TABLE_COLUMNS.map((c) => c.label)}
          error={error}
        />
      );
    if (rows.length === 0)
      return <TableEmptyState columnCount={REPORTS_TABLE_COLUMNS.length} />;
    return getTable();
  };

  return (
    <Stack hasGutter>
      <StackItem>{toolbar}</StackItem>
      <StackItem>{renderContent()}</StackItem>
    </Stack>
  );
};

export default SbomsTable;
