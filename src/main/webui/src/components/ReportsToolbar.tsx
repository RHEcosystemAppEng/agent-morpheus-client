import { useState, useEffect, useRef } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarToggleGroup,
  SearchInput,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Badge,
  Popper,
  Pagination,
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
  pagination?: {
    itemCount: number;
    page: number;
    perPage: number;
    onSetPage: (event: unknown, newPage: number) => void;
  };
}

const ALL_EXPLOIT_IQ_STATUS_OPTIONS = [
  "Vulnerable",
  "Not Vulnerable",
  "Uncertain",
];

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
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = useState(false);
  const [isExploitIqStatusMenuOpen, setIsExploitIqStatusMenuOpen] =
    useState(false);
  const [isAnalysisStateMenuOpen, setIsAnalysisStateMenuOpen] = useState(false);

  const attributeToggleRef = useRef<HTMLButtonElement>(null);
  const attributeMenuRef = useRef<HTMLDivElement>(null);
  const attributeContainerRef = useRef<HTMLDivElement>(null);
  const exploitIqStatusToggleRef = useRef<HTMLButtonElement>(null);
  const exploitIqStatusMenuRef = useRef<HTMLDivElement>(null);
  const exploitIqStatusContainerRef = useRef<HTMLDivElement>(null);
  const analysisStateToggleRef = useRef<HTMLButtonElement>(null);
  const analysisStateMenuRef = useRef<HTMLDivElement>(null);
  const analysisStateContainerRef = useRef<HTMLDivElement>(null);

  const handleAttributeMenuKeys = (event: KeyboardEvent) => {
    if (!isAttributeMenuOpen) return;
    if (
      attributeMenuRef.current?.contains(event.target as Node) ||
      attributeToggleRef.current?.contains(event.target as Node)
    ) {
      if (event.key === "Escape" || event.key === "Tab") {
        setIsAttributeMenuOpen(false);
        attributeToggleRef.current?.focus();
      }
    }
  };

  const handleAttributeClickOutside = (event: MouseEvent) => {
    if (
      isAttributeMenuOpen &&
      !attributeMenuRef.current?.contains(event.target as Node)
    ) {
      setIsAttributeMenuOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleAttributeMenuKeys);
    window.addEventListener("click", handleAttributeClickOutside);
    return () => {
      window.removeEventListener("keydown", handleAttributeMenuKeys);
      window.removeEventListener("click", handleAttributeClickOutside);
    };
  }, [isAttributeMenuOpen]);

  const handleExploitIqStatusMenuKeys = (event: KeyboardEvent) => {
    if (
      isExploitIqStatusMenuOpen &&
      exploitIqStatusMenuRef.current?.contains(event.target as Node)
    ) {
      if (event.key === "Escape" || event.key === "Tab") {
        setIsExploitIqStatusMenuOpen(false);
        exploitIqStatusToggleRef.current?.focus();
      }
    }
  };

  const handleExploitIqStatusClickOutside = (event: MouseEvent) => {
    if (
      isExploitIqStatusMenuOpen &&
      !exploitIqStatusMenuRef.current?.contains(event.target as Node)
    ) {
      setIsExploitIqStatusMenuOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleExploitIqStatusMenuKeys);
    window.addEventListener("click", handleExploitIqStatusClickOutside);
    return () => {
      window.removeEventListener("keydown", handleExploitIqStatusMenuKeys);
      window.removeEventListener("click", handleExploitIqStatusClickOutside);
    };
  }, [isExploitIqStatusMenuOpen]);

  const handleAnalysisStateMenuKeys = (event: KeyboardEvent) => {
    if (
      isAnalysisStateMenuOpen &&
      analysisStateMenuRef.current?.contains(event.target as Node)
    ) {
      if (event.key === "Escape" || event.key === "Tab") {
        setIsAnalysisStateMenuOpen(false);
        analysisStateToggleRef.current?.focus();
      }
    }
  };

  const handleAnalysisStateClickOutside = (event: MouseEvent) => {
    if (
      isAnalysisStateMenuOpen &&
      !analysisStateMenuRef.current?.contains(event.target as Node)
    ) {
      setIsAnalysisStateMenuOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleAnalysisStateMenuKeys);
    window.addEventListener("click", handleAnalysisStateClickOutside);
    return () => {
      window.removeEventListener("keydown", handleAnalysisStateMenuKeys);
      window.removeEventListener("click", handleAnalysisStateClickOutside);
    };
  }, [isAnalysisStateMenuOpen]);

  const onAttributeToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setTimeout(() => {
      if (attributeMenuRef.current) {
        const firstElement = attributeMenuRef.current.querySelector(
          "li > button:not(:disabled)"
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsAttributeMenuOpen(!isAttributeMenuOpen);
  };

  const onExploitIqStatusToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setTimeout(() => {
      if (exploitIqStatusMenuRef.current) {
        const firstElement = exploitIqStatusMenuRef.current.querySelector(
          "li > button:not(:disabled)"
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsExploitIqStatusMenuOpen(!isExploitIqStatusMenuOpen);
  };

  const onAnalysisStateToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setTimeout(() => {
      if (analysisStateMenuRef.current) {
        const firstElement = analysisStateMenuRef.current.querySelector(
          "li > button:not(:disabled)"
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsAnalysisStateMenuOpen(!isAnalysisStateMenuOpen);
  };

  const handleExploitIqStatusSelect = (
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined
  ) => {
    if (typeof itemId === "undefined") return;
    const itemStr = itemId.toString();
    const isSelected = filters.exploitIqStatus.includes(itemStr);
    onFiltersChange({
      ...filters,
      exploitIqStatus: isSelected
        ? filters.exploitIqStatus.filter((v) => v !== itemStr)
        : [...filters.exploitIqStatus, itemStr],
    });
  };

  const handleAnalysisStateSelect = (
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined
  ) => {
    if (typeof itemId === "undefined") return;
    const itemStr = itemId.toString();
    const isSelected = filters.analysisState.includes(itemStr);
    onFiltersChange({
      ...filters,
      analysisState: isSelected
        ? filters.analysisState.filter((v) => v !== itemStr)
        : [...filters.analysisState, itemStr],
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

  const attributeToggle = (
    <MenuToggle
      ref={attributeToggleRef}
      onClick={onAttributeToggleClick}
      isExpanded={isAttributeMenuOpen}
      icon={<FilterIcon />}
    >
      {activeAttribute}
    </MenuToggle>
  );

  const attributeMenu = (
    <Menu
      ref={attributeMenuRef}
      onSelect={(_ev, itemId) => {
        setActiveAttribute(itemId?.toString() as ActiveAttribute);
        setIsAttributeMenuOpen(false);
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="SBOM Name">SBOM Name</MenuItem>
          <MenuItem itemId="CVE ID">CVE ID</MenuItem>
          <MenuItem itemId="ExploitIQ Status">ExploitIQ Status</MenuItem>
          <MenuItem itemId="Analysis State">Analysis State</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const attributeDropdown = (
    <div ref={attributeContainerRef}>
      <Popper
        trigger={attributeToggle}
        triggerRef={attributeToggleRef}
        popper={attributeMenu}
        popperRef={attributeMenuRef}
        appendTo={attributeContainerRef.current || undefined}
        isVisible={isAttributeMenuOpen}
      />
    </div>
  );

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

  const exploitIqStatusToggle = (
    <MenuToggle
      ref={exploitIqStatusToggleRef}
      onClick={onExploitIqStatusToggleClick}
      isExpanded={isExploitIqStatusMenuOpen}
      {...(filters.exploitIqStatus.length > 0 && {
        badge: <Badge isRead>{filters.exploitIqStatus.length}</Badge>,
      })}
      style={{ width: "200px" } as React.CSSProperties}
    >
      Filter by ExploitIQ Status
    </MenuToggle>
  );

  const exploitIqStatusMenu = (
    <Menu
      ref={exploitIqStatusMenuRef}
      id="exploit-iq-status-menu"
      onSelect={handleExploitIqStatusSelect}
      selected={filters.exploitIqStatus}
    >
      <MenuContent>
        <MenuList>
          {ALL_EXPLOIT_IQ_STATUS_OPTIONS.map((option) => (
            <MenuItem
              hasCheckbox
              key={option}
              itemId={option}
              isSelected={filters.exploitIqStatus.includes(option)}
            >
              {option}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const exploitIqStatusSelect = (
    <div ref={exploitIqStatusContainerRef}>
      <Popper
        trigger={exploitIqStatusToggle}
        triggerRef={exploitIqStatusToggleRef}
        popper={exploitIqStatusMenu}
        popperRef={exploitIqStatusMenuRef}
        appendTo={exploitIqStatusContainerRef.current || undefined}
        isVisible={isExploitIqStatusMenuOpen}
      />
    </div>
  );

  const analysisStateToggle = (
    <MenuToggle
      ref={analysisStateToggleRef}
      onClick={onAnalysisStateToggleClick}
      isExpanded={isAnalysisStateMenuOpen}
      {...(filters.analysisState.length > 0 && {
        badge: <Badge isRead>{filters.analysisState.length}</Badge>,
      })}
      style={{ width: "200px" } as React.CSSProperties}
    >
      Filter by Analysis State
    </MenuToggle>
  );

  const analysisStateMenu = (
    <Menu
      ref={analysisStateMenuRef}
      id="analysis-state-menu"
      onSelect={handleAnalysisStateSelect}
      selected={filters.analysisState}
    >
      <MenuContent>
        <MenuList>
          {analysisStateOptions.map((option) => (
            <MenuItem
              hasCheckbox
              key={option}
              itemId={option}
              isSelected={filters.analysisState.includes(option)}
            >
              {option}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const analysisStateSelect = (
    <div ref={analysisStateContainerRef}>
      <Popper
        trigger={analysisStateToggle}
        triggerRef={analysisStateToggleRef}
        popper={analysisStateMenu}
        popperRef={analysisStateMenuRef}
        appendTo={analysisStateContainerRef.current || undefined}
        isVisible={isAnalysisStateMenuOpen}
      />
    </div>
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
            <ToolbarItem>{attributeDropdown}</ToolbarItem>
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
              {exploitIqStatusSelect}
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
              {analysisStateSelect}
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
