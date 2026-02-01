import { useState, useEffect, useRef } from "react";
import {
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Badge,
  Popper,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";

export const ALL_EXPLOIT_IQ_STATUS_OPTIONS = [
  "Vulnerable",
  "Not Vulnerable",
  "Uncertain",
];

/**
 * Maps display label to API value for ExploitIQ status
 */
export function mapDisplayLabelToApiValue(displayLabel: string): string {
  switch (displayLabel) {
    case "Vulnerable":
      return "TRUE";
    case "Not Vulnerable":
      return "FALSE";
    case "Uncertain":
      return "UNKNOWN";
    default:
      return displayLabel.toLowerCase().replace(/\s+/g, "_");
  }
}

/**
 * Hook for managing menu open/close state with keyboard and click outside handlers
 */
export function useMenuHandlers(
  isMenuOpen: boolean,
  setIsMenuOpen: (open: boolean) => void,
  menuRef: React.RefObject<HTMLDivElement>,
  toggleRef: React.RefObject<HTMLButtonElement>,
  containerRef?: React.RefObject<HTMLDivElement>
) {
  useEffect(() => {
    const handleMenuKeys = (event: KeyboardEvent) => {
      if (!isMenuOpen) return;
      if (
        menuRef.current?.contains(event.target as Node) ||
        toggleRef.current?.contains(event.target as Node)
      ) {
        if (event.key === "Escape" || event.key === "Tab") {
          setIsMenuOpen(false);
          toggleRef.current?.focus();
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const isOutsideMenu = !menuRef.current?.contains(event.target as Node);
        const isOutsideToggle = !toggleRef.current?.contains(
          event.target as Node
        );
        const isOutsideContainer = !containerRef?.current?.contains(
          event.target as Node
        );

        if (isOutsideMenu && isOutsideToggle && isOutsideContainer) {
          setIsMenuOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleMenuKeys);
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleMenuKeys);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen, setIsMenuOpen, menuRef, toggleRef, containerRef]);
}

/**
 * Attribute selector dropdown component
 */
export interface AttributeSelectorProps<T extends string> {
  activeAttribute: T;
  attributes: T[];
  onAttributeChange: (attribute: T) => void;
}

export function AttributeSelector<T extends string>({
  activeAttribute,
  attributes,
  onAttributeChange,
}: AttributeSelectorProps<T>) {
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = useState(false);
  const attributeToggleRef = useRef<HTMLButtonElement>(null);
  const attributeMenuRef = useRef<HTMLDivElement>(null);
  const attributeContainerRef = useRef<HTMLDivElement>(null);

  useMenuHandlers(
    isAttributeMenuOpen,
    setIsAttributeMenuOpen,
    attributeMenuRef,
    attributeToggleRef,
    attributeContainerRef
  );

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
    setIsAttributeMenuOpen((prev) => !prev);
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
        onAttributeChange(itemId?.toString() as T);
        setIsAttributeMenuOpen(false);
      }}
    >
      <MenuContent>
        <MenuList>
          {attributes.map((attr) => (
            <MenuItem key={attr} itemId={attr}>
              {attr}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
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
}

/**
 * Generic checkbox filter component for dynamic options
 */
export interface CheckboxFilterProps {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onSelect: (selected: string[]) => void;
  loading?: boolean;
  singleSelect?: boolean;
  isDisabled?: boolean;
}

export function CheckboxFilter({
  id,
  label,
  options,
  selected,
  onSelect,
  loading = false,
  singleSelect = false,
  isDisabled = false,
}: CheckboxFilterProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useMenuHandlers(isMenuOpen, setIsMenuOpen, menuRef, toggleRef, containerRef);

  const onToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setTimeout(() => {
      if (menuRef.current) {
        const firstElement = menuRef.current.querySelector(
          "li > button:not(:disabled)"
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsMenuOpen((prev) => !prev);
  };

  const handleSelect = (
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined
  ) => {
    if (typeof itemId === "undefined") return;
    const itemStr = itemId.toString();
    const isSelected = selected.includes(itemStr);

    if (singleSelect) {
      // Single selection: replace current selection with new one, or clear if clicking the same
      onSelect(isSelected ? [] : [itemStr]);
      setIsMenuOpen(false);
    } else {
      // Multiple selection: toggle the item
      onSelect(
        isSelected
          ? selected.filter((v) => v !== itemStr)
          : [...selected, itemStr]
      );
    }
  };

  const toggle = (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isMenuOpen}
      {...(!singleSelect &&
        selected.length > 0 && {
          badge: <Badge isRead>{selected.length}</Badge>,
        })}
      style={{ width: "200px" } as React.CSSProperties}
      isDisabled={loading || isDisabled}
    >
      {singleSelect && selected.length > 0 ? `${label}: ${selected[0]}` : label}
    </MenuToggle>
  );

  const menu = (
    <Menu ref={menuRef} id={id} onSelect={handleSelect}>
      <MenuContent>
        <MenuList>
          {options.map((option) => (
            <MenuItem
              hasCheckbox
              key={option}
              itemId={option}
              isSelected={selected.includes(option)}
            >
              {option}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <div ref={containerRef}>
      <Popper
        trigger={toggle}
        triggerRef={toggleRef}
        popper={menu}
        popperRef={menuRef}
        appendTo={containerRef.current || undefined}
        isVisible={isMenuOpen}
      />
    </div>
  );
}
