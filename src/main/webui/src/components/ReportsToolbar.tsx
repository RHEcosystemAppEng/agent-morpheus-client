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

  const hasActiveFilters = searchValue !== "" || cveSearchValue !== "";

  return (
    <Toolbar
      id="reports-toolbar"
      clearAllFilters={hasActiveFilters ? onClearFilters : undefined}
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
                onPerPageSelect={() => {}}
                perPageOptions={[]}
              />
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

export default ReportsToolbar;
