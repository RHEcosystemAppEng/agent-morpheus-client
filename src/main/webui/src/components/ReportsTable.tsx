import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Label,
  Flex,
  FlexItem,
  Alert,
  AlertVariant,
  Card,
  CardBody,
  Popover,
  Icon,
} from "@patternfly/react-core";
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import {
  useReportsTableData,
  SortDirection,
  SortColumn,
  getStatusItems,
  isAnalysisCompleted,
} from "../hooks/useReportsTableData";
import ReportsToolbar from "./ReportsToolbar";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import TableEmptyState from "./TableEmptyState";

const PER_PAGE = 10;

interface ReportsTableProps {
  searchValue?: string;
  cveSearchValue?: string;
  filters?: {
    exploitIqStatus: string[];
    analysisState: string[];
  };
  activeAttribute?:
    | "SBOM Name"
    | "CVE ID"
    | "ExploitIQ Status"
    | "Analysis State";
  onSearchChange?: (value: string) => void;
  onCveSearchChange?: (value: string) => void;
  onFiltersChange?: (filters: {
    exploitIqStatus: string[];
    analysisState: string[];
  }) => void;
  onActiveAttributeChange?: (
    attr: "SBOM Name" | "CVE ID" | "ExploitIQ Status" | "Analysis State"
  ) => void;
  onClearFilters?: () => void;
  analysisStateOptions?: string[];
  sortColumn?: SortColumn;
  sortDirection?: SortDirection;
  onSortChange?: (column: SortColumn, direction: SortDirection) => void;
}

