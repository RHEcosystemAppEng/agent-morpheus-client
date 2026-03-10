/**
 * Generic hook that reads and writes table state (sort, filter, pagination) from the URL.
 * Does not apply defaults; the caller/table applies defaults.
 * All handler calls update the URL so state is always in sync.
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

const PARAM_SORT_FIELD = "sortField";
const PARAM_SORT_DIRECTION = "sortDirection";
const PARAM_PAGE = "page";
const PARAM_PER_PAGE = "perPage";

export type SortDirection = "asc" | "desc";

export interface UseTableParamsOptions<TSort extends string, TFilterKey extends string> {
  validSortColumns: readonly TSort[];
  validFilterKeys: readonly TFilterKey[];
}

export interface UseTableParamsData<TSort extends string, TFilterKey extends string> {
  sortColumn: TSort | undefined;
  sortDirection: SortDirection | undefined;
  page: number | undefined;
  perPage: number | undefined;
  getFilterValue: (key: TFilterKey) => string | undefined;
}

export interface UseTableParamsHandlers<TSort extends string, TFilterKey extends string> {
  setFilterValue: (key: TFilterKey, value: string) => void;
  setSort: (column: TSort, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  /** Set pagination (perPage and page) in a single URL update (e.g. for per-page dropdown). */
  setPagination: (perPage: number, page: number) => void;
  handleSortToggle: (column: TSort) => void;
}

export interface UseTableParamsResult<TSort extends string, TFilterKey extends string> {
  data: UseTableParamsData<TSort, TFilterKey>;
  handlers: UseTableParamsHandlers<TSort, TFilterKey>;
}

function parsePositiveInt(value: string | null): number | undefined {
  if (value == null || !/^\d+$/.test(value)) return undefined;
  const n = parseInt(value, 10);
  return n >= 1 ? n : undefined;
}

export function useTableParams<TSort extends string, TFilterKey extends string>(
  options: UseTableParamsOptions<TSort, TFilterKey>
): UseTableParamsResult<TSort, TFilterKey> {
  const { validSortColumns, validFilterKeys } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const sortColumn = useMemo((): TSort | undefined => {
    const sortField = searchParams.get(PARAM_SORT_FIELD);
    if (sortField == null) return undefined;
    return validSortColumns.includes(sortField as TSort) ? (sortField as TSort) : undefined;
  }, [searchParams, validSortColumns]);

  const sortDirection = useMemo((): SortDirection | undefined => {
    const dir = searchParams.get(PARAM_SORT_DIRECTION);
    return dir === "asc" || dir === "desc" ? dir : undefined;
  }, [searchParams]);

  const page = useMemo(
    () => parsePositiveInt(searchParams.get(PARAM_PAGE)),
    [searchParams]
  );

  const perPage = useMemo(
    () => parsePositiveInt(searchParams.get(PARAM_PER_PAGE)),
    [searchParams]
  );

  const getFilterValue = useCallback(
    (key: TFilterKey): string | undefined => {
      if (!validFilterKeys.includes(key)) return undefined;
      const value = searchParams.get(key);
      return value ?? undefined;
    },
    [searchParams, validFilterKeys]
  );

  const updateUrl = useCallback(
    (updater: (prev: URLSearchParams) => URLSearchParams) => {
      setSearchParams(updater(searchParams), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setFilterValue = useCallback(
    (key: TFilterKey, value: string) => {
      updateUrl((prev) => {
        const next = new URLSearchParams(prev);
        if (value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        next.set(PARAM_PAGE, "1");
        return next;
      });
    },
    [updateUrl]
  );

  const setSort = useCallback(
    (column: TSort, direction: SortDirection) => {
      updateUrl((prev) => {
        const next = new URLSearchParams(prev);
        next.set(PARAM_SORT_FIELD, column);
        next.set(PARAM_SORT_DIRECTION, direction);
        next.set(PARAM_PAGE, "1");
        return next;
      });
    },
    [updateUrl]
  );

  const setPage = useCallback(
    (newPage: number) => {
      updateUrl((prev) => {
        const next = new URLSearchParams(prev);
        next.set(PARAM_PAGE, String(newPage));
        return next;
      });
    },
    [updateUrl]
  );

  const setPerPage = useCallback(
    (newPerPage: number) => {
      updateUrl((prev) => {
        const next = new URLSearchParams(prev);
        next.set(PARAM_PER_PAGE, String(newPerPage));
        next.set(PARAM_PAGE, "1");
        return next;
      });
    },
    [updateUrl]
  );

  const setPagination = useCallback(
    (newPerPage: number, newPage: number) => {
      updateUrl((prev) => {
        const next = new URLSearchParams(prev);
        next.set(PARAM_PER_PAGE, String(newPerPage));
        next.set(PARAM_PAGE, String(newPage));
        return next;
      });
    },
    [updateUrl]
  );

  const handleSortToggle = useCallback(
    (column: TSort) => {
      const nextDirection: SortDirection =
        sortColumn === column
          ? sortDirection === "asc"
            ? "desc"
            : "asc"
          : "asc";
      setSort(column, nextDirection);
    },
    [sortColumn, sortDirection, setSort]
  );

  return {
    data: {
      sortColumn,
      sortDirection,
      page,
      perPage,
      getFilterValue,
    },
    handlers: {
      setFilterValue,
      setSort,
      setPage,
      setPerPage,
      setPagination,
      handleSortToggle,
    },
  };
}
