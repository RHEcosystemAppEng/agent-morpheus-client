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
import {
  AttributeSelector,
  CheckboxFilter,
  ALL_EXPLOIT_IQ_STATUS_OPTIONS,
} from "./Filtering";

export interface ReportsToolbarFilters {
  exploitIqStatus: string[];
}

interface ReportsToolbarProps {
  searchValue?: string;
  cveSearchValue?: string;
  filters?: ReportsToolbarFilters;
  activeAttribute?: "SBOM Name" | "CVE ID" | "ExploitIQ Status";
  onSearchChange?: (value: string) => void;
  onCveSearchChange?: (value: string) => void;
  onFiltersChange?: (filters: ReportsToolbarFilters) => void;
  onActiveAttributeChange?: (
    attr: "SBOM Name" | "CVE ID" | "ExploitIQ Status"
  ) => void;
  onClearFilters?: () => void;
  pagination?: {
    itemCount: number;
    page: number;
    perPage: number;
    onSetPage: (event: unknown, newPage: number) => void;
  };
}

type ActiveAttribute = "SBOM Name" | "CVE ID" | "ExploitIQ Status";

const ReportsToolbar: React.FC<ReportsToolbarProps> = ({
  searchValue = "",
  cveSearchValue = "",
  filters = { exploitIqStatus: [] },
  activeAttribute = "SBOM Name",
  onSearchChange = () => {},
  onCveSearchChange = () => {},
  onFiltersChange = () => {},
  onActiveAttributeChange = () => {},
  onClearFilters = () => {},
  pagination,
}) => {
  const sbomSearchInput = (
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

  const handleExploitIqStatusChange = (selected: string[]) => {
    onFiltersChange({ ...filters, exploitIqStatus: selected });
  };

  const handleExploitIqStatusDelete = (
    _category: string | unknown,
    label: string | unknown
  ) => {
    if (typeof label === "string") {
      handleExploitIqStatusChange(
        filters.exploitIqStatus.filter((f) => f !== label)
      );
    }
  };

  const hasActiveFilters =
    searchValue !== "" ||
    cveSearchValue !== "" ||
    filters.exploitIqStatus.length > 0;

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
                attributes={["SBOM Name", "CVE ID", "ExploitIQ Status"]}
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
              {sbomSearchInput}
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
            <ToolbarFilter
              labels={filters.exploitIqStatus}
              deleteLabel={handleExploitIqStatusDelete}
              deleteLabelGroup={() => handleExploitIqStatusChange([])}
              categoryName="ExploitIQ Status"
              showToolbarItem={activeAttribute === "ExploitIQ Status"}
            >
              <CheckboxFilter
                id="exploit-iq-status-menu"
                label="Filter by ExploitIQ Status"
                options={ALL_EXPLOIT_IQ_STATUS_OPTIONS}
                selected={filters.exploitIqStatus}
                onSelect={handleExploitIqStatusChange}
                isDisabled={true}
              />
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
