import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Flex,
  FlexItem,
  Alert,
  AlertVariant,
  Card,
  CardBody,
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
} from "@patternfly/react-table";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import {
  useReportsTableData,
  SortDirection,
  SortColumn,
} from "../hooks/useReportsTableData";
import Finding from "./Finding";
import ReportsToolbar, {
  type ReportsToolbarFilters,
} from "./ReportsToolbar";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import TableEmptyState from "./TableEmptyState";
import { ReportEndpointService } from "../generated-client/services/ReportEndpointService";
import type { Report } from "../generated-client/models/Report";
import { useExecuteApi } from "../hooks/useExecuteApi";

const PER_PAGE = 10;

export interface SbomsTableProps {
  searchValue?: string;
  cveSearchValue?: string;
  filters?: ReportsToolbarFilters;
  activeAttribute?: "SBOM Name" | "CVE ID";
  onSearchChange?: (value: string) => void;
  onCveSearchChange?: (value: string) => void;
  onFiltersChange?: (filters: ReportsToolbarFilters) => void;
  onActiveAttributeChange?: (attr: "SBOM Name" | "CVE ID") => void;
  onClearFilters?: () => void;
  sortColumn?: SortColumn;
  sortDirection?: SortDirection;
  onSortChange?: (column: SortColumn, direction: SortDirection) => void;
}

