# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view SBOM report-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each SBOM report.
## Requirements
### Requirement: Reports Table Display
The reports table SHALL support sorting by the following columns:
- **SBOM Name**: Sortable (maps to product name)
- **CVE ID**: Sortable (maps to product CVE ID)
- **Submitted Date**: Sortable (maps to submittedAt timestamp)
- **Completion Date**: Sortable (maps to completedAt timestamp)

**Note**: Report ID column is NOT sortable - it is displayed as a clickable link for navigation purposes only.

#### Scenario: Default sorting by submittedAt
- **WHEN** a user first views the reports table
- **THEN** the table is sorted by submittedAt in descending order (newest products first, oldest products last) using server-side sorting
- **AND** the sorting is performed by the `/api/v1/reports/product` API endpoint with `sortField=submittedAt` and `sortDirection=DESC`
- **AND** the SBOM Name, CVE ID, Submitted Date, and Completion Date columns are sortable by the user (ascending/descending)
- **AND** the Report ID column is NOT sortable (it is a clickable link for navigation only)

### Requirement: Reports Table Filtering

The reports table SHALL support filtering by SBOM Name and CVE ID. All filtering SHALL be performed server-side via the `/api/v1/reports/product` API endpoint. Filter state SHALL be persisted in the browser URL as query parameters to enable shareable links. The active filter attribute (which search/filter input is displayed) SHALL remain unchanged until the user manually changes it.

#### Scenario: SBOM Name text search filter
- **WHEN** a user enters text in the SBOM Name search field
- **THEN** the filter value is sent to `/api/v1/reports/product` as `name` query parameter
- **AND** the API performs case-insensitive partial text matching on product name field
- **AND** products matching the search text are displayed in the table
- **AND** partial matches are supported (e.g., searching "test" matches "test-product" and "my-test-product")

#### Scenario: CVE ID text search filter
- **WHEN** a user enters text in the CVE ID search field
- **THEN** the filter value is sent to `/api/v1/reports/product` as `cveId` query parameter
- **AND** the API performs exact matching on CVE ID field
- **AND** products with matching CVE IDs are displayed in the table

#### Scenario: Filter combination
- **WHEN** a user applies multiple filters simultaneously
- **THEN** all active filters are combined with AND logic
- **AND** products matching all filter criteria are displayed
- **AND** filter parameters are sent together in a single API request

#### Scenario: Clear filters
- **WHEN** a user clicks "Clear all filters"
- **THEN** all filter values are reset to empty/default
- **AND** the URL query parameters are removed
- **AND** the table displays all products (unfiltered)

#### Scenario: Filter state in URL
- **WHEN** a user applies filters to the reports table
- **THEN** the filter values are stored as query parameters in the browser URL (e.g., `/reports?name=test&cveId=CVE-2024`)
- **AND** the URL can be shared with others to view the same filtered results
- **AND** when navigating back to the reports page, the filter state is restored from URL parameters
- **AND** filter parameters are combined with sort parameters in the URL

#### Scenario: Filter persistence across navigation
- **WHEN** a user applies filters and then navigates away from the reports page
- **AND** the user navigates back to the reports page
- **THEN** the filter state is restored from URL query parameters
- **AND** the table displays the filtered results matching the restored filter state

#### Scenario: Pagination reset on filter change
- **WHEN** a user changes any filter value
- **THEN** the pagination is reset to page 1
- **AND** the filtered results are displayed starting from the first page

#### Scenario: Active filter attribute persistence
- **WHEN** a user selects a filter attribute (e.g., "SBOM Name" or "CVE ID") from the attribute selector
- **AND** the user applies a filter value
- **THEN** the active filter attribute remains set to the selected attribute (e.g., "SBOM Name")
- **AND** the same filter input remains displayed even after the filter is applied
- **AND** the active attribute only changes when the user manually selects a different attribute from the attribute selector

#### Scenario: Auto-refresh behavior
- **WHEN** a user views the reports table
- **THEN** the table automatically refreshes data every 15 seconds (see `api-hooks` specification for polling behavior)
- **AND** the auto-refresh preserves current pagination, sorting, and filter settings
- **AND** the auto-refresh prevents unnecessary rerenders when data hasn't changed (see `api-hooks` specification for `shouldUpdate` behavior)

### Requirement: Optimized Single Report Navigation
When a product has exactly one submitted report (`submittedCount === 1`), clicking on the Report ID in the reports table SHALL query the reports API for that product and navigate directly to the single report page at `/reports/component/:reportId/:cveId`, bypassing the product summary page. If the product has more than one submitted report, the system SHALL navigate to the product summary page at `/reports/product/:productId/:cveId` (current behavior).

#### Scenario: Direct navigation for single report product
- **WHEN** a user clicks on a Report ID in the reports table
- **AND** the product has `submittedCount === 1`
- **THEN** the system queries the `/api/v1/reports` API endpoint with `productId` filter parameter
- **AND** a loading state indicator is displayed while the query is in progress
- **AND** upon successful response, the system takes the first report from the results
- **AND** the system navigates directly to `/reports/component/:reportId/:cveId` where `reportId` is the ID of the first report and `cveId` is the CVE ID from the product row
- **AND** the user sees the repository report page without an intermediate product summary page

#### Scenario: Standard navigation for multiple report product
- **WHEN** a user clicks on a Report ID in the reports table
- **AND** the product has `submittedCount > 1` or `submittedCount` is undefined/null
- **THEN** the system navigates to the product summary page at `/reports/product/:productId/:cveId` (current behavior)
- **AND** no reports API query is performed

#### Scenario: Error handling for single report navigation
- **WHEN** a user clicks on a Report ID in the reports table
- **AND** the product has `submittedCount === 1`
- **AND** the reports API query fails (network error, 500 error, etc.)
- **THEN** the system falls back to the standard navigation behavior
- **AND** the system navigates to the product summary page at `/reports/product/:productId/:cveId`
- **AND** the error is handled gracefully without displaying an error message to the user (silent fallback)

#### Scenario: Edge case handling for empty results
- **WHEN** a user clicks on a Report ID in the reports table
- **AND** the product has `submittedCount === 1`
- **AND** the reports API query succeeds but returns zero reports
- **THEN** the system falls back to the standard navigation behavior
- **AND** the system navigates to the product summary page at `/reports/product/:productId/:cveId`

#### Scenario: Loading state during single report query
- **WHEN** a user clicks on a Report ID in the reports table
- **AND** the product has `submittedCount === 1`
- **AND** the reports API query is in progress
- **THEN** a PatternFly `Spinner` component with `size="sm"` is displayed inline within the Report ID Link component
- **AND** the Spinner replaces the Report ID text in the same table cell (first column, same row)
- **AND** the Link component remains in the same position and maintains its clickable area styling
- **AND** the loading indicator is visible until the query completes or fails
- **AND** the loading indicator is removed once navigation occurs or the fallback behavior is triggered
- **AND** only the clicked row shows the loading indicator (other rows remain unchanged)

