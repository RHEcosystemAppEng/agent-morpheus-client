/**
 * Shared state and handlers for repository reports tables (product/CVE and single-repo).
 * Use with RepositoryReportsTableContent and either useRepositoryReports or useSingleRepositoryReports.
 */

import { useState, useCallback } from "react";

export type SortColumn = "gitRepo" | "submittedAt" | "completedAt";
export type SortDirection = "asc" | "desc";

const PER_PAGE = 10;

export interface RepositoryReportsTableState {
  page: number;
  perPage: number;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  findingFilter: string[];
  repositorySearchValue: string;  
  activeSortDirection: SortDirection;
  handleFindingFilterChange: (filters: string[]) => void;
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
  const [sortColumn, setSortColumn] = useState<SortColumn>("submittedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [findingFilter, setFindingFilter] = useState<string[]>([]);
  const [repositorySearchValue, setRepositorySearchValue] = useState<string>("");

  const handleFindingFilterChange = useCallback((filters: string[]) => {
    setFindingFilter(filters);
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

  const activeSortDirection = sortDirection;

  return {
    page,
    perPage,
    sortColumn,
    sortDirection,
    findingFilter,
    repositorySearchValue,
    activeSortDirection,
    handleFindingFilterChange,
    handleRepositorySearchChange,
    onSetPage,
    onPerPageSelect,
    handleSortToggle,
  };
}
