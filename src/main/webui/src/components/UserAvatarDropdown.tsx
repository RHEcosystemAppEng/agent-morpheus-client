/**
 * User avatar dropdown component for the page header
 * Based on reference implementation pattern
 */

import React, { useState, useEffect } from 'react';
import {
  Icon,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import {UserIcon} from '@patternfly/react-icons'

const UserAvatarDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName("dummy user");
    console.log("dummy login")
  }, []);

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    console.log("dummy logout")
  };

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

