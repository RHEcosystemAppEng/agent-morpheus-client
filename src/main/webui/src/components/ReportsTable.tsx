import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Label,
  Pagination,
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
import { ReportsToolbarFilters } from "./ReportsToolbar";
import { getErrorMessage } from "../utils/errorHandling";
import FormattedTimestamp from "./FormattedTimestamp";

const PER_PAGE = 8;

interface ReportsTableProps {
  searchValue: string;
  cveSearchValue: string;
  filters: ReportsToolbarFilters;
}

const ReportsTable: React.FC<ReportsTableProps> = ({
  searchValue,
  cveSearchValue,
  filters,
}) => {
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>("completedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Use the custom hook for data fetching and processing (Rule VI)
  const {
    rows: filteredRows,
    loading,
    error,
  } = useReportsTableData({
    searchValue,
    cveSearchValue,
    filters,
    sortColumn,
    sortDirection,
  });

  // Paginate the filtered rows
  const paginatedRows = filteredRows.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  const columnNames = {
    reportId: "Report ID",
    sbomName: "SBOM name",
    cveId: "CVE ID",
    repositoriesAnalyzed: "Repositories Analyzed",
    exploitIqStatus: "ExploitIQ Status",
    completedAt: "Completion Date",
  };

  const handleSortToggle = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
  };

  // Map sort columns to their column indices
  const getColumnIndex = (column: SortColumn): number => {
    switch (column) {
      case "reportId":
        return 0;
      case "sbomName":
        return 1;
      case "completedAt":
        return 5;
      default:
        return 0;
    }
  };

  // Get the current sort index and direction for PatternFly
  const activeSortIndex = getColumnIndex(sortColumn);
  const activeSortDirection = sortDirection;

  useEffect(() => {
    setPage(1);
  }, [
    searchValue,
    cveSearchValue,
    filters.exploitIqStatus,
    filters.analysisState,
  ]);

  if (loading) {
    return (
      <SkeletonTable
        rowsCount={8}
        columns={[
          "Report ID",
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

  return (
    <Flex direction={{ default: "column" }}>
      <FlexItem align={{ default: "alignRight" }}>
        <Pagination
          itemCount={filteredRows.length}
          perPage={PER_PAGE}
          page={page}
          onSetPage={(_event, newPage) => setPage(newPage)}
          onPerPageSelect={() => {
            setPage(1);
          }}
          perPageOptions={[]}
        />
      </FlexItem>
      <FlexItem>
        <Table aria-label="Reports table">
          <Thead>
            <Tr>
              <Th
                sort={{
                  sortBy: {
                    index: activeSortIndex,
                    direction: activeSortDirection,
                  },
                  onSort: () => handleSortToggle("reportId"),
                  columnIndex: 0,
                }}
              >
                {columnNames.reportId}
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
                          Vulnerable (red), Not Vulnerable (green), and
                          Uncertain (orange). Any status with a count of 0 is
                          hidden. The status is blank during analysis.
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
            {paginatedRows.length === 0 ? (
              <Tr>
                <Td colSpan={6}>No reports found</Td>
              </Tr>
            ) : (
              paginatedRows.map((row, index) => {
                const isCompleted = isAnalysisCompleted(row.analysisState);
                return (
                  <Tr key={`${row.reportId}-${row.cveId}-${index}`}>
                    <Td
                      dataLabel={columnNames.reportId}
                      style={{
                        maxWidth: "10rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Link
                        to={`/Reports/${row.reportId}/${row.cveId}`}
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.reportId}
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
                            const statusItems = getStatusItems(
                              row.productStatus
                            );
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
      </FlexItem>
    </Flex>
  );
};

export default ReportsTable;
