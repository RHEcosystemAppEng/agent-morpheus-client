// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import { Nav, NavList, NavItem, PageSidebarBody } from "@patternfly/react-core";
import { useNavigate, useLocation } from "react-router";

/**
 * Navigation component with links to main application sections
 */
const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <PageSidebarBody>
      <Nav aria-label="Nav">
        <NavList>
          <NavItem
            itemId="home"
            isActive={location.pathname === "/"}
            onClick={() => navigate("/")}
          >
            Home
          </NavItem>
          <NavItem
            itemId="reports"
            isActive={location.pathname.startsWith("/reports")}
            onClick={() => navigate("/reports")}
          >
            Reports
          </NavItem>
        </NavList>
      </Nav>
    </PageSidebarBody>
  );
};

export default Navigation;
