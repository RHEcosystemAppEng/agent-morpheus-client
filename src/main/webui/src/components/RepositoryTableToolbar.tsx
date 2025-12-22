import { useState, useEffect, useRef } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarToggleGroup,
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

interface RepositoryTableToolbarProps {
  scanStateFilter: string[];
  scanStateOptions: string[];
  loading: boolean;
  onFilterChange: (filters: string[]) => void;
  pagination?: {
    itemCount: number;
    page: number;
    perPage: number;
    onSetPage: (event: unknown, newPage: number) => void;
  };
}

const RepositoryTableToolbar: React.FC<RepositoryTableToolbarProps> = ({
  scanStateFilter,
  scanStateOptions,
  loading,
  onFilterChange,
  pagination,
}) => {
  const [isScanStateMenuOpen, setIsScanStateMenuOpen] = useState(false);

  const scanStateToggleRef = useRef<HTMLButtonElement>(null);
  const scanStateMenuRef = useRef<HTMLDivElement>(null);
  const scanStateContainerRef = useRef<HTMLDivElement>(null);

  const handleScanStateMenuKeys = (event: KeyboardEvent) => {
    if (
      isScanStateMenuOpen &&
      scanStateMenuRef.current?.contains(event.target as Node)
    ) {
      if (event.key === "Escape" || event.key === "Tab") {
        setIsScanStateMenuOpen(false);
        scanStateToggleRef.current?.focus();
      }
    }
  };

  const handleScanStateClickOutside = (event: MouseEvent) => {
    if (
      isScanStateMenuOpen &&
      !scanStateMenuRef.current?.contains(event.target as Node) &&
      !scanStateToggleRef.current?.contains(event.target as Node) &&
      !scanStateContainerRef.current?.contains(event.target as Node)
    ) {
      setIsScanStateMenuOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleScanStateMenuKeys);
    window.addEventListener("click", handleScanStateClickOutside);
    return () => {
      window.removeEventListener("keydown", handleScanStateMenuKeys);
      window.removeEventListener("click", handleScanStateClickOutside);
    };
  }, [isScanStateMenuOpen]);

  const onScanStateToggleClick = () => {
    setIsScanStateMenuOpen(!isScanStateMenuOpen);
  };

  const handleScanStateSelect = (
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined
  ) => {
    if (typeof itemId === "undefined") return;
    const itemStr = itemId.toString();
    const isSelected = scanStateFilter.includes(itemStr);
    onFilterChange(
      isSelected
        ? scanStateFilter.filter((v) => v !== itemStr)
        : [...scanStateFilter, itemStr]
    );
  };

  const handleFilterDelete = (_category: string | unknown, label: string | unknown) => {
    if (typeof label === "string") {
      onFilterChange(scanStateFilter.filter((fil) => fil !== label));
    }
  };

  const handleFilterDeleteGroup = () => {
    onFilterChange([]);
  };

  const scanStateToggle = (
    <MenuToggle
      ref={scanStateToggleRef}
      onClick={onScanStateToggleClick}
      isExpanded={isScanStateMenuOpen}
      {...(scanStateFilter.length > 0 && {
        badge: <Badge isRead>{scanStateFilter.length}</Badge>,
      })}
      style={{ width: "200px" } as React.CSSProperties}
      isDisabled={loading}
    >
      Filter by Analysis State
    </MenuToggle>
  );

  const scanStateMenu = (
    <Menu
      ref={scanStateMenuRef}
      id="scan-state-menu"
      onSelect={handleScanStateSelect}
      selected={scanStateFilter}
    >
      <MenuContent>
        <MenuList>
          {scanStateOptions.map((option) => (
            <MenuItem
              hasCheckbox
              key={option}
              itemId={option}
              isSelected={scanStateFilter.includes(option)}
            >
              {option}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const scanStateSelect = (
    <div ref={scanStateContainerRef}>
      <Popper
        trigger={scanStateToggle}
        triggerRef={scanStateToggleRef}
        popper={scanStateMenu}
        popperRef={scanStateMenuRef}
        appendTo={scanStateContainerRef.current || undefined}
        isVisible={isScanStateMenuOpen}
      />
    </div>
  );

  return (
    <Toolbar
      id="repository-reports-toolbar"
      clearAllFilters={
        scanStateFilter.length > 0 ? handleFilterDeleteGroup : undefined
      }
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarFilter
              labels={scanStateFilter}
              deleteLabel={handleFilterDelete}
              deleteLabelGroup={handleFilterDeleteGroup}
              categoryName="Analysis State"
            >
              {scanStateSelect}
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

export default RepositoryTableToolbar;

