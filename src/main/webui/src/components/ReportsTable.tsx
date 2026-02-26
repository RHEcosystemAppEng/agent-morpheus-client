import { useState, useEffect, useRef } from "react";
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
  Spinner,
} from "@patternfly/react-core";
import { OutlinedQuestionCircleIcon, ExclamationCircleIcon, InProgressIcon } from "@patternfly/react-icons";
import { Table, Thead, Tr, Th, Tbody, Td, TableText } from "@patternfly/react-table";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import {
  useReportsTableData,
  SortDirection,
  SortColumn,
  getFinding,
} from "../hooks/useReportsTableData";
import ReportsToolbar from "./ReportsToolbar";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";
import TableEmptyState from "./TableEmptyState";
import { ReportEndpointService } from "../generated-client/services/ReportEndpointService";
import type { Report } from "../generated-client/models/Report";
import { useExecuteApi } from "../hooks/useExecuteApi";

const PER_PAGE = 10;

interface ReportsTableProps {
  searchValue?: string;
  cveSearchValue?: string;
  filters?: {};
  activeAttribute?: "SBOM Name" | "CVE ID";
  onSearchChange?: (value: string) => void;
  onCveSearchChange?: (value: string) => void;
  onFiltersChange?: (filters: {}) => void;
  onActiveAttributeChange?: (attr: "SBOM Name" | "CVE ID") => void;
  onClearFilters?: () => void;
  sortColumn?: SortColumn;
  sortDirection?: SortDirection;
  onSortChange?: (column: SortColumn, direction: SortDirection) => void;
}

