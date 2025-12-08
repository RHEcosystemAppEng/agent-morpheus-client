import { useState } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarToggleGroup,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Badge,
  MenuToggle,
  MenuToggleElement,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";

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
}

const ALL_EXPLOIT_IQ_STATUS_OPTIONS = [
  "Vulnerable",
  "Uncertain",
  "Not Vulnerable",
  "False Positive",
  "Code Not Present",
  "Code Not Reachable",
  "Requires Configuration",
  "Requires Dependency",
  "Requires Environment",
  "Protected By Compiler",
  "Protected At Runtime",
  "Protected At Perimeter",
  "Protected By Mitigating Control",
];

const ReportsToolbar: React.FC<ReportsToolbarProps> = ({
  searchValue,
  onSearchChange,
  cveSearchValue,
  onCveSearchChange,
  filters,
  onFiltersChange,
  analysisStateOptions,
}) => {
  const [isExploitIqStatusExpanded, setIsExploitIqStatusExpanded] =
    useState(false);
  const [isAnalysisStateExpanded, setIsAnalysisStateExpanded] = useState(false);

  const handleFilterSelect = (
    type: keyof ReportsToolbarFilters,
    checked: boolean,
    selection: string
  ) => {
    onFiltersChange({
      ...filters,
      [type]: checked
        ? [...filters[type], selection]
        : filters[type].filter((v) => v !== selection),
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

  return (
    <Toolbar
      id="reports-toolbar"
      className="pf-m-toggle-group-container"
      collapseListedFiltersBreakpoint="xl"
      clearAllFilters={() =>
        onFiltersChange({ exploitIqStatus: [], analysisState: [] })
      }
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarItem>
            <SearchInput
              aria-label="Search by SBOM name"
              placeholder="Search by SBOM Name"
              value={searchValue}
              onChange={(_event, value) => onSearchChange(value)}
              onClear={() => onSearchChange("")}
            />
          </ToolbarItem>
          <ToolbarItem>
            <SearchInput
              aria-label="Search by CVE ID"
              placeholder="Search by CVE ID"
              value={cveSearchValue}
              onChange={(_event, value) => onCveSearchChange(value)}
              onClear={() => onCveSearchChange("")}
            />
          </ToolbarItem>
          <ToolbarGroup variant="filter-group">
            <ToolbarFilter
              labels={filters.exploitIqStatus}
              deleteLabel={(category, label) =>
                handleFilterDelete(
                  category as keyof ReportsToolbarFilters,
                  label as string
                )
              }
              deleteLabelGroup={(category) =>
                handleFilterDeleteGroup(category as keyof ReportsToolbarFilters)
              }
              categoryName="ExploitIQ Status"
            >
              <Select
                aria-label="ExploitIQ Status"
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() =>
                      setIsExploitIqStatusExpanded(!isExploitIqStatusExpanded)
                    }
                    isExpanded={isExploitIqStatusExpanded}
                    style={{ width: "180px" } as React.CSSProperties}
                  >
                    ExploitIQ Status
                    {filters.exploitIqStatus.length > 0 && (
                      <Badge isRead>{filters.exploitIqStatus.length}</Badge>
                    )}
                  </MenuToggle>
                )}
                onSelect={(_event, selection) => {
                  const checked =
                    (_event?.target as HTMLInputElement)?.checked ?? false;
                  handleFilterSelect(
                    "exploitIqStatus",
                    checked,
                    selection as string
                  );
                }}
                selected={filters.exploitIqStatus}
                isOpen={isExploitIqStatusExpanded}
                onOpenChange={setIsExploitIqStatusExpanded}
              >
                <SelectList>
                  {ALL_EXPLOIT_IQ_STATUS_OPTIONS.map((option) => (
                    <SelectOption
                      hasCheckbox
                      key={option}
                      value={option}
                      isSelected={filters.exploitIqStatus.includes(option)}
                    >
                      {option}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>
            <ToolbarFilter
              labels={filters.analysisState}
              deleteLabel={(category, label) =>
                handleFilterDelete(
                  category as keyof ReportsToolbarFilters,
                  label as string
                )
              }
              deleteLabelGroup={(category) =>
                handleFilterDeleteGroup(category as keyof ReportsToolbarFilters)
              }
              categoryName="Analysis State"
            >
              <Select
                aria-label="Analysis State"
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() =>
                      setIsAnalysisStateExpanded(!isAnalysisStateExpanded)
                    }
                    isExpanded={isAnalysisStateExpanded}
                    style={{ width: "180px" } as React.CSSProperties}
                  >
                    Analysis State
                    {filters.analysisState.length > 0 && (
                      <Badge isRead>{filters.analysisState.length}</Badge>
                    )}
                  </MenuToggle>
                )}
                onSelect={(_event, selection) => {
                  const checked =
                    (_event?.target as HTMLInputElement)?.checked ?? false;
                  handleFilterSelect(
                    "analysisState",
                    checked,
                    selection as string
                  );
                }}
                selected={filters.analysisState}
                isOpen={isAnalysisStateExpanded}
                onOpenChange={setIsAnalysisStateExpanded}
              >
                <SelectList>
                  {analysisStateOptions.map((option) => (
                    <SelectOption
                      hasCheckbox
                      key={option}
                      value={option}
                      isSelected={filters.analysisState.includes(option)}
                    >
                      {option}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarToggleGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default ReportsToolbar;
