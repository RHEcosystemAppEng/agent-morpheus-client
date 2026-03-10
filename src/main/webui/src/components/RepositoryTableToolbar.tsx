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
import type { SortColumn, RepoFilterKey } from "../hooks/repositoryReportsTableParams";

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
  /** When true, show CVE ID filter (Single Repositories only). */
  showCveIdFilter?: boolean;
  itemCount?: number;
}

type ActiveAttribute = "Repository Name" | "CVE ID" | "Finding";

const RepositoryTableToolbar: React.FC<RepositoryTableToolbarProps> = ({
  tableParams,
  loading,
  showCveIdFilter = false,
  itemCount,
}) => {
  const [activeAttribute, setActiveAttribute] =
    useState<ActiveAttribute>("Repository Name");

  const { data, handlers } = tableParams;
  const repositorySearchValue = data.getFilterValue("gitRepo") ?? "";
  const findingFilter = data.getFilterValue("finding") ?? undefined;
  const cveIdFilterValue = data.getFilterValue("cveId") ?? "";
  const page = data.page ?? 1;
  const perPage = data.perPage ?? DEFAULT_PER_PAGE;

  const handleFindingFilterDelete = () => {
    handlers.setFilterValue("finding", "");
  };

  const handleFilterDeleteGroup = () => {
    handlers.setFilterValue("gitRepo", "");
    handlers.setFilterValue("finding", "");
    handlers.setFilterValue("cveId", "");
  };

  const attributes: ActiveAttribute[] = ["Repository Name", ...(showCveIdFilter ? (["CVE ID"] as const) : []), "Finding"];
  const hasActiveFilters =
    repositorySearchValue !== "" ||
    findingFilter != null ||
    (showCveIdFilter && cveIdFilterValue !== "");

  const repositorySearchInput = (
    <SearchInput
      aria-label="Search by repository name"
      placeholder="Search by Repository Name"
      value={repositorySearchValue}
      onChange={(_event, value) => handlers.setFilterValue("gitRepo", value)}
      onClear={() => handlers.setFilterValue("gitRepo", "")}
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
      clearAllFilters={hasActiveFilters ? handleFilterDeleteGroup : undefined}
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
              labels={
                repositorySearchValue !== "" ? [repositorySearchValue] : []
              }
              deleteLabel={() => handlers.setFilterValue("gitRepo", "")}
              deleteLabelGroup={() => handlers.setFilterValue("gitRepo", "")}
              categoryName="Repository Name"
              showToolbarItem={activeAttribute === "Repository Name"}
            >
              {repositorySearchInput}
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
              deleteLabel={handleFindingFilterDelete}
              deleteLabelGroup={handleFilterDeleteGroup}
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
