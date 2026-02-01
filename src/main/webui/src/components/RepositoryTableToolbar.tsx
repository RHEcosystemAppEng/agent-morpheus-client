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

interface RepositoryTableToolbarProps {
  repositorySearchValue: string;
  onRepositorySearchChange: (value: string) => void;
  scanStateFilter: string[];
  scanStateOptions: string[];
  exploitIqStatusFilter: string[];
  loading: boolean;
  onScanStateFilterChange: (filters: string[]) => void;
  onExploitIqStatusFilterChange: (filters: string[]) => void;
  pagination?: {
    itemCount: number;
    page: number;
    perPage: number;
    onSetPage: (
      event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
      newPage: number
    ) => void;
    onPerPageSelect?: (
      event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
      newPerPage: number,
      newPage: number
    ) => void;
  };
}

type ActiveAttribute =
  | "Repository Name"
  | "Analysis State"
  | "ExploitIQ Status";

const RepositoryTableToolbar: React.FC<RepositoryTableToolbarProps> = ({
  repositorySearchValue,
  onRepositorySearchChange,
  scanStateFilter,
  scanStateOptions,
  exploitIqStatusFilter,
  loading,
  onScanStateFilterChange,
  onExploitIqStatusFilterChange,
  pagination,
}) => {
  const [activeAttribute, setActiveAttribute] =
    useState<ActiveAttribute>("Repository Name");

  const handleScanStateFilterDelete = (
    _category: string | unknown,
    label: string | unknown
  ) => {
    if (typeof label === "string") {
      onScanStateFilterChange(scanStateFilter.filter((fil) => fil !== label));
    }
  };

  const handleExploitIqStatusFilterDelete = (
    _category: string | unknown,
    label: string | unknown
  ) => {
    if (typeof label === "string") {
      onExploitIqStatusFilterChange(
        exploitIqStatusFilter.filter((fil) => fil !== label)
      );
    }
  };

  const handleFilterDeleteGroup = () => {
    onRepositorySearchChange("");
    onScanStateFilterChange([]);
    onExploitIqStatusFilterChange([]);
  };

  const repositorySearchInput = (
    <SearchInput
      aria-label="Search by repository name"
      placeholder="Search by Repository Name"
      value={repositorySearchValue}
      onChange={(_event, value) => onRepositorySearchChange(value)}
      onClear={() => onRepositorySearchChange("")}
    />
  );

  return (
    <Toolbar
      id="repository-reports-toolbar"
      clearAllFilters={
        repositorySearchValue !== "" ||
        scanStateFilter.length > 0 ||
        exploitIqStatusFilter.length > 0
          ? handleFilterDeleteGroup
          : undefined
      }
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>
              <AttributeSelector
                activeAttribute={activeAttribute}
                attributes={[
                  "Repository Name",
                  "Analysis State",
                  "ExploitIQ Status",
                ]}
                onAttributeChange={(attr) =>
                  setActiveAttribute(attr as ActiveAttribute)
                }
              />
            </ToolbarItem>
            <ToolbarFilter
              labels={
                repositorySearchValue !== "" ? [repositorySearchValue] : []
              }
              deleteLabel={() => onRepositorySearchChange("")}
              deleteLabelGroup={() => onRepositorySearchChange("")}
              categoryName="Repository Name"
              showToolbarItem={activeAttribute === "Repository Name"}
            >
              {repositorySearchInput}
            </ToolbarFilter>
            <ToolbarFilter
              labels={scanStateFilter}
              deleteLabel={handleScanStateFilterDelete}
              deleteLabelGroup={handleFilterDeleteGroup}
              categoryName="Analysis State"
              showToolbarItem={activeAttribute === "Analysis State"}
            >
              <CheckboxFilter
                id="scan-state-menu"
                label="Filter by Analysis State"
                options={scanStateOptions}
                selected={scanStateFilter}
                onSelect={onScanStateFilterChange}
                loading={loading}
              />
            </ToolbarFilter>
            <ToolbarFilter
              labels={exploitIqStatusFilter}
              deleteLabel={handleExploitIqStatusFilterDelete}
              deleteLabelGroup={handleFilterDeleteGroup}
              categoryName="ExploitIQ Status"
              showToolbarItem={activeAttribute === "ExploitIQ Status"}
            >
              <CheckboxFilter
                id="exploit-iq-status-menu"
                label="Filter by ExploitIQ Status"
                options={ALL_EXPLOIT_IQ_STATUS_OPTIONS}
                selected={exploitIqStatusFilter}
                onSelect={onExploitIqStatusFilterChange}
                loading={loading}
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
                onPerPageSelect={pagination.onPerPageSelect || (() => {})}
                perPageOptions={[
                  { title: "10", value: 10 },
                  { title: "20", value: 20 },
                  { title: "50", value: 50 },
                  { title: "100", value: 100 },
                ]}
              />
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

export default RepositoryTableToolbar;
