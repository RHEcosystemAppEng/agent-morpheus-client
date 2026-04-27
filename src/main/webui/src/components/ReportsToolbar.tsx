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

import React from "react";
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
import { AttributeSelector } from "./Filtering";
import { PER_PAGE_OPTIONS } from "../constants/pagination";

export interface ReportsToolbarFilters {}

interface ReportsToolbarProps {
  searchValue?: string;
  cveSearchValue?: string;
  filters?: ReportsToolbarFilters;
  activeAttribute?: "SBOM Name" | "CVE ID";
  onSearchChange?: (value: string) => void;
  onCveSearchChange?: (value: string) => void;
  onFiltersChange?: (filters: ReportsToolbarFilters) => void;
  onActiveAttributeChange?: (attr: "SBOM Name" | "CVE ID") => void;
  onClearFilters?: () => void;
  pagination?: {
    itemCount: number;
    page: number;
    perPage: number;
    onSetPage: (event: unknown, newPage: number) => void;
    onPerPageSelect: (
      event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
      newPerPage: number,
      newPage: number
    ) => void;
  };
}

type ActiveAttribute = "SBOM Name" | "CVE ID";

const ReportsToolbar: React.FC<ReportsToolbarProps> = ({
  searchValue = "",
  cveSearchValue = "",
  filters: _filters = {},
  activeAttribute = "SBOM Name",
  onSearchChange = () => {},
  onCveSearchChange = () => {},
  onFiltersChange: _onFiltersChange = () => {},
  onActiveAttributeChange = () => {},
  onClearFilters = () => {},
  pagination,
}) => {
  const productSearchInput = (
    <SearchInput
      aria-label="Search by SBOM name"
      placeholder="Search by SBOM Name"
      value={searchValue}
      onChange={(_event, value) => onSearchChange(value)}
      onClear={() => onSearchChange("")}
    />
  );

  const cveSearchInput = (
    <SearchInput
      aria-label="Search by CVE ID"
      placeholder="Search by CVE ID"
      value={cveSearchValue}
      onChange={(_event, value) => onCveSearchChange(value)}
      onClear={() => onCveSearchChange("")}
    />
  );

  return (
    <Toolbar
      id="reports-toolbar"
      clearAllFilters={onClearFilters}
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>
              <AttributeSelector
                activeAttribute={activeAttribute}
                attributes={["SBOM Name", "CVE ID"]}
                onAttributeChange={(attr) =>
                  onActiveAttributeChange(attr as ActiveAttribute)
                }
              />
            </ToolbarItem>
            <ToolbarFilter
              labels={searchValue !== "" ? [searchValue] : []}
              deleteLabel={() => onSearchChange("")}
              deleteLabelGroup={() => onSearchChange("")}
              categoryName="SBOM Name"
              showToolbarItem={activeAttribute === "SBOM Name"}
            >
              {productSearchInput}
            </ToolbarFilter>
            <ToolbarFilter
              labels={cveSearchValue !== "" ? [cveSearchValue] : []}
              deleteLabel={() => onCveSearchChange("")}
              deleteLabelGroup={() => onCveSearchChange("")}
              categoryName="CVE ID"
              showToolbarItem={activeAttribute === "CVE ID"}
            >
              {cveSearchInput}
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarToggleGroup>
        {pagination && (
          <ToolbarGroup align={{ default: "alignEnd" }}>
            <ToolbarItem>
              <Pagination
                itemCount={pagination.itemCount}
                page={pagination.page}
                perPage={pagination.perPage}
                onSetPage={pagination.onSetPage}
                onPerPageSelect={pagination.onPerPageSelect}
                perPageOptions={PER_PAGE_OPTIONS}
              />
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

export default ReportsToolbar;
