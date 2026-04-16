# report-page Specification

## Purpose
View SBOM report details: navigation, report and additional details cards, CVE status and component states donut charts, excluded components link, and repository reports table.
## Requirements
### Requirement: Report Page Navigation
The application SHALL provide navigation from the reports table to a report page when a user clicks the "SBOM Report ID" link in a table row.

#### Scenario: Navigate to report page
- **WHEN** a user clicks the "SBOM Report ID" link in a table row
- **THEN** the application navigates based on `SbomReport.numReports`:
  - If `numReports === 1`, navigate to `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID and `:reportId` is `SbomReport.firstReportId`
  - Otherwise, navigate to `/reports/product/:productId/:cveId` where `:productId` is `SbomReport.productId` and `:cveId` is the CVE ID

### Requirement: Report Details Display
The report page SHALL display report details in two separate cards positioned side by side at the top of the page. Date fields in the table SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM" (e.g., "07 July 2025, 10:14:02 PM"), including the day, full month name, year, and time with seconds and AM/PM indicator.

The report page SHALL automatically refresh data using `useReport` with SSE (`sseRefreshPath`), but only when some analysis states in `sbomReport.statusCounts` are not "failed" or "completed". When all analysis states are either "failed" or "completed", live refresh SHALL stop (see `api-hooks` and `report-events-stream` specifications).

The report page SHALL use the `shouldUpdate` option to prevent unnecessary rerenders when data hasn't changed (see `api-hooks` specification).

The Details card SHALL display a field with label "Excluded components" and value `<numExcluded>/<numSubmitted>` (numExcluded from `sbomReport.statusCounts["excluded"]` or `product.data.submissionFailures.length`, numSubmitted from `product.data.submittedCount`). When numExcluded > 0, the value SHALL be a link that navigates to `/reports/product/excluded-components/:productId/:cveId`. When numExcluded === 0, the value SHALL be `0/<numSubmitted>` displayed as plain text (not a link).

#### Scenario: Report details card displays
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** the page displays two cards side by side using a `Grid` layout at the top of the page
- **AND** the left card (Details card) displays report information in two columns:
  - Right column: Number of repositories analyzed (showing {num completed} / {num submitted}, where num completed is the count from `sbomReport.statusCounts["completed"]` and num submitted is the value from `product.data.submittedCount`)
- **AND** the right card (Additional Details card) displays: Completed date field (showing the date in the format "DD Month YYYY, HH:MM:SS AM/PM" (e.g., "07 July 2025, 10:14:02 PM") when available, or "-" when no Date Completed is available) and Metadata field (displaying metadata key-value pairs from `product.data.metadata` using PatternFly LabelGroup and Label components when metadata exists, or `NotAvailable` component when no metadata is available)
- **AND** the CVE data displayed corresponds to the CVE ID from the route parameters

#### Scenario: Repositories analyzed shows completed over submitted
- **WHEN** a user views the report page
- **THEN** the Details card displays "Number of repositories analyzed" in the form num completed / num submitted (e.g. "5 / 10") using a shared formatter with no suffix
- **AND** num completed is the value of `sbomReport.statusCounts["completed"]` (or 0 if absent)
- **AND** num submitted is the value of `product.data.submittedCount`

#### Scenario: Excluded components field with link when excluded present
- **WHEN** a user views the report page and the product has one or more excluded components (numExcluded > 0, from `sbomReport.statusCounts["excluded"]` or `product.data.submissionFailures.length`)
- **THEN** the Details card displays a field with label "Excluded components" and value `<numExcluded>/<numSubmitted>` (e.g. "3/10") as a clickable link
- **AND** clicking the link navigates to `/reports/product/excluded-components/:productId/:cveId` where `productId` and `cveId` are from the current report page route

#### Scenario: Excluded components field as plain text when zero excluded
- **WHEN** a user views the report page and the product has zero excluded components (numExcluded === 0)
- **THEN** the Details card displays a field with label "Excluded components" and value `0/<numSubmitted>` (e.g. "0/10") as plain text, not a link

#### Scenario: Date Completed field always displayed
- **WHEN** a user views the report page AND the report has no Date Completed
- **THEN** the Additional Details card displays the Completed field with value "-" or `NotAvailable` component

#### Scenario: Metadata field display with metadata present
- **WHEN** a user views the report page AND the product has metadata in `product.data.metadata`
- **THEN** the Additional Details card displays a Metadata field below the Completed field
- **AND** the Metadata field displays all metadata key-value pairs using PatternFly LabelGroup and Label components
- **AND** each metadata entry is displayed as a Label with format "key:value"

#### Scenario: Metadata field display with no metadata
- **WHEN** a user views the report page AND the product has no metadata in `product.data.metadata` (metadata is empty or undefined)
- **THEN** the Additional Details card displays the Metadata field with `NotAvailable` component

### Requirement: CVE Status donut Chart
The report page SHALL display a donut chart summarizing CVE vulnerability statuses (vulnerable, not_vulnerable, uncertain) for the specific CVE ID from the route parameters across all repository reports for the report. The card title SHALL be "Findings". When data is present, the donut center SHALL show the total count with subtitle "Statuses".

#### Scenario: CVE status donut chart displays
- **WHEN** a user views the report page with report data loaded and a specific CVE ID in the route
- **THEN** a donut chart displays with slices for vulnerable (red), not_vulnerable (green), and uncertain (orange) statuses
- **AND** each slice shows the count from `product.summary.justificationStatusCounts` for keys "TRUE", "FALSE", and "UNKNOWN" (matched case-insensitively) mapped to vulnerable, not_vulnerable, and uncertain respectively
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
The report page SHALL display an embedded repository reports table that conforms to the **repository-reports-table** specification. The table SHALL list repository reports filtered by both the report's SBOM report ID and the CVE ID from the route parameters. The table SHALL automatically refresh using `usePaginatedApi` with SSE, using the same condition as the parent report page: refresh only when some analysis states in `sbomReport.statusCounts` are not "failed" or "completed". When all analysis states are either "failed" or "completed", live refresh SHALL stop. The repository reports table SHALL use the same `sbomReport.statusCounts` data from the parent report page to determine whether to continue (see `api-hooks` and `report-events-stream` specifications). The repository reports table SHALL use the `shouldUpdate` option to prevent unnecessary rerenders when data hasn't changed (see `api-hooks` specification).

#### Scenario: Repository reports table displays on report page
- **WHEN** a user views the report page with a specific CVE ID in the route
- **THEN** a repository reports table displays per the repository-reports-table specification
- **AND** the table shows only repository reports for the current SBOM report and CVE (filtered by both SBOM report ID and CVE ID from route parameters)
- **AND** the table is embedded in the page under the donut charts

#### Scenario: Repository reports table live refresh on report page
- **WHEN** a user views the report page with a repository reports table
- **AND** some analysis states in `sbomReport.statusCounts` (from the parent report page) are not "failed" or "completed"
- **THEN** the repository reports table refreshes on SSE catalog events via `usePaginatedApi` (see `api-hooks` and `report-events-stream` specifications)
- **AND** the repository reports table uses the same `sbomReport.statusCounts` condition as the parent report page to determine whether to continue live refresh
- **AND** the refresh preserves current pagination, sorting, and filter settings
- **AND** when all analysis states in `sbomReport.statusCounts` are either "failed" or "completed", live refresh stops
- **AND** unnecessary rerenders are avoided when data hasn't changed (see `api-hooks` `shouldUpdate` behavior)

#### Scenario: Repository reports table error state on report page
- **WHEN** reports data fetch fails for the repository reports table on the report page
- **THEN** the table displays an error message

#### Scenario: Repository reports table empty state on report page
- **WHEN** no repository reports are found for the SBOM report and CVE combination
- **THEN** the table displays an empty state message

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
- **THEN** report data is fetched using `/api/v1/reports/product/${productId}` endpoint via the `useReport` hook (see `api-hooks` specification)
- **AND** the page extracts and displays data for the specific CVE ID from the route parameters, not the first CVE

#### Scenario: Repository reports data fetched via API
- **WHEN** the repository reports table loads with SBOM report ID and CVE ID in route parameters
- **THEN** reports data is fetched using `/api/v1/reports` endpoint with `productId` and `vulnId` query parameters via the `usePaginatedApi` hook (see `api-hooks` specification)
- **AND** the API call includes pagination parameters (`page`, `pageSize`), sorting parameters (`sortBy`), and optional filtering parameters (`status`, `exploitIqStatus`, `gitRepo`)

#### Scenario: Report page live refresh
- **WHEN** a user views the report page
- **AND** some analysis states in `sbomReport.statusCounts` are not "failed" or "completed"
- **THEN** the report page refreshes product data on SSE using `useReport` (see `api-hooks` and `report-events-stream` specifications)
- **AND** when all analysis states are either "failed" or "completed", live refresh stops (via `shouldPoll`)
- **AND** the refresh preserves the current view state (no disruption to user interactions)

