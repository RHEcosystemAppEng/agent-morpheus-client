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
            style={{ cursor: "pointer" }}
          >
            Home
          </NavItem>
          <NavItem
            itemId="reports"
            isActive={location.pathname.startsWith("/Reports")}
            onClick={() => navigate("/Reports")}
            style={{ cursor: "pointer" }}
          >
            Reports
          </NavItem>
        </NavList>
      </Nav>
    </PageSidebarBody>
  );
};

export default Navigation;