const SbomsTable: React.FC<SbomsTableProps> = ({
  searchValue = "",
  cveSearchValue = "",
  filters = {},
  activeAttribute = "SBOM Name",
  onSearchChange = () => {},
  onCveSearchChange = () => {},
  onFiltersChange = () => {},
  onActiveAttributeChange = () => {},
  onClearFilters = () => {},
  sortColumn: propSortColumn,
  sortDirection: propSortDirection,
  onSortChange,
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(
    propSortColumn || "submittedAt"
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    propSortDirection || "desc"
  );
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

  useEffect(() => {
    if (propSortColumn !== undefined) setSortColumn(propSortColumn);
  }, [propSortColumn]);

  useEffect(() => {
    if (propSortDirection !== undefined) setSortDirection(propSortDirection);
  }, [propSortDirection]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, cveSearchValue]);

  const { rows, loading, error, pagination } = useReportsTableData({
    page,
    perPage: PER_PAGE,
    sortColumn,
    sortDirection,
    name: searchValue,
    cveId: cveSearchValue,
  });

  const columnNames = {
    productId: "Report ID",
    productName: "SBOM Name",
    cveId: "CVE ID",
    repositoriesAnalyzed: "Repositories Analyzed",
    finding: "Finding",
    submittedAt: "Date Requested",
    completedAt: "Date Completed",
  };

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
        if (!firstReport?.id) {
          navigateToProductPage(productId, cveId);
          return;
        }
        setLoadingRow(null);
        currentProductIdRef.current = null;
        navigate(`/reports/component/${cveId}/${firstReport.id}`);
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
    const newDirection: SortDirection =
      sortColumn === column
        ? sortDirection === "asc"
          ? "desc"
          : "asc"
        : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);
    setPage(1);
    onSortChange?.(column, newDirection);
  };

  const getColumnIndex = (column: SortColumn): number => {
    switch (column) {
      case "name":
        return 1;
      case "cveId":
        return 2;
      case "submittedAt":
        return 5;
      case "completedAt":
        return 6;
      default:
        return 5;
    }
  };

  const activeSortIndex = getColumnIndex(sortColumn);
  const totalItems = pagination?.totalElements ?? 0;

  if (loading) {
    return (      
      <SkeletonTable
        rowsCount={10}
        columns={Object.values(columnNames)}/>      
    );
  }

  if (error) {
    return (      
      <Card>
        <CardBody>
          <Alert variant={AlertVariant.danger} title="Error loading reports">
            {getErrorMessage(error)}
          </Alert>
        </CardBody>
      </Card>      
    );
  }

  if (rows.length === 0) {
    return (
      <Stack hasGutter>
        <StackItem>      
          <ReportsToolbar
            searchValue={searchValue}
            cveSearchValue={cveSearchValue}
            filters={filters}
            activeAttribute={activeAttribute}
            onSearchChange={onSearchChange}
            onCveSearchChange={onCveSearchChange}
            onFiltersChange={onFiltersChange}
            onActiveAttributeChange={onActiveAttributeChange}
            onClearFilters={onClearFilters}
            pagination={{
              itemCount: totalItems,
              page,
              perPage: PER_PAGE,
              onSetPage: (_event: unknown, newPage: number) => setPage(newPage),
            }}
          />
        </StackItem>
        <StackItem>
            <TableEmptyState columnCount={7} titleText="No reports found" />            
          </StackItem>
        </Stack>      
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <ReportsToolbar
          searchValue={searchValue}
          cveSearchValue={cveSearchValue}
          filters={filters}
          activeAttribute={activeAttribute}
          onSearchChange={onSearchChange}
          onCveSearchChange={onCveSearchChange}
          onFiltersChange={onFiltersChange}
          onActiveAttributeChange={onActiveAttributeChange}
          onClearFilters={onClearFilters}
          pagination={{
            itemCount: totalItems,
            page,
            perPage: PER_PAGE,
            onSetPage: (_event: unknown, newPage: number) => setPage(newPage),
          }}
        />
        <Table aria-label="Reports table">
          <Thead>
            <Tr>
              <Th width={10}>{columnNames.productId}</Th>
              <Th
                width={15}
                sort={{
                  sortBy: {
                    index: activeSortIndex,
                    direction: sortDirection,
                  },
                  onSort: () => handleSortToggle("name"),
                  columnIndex: 1,
                }}
              >
                {columnNames.productName}
              </Th>
              <Th
                width={10}
                sort={{
                  sortBy: {
                    index: activeSortIndex,
                    direction: sortDirection,
                  },
                  onSort: () => handleSortToggle("cveId"),
                  columnIndex: 2,
                }}
              >
                {columnNames.cveId}
              </Th>
              <Th width={15}>{columnNames.repositoriesAnalyzed}</Th>
              <Th width={10}>
                <Flex
                  gap={{ default: "gapXs" as const }}
                  alignItems={{ default: "alignItemsCenter" as const }}
                >
                  <FlexItem>{columnNames.finding}</FlexItem>
                  <FlexItem>
                    <Popover
                      triggerAction="hover"
                      aria-label="Finding information"
                      bodyContent={
                        <div>
                          This status indicates the highest risk level detected
                          across all repositories analyzed. Not Vulnerable
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
              </Th>
              <Th
                width={20}
                sort={{
                  sortBy: {
                    index: activeSortIndex,
                    direction: sortDirection,
                  },
                  onSort: () => handleSortToggle("submittedAt"),
                  columnIndex: 5,
                }}
              >
                {columnNames.submittedAt}
              </Th>
              <Th
                width={20}
                sort={{
                  sortBy: {
                    index: activeSortIndex,
                    direction: sortDirection,
                  },
                  onSort: () => handleSortToggle("completedAt"),
                  columnIndex: 6,
                }}
              >
                {columnNames.completedAt}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((row, index) => (
              <Tr key={`${row.productId}-${row.cveId}-${index}`}>
                <Td dataLabel={columnNames.productId}>
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
                </Td>
                <Td dataLabel={columnNames.productName}>
                  <TableText wrapModifier="truncate">{row.productName}</TableText>
                </Td>
                <Td dataLabel={columnNames.cveId}>{row.cveId}</Td>
                <Td dataLabel={columnNames.repositoriesAnalyzed}>
                  {row.repositoriesAnalyzed}
                </Td>
                <Td dataLabel={columnNames.finding}>
                  <Finding finding={row.finding} />
                </Td>
                <Td dataLabel={columnNames.submittedAt}>
                  {row.submittedAt ? (
                    <FormattedTimestamp date={row.submittedAt} />
                  ) : (
                    " "
                  )}
                </Td>
                <Td dataLabel={columnNames.completedAt}>
                  {row.completedAt ? (
                    <FormattedTimestamp date={row.completedAt} />
                  ) : (
                    " "
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </StackItem>
    </Stack>
  );
};

export default SbomsTable;