const ReportsTable: React.FC<ReportsTableProps> = ({
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
  // Track which row is currently loading (only one at a time)
  // Store as object to avoid delimiter issues with productId or cveId
  const [loadingRow, setLoadingRow] = useState<{ productId: string; cveId: string } | null>(null);
  // Use ref to store current productId for the API call
  const currentProductIdRef = useRef<string | null>(null);
  
  // Use executeApi hook for on-demand API calls - automatically cancels previous promise
  const { data: reportsData, loading: reportsLoading, error: reportsError, execute: executeReportsQuery } = useExecuteApi<Array<Report>>(
    () => {
      // This will be called when execute() is invoked
      // Get productId from ref
      if (!currentProductIdRef.current) {
        throw new Error("No product ID set for query");
      }
      return ReportEndpointService.getApiV1Reports({
        productId: currentProductIdRef.current,
        pageSize: 1, // We only need the first report
      });
    }
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
  }, [searchValue, cveSearchValue]);

  // Use the custom hook for data fetching with server-side pagination and sorting
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
    repositoriesAnalyzed: "Repos Analyzed",
    finding: "Finding",
    submittedAt: "Submitted Date",
    completedAt: "Completion Date",
  };

  // Helper function to clear loading state and navigate to product page
  const navigateToProductPage = (productId: string, cveId: string) => {
    setLoadingRow(null);
    currentProductIdRef.current = null;
    navigate(`/reports/product/${productId}/${cveId}`);
  };

  // Handle navigation after reports query completes
  useEffect(() => {
    if (!reportsLoading && loadingRow) {
      const { productId, cveId } = loadingRow;
      
      if (reportsError) {
        // Error handling: clear loading state and fall back to product page (silent fallback)
        navigateToProductPage(productId, cveId);
        return;
      }
      
      if (reportsData) {
        // Handle edge cases
        if (reportsData.length === 0) {
          // Empty results: fall back to product page
          navigateToProductPage(productId, cveId);
          return;
        }

        // Take the first report and navigate to component route
        const firstReport = reportsData[0];
        if (!firstReport || !firstReport.id) {
          // No report or no report ID: fall back to product page
          navigateToProductPage(productId, cveId);
          return;
        }

        // Navigate directly to the report component page
        setLoadingRow(null);
        currentProductIdRef.current = null;
        navigate(`/reports/component/${cveId}/${firstReport.id}`);
      }
    }
  }, [reportsData, reportsLoading, reportsError, loadingRow, navigate]);

  // Handle Product ID link navigation
  const handleProductIdClick = (row: (typeof rows)[0]) => {
    if (!row.productId) {
      return;
    }

    // If submittedCount === 1, query reports and navigate directly to the report
    if (row.submittedCount === 1) {
      // Set productId in ref and loading state for this row
      // This will cancel any previous query when execute() is called
      currentProductIdRef.current = row.productId;
      setLoadingRow({ productId: row.productId, cveId: row.cveId });
      // Execute the query - useExecuteApi will cancel previous promise automatically
      executeReportsQuery();
    } else {
      // Standard navigation for multiple reports or undefined submittedCount
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

  // Get the current sort index and direction for PatternFly
  const activeSortIndex = getColumnIndex(sortColumn);
  const activeSortDirection = sortDirection;

  if (loading) {
    return (
      <SkeletonTable
        rowsCount={10}
        columns={[
          "Report ID",
          "SBOM Name",
          "CVE ID",
          "Repos Analyzed",
          "Finding",
          "Submitted Date",
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
          pagination={{
            itemCount: totalItems,
            page,
            perPage: PER_PAGE,
            onSetPage: (_event: unknown, newPage: number) => setPage(newPage),
          }}
        />
        <TableEmptyState columnCount={7} titleText="No reports found" />
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
            <Th width={10}>
              {columnNames.productId}
            </Th>
            <Th
              width={15}
              sort={{
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
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
                  direction: activeSortDirection,
                },
                onSort: () => handleSortToggle("cveId"),
                columnIndex: 2,
              }}
            >
              {columnNames.cveId}
            </Th>
            <Th width={10}>
              {columnNames.repositoriesAnalyzed}
            </Th>
            <Th
              width={15}              
            >              
              <Flex
                gap={{ default: "gapXs" as const }}
                alignItems={{ default: "alignItemsCenter" as const }}
              >
                
                <FlexItem>                  
                    {columnNames.finding}                  
                </FlexItem>
                <FlexItem>
                  <Popover
                    triggerAction="hover"
                    aria-label="Finding information"
                    bodyContent={
                      <div>
                        This status indicates the highest risk level detected across all repositories analyzed. Not Vulnerable appears only when every repository is analyzed and found to be not vulnerable.
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
                  direction: activeSortDirection,
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
                  direction: activeSortDirection,
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
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={7}>No reports found</Td>
            </Tr>
          ) : (
            rows.map((row, index) => {
              return (
                <Tr key={`${row.productId}-${row.cveId}-${index}`}>
                  <Td
                    dataLabel={columnNames.productId}
                  >
                    <TableText wrapModifier="truncate">
                      <Link
                        to="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleProductIdClick(row);
                        }}                        
                      >
                        {loadingRow?.productId === row.productId && loadingRow?.cveId === row.cveId ? (
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
                    {(() => {
                      const finding = getFinding(row.productStatus, row.analysisState, row.statusCounts);
                      if (!finding) {
                        return "";
                      }

                      // Build label text with count if applicable
                      const labelText = finding.count !== undefined 
                        ? `${finding.count} ${finding.label}`
                        : finding.label;

                      // Determine label props based on finding type
                      const labelProps: {
                        color?: "red" | "green" | "orange" | "grey";
                        variant?: "filled" | "outline";
                        icon?: React.ReactNode;
                      } = {};

                      if (finding.color) {
                        labelProps.color = finding.color;
                      }
                      if (finding.variant) {
                        labelProps.variant = finding.variant;
                      }
                      if (finding.type === "in-progress") {
                        labelProps.icon = <InProgressIcon />;
                      } else if (finding.type === "failed") {
                        labelProps.icon = <ExclamationCircleIcon />;
                      }

                      return (
                        <Label {...labelProps}>
                          {labelText}
                        </Label>
                      );
                    })()}
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
              );
            })
          )}
        </Tbody>
      </Table>
    </>
  );
};

export default ReportsTable;
