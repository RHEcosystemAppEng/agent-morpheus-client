/**
 * Shared state and handlers for repository reports tables (product/CVE and single-repo).
 * Use with RepositoryReportsTableContent and either useRepositoryReports or useSingleRepositoryReports.
 */

import { useState, useCallback, useMemo } from "react";

export type SortColumn = "gitRepo" | "completedAt" | "state";
export type SortDirection = "asc" | "desc";

const PER_PAGE = 10;

function getColumnIndex(column: SortColumn): number {
  switch (column) {
    case "gitRepo":
      return 0;
    case "completedAt":
      return 3;
    case "state":
      return 4;
    default:
      return 0;
  }
}

export interface RepositoryReportsTableState {
  page: number;
  perPage: number;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  scanStateFilter: string[];
  exploitIqStatusFilter: string[];
  repositorySearchValue: string;
  activeSortIndex: number;
  activeSortDirection: SortDirection;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  handleScanStateFilterChange: (filters: string[]) => void;
  handleExploitIqStatusFilterChange: (filters: string[]) => void;
  handleRepositorySearchChange: (value: string) => void;
  onSetPage: (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number
  ) => void;
  onPerPageSelect: (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number
  ) => void;
  handleSortToggle: (column: SortColumn) => void;
}

export function useRepositoryReportsTableState(): RepositoryReportsTableState {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE);
  const [sortColumn, setSortColumn] = useState<SortColumn>("state");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [scanStateFilter, setScanStateFilter] = useState<string[]>([]);
  const [exploitIqStatusFilter, setExploitIqStatusFilter] = useState<string[]>(
    []
  );
  const [repositorySearchValue, setRepositorySearchValue] = useState<string>("");

  const handleScanStateFilterChange = useCallback((filters: string[]) => {
    setScanStateFilter(filters);
    setPage(1);
  }, []);

  const handleExploitIqStatusFilterChange = useCallback((filters: string[]) => {
    setExploitIqStatusFilter(filters);
    setPage(1);
  }, []);

  const handleRepositorySearchChange = useCallback((value: string) => {
    setRepositorySearchValue(value);
    setPage(1);
  }, []);

  const onSetPage = useCallback(
    (
      _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
      newPage: number
    ) => {
      setPage(newPage);
    },
    []
  );

  const onPerPageSelect = useCallback(
    (
      _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
      newPerPage: number,
      newPage: number
    ) => {
      setPerPage(newPerPage);
      setPage(newPage);
    },
    []
  );

  const handleSortToggle = useCallback((column: SortColumn) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prevColumn;
      }
      setSortDirection("asc");
      return column;
    });
    setPage(1);
  }, []);

  const activeSortIndex = useMemo(
    () => getColumnIndex(sortColumn),
    [sortColumn]
  );
  const activeSortDirection = sortDirection;

  return {
    page,
    perPage,
    sortColumn,
    sortDirection,
    scanStateFilter,
    exploitIqStatusFilter,
    repositorySearchValue,
    activeSortIndex,
    activeSortDirection,
    setPage,
    setPerPage,
    handleScanStateFilterChange,
    handleExploitIqStatusFilterChange,
    handleRepositorySearchChange,
    onSetPage,
    onPerPageSelect,
    handleSortToggle,
  };
}
