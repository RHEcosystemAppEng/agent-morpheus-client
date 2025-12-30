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
import {
  AttributeSelector,
  CheckboxFilter,
  ALL_EXPLOIT_IQ_STATUS_OPTIONS,
} from "./Filtering";

export interface ReportsToolbarFilters {
  exploitIqStatus: string[];
  analysisState: string[];
}

interface ReportsToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  cveSearchValue: string;
  onCveSearchChange: (value: string) => void;
  filters: ReportsToolbarFilters;
  onFiltersChange: (filters: ReportsToolbarFilters) => void;
  analysisStateOptions: string[];
  pagination?: {
    itemCount: number;
    page: number;
    perPage: number;
    onSetPage: (event: unknown, newPage: number) => void;
  };
}

type ActiveAttribute =
  | "SBOM Name"
  | "CVE ID"
  | "ExploitIQ Status"
  | "Analysis State";

const ReportsToolbar: React.FC<ReportsToolbarProps> = ({
  searchValue,
  onSearchChange,
  cveSearchValue,
  onCveSearchChange,
  filters,
  onFiltersChange,
  analysisStateOptions,
  pagination,
}) => {
  const [activeAttribute, setActiveAttribute] =
    useState<ActiveAttribute>("SBOM Name");

  const handleExploitIqStatusSelect = (selected: string[]) => {
    onFiltersChange({
      ...filters,
      exploitIqStatus: selected,
    });
  };

  const handleAnalysisStateSelect = (selected: string[]) => {
    onFiltersChange({
      ...filters,
      analysisState: selected,
    });
  };

  const handleFilterDelete = (
    type: keyof ReportsToolbarFilters,
    id: string
  ) => {
    onFiltersChange({
      ...filters,
      [type]: filters[type].filter((fil) => fil !== id),
    });
  };

  const handleFilterDeleteGroup = (type: keyof ReportsToolbarFilters) => {
    onFiltersChange({ ...filters, [type]: [] });
  };

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

  return (
    <Toolbar
      id="reports-toolbar"
      clearAllFilters={() => {
        onSearchChange("");
        onCveSearchChange("");
        onFiltersChange({ exploitIqStatus: [], analysisState: [] });
      }}
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>
              <AttributeSelector
                activeAttribute={activeAttribute}
                attributes={[
                  "SBOM Name",
                  "CVE ID",
                  "ExploitIQ Status",
                  "Analysis State",
                ]}
                onAttributeChange={(attr) =>
                  setActiveAttribute(attr as ActiveAttribute)
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
              deleteLabel={(category, label) =>
                handleFilterDelete(
                  category as keyof ReportsToolbarFilters,
                  label as string
                )
              }
              deleteLabelGroup={() =>
                handleFilterDeleteGroup("exploitIqStatus")
              }
              categoryName="ExploitIQ Status"
              showToolbarItem={activeAttribute === "ExploitIQ Status"}
            >
              <CheckboxFilter
                id="exploit-iq-status-menu"
                label="Filter by ExploitIQ Status"
                options={ALL_EXPLOIT_IQ_STATUS_OPTIONS}
                selected={filters.exploitIqStatus}
                onSelect={handleExploitIqStatusSelect}
              />
            </ToolbarFilter>
            <ToolbarFilter
              labels={filters.analysisState}
              deleteLabel={(category, label) =>
                handleFilterDelete(
                  category as keyof ReportsToolbarFilters,
                  label as string
                )
              }
              deleteLabelGroup={() => handleFilterDeleteGroup("analysisState")}
              categoryName="Analysis State"
              showToolbarItem={activeAttribute === "Analysis State"}
            >
              <CheckboxFilter
                id="analysis-state-menu"
                label="Filter by Analysis State"
                options={analysisStateOptions}
                selected={filters.analysisState}
                onSelect={handleAnalysisStateSelect}
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
