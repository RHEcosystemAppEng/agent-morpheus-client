/* eslint-disable no-console */
import { Fragment, useState, useMemo } from "react";
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
  Report,
  VulnResult,
} from "../generated-client";

interface ReportRow {
  reportId: string;
  sbomName: string;
  cveId: string;
  exploitIqStatus: string;
  exploitIqLabel: string;
  completedAt: string;
  analysisState: string;
}

const PER_PAGE = 8;

const ReportsTable: React.FC = () => {
  const [page, setPage] = useState(1);

  const {
    data: reports,
    loading,
    error,
  } = useApi<Array<Report>>(() => Reports.getApiReports({ pageSize: 100 }));

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
    if (!reports) return [];

    const rows: ReportRow[] = [];

    reports.forEach((report) => {
      if (report.vulns && report.vulns.length > 0) {
        report.vulns.forEach((vuln: VulnResult) => {
          rows.push({
            reportId: report.id,
            sbomName: report.name || "-",
            cveId: vuln.vulnId || "-",
            exploitIqStatus: vuln.justification?.status || "unknown",
            exploitIqLabel: vuln.justification?.label || "uncertain",
            completedAt: report.completedAt || "",
            analysisState: report.state || "-",
          });
        });
      } else {
        rows.push({
          reportId: report.id,
          sbomName: report.name || "-",
          cveId: "-",
          exploitIqStatus: "unknown",
          exploitIqLabel: "uncertain",
          completedAt: report.completedAt || "",
          analysisState: report.state || "-",
        });
      }
    });

    return rows;
  }, [reports]);

  const filteredRows = useMemo(() => {
    return reportRows;
  }, [reportRows]);

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
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div>Error loading reports: {error.message}</div>;
  }

  return (
    <Fragment>
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
                <Th>{columnNames.completedAt}</Th>
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
                  <Tr key={`${row.reportId}-${row.cveId}-${index}`}>
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
                            console.log(`View report ${row.reportId}`)
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
    </Fragment>
  );
};

export default ReportsTable;