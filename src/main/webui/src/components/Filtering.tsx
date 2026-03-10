import { useState, useEffect, useRef } from "react";
import {
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Popper,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";


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
 * Single-select filter: PatternFly Menu with one selectable option at a time.
 * Clearing is done by the parent (e.g. toolbar chip); this component only sets a value when the user picks an option.
 */
export interface SingleSelectFilterProps {
  id: string;
  label: string;
  options: string[];
  selected: string | undefined;
  onSelect: (value: string) => void;
  loading?: boolean;
}

export function SingleSelectFilter({
  id,
  label,
  options,
  selected,
  onSelect,
  loading = false,
}: SingleSelectFilterProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useMenuHandlers(isMenuOpen, setIsMenuOpen, menuRef, toggleRef, containerRef);

  const handleSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    itemId: string | number | undefined
  ) => {
    if (itemId != null) {
      onSelect(String(itemId));
      setIsMenuOpen(false);
    }
  };

  return (
    <div ref={containerRef}>
      <Popper
        trigger={
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            isExpanded={isMenuOpen}
            isDisabled={loading}
            style={{ width: "200px" } as React.CSSProperties}
          >
            {selected != null ? `${label}: ${selected}` : label}
          </MenuToggle>
        }
        triggerRef={toggleRef}
        popper={
          <Menu
            ref={menuRef}
            id={id}
            onSelect={handleSelect}
            selected={selected ?? undefined}
          >
            <MenuContent>
              <MenuList>
                {options.map((option) => (
                  <MenuItem
                    key={option}
                    itemId={option}
                    isSelected={selected === option}
                  >
                    {option}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuContent>
          </Menu>
        }
        popperRef={menuRef}
        appendTo={containerRef.current ?? undefined}
        isVisible={isMenuOpen}
      />
    </div>
  );
}
