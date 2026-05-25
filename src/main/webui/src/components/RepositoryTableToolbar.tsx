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

import { useState } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarToggleGroup,
  SearchInput,
  Pagination,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";
import { AttributeSelector, SingleSelectFilter } from "./Filtering";
import { PER_PAGE_OPTIONS } from "../constants/pagination";
import type { UseTableParamsResult } from "../hooks/useTableParams";
import type {
  RepositoryReportsInputType,
  SortColumn,
  RepoFilterKey,
} from "../hooks/repositoryReportsTableParams";

const FINDING_FILTER_OPTIONS = [
  "Vulnerable",
  "Not Vulnerable",
  "Uncertain",
  "In progress",
  "Failed",
];

const DEFAULT_PER_PAGE = 10;

interface RepositoryTableToolbarProps {
  tableParams: UseTableParamsResult<SortColumn, RepoFilterKey>;
  loading: boolean;
  /** When true, show CVE ID filter on Standalone (`/reports/single-repositories` / `/reports/rpm`). */
  showCveIdFilter?: boolean;
  /**
   * Standalone artifact search: **`repository`** reads/writes URL key **`gitRepo`** (repository name);
   * **`rpm`** reads/writes **`rpmPackage`** (NVR substring). Aligns with **`GET /api/v1/reports` `inputType`**.
   */
  inputType?: RepositoryReportsInputType;
  itemCount?: number;
}

type ActiveAttribute = "Repository Name" | "CVE ID" | "Finding" | "Package";

/** URL / API filter field backing the artifact search box for the given tab. */
function artifactFilterUrlKey(inputType: RepositoryReportsInputType): "gitRepo" | "rpmPackage" {
  return inputType === "rpm" ? "rpmPackage" : "gitRepo";
}

const RepositoryTableToolbar: React.FC<RepositoryTableToolbarProps> = ({
  tableParams,
  loading,
  showCveIdFilter = false,
  inputType = "repository",
  itemCount,
}) => {
  const [activeAttribute, setActiveAttribute] = useState<ActiveAttribute>(
    inputType === "rpm" ? "Package" : "Repository Name"
  );

  const { data, handlers } = tableParams;
  const artifactKey = artifactFilterUrlKey(inputType);
  const inputArtifactFilter = data.getFilterValue(artifactKey) ?? "";
  const setInputArtifactFilter = (value: string) => {
    handlers.setFilterValue(artifactKey, value);
  };

  const findingFilter = data.getFilterValue("finding") ?? undefined;
  const cveIdFilterValue = data.getFilterValue("cveId") ?? "";
  const page = data.page ?? 1;
  const perPage = data.perPage ?? DEFAULT_PER_PAGE;

  const attributes: ActiveAttribute[] =
    inputType === "rpm"
      ? ["Package", ...(showCveIdFilter ? (["CVE ID"] as const) : []), "Finding"]
      : [
          "Repository Name",
          ...(showCveIdFilter ? (["CVE ID"] as const) : []),
          "Finding",
        ];

  const artifactCategoryName: ActiveAttribute =
    inputType === "rpm" ? "Package" : "Repository Name";

  const artifactSearchInput = (
    <SearchInput
      aria-label={
        inputType === "rpm"
          ? "Filter by RPM package — name, version, or release (substring match)"
          : "Search by repository name"
      }
      placeholder={
        inputType === "rpm"
          ? "Filter by package (substring)"
          : "Search by Repository Name"
      }
      value={inputArtifactFilter}
      onChange={(_event, value) => setInputArtifactFilter(value)}
      onClear={() => setInputArtifactFilter("")}
    />
  );

  const cveIdSearchInput = showCveIdFilter ? (
    <SearchInput
      aria-label="Filter by CVE ID"
      placeholder="Filter by CVE ID"
      value={cveIdFilterValue}
      onChange={(_event, value) => handlers.setFilterValue("cveId", value)}
      onClear={() => handlers.setFilterValue("cveId", "")}
    />
  ) : null;

  return (
    <Toolbar
      id="repository-reports-toolbar"
      clearAllFilters={handlers.clearAllFilters}
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>
              <AttributeSelector
                activeAttribute={activeAttribute}
                attributes={attributes}
                onAttributeChange={(attr) =>
                  setActiveAttribute(attr as ActiveAttribute)
                }
              />
            </ToolbarItem>
            <ToolbarFilter
              labels={inputArtifactFilter !== "" ? [inputArtifactFilter] : []}
              deleteLabel={() => setInputArtifactFilter("")}
              deleteLabelGroup={() => setInputArtifactFilter("")}
              categoryName={artifactCategoryName}
              showToolbarItem={activeAttribute === artifactCategoryName}
            >
              {artifactSearchInput}
            </ToolbarFilter>
            {showCveIdFilter && (
              <ToolbarFilter
                labels={cveIdFilterValue !== "" ? [cveIdFilterValue] : []}
                deleteLabel={() => handlers.setFilterValue("cveId", "")}
                deleteLabelGroup={() => handlers.setFilterValue("cveId", "")}
                categoryName="CVE ID"
                showToolbarItem={activeAttribute === "CVE ID"}
              >
                {cveIdSearchInput}
              </ToolbarFilter>
            )}
            <ToolbarFilter
              labels={findingFilter != null ? [findingFilter] : []}
              deleteLabel={() => handlers.setFilterValue("finding", "")}
              deleteLabelGroup={() => handlers.setFilterValue("finding", "")}
              categoryName="Finding"
              showToolbarItem={activeAttribute === "Finding"}
            >
              <SingleSelectFilter
                id="finding-single-select-menu"
                label="Filter by Finding"
                options={FINDING_FILTER_OPTIONS}
                selected={findingFilter}
                onSelect={(value) =>
                  handlers.setFilterValue("finding", value ?? "")
                }
                loading={loading}
              />
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarToggleGroup>
        {itemCount != null && (
          <ToolbarGroup align={{ default: "alignEnd" }}>
            <ToolbarItem>
              <Pagination
                itemCount={itemCount}
                page={page}
                perPage={perPage}
                onSetPage={(
                  _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
                  newPage: number
                ) => handlers.setPage(newPage)}
                onPerPageSelect={(
                  _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
                  newPerPage: number,
                  newPage: number
                ) => {
                  handlers.setPagination(newPerPage, newPage);
                }}
                perPageOptions={PER_PAGE_OPTIONS}
              />
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

export default RepositoryTableToolbar;
