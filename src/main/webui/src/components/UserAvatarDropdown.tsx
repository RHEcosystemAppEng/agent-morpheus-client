/**
 * User avatar dropdown component for the page header
 * Displays authenticated user information and provides logout functionality
 * Integrates with Quarkus OIDC backend authentication
 */

import React, { useState } from 'react';
import {
  Icon,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Spinner,
} from "@patternfly/react-core";
import { UserIcon } from "@patternfly/react-icons";
import { useAuth, logout } from "../hooks/useAuth";

const UserAvatarDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userName, loading, error } = useAuth();

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
      // Even if logout fails, try to redirect to logout endpoint
      window.location.href = "/api/v1/user/logout";
    }
  };

  // Show spinner while loading user info
  if (loading) {
    return (
      <MenuToggle
        icon={
          <Icon>
            <UserIcon />
          </Icon>
        }
        isFullHeight
        isDisabled
      >
        <Spinner size="sm" />
      </MenuToggle>
    );
  }

  // Show error state (user might need to login)
  if (error) {
    return (
      <MenuToggle
        icon={
          <Icon>
            <UserIcon />
          </Icon>
        }
        isFullHeight
      >
        Login
      </MenuToggle>
    );
  }

  const userDropdownItems = (
    <DropdownItem key="logout" onClick={handleLogout}>
      Logout
    </DropdownItem>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={onToggle}
          icon={<Icon ><UserIcon/></Icon>}
          isFullHeight
        >
          {userName}
        </MenuToggle>
      )}
    >
      <DropdownList>{userDropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default UserAvatarDropdown;
