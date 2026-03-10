/**
 * Types and constants for repository reports table URL state.
 * Use with useTableParams; pass params.data to useRepositoryReports and params to toolbar/content.
 */

import type { SortDirection as TableParamsSortDirection } from "./useTableParams";

export type SortColumn = "gitRepo" | "submittedAt" | "completedAt";
export type SortDirection = TableParamsSortDirection;

export const REPOSITORY_REPORTS_VALID_SORT_COLUMNS: readonly SortColumn[] = [
  "gitRepo",
  "submittedAt",
  "completedAt",
];

export const REPOSITORY_REPORTS_VALID_FILTER_KEYS = [
  "gitRepo",
  "cveId",
  "finding",
] as const;

export type RepoFilterKey =
  (typeof REPOSITORY_REPORTS_VALID_FILTER_KEYS)[number];
