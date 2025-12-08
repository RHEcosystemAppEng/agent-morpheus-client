/* eslint-disable no-console */
import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Label,
  Pagination,
  Flex,
  FlexItem,
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
import { useApi } from "../hooks/useApi";
import {
  ReportEndpointService as Reports,
  ProductSummary,
} from "../generated-client";
import { ReportsToolbarFilters } from "./ReportsToolbar";

interface ReportRow {
  productId: string;
  sbomName: string;
  cveId: string;
  exploitIqStatus: string;
  exploitIqLabel: string;
  completedAt: string;
  analysisState: string;
}

const PER_PAGE = 8;

type SortDirection = "asc" | "desc";

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
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const {
    data: productSummaries,
    loading,
    error,
  } = useApi<Array<ProductSummary>>(() => Reports.getApiReportsProduct());

  const getStatusColor = (
    status: string,
    label: string
  ): "red" | "orange" | "green" | "grey" => {
    if (status === "true" || label === "vulnerable") {
      return "red";
    }
    if (status === "unknown" || label === "uncertain") {
      return "orange";
    }
    if (
      status === "false" ||
      label.includes("not") ||
      label.includes("protected")
    ) {
      return "green";
    }
    return "grey";
  };

  const formatStatusLabel = (label: string): string => {
    if (label === "vulnerable") return "Vulnerable";
    if (label === "uncertain") return "Uncertain";
    if (label === "false_positive") return "Not Vulnerable";
    if (label.includes("not_present") || label.includes("not_reachable"))
      return "Not Vulnerable";
    if (label.includes("protected")) return "Not Vulnerable";
    return label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const reportRows = useMemo(() => {
    if (!productSummaries) return [];

    const rows: ReportRow[] = [];

    productSummaries.forEach((productSummary) => {
      const productId = productSummary.data.id;
      const sbomName = productSummary.data.name || "-";
      const completedAt = productSummary.data.completedAt || "";
      const analysisState = productSummary.summary.productState || "-";
      const cves = productSummary.summary.cves || {};

      // Create a row for each CVE
      const cveIds = Object.keys(cves);
      if (cveIds.length > 0) {
        cveIds.forEach((cveId) => {
          const justifications = cves[cveId] || [];
          // Use the first justification if multiple exist
          const justification = justifications[0] || {
            status: "unknown",
            label: "uncertain",
          };
          rows.push({
            productId,
            sbomName,
            cveId,
            exploitIqStatus: justification.status || "unknown",
            exploitIqLabel: justification.label || "uncertain",
            completedAt,
            analysisState,
          });
        });
      } else {
        // If no CVEs, create a single row with empty CVE
        rows.push({
          productId,
          sbomName,
          cveId: "-",
          exploitIqStatus: "unknown",
          exploitIqLabel: "uncertain",
          completedAt,
          analysisState,
        });
      }
    });

    return rows;
  }, [productSummaries]);

  const filteredRows = useMemo(() => {
    let filtered = reportRows;

    // Apply SBOM name search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase().trim();
      filtered = filtered.filter((row) =>
        row.sbomName.toLowerCase().includes(searchLower)
      );
    }

    // Apply CVE ID search filter
    if (cveSearchValue.trim()) {
      const searchLower = cveSearchValue.toLowerCase().trim();
      filtered = filtered.filter((row) =>
        row.cveId.toLowerCase().includes(searchLower)
      );
    }

    // Apply ExploitIQ status filter
    if (filters.exploitIqStatus.length > 0) {
      filtered = filtered.filter((row) => {
        const formattedLabel = formatStatusLabel(row.exploitIqLabel);
        return filters.exploitIqStatus.includes(formattedLabel);
      });
    }

    // Apply Analysis state filter
    if (filters.analysisState.length > 0) {
      filtered = filtered.filter((row) =>
        filters.analysisState.includes(row.analysisState)
      );
    }

    // Apply sorting by completedAt
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;

      if (sortDirection === "desc") {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    return filtered;
  }, [
    reportRows,
    searchValue,
    cveSearchValue,
    filters.exploitIqStatus,
    filters.analysisState,
    sortDirection,
  ]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    return filteredRows.slice(start, end);
  }, [filteredRows, page]);

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

  const handleSortToggle = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
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

  if (loading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div>Error loading reports: {error.message}</div>;
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
              <Th>{columnNames.sbomName}</Th>
              <Th>{columnNames.cveId}</Th>
              <Th>{columnNames.exploitIqStatus}</Th>
              <Th
                sort={{
                  sortBy: {
                    index: 0,
                    direction: sortDirection,
                    defaultDirection: "desc",
                  },
                  onSort: handleSortToggle,
                  columnIndex: 0,
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
                    <Label
                      color={getStatusColor(
                        row.exploitIqStatus,
                        row.exploitIqLabel
                      )}
                    >
                      {formatStatusLabel(row.exploitIqLabel)}
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
