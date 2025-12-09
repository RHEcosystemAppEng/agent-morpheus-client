/* eslint-disable no-console */
import { useState, useEffect } from "react";
import {
  Button,
  Label,
  Pagination,
  Flex,
  FlexItem,
  Spinner,
  Alert,
  AlertVariant,
  Card,
  CardBody,
} from "@patternfly/react-core";
import {
  Table,
  TableText,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@patternfly/react-table";
import {
  useReportsTableData,
  ReportRow,
  SortDirection,
  SortColumn,
  formatStatusLabel,
} from "../hooks/useReportsTableData";
import { ReportsToolbarFilters } from "./ReportsToolbar";
import { getErrorMessage } from "../utils/errorHandling";

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

  const getStatusColor = (
    productStatus: ReportRow["productStatus"]
  ): "red" | "green" | "grey" => {
    if (productStatus.status === "vulnerable") {
      return "red";
    }
    if (productStatus.status === "not_vulnerable") {
      return "green";
    }
    return "grey";
  };

  const columnNames = {
    sbomName: "SBOM name",
    cveId: "CVE ID",
    exploitIqStatus: "ExploitIQ status",
    completedAt: "Report completed at",
    analysisState: "Analysis state",
    action: "Action",
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const handleSortToggle = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection(column === "sbomName" ? "asc" : "desc");
    }
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [
    searchValue,
    cveSearchValue,
    filters.exploitIqStatus,
    filters.analysisState,
  ]);

  // Use PatternFly components for loading and error states (Rule IV)
  if (loading) {
    return (
      <Card>
        <CardBody>
          <Flex>
            <FlexItem>
              <Spinner size="lg" />
            </FlexItem>
            <FlexItem>Loading reports...</FlexItem>
          </Flex>
        </CardBody>
      </Card>
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
          isCompact
        />
      </FlexItem>
      <FlexItem>
        <Table aria-label="Reports table">
          <Thead>
            <Tr>
              <Th
                sort={{
                  sortBy: {
                    index: 0,
                    direction:
                      sortColumn === "sbomName" ? sortDirection : undefined,
                    defaultDirection: "asc",
                  },
                  onSort: () => handleSortToggle("sbomName"),
                  columnIndex: 0,
                }}
              >
                {columnNames.sbomName}
              </Th>
              <Th>{columnNames.cveId}</Th>
              <Th>{columnNames.exploitIqStatus}</Th>
              <Th
                sort={{
                  sortBy: {
                    index: 3,
                    direction:
                      sortColumn === "completedAt" ? sortDirection : undefined,
                    defaultDirection: "desc",
                  },
                  onSort: () => handleSortToggle("completedAt"),
                  columnIndex: 3,
                }}
              >
                {columnNames.completedAt}
              </Th>
              <Th>{columnNames.analysisState}</Th>
              <Th screenReaderText="Action" />
            </Tr>
          </Thead>
          <Tbody>
            {paginatedRows.length === 0 ? (
              <Tr>
                <Td colSpan={6}>No reports found</Td>
              </Tr>
            ) : (
              paginatedRows.map((row, index) => (
                <Tr key={`${row.productId}-${row.cveId}-${index}`}>
                  <Td dataLabel={columnNames.sbomName}>{row.sbomName}</Td>
                  <Td dataLabel={columnNames.cveId}>{row.cveId}</Td>
                  <Td dataLabel={columnNames.exploitIqStatus}>
                    <Label color={getStatusColor(row.productStatus)}>
                      {formatStatusLabel(row.productStatus)}
                    </Label>
                  </Td>
                  <Td dataLabel={columnNames.completedAt}>
                    {formatDate(row.completedAt)}
                  </Td>
                  <Td dataLabel={columnNames.analysisState}>
                    {row.analysisState}
                  </Td>
                  <Td
                    dataLabel={columnNames.action}
                    modifier="fitContent"
                    hasAction
                  >
                    <TableText>
                      <Button
                        variant="primary"
                        onClick={() =>
                          console.log(`View report ${row.productId}`)
                        }
                      >
                        View Report
                      </Button>
                    </TableText>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </FlexItem>
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
    </Flex>
  );
};

export default ReportsTable;
