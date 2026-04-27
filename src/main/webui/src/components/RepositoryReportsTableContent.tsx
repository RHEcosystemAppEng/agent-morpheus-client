// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useMemo } from "react";
import { Link } from "react-router";
import {
  Table,
  TableText,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ThProps,
} from "@patternfly/react-table";
import SkeletonTable from "@patternfly/react-component-groups/dist/dynamic/SkeletonTable";
import type { Report } from "../generated-client/models/Report";
import FormattedTimestamp from "./FormattedTimestamp";
import Finding from "./Finding";
import RepositoryTableToolbar from "./RepositoryTableToolbar";
import { getFindingForReportRow } from "../utils/findingDisplay";
import TableEmptyState from "./TableEmptyState";
import type { UseTableParamsResult } from "../hooks/useTableParams";
import type { SortColumn, RepoFilterKey } from "../hooks/repositoryReportsTableParams";
import TableErrorState from "./TableErrorState";

type ColumnKey =
  | "id"
  | "gitRepo"
  | "commitId"
  | "cveId"
  | "finding"
  | "submittedAt"
  | "completedAt";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortable?: boolean;
  width?: ThProps["width"];
}

const REPOSITORY_REPORTS_COLUMNS: ColumnDef[] = [
  { key: "id", label: "ID", width: 10 },
  { key: "gitRepo", label: "Repository", sortable: true, width: 25 },
  { key: "commitId", label: "Commit ID", width: 10 },
  { key: "cveId", label: "CVE ID" },
  { key: "finding", label: "Finding", width: 10 },
  { key: "submittedAt", label: "Date Requested", sortable: true, width: 15 },
  { key: "completedAt", label: "Date Completed", sortable: true, width: 15 },
];

function isSortableColumn(key: ColumnKey): key is SortColumn {
  const col = REPOSITORY_REPORTS_COLUMNS.find((c) => c.key === key);
  return col?.sortable === true;
}

export interface RepositoryReportsTableContentProps {
  reports: Report[] | null;
  loading: boolean;
  error: Error | null;
  pagination: { totalElements: number; totalPages: number } | null;
  tableParams: UseTableParamsResult<SortColumn, RepoFilterKey>;
  getViewPath: (report: Report) => string;
  /** When true, show CVE ID column and CVE ID filter (Single Repositories only). */
  showCveIdColumn?: boolean;
  ariaLabel?: string;
}

const RepositoryReportsTableContent: React.FC<
  RepositoryReportsTableContentProps
> = ({
  reports,
  loading,
  error,
  pagination,
  tableParams,
  getViewPath,
  showCveIdColumn = false,
  ariaLabel = "Repository reports table",
}) => {
  const showCveIdFilter = showCveIdColumn;
  const displayReports = reports || [];
  const totalFilteredCount = pagination?.totalElements ?? 0;
  const visibleColumns = REPOSITORY_REPORTS_COLUMNS.filter(
    (col) => col.key !== "cveId" || (col.key === "cveId" && showCveIdColumn)
  );
  const sortColumn = tableParams.data.sortColumn ?? "submittedAt";
  const sortDirection = tableParams.data.sortDirection ?? "desc";
  const activeSortIndex = useMemo(
    () =>
      Math.max(
        0,
        visibleColumns.findIndex((c) => c.key === sortColumn)
      ),
    [visibleColumns, sortColumn]
  );

  const toolbar = (
    <RepositoryTableToolbar
      tableParams={tableParams}
      loading={loading}
      showCveIdFilter={showCveIdFilter}
      itemCount={pagination?.totalElements ?? totalFilteredCount}
    />
  );

  const renderCell = (report: Report, col: ColumnDef) => {
    switch (col.key) {
      case "id":
        return (
          <TableText wrapModifier="truncate">
            <Link to={getViewPath(report)}>{report.scanId}</Link>
          </TableText>
        );
      case "gitRepo":
        return (
          <TableText wrapModifier="truncate">{report.gitRepo || ""}</TableText>
        );
      case "commitId":
        return (
          <TableText wrapModifier="truncate">{report.ref}</TableText>
        );
      case "cveId":
        return (
          <TableText wrapModifier="truncate">
            {report.vulns?.[0]?.vulnId ?? ""}
          </TableText>
        );
      case "finding": {
        const justificationStatus = report.vulns?.[0]?.justification?.status;
        return (
          <Finding
            finding={getFindingForReportRow(report.state, justificationStatus)}
          />
        );
      }
      case "submittedAt":
        return (
          <TableText wrapModifier="truncate">
            <FormattedTimestamp date={report.submittedAt} />
          </TableText>
        );
      case "completedAt":
        return (
          <TableText wrapModifier="truncate">
            <FormattedTimestamp date={report.completedAt} />
          </TableText>
        );
    }
  };

  const getTable = () => (
    <Table aria-label={ariaLabel}>
      <Thead>
        <Tr>
          {visibleColumns.map((col, index) => (
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
                      onSort: () =>
                        tableParams.handlers.handleSortToggle(col.key as SortColumn),
                      columnIndex: index,
                    }
                  : undefined
              }
            >
              {col.label}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {displayReports.map((report) => (
          <Tr key={report.id}>
            {visibleColumns.map((col) => (
              <Td key={col.key} dataLabel={col.label}>
                {renderCell(report, col)}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  const renderContent = () => {
    if (error)
      return (
        <TableErrorState
          columnNames={visibleColumns.map((c) => c.label)}
          error={error}
        />
      );
    if (loading)
      return (
        <SkeletonTable
          rowsCount={10}
          columns={visibleColumns.map((c) => c.label)}
        />
      );
    if (!reports || reports.length === 0)
      return <TableEmptyState columnCount={visibleColumns.length} />;
    return getTable();
  };

  return (
    <>
      {toolbar}
      {renderContent()}
    </>
  );
};

export default RepositoryReportsTableContent;
