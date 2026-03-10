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
} from "./Filtering";


const FINDING_FILTER_OPTIONS = [
  "Vulnerable",
  "Not Vulnerable",
  "Uncertain",
  "In progress",
  "Failed",
];
interface RepositoryTableToolbarProps {
  repositorySearchValue: string;
  onRepositorySearchChange: (value: string) => void;
  findingFilter: string[];
  loading: boolean;
  onFindingFilterChange: (filters: string[]) => void;
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

type ActiveAttribute = "Repository Name" | "Finding";

const RepositoryTableToolbar: React.FC<RepositoryTableToolbarProps> = ({
  repositorySearchValue,
  onRepositorySearchChange,
  findingFilter,
  loading,
  onFindingFilterChange,
  pagination,
}) => {
  const [activeAttribute, setActiveAttribute] =
    useState<ActiveAttribute>("Repository Name");

  const handleFindingFilterDelete = (
    _category: string | unknown,
    label: string | unknown
  ) => {
    if (typeof label === "string") {
      onFindingFilterChange(findingFilter.filter((fil) => fil !== label));
    }
  };

  const handleFilterDeleteGroup = () => {
    onRepositorySearchChange("");
    onFindingFilterChange([]);
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
        repositorySearchValue !== "" || findingFilter.length > 0
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
                attributes={["Repository Name", "Finding"]}
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
              labels={findingFilter}
              deleteLabel={handleFindingFilterDelete}
              deleteLabelGroup={handleFilterDeleteGroup}
              categoryName="Finding"
              showToolbarItem={activeAttribute === "Finding"}
            >
              <CheckboxFilter
                id="finding-menu"
                label="Filter by Finding"
                options={FINDING_FILTER_OPTIONS}
                selected={findingFilter}
                onSelect={onFindingFilterChange}
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