const ReportsTable: React.FC<ReportsTableProps> = ({
  searchValue = "",
  cveSearchValue = "",
  filters = { exploitIqStatus: [], analysisState: [] },
  activeAttribute = "SBOM Name",
  onSearchChange = () => {},
  onCveSearchChange = () => {},
  onFiltersChange = () => {},
  onActiveAttributeChange = () => {},
  onClearFilters = () => {},
  analysisStateOptions = [],
  sortColumn: propSortColumn,
  sortDirection: propSortDirection,
  onSortChange,
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(
    propSortColumn || "completedAt"
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    propSortDirection || "desc"
  );

  // Sync with props when they change (from URL)
  useEffect(() => {
    if (propSortColumn !== undefined) {
      setSortColumn(propSortColumn);
    }
  }, [propSortColumn]);

  useEffect(() => {
    if (propSortDirection !== undefined) {
      setSortDirection(propSortDirection);
    }
  }, [propSortDirection]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchValue,
    cveSearchValue,
    filters.exploitIqStatus,
    filters.analysisState,
  ]);

  // Use the custom hook for data fetching with server-side pagination and sorting
  const { rows, loading, error, pagination } = useReportsTableData({
    page,
    perPage: PER_PAGE,
    sortColumn,
    sortDirection,
    sbomName: searchValue,
    cveId: cveSearchValue,
    exploitIqStatus: filters.exploitIqStatus,
    analysisState: filters.analysisState,
  });

  const columnNames = {
    productId: "Product ID",
    sbomName: "SBOM name",
    cveId: "CVE ID",
    repositoriesAnalyzed: "Repositories Analyzed",
    exploitIqStatus: "ExploitIQ Status",
    completedAt: "Completion Date",
  };

  // Handle Product ID link navigation based on numReports
  const handleProductIdClick = (row: (typeof rows)[0]) => {
    // Use firstReportId which is always populated from the Product API
    const reportId = row.firstReportId;

    if (row.numReports === 1 && reportId && row.cveId) {
      // Single report: navigate to component report page
      navigate(`/reports/component/${row.cveId}/${reportId}`);
    } else if (row.cveId) {
      // Multiple reports: navigate to product report page
      navigate(`/reports/product/${row.productId}/${row.cveId}`);
    }
  };

  const handleSortToggle = (column: SortColumn) => {
    let newDirection: SortDirection;
    if (sortColumn === column) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      newDirection = "asc";
    }
    setSortColumn(column);
    setSortDirection(newDirection);
    setPage(1);
    // Notify parent component to update URL
    if (onSortChange) {
      onSortChange(column, newDirection);
    }
  };

  // Map sort columns to their column indices
  const getColumnIndex = (column: SortColumn): number => {
    switch (column) {
      case "productId":
        return 0;
      case "sbomName":
        return 1;
      case "completedAt":
        return 5;
      default:
        return 5;
    }
  };

  // Get the current sort index and direction for PatternFly
  const activeSortIndex = getColumnIndex(sortColumn);
  const activeSortDirection = sortDirection;

  if (loading) {
    return (
      <SkeletonTable
        rowsCount={10}
        columns={[
          "Product ID",
          "SBOM name",
          "CVE ID",
          "Repositories Analyzed",
          "ExploitIQ Status",
          "Completion Date",
        ]}
      />
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

  const totalItems = pagination?.totalElements ?? 0;

  if (rows.length === 0 && !loading) {
    return (
      <>
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
          analysisStateOptions={analysisStateOptions}
          pagination={{
            itemCount: totalItems,
            page,
            perPage: PER_PAGE,
            onSetPage: (_event: unknown, newPage: number) => setPage(newPage),
          }}
        />
        <TableEmptyState columnCount={6} titleText="No reports found" />
      </>
    );
  }

  return (
    <>
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
        analysisStateOptions={analysisStateOptions}
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
            <Th
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("productId"),
                columnIndex: 0,
              }}
            >
              {columnNames.productId}
            </Th>
            <Th
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("sbomName"),
                columnIndex: 1,
              }}
            >
              {columnNames.sbomName}
            </Th>
            <Th>{columnNames.cveId}</Th>
            <Th>{columnNames.repositoriesAnalyzed}</Th>
            <Th>
              <Flex
                gap={{ default: "gapSm" }}
                alignItems={{ default: "alignItemsCenter" }}
              >
                <FlexItem>{columnNames.exploitIqStatus}</FlexItem>
                <FlexItem>
                  <Popover
                    triggerAction="hover"
                    aria-label="ExploitIQ Status information"
                    bodyContent={
                      <div>
                        The status shows repository-level counts for this CVE.
                        All status types are displayed with their counts:
                        Vulnerable (red), Not Vulnerable (green), and Uncertain
                        (orange). Any status with a count of 0 is hidden. The
                        status is blank during analysis.
                      </div>
                    }
                  >
                    <Icon
                      role="button"
                      tabIndex={0}
                      aria-label="ExploitIQ Status help"
                      style={{
                        cursor: "help",
                        color: "var(--pf-v6-global--Color--200)",
                      }}
                    >
                      <OutlinedQuestionCircleIcon />
                    </Icon>
                  </Popover>
                </FlexItem>
              </Flex>
            </Th>
            <Th
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("completedAt"),
                columnIndex: 5,
              }}
            >
              {columnNames.completedAt}
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={6}>No reports found</Td>
            </Tr>
          ) : (
            rows.map((row, index) => {
              const isCompleted = isAnalysisCompleted(row.analysisState);
              return (
                <Tr key={`${row.productId}-${row.cveId}-${index}`}>
                  <Td
                    dataLabel={columnNames.productId}
                    style={{
                      maxWidth: "10rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleProductIdClick(row);
                      }}
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                    >
                      {row.productId}
                    </Link>
                  </Td>
                  <Td dataLabel={columnNames.sbomName}>{row.sbomName}</Td>
                  <Td dataLabel={columnNames.cveId}>{row.cveId}</Td>
                  <Td dataLabel={columnNames.repositoriesAnalyzed}>
                    {row.repositoriesAnalyzed}
                  </Td>
                  <Td dataLabel={columnNames.exploitIqStatus}>
                    {isCompleted
                      ? (() => {
                          const statusItems = getStatusItems(row.productStatus);
                          return statusItems.length > 0 ? (
                            <Flex gap={{ default: "gapSm" }}>
                              {statusItems.map((item, index) => (
                                <FlexItem key={index}>
                                  <Label color={item.color}>
                                    {item.count} {item.label}
                                  </Label>
                                </FlexItem>
                              ))}
                            </Flex>
                          ) : (
                            ""
                          );
                        })()
                      : ""}
                  </Td>
                  <Td dataLabel={columnNames.completedAt}>
                    {isCompleted ? (
                      <FormattedTimestamp date={row.completedAt} />
                    ) : (
                      ""
                    )}
                  </Td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>
    </>
  );
};

export default ReportsTable;
