# ui-layout Specification

## Purpose
The application provides a consistent user interface layout with standard navigation, branding, and page structure using PatternFly components.
## Requirements
### Requirement: Standard Page Layout
The application SHALL provide a standard PatternFly page layout with a consistent header (masthead) that includes navigation controls, branding, and user context.

#### Scenario: Page header displays with all elements
- **WHEN** a user loads any page in the application
- **THEN** the page header displays with hamburger menu, product branding, and user avatar dropdown

#### Scenario: Sidebar toggle functionality
- **WHEN** a user clicks the hamburger menu icon
- **THEN** the sidebar navigation toggles between open and closed states

#### Scenario: User avatar dropdown displays current user
- **WHEN** a user views any page
- **THEN** the user avatar dropdown displays a dummy name (user avatar TBD)

### Requirement: Product Branding
The application SHALL display consistent product branding in the page header.

#### Scenario: Product name and icon display
- **WHEN** a user views any page
- **THEN** the product name "Red Hat Trusted Profile Analyzer ExploitIQ" and icon are visible in the header

### Requirement: Application Navigation
The application SHALL provide consistent navigation routes using lowercase paths. All routes SHALL use lowercase letters to follow REST conventions and maintain consistency.

#### Scenario: Reports list route uses lowercase
- **WHEN** a user navigates to the reports list page
- **THEN** the route uses `/reports` (lowercase) instead of `/Reports` (capitalized)
- **AND** all navigation links and breadcrumbs reference `/reports` (lowercase)

#### Scenario: Breadcrumb navigation uses lowercase routes
- **WHEN** a user views a report page or repository report page
- **THEN** breadcrumb links to the reports list use `/reports` (lowercase)
- **AND** clicking the breadcrumb navigates to `/reports`

#### Scenario: Navigation component uses lowercase routes
- **WHEN** a user uses the main navigation component
- **THEN** the reports navigation link uses `/reports` (lowercase)
- **AND** the active state detection checks for `/reports` (lowercase)

#### Scenario: Redirects use lowercase routes
- **WHEN** the application performs redirects to the reports page
- **THEN** redirects use `/reports` (lowercase) instead of `/Reports` (capitalized)

