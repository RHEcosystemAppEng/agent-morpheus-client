# report-page Specification

## Purpose
View SBOM report details
## Requirements
### Requirement: Report Page Navigation
The application SHALL provide navigation from the reports table to a report page when a user clicks the "SBOM Report ID" link in a table row.

#### Scenario: Navigate to report page
- **WHEN** a user clicks the "SBOM Report ID" link in a table row
- **THEN** the application navigates based on `SbomReport.numReports`:
  - If `numReports === 1`, navigate to `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID and `:reportId` is `SbomReport.firstReportId`
  - Otherwise, navigate to `/reports/product/:productId/:cveId` where `:productId` is `SbomReport.productId` and `:cveId` is the CVE ID

### Requirement: Report Details Display
The report page SHALL display report details in two separate cards positioned side by side at the top of the page. Date fields in the table SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation.

The report page SHALL automatically refresh data every 5 seconds using `useReport` hook with polling, but only when some analysis states in `sbomReport.statusCounts` are not "failed" or "completed". When all analysis states are either "failed" or "completed", auto-refresh SHALL stop (see `api-hooks` specification for `useReport` and polling behavior).

The report page SHALL use the `shouldUpdate` option to prevent unnecessary rerenders when data hasn't changed (see `api-hooks` specification).

#### Scenario: Report details card displays
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** the page displays two cards side by side using a `Grid` layout at the top of the page
- **AND** the left card (Details card) displays report information in two columns:
  - Left column: CVE Analyzed (the specified CVE ID as plain text, not a clickable link) and Report name (from `sbomReport.sbomName`)
  - Right column: Number of repositories analyzed (showing the count of repositories with "completed" state from `sbomReport.statusCounts["completed"]`)
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
- **AND** each slice shows the count aggregated from `sbomReport.cveStatusCounts` where status values are mapped: "TRUE" -> vulnerable, "FALSE" -> not_vulnerable, all other values -> uncertain
- **AND** the chart includes a legend showing status labels and counts
- **AND** all three statuses are always displayed, even if count is 0

#### Scenario: CVE status donut chart empty state
- **WHEN** no data is available for the specified CVE ID in the report
- **THEN** the donut chart displays an empty state message

#### Scenario: CVE status donut chart loading state
- **WHEN** report data is being fetched for the donut chart
- **THEN** the donut chart area displays a loading spinner

### Requirement: Component Scan States donut Chart
The report page SHALL display a donut chart summarizing component scan states from the report summary data, including components that have not been scanned. Component states SHALL be displayed in a specific order: completed, expired, failed, queued, sent, pending. States that appear in the data SHALL be shown first in this order, followed by any states not in the predefined list (appended at the end). Each component state SHALL be displayed with a specific, semantically meaningful color: completed (green), expired (orange), failed (red), queued (orange), sent (purple), pending (turquoise).

#### Scenario: Component Scan states donut chart displays
- **WHEN** a user views the report page with report data loaded
- **THEN** a donut chart displays with slices for each unique component state from the `sbomReport.statusCounts` map
- **AND** each slice shows the count of components with that state
- **AND** the chart includes a legend showing state labels and counts
- **AND** component states are displayed in the order: completed, expired, failed, queued, sent, pending (only states present in data are shown)
- **AND** any states not in the predefined list are displayed at the end, after the predefined states
- **AND** each state is displayed with its specified color: completed (green), expired (orange), failed (red), queued (orange), sent (purple), pending (turquoise)

#### Scenario: Component states donut chart with no unscanned components
- **WHEN** a user views the report page with report data loaded
- **THEN** the donut chart displays with slices for each unique component state from the `statusCounts` map
- **AND** component states are displayed in the order: completed, expired, failed, queued, sent, pending (only states present in data are shown)
- **AND** each state is displayed with its specified color

#### Scenario: Component states donut chart with states not in predefined list
- **WHEN** a user views the report page with report data loaded
- **AND** the `sbomReport.statusCounts` map contains states that are not in the predefined list (completed, expired, failed, queued, sent, pending)
- **THEN** the donut chart displays slices for all component states
- **AND** predefined states are displayed first in the specified order (completed, expired, failed, queued, sent, pending)
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
The report page SHALL display an embedded table listing all repository reports (CVE + component combinations) for the components in the SBOM, filtered by both the report's SBOM report ID and the CVE ID from the route parameters. Date fields in the table SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST").

The repository reports table SHALL automatically refresh data every 5 seconds using `usePaginatedApi` with polling, using the same auto-refresh condition as the parent report page: refresh only when some analysis states in `sbomReport.statusCounts` are not "failed" or "completed". When all analysis states are either "failed" or "completed", auto-refresh SHALL stop. The repository reports table SHALL use the same `sbomReport.statusCounts` data from the parent report page to determine whether to continue auto-refreshing (see `api-hooks` specification for polling behavior).

The repository reports table SHALL use the `shouldUpdate` option to prevent unnecessary rerenders when data hasn't changed (see `api-hooks` specification).

The repository reports table SHALL display a loading skeleton only on the initial load when first entering the report page. When users change sort order or filters, the existing table data SHALL remain visible while new data loads in the background. The table SHALL update with new data once the API call completes, without showing the skeleton. This prevents visual disruption and table jumping during user interactions.

#### Scenario: Repository reports table displays
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** a table displays with columns: Repository, Commit ID, ExploitIQ Status, Completed (displaying dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ"), and Scan state
- **AND** the table shows only repository reports for the current SBOM report and CVE (filtered by both SBOM report ID and CVE ID from route parameters)
- **AND** the table is embedded in the page under the donut charts

#### Scenario: Repository reports table pagination
- **WHEN** a user views the repository reports table
- **THEN** the table displays pagination controls
- **AND** pagination uses backend pagination support via `/api/v1/reports` endpoint with `page` and `pageSize` query parameters
- **AND** users can navigate between pages of repository reports

#### Scenario: Loading skeleton on initial page load
- **WHEN** a user first views the report page with the repository reports table
- **THEN** a loading skeleton is displayed while the initial data is being fetched
- **AND** the skeleton shows placeholder rows matching the table structure
- **AND** once data is loaded, the skeleton is replaced with the actual table data

#### Scenario: No skeleton on sort change
- **WHEN** a user changes the sort order in the repository reports table (e.g., clicks a column header to sort)
- **THEN** the existing table data remains visible
- **AND** the table updates with sorted data once the API call completes
- **AND** no loading skeleton is displayed during the sort operation

#### Scenario: No skeleton on filter change
- **WHEN** a user changes a filter value in the repository reports table (e.g., selects scan state filter, exploitIQ status filter, or enters repository search text)
- **THEN** the existing table data remains visible
- **AND** the table updates with filtered data once the API call completes
- **AND** no loading skeleton is displayed during the filter operation

#### Scenario: Repository reports table error state
- **WHEN** reports data fetch fails
- **THEN** the table displays an error message

#### Scenario: Repository reports table empty state
- **WHEN** no repository reports are found for the SBOM report and CVE combination
- **THEN** the table displays an empty state message

#### Scenario: Repository reports table auto-refresh
- **WHEN** a user views the report page with a repository reports table
- **AND** some analysis states in `sbomReport.statusCounts` (from the parent report page) are not "failed" or "completed"
- **THEN** the repository reports table automatically refreshes data every 5 seconds using `usePaginatedApi` with polling (see `api-hooks` specification)
- **AND** the repository reports table uses the same `sbomReport.statusCounts` condition as the parent report page to determine whether to continue auto-refreshing
- **AND** the auto-refresh preserves current pagination, sorting, and filter settings
- **AND** when all analysis states in `sbomReport.statusCounts` are either "failed" or "completed", auto-refresh stops
- **AND** the auto-refresh prevents unnecessary rerenders when data hasn't changed (see `api-hooks` specification for `shouldUpdate` behavior)

### Requirement: Report Page Layout
The report page SHALL use PatternFly layout components and follow the standard page structure. The report page SHALL display a breadcrumb navigation and page title at the top of the page.

#### Scenario: Report page layout
- **WHEN** a user views the report page
- **THEN** the page uses PatternFly `PageSection` components for layout
- **AND** a breadcrumb navigation is displayed at the top of the page with:
  - First item: "Reports" as a clickable link that navigates to `/reports`
  - Second item: `<SBOM name>/<CVE ID>` displayed as non-clickable text (current page indicator)
- **AND** a page title is displayed below the breadcrumb with the format "Report: <SBOM name>/<CVE ID>" where the word "Report" is displayed in bold
- **AND** a status label is displayed next to the page title showing the SBOM report state (e.g., "Completed" with green label if `sbomReport.statusCounts["completed"]` exists)
- **AND** report details are displayed in two separate `Card` components side by side using a `Grid` layout
- **AND** donut charts are displayed side by side in a `Grid` layout
- **AND** the repository reports table is displayed embedded in a separate `PageSection` below the donut charts

#### Scenario: Breadcrumb navigation
- **WHEN** a user views the report page
- **THEN** the breadcrumb displays the SBOM name from `sbomReport.sbomName` and the CVE ID from route parameters
- **AND** clicking the "Reports" breadcrumb item navigates to the reports list page at `/reports`

#### Scenario: Page title display
- **WHEN** a user views the report page
- **THEN** the page title displays "Report: <SBOM name>/<CVE ID>" where:
  - The word "Report" is displayed in bold
  - The SBOM name is extracted from `sbomReport.sbomName`
  - The CVE ID is extracted from route parameters

### Requirement: API Integration
The report page SHALL use API calls for data fetching, using hooks defined in the `api-hooks` capability. See `api-hooks` specification for details on `useApi`, `usePaginatedApi`, and `useReport` hooks.

#### Scenario: Report data fetched via API
- **WHEN** the report page loads with SBOM report ID and CVE ID in route parameters
- **THEN** report data is fetched using `/api/v1/product/${productId}` endpoint via the `useReport` hook (see `api-hooks` specification)
- **AND** the page extracts and displays data for the specific CVE ID from the route parameters, not the first CVE

#### Scenario: Repository reports data fetched via API
- **WHEN** the repository reports table loads with SBOM report ID and CVE ID in route parameters
- **THEN** reports data is fetched using `/api/v1/reports` endpoint with `productId` and `vulnId` query parameters via the `usePaginatedApi` hook (see `api-hooks` specification)
- **AND** the API call includes pagination parameters (`page`, `pageSize`), sorting parameters (`sortBy`), and optional filtering parameters (`status`, `exploitIqStatus`, `gitRepo`)

#### Scenario: Report page auto-refresh
- **WHEN** a user views the report page
- **AND** some analysis states in `sbomReport.statusCounts` are not "failed" or "completed"
- **THEN** the report page automatically refreshes data every 5 seconds using `useReport` hook with polling (see `api-hooks` specification)
- **AND** when all analysis states are either "failed" or "completed", auto-refresh stops (via `shouldPoll` function)
- **AND** the auto-refresh preserves the current view state (no disruption to user interactions)

