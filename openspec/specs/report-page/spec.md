# report-page Specification

## Purpose
View SBOM report details
## Requirements
### Requirement: Report Page Navigation
The application SHALL provide navigation from the reports table to a report page when a user clicks the "Product ID" link in a table row.

#### Scenario: Navigate to report page
- **WHEN** a user clicks the "Product ID" link in a table row
- **THEN** the application navigates based on `Product.numReports`:
  - If `numReports === 1`, navigate to `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID and `:reportId` is `Product.firstReportId`
  - Otherwise, navigate to `/reports/product/:productId/:cveId` where `:productId` is `Product.productId` and `:cveId` is the CVE ID

### Requirement: Report Details Display
The report page SHALL display report details in two separate cards positioned side by side at the top of the page. Date fields in the table SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation.

The report page SHALL automatically refresh data every 5 seconds by re-fetching from the `/api/v1/products/${productId}` endpoint, but only when some analysis states in `product.statusCounts` are not "failed" or "completed". When all analysis states are either "failed" or "completed", auto-refresh SHALL stop.

The report page SHALL compare the entire Product object between the previous and current data during auto-refresh using deep comparison. The page SHALL only trigger a rerender if any field in the Product object has changed (including statusCounts, completion dates, CVE status counts, SBOM name, or any other field). This optimization SHALL prevent unnecessary rerenders and UI jumps when the data remains unchanged.

#### Scenario: Report details card displays
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** the page displays two cards side by side using a `Grid` layout at the top of the page
- **AND** the left card (Details card) displays report information in two columns:
  - Left column: CVE Analyzed (the specified CVE ID as plain text, not a clickable link) and Report name (from `product.sbomName`)
  - Right column: Number of repositories analyzed (showing the count of repositories with "completed" state from `product.statusCounts["completed"]`)
- **AND** the right card (Additional Details card) displays: Completed date field (showing the date in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST") when available, or "-" when no completion date is available)
- **AND** the CVE data displayed corresponds to the CVE ID from the route parameters

#### Scenario: Completion date field always displayed
- **WHEN** a user views the report page AND the report has no completion date
- **THEN** the Additional Details card displays the Completed field with value "-"

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
- **AND** each slice shows the count aggregated from `product.cveStatusCounts` where status values are mapped: "TRUE" -> vulnerable, "FALSE" -> not_vulnerable, all other values -> uncertain
- **AND** the chart includes a legend showing status labels and counts
- **AND** all three statuses are always displayed, even if count is 0

#### Scenario: CVE status donut chart empty state
- **WHEN** no data is available for the specified CVE ID in the report
- **THEN** the donut chart displays an empty state message

#### Scenario: CVE status donut chart loading state
- **WHEN** report data is being fetched for the donut chart
- **THEN** the donut chart area displays a loading spinner

### Requirement: Component Scan States donut Chart
The report page SHALL display a donut chart summarizing component scan states from the report summary data, including components that have not been scanned. Component states SHALL be displayed in a specific order: completed, expired, failed, queued, sent, pending, preprocessing failed. States that appear in the data SHALL be shown first in this order, followed by any states not in the predefined list (appended at the end). Each component state SHALL be displayed with a specific, semantically meaningful color: completed (green), expired (orange), failed (red), queued (orange), sent (purple), pending (turquoise), preprocessing failed (light gray).

#### Scenario: Component Scan states donut chart displays
- **WHEN** a user views the report page with report data loaded
- **THEN** a donut chart displays with slices for each unique component state from the `product.statusCounts` map
- **AND** each slice shows the count of components with that state
- **AND** the chart includes a legend showing state labels and counts
- **AND** component states are displayed in the order: completed, expired, failed, queued, sent, pending, preprocessing failed (only states present in data are shown)
- **AND** any states not in the predefined list are displayed at the end, after the predefined states
- **AND** each state is displayed with its specified color: completed (green), expired (orange), failed (red), queued (orange), sent (purple), pending (turquoise), preprocessing failed (light gray)
- **AND** the chart calculates "Preprocessing failed" count from `product.statusCounts` (as the difference between total count and scanned total, both calculated from `product.statusCounts`)
- **AND** if the "Preprocessing failed" count is greater than 0, the chart SHALL include an additional "Preprocessing failed" slice with that count
- **AND** the "Preprocessing failed" slice SHALL be displayed with light gray color

#### Scenario: Component states donut chart with no unscanned components
- **WHEN** a user views the report page with report data loaded
- **AND** the calculated "Preprocessing failed" count is 0 or less
- **THEN** the donut chart displays with slices for each unique component state from the `statusCounts` map
- **AND** component states are displayed in the order: completed, expired, failed, queued, sent, pending, preprocessing failed (only states present in data are shown)
- **AND** each state is displayed with its specified color
- **AND** the chart does NOT display a "Preprocessing failed" slice

#### Scenario: Component states donut chart with states not in predefined list
- **WHEN** a user views the report page with report data loaded
- **AND** the `product.statusCounts` map contains states that are not in the predefined list (completed, expired, failed, queued, sent, pending, preprocessing failed)
- **THEN** the donut chart displays slices for all component states
- **AND** predefined states are displayed first in the specified order (completed, expired, failed, queued, sent, pending, preprocessing failed)
- **AND** states not in the predefined list are displayed at the end, after all predefined states
- **AND** each predefined state uses its specified color
- **AND** states not in the predefined list use a default color from the color palette

#### Scenario: Component states donut chart empty state
- **WHEN** no component state data is available
- **THEN** the donut chart displays an empty state message

#### Scenario: Component states donut chart loading state
- **WHEN** report data is being fetched
- **THEN** the donut chart area displays a loading spinner

### Requirement: Repository Reports Table
The report page SHALL display an embedded table listing all repository reports (CVE + component combinations) for the components in the SBOM, filtered by both the report's product ID and the CVE ID from the route parameters. Date fields in the table SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST").

The repository reports table SHALL automatically refresh data every 5 seconds by re-fetching from the `/api/v1/reports` endpoint, using the same auto-refresh condition as the parent report page: refresh only when some analysis states in `product.statusCounts` are not "failed" or "completed". When all analysis states are either "failed" or "completed", auto-refresh SHALL stop. The repository reports table SHALL use the same `product.statusCounts` data from the parent report page to determine whether to continue auto-refreshing.

The repository reports table SHALL compare the entire Report objects between the previous and current data during auto-refresh using deep comparison. The table SHALL only trigger a rerender if any field in any Report object has changed (including state, completion dates, ExploitIQ status, or any other field). This optimization SHALL prevent unnecessary rerenders and UI jumps when the data remains unchanged.

#### Scenario: Repository reports table displays
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** a table displays with columns: Repository, Commit ID, ExploitIQ Status, Completed (displaying dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ"), and Scan state
- **AND** the table shows only repository reports for the current product and CVE (filtered by both product ID and CVE ID from route parameters)
- **AND** the table is embedded in the page under the donut charts

#### Scenario: Repository reports table pagination
- **WHEN** a user views the repository reports table
- **THEN** the table displays pagination controls
- **AND** pagination uses backend pagination support via `/api/v1/reports` endpoint with `page` and `pageSize` query parameters
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

#### Scenario: Repository reports table auto-refresh
- **WHEN** a user views the report page with a repository reports table
- **AND** some analysis states in `product.statusCounts` (from the parent report page) are not "failed" or "completed"
- **THEN** the repository reports table automatically refreshes data every 5 seconds by re-fetching from the `/api/v1/reports` endpoint
- **AND** the repository reports table uses the same `product.statusCounts` condition as the parent report page to determine whether to continue auto-refreshing
- **AND** the auto-refresh preserves current pagination, sorting, and filter settings
- **AND** when all analysis states in `product.statusCounts` are either "failed" or "completed", auto-refresh stops (same condition as the parent report page)
- **AND** the auto-refresh stops when the user navigates away from the page or the component is unmounted

#### Scenario: Repository reports table auto-refresh prevents unnecessary rerenders
- **WHEN** the repository reports table auto-refreshes AND the Report data for all visible rows has not changed
- **THEN** the table SHALL compare the entire Report objects between the previous and current data using deep comparison
- **AND** the table SHALL skip the state update (prevent rerender) if all Report objects are unchanged (all fields match)
- **AND** the table SHALL trigger a rerender if any field in any Report object has changed
- **AND** this optimization SHALL prevent UI jumps and visual disruption when the data remains unchanged

#### Scenario: Report page auto-refresh
- **WHEN** a user views the report page
- **AND** some analysis states in `product.statusCounts` are not "failed" or "completed"
- **THEN** the report page automatically refreshes data every 5 seconds by re-fetching from the `/api/v1/products/${productId}` endpoint
- **AND** when all analysis states are either "failed" or "completed", auto-refresh stops
- **AND** the auto-refresh stops when the user navigates away from the page or the component is unmounted
- **AND** the auto-refresh preserves the current view state (no disruption to user interactions)

#### Scenario: Report page auto-refresh prevents unnecessary rerenders
- **WHEN** the report page auto-refreshes AND the Product data has not changed
- **THEN** the page SHALL compare the entire Product object between the previous and current data using deep comparison
- **AND** the page SHALL skip the state update (prevent rerender) if the Product object is unchanged (all fields match)
- **AND** the page SHALL trigger a rerender if any field in the Product object has changed
- **AND** this optimization SHALL prevent UI jumps and visual disruption when the data remains unchanged

### Requirement: Report Page Layout
The report page SHALL use PatternFly layout components and follow the standard page structure. The report page SHALL display a breadcrumb navigation and page title at the top of the page.

#### Scenario: Report page layout
- **WHEN** a user views the report page
- **THEN** the page uses PatternFly `PageSection` components for layout
- **AND** a breadcrumb navigation is displayed at the top of the page with:
  - First item: "Reports" as a clickable link that navigates to `/reports`
  - Second item: `<SBOM name>/<CVE ID>` displayed as non-clickable text (current page indicator)
- **AND** a page title is displayed below the breadcrumb with the format "Report: <SBOM name>/<CVE ID>" where the word "Report" is displayed in bold
- **AND** a status label is displayed next to the page title showing the product state (e.g., "Completed" with green label if `product.statusCounts["completed"]` exists)
- **AND** report details are displayed in two separate `Card` components side by side using a `Grid` layout
- **AND** donut charts are displayed side by side in a `Grid` layout
- **AND** the repository reports table is displayed embedded in a separate `PageSection` below the donut charts

#### Scenario: Breadcrumb navigation
- **WHEN** a user views the report page
- **THEN** the breadcrumb displays the SBOM name from `product.sbomName` and the CVE ID from route parameters
- **AND** clicking the "Reports" breadcrumb item navigates to the reports list page at `/reports`

#### Scenario: Page title display
- **WHEN** a user views the report page
- **THEN** the page title displays "Report: <SBOM name>/<CVE ID>" where:
  - The word "Report" is displayed in bold
  - The SBOM name is extracted from `product.sbomName`
  - The CVE ID is extracted from route parameters

### Requirement: API Integration
The report page SHALL use API calls for data fetching, using the `useApi` and `usePaginatedApi` hooks.

#### Scenario: Report data fetched via API
- **WHEN** the report page loads with product ID and CVE ID in route parameters
- **THEN** report data is fetched using `/api/v1/products/${productId}` endpoint via the `useReport` hook (which uses `useApi` internally)
- **AND** the page extracts and displays data for the specific CVE ID from the route parameters, not the first CVE

#### Scenario: Repository reports data fetched via API
- **WHEN** the repository reports table loads with product ID and CVE ID in route parameters
- **THEN** reports data is fetched using `/api/v1/reports` endpoint with `productId` and `vulnId` query parameters via the `usePaginatedApi` hook
- **AND** the API call includes pagination parameters (`page`, `pageSize`), sorting parameters (`sortBy`), and optional filtering parameters (`status`, `exploitIqStatus`, `gitRepo`)

#### Scenario: Report page auto-refresh
- **WHEN** a user views the report page
- **AND** some analysis states in `product.statusCounts` are not "failed" or "completed"
- **THEN** the report page automatically refreshes data every 5 seconds by re-fetching from the `/api/v1/products/${productId}` endpoint
- **AND** when all analysis states are either "failed" or "completed", auto-refresh stops
- **AND** the auto-refresh stops when the user navigates away from the page or the component is unmounted
- **AND** the auto-refresh preserves the current view state (no disruption to user interactions)

