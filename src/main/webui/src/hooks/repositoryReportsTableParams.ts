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

/**
 * Types and constants for repository reports table URL state.
 * Use with useTableParams; pass params.data to useRepositoryReports and params to toolbar/content.
 */

import type { SortDirection as TableParamsSortDirection } from "./useTableParams";

/** Matches repository reports table layouts and `GET /api/v1/reports` `inputType` for standalone tabs. */
export type RepositoryReportsInputType = "repository" | "rpm";

/** Sort columns for **`GET /api/v1/reports`** `sortBy` (maps via backend SORT_MAPPINGS). */
export type RepoSortColumn =
  | "gitRepo"
  | "submittedAt"
  | "completedAt"
  | "rpmPackage"
  | "rpmArchitecture";

export type SortDirection = TableParamsSortDirection;

export const REPOSITORY_REPORTS_REPOSITORY_SORT_COLUMNS: readonly RepoSortColumn[] = [
  "gitRepo",
  "submittedAt",
  "completedAt",
];

export const REPOSITORY_REPORTS_RPM_SORT_COLUMNS: readonly RepoSortColumn[] = [
  "rpmPackage",
  "rpmArchitecture",
  "submittedAt",
  "completedAt",
];

export const REPOSITORY_REPORTS_VALID_FILTER_KEYS = [
  "gitRepo",
  "cveId",
  "finding",
  "rpmPackage",
] as const;

export type RepoFilterKey =
  (typeof REPOSITORY_REPORTS_VALID_FILTER_KEYS)[number];

/** @deprecated Prefer {@link RepoSortColumn}. */
export type SortColumn = RepoSortColumn;

/** @deprecated Prefer {@link REPOSITORY_REPORTS_REPOSITORY_SORT_COLUMNS}. */
export const REPOSITORY_REPORTS_VALID_SORT_COLUMNS =
  REPOSITORY_REPORTS_REPOSITORY_SORT_COLUMNS;
