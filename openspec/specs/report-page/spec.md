# report-page Specification

## Purpose
TBD - created by archiving change add-product-report-page. Update Purpose after archive.
## Requirements
### Requirement: Report Page Navigation
The application SHALL provide navigation from the reports table to a report page when a user clicks the "View Report" button.

#### Scenario: Navigate to report page
- **WHEN** a user clicks "View Report" button for a report in the reports table
- **THEN** the application navigates to `/Reports/:productId/:cveId` where `:productId` is the product ID and `:cveId` is the CVE ID from the row data

#### Scenario: Redirect from product-only route
- **WHEN** a user navigates to `/Reports/:productId` without a CVE ID
- **THEN** the application redirects to `/Reports` with the product ID as a filter parameter to show all repository reports for that product

### Requirement: Report Details Display
The report page SHALL display report details in two separate cards positioned side by side at the top of the page.

#### Scenario: Report details card displays
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** the page displays two cards side by side using a `Grid` layout at the top of the page
- **AND** the left card (Details card) displays report information in two columns:
  - Left column: CVE Analyzed (the specified CVE ID as plain text, not a clickable link) and Report name
  - Right column: Number of repositories scanned (format: "scannedCount / submittedCount")
- **AND** the right card (Additional Details card) displays: Completed date and metadata fields as labels
- **AND** the CVE data displayed corresponds to the CVE ID from the route parameters

#### Scenario: Report details loading state
- **WHEN** report data is being fetched
- **THEN** both cards display a loading spinner

#### Scenario: Report details error state
- **WHEN** report data fetch fails
- **THEN** both cards display an error message

### Requirement: CVE Status donut Chart
The report page SHALL display a donut chart summarizing CVE vulnerability statuses (vulnerable, not_vulnerable, uncertain) for the specific CVE ID from the route parameters across all repository reports for the report.

#### Scenario: CVE status donut chart displays
- **WHEN** a user views the report page with report data loaded and a specific CVE ID in the route
- **THEN** a donut chart displays with slices for vulnerable (red), not_vulnerable (green), and uncertain (gray) statuses
- **AND** each slice shows the count of repository reports for the specified CVE with that status
- **AND** the chart includes a legend showing status labels and counts
- **AND** the chart data is filtered to show only results for the CVE ID from the route parameters

#### Scenario: CVE status donut chart empty state
- **WHEN** no data is available for the specified CVE ID in the report
- **THEN** the donut chart displays an empty state message

#### Scenario: CVE status donut chart loading state
- **WHEN** report data is being fetched for the donut chart
- **THEN** the donut chart area displays a loading spinner

### Requirement: Component Scan States donut Chart
The report page SHALL display a donut chart summarizing component scan states from the report summary data, including components that have not been scanned.

#### Scenario: Component Scan states donut chart displays
- **WHEN** a user views the report page with report data loaded
- **THEN** a donut chart displays with slices for each unique component state from the `componentStates` map
- **AND** each slice shows the count of components with that state
- **AND** the chart includes a legend showing state labels and counts
- **AND** if `product.data.submittedCount` is greater than the sum of all values in `product.summary.componentStates`, the chart SHALL include an additional "None Scanned" slice
- **AND** the "None Scanned" slice SHALL display the count calculated as `product.data.submittedCount` minus the sum of all values in `product.summary.componentStates`
- **AND** the "None Scanned" slice SHALL be displayed with a distinct color

#### Scenario: Component states donut chart with no unscanned components
- **WHEN** a user views the report page with report data loaded
- **AND** `product.data.submittedCount` equals the sum of all values in `product.summary.componentStates`
- **THEN** the donut chart displays with slices for each unique component state from the `componentStates` map
- **AND** the chart does NOT display a "None Scanned" slice

#### Scenario: Component states donut chart empty state
- **WHEN** no component state data is available
- **THEN** the donut chart displays an empty state message

#### Scenario: Component states donut chart loading state
- **WHEN** report data is being fetched
- **THEN** the donut chart area displays a loading spinner

### Requirement: Repository Reports Table
The report page SHALL display an embedded table listing all repository reports (CVE + component combinations) for the components in the SBOM, filtered by both the report's product ID and the CVE ID from the route parameters.

#### Scenario: Repository reports table displays
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** a table displays with columns: ID, Product Name, Version, CVEs, Completed At, Submitted At, State
- **AND** the table shows only repository reports for the current product and CVE (filtered by both product ID and CVE ID from route parameters)
- **AND** the table is embedded in the page under the donut charts

#### Scenario: Repository reports table pagination
- **WHEN** a user views the repository reports table
- **THEN** the table displays pagination controls
- **AND** pagination uses backend pagination support via `ReportEndpointService.getApiReports()` with `page` and `pageSize` parameters
- **AND** users can navigate between pages of repository reports

#### Scenario: Repository reports table loading state
- **WHEN** reports data is being fetched
- **THEN** the table displays a loading spinner

#### Scenario: Repository reports table error state
- **WHEN** reports data fetch fails
- **THEN** the table displays an error message

#### Scenario: Repository reports table empty state
- **WHEN** no repository reports are found for the product and CVE combination
- **THEN** the table displays an empty state message

### Requirement: Report Page Layout
The report page SHALL use PatternFly layout components and follow the standard page structure.

#### Scenario: Report page layout
- **WHEN** a user views the report page
- **THEN** the page uses PatternFly `PageSection` components for layout
- **AND** report details are displayed in two separate `Card` components side by side using a `Grid` layout
- **AND** donut charts are displayed side by side in a `Grid` layout
- **AND** the repository reports table is displayed embedded in a separate `PageSection` below the donut charts

### Requirement: API Integration
The report page SHALL use the generated OpenAPI client for all API calls.

#### Scenario: Report data fetched via generated client
- **WHEN** the report page loads with product ID and CVE ID in route parameters
- **THEN** report data is fetched using `ReportEndpointService.getApiReportsProduct1({ id })` via the `useApi` hook
- **AND** the page extracts and displays data for the specific CVE ID from the route parameters, not the first CVE

#### Scenario: Repository reports data fetched via generated client
- **WHEN** the repository reports table loads with product ID and CVE ID in route parameters
- **THEN** reports data is fetched using `ReportEndpointService.getApiReports()` with both product ID and CVE ID filters via the `useApi` hook

