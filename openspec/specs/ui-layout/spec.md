# ui-layout Specification

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

