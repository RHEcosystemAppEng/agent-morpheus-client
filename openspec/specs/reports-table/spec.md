# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view SBOM report-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each SBOM report.
## Requirements
### Requirement: Reports Table Display
The reports table SHALL support sorting by the following columns:
- **SBOM Name**: Sortable (maps to product name)
- **CVE ID**: Sortable (maps to product CVE ID)
- **Date Requested**: Sortable (maps to submittedAt timestamp)
- **Date Completed**: Sortable (maps to completedAt timestamp)

**Note**: Report ID column is NOT sortable - it is displayed as a clickable link for navigation purposes only.
 When every component is excluded (`submissionFailures.length` equals `submittedCount`), `completedAt` SHALL be set when the last submission failure is recorded so Date Completed is not empty.

#### Scenario: Default sorting by submittedAt
- **WHEN** a user first views the reports table
- **THEN** the table is sorted by submittedAt in descending order (newest products first, oldest products last) using server-side sorting
- **AND** the sorting is performed by the `/api/v1/reports/product` API endpoint with `sortField=submittedAt` and `sortDirection=DESC`
- **AND** the SBOM Name, CVE ID, Date Requested, and Date Completed columns are sortable by the user (ascending/descending)
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

#### Scenario: Live refresh behavior
- **WHEN** a user views the reports table
- **THEN** the table refreshes when the server pushes SSE catalog events (see `report-events-stream` and `api-hooks` specifications)
- **AND** the refresh preserves current pagination, sorting, and filter settings
- **AND** live-update invalidation uses `LiveUpdatesProvider` and `liveUpdatesRefresh` (see `api-hooks` and `report-events-stream`)

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

### Requirement: Reports Table Finding Column
The reports table SHALL display a "Finding" column with one finding per product. If any component report is still in pending, queued, or sent state, the Finding SHALL be "In progress" until every component has a terminal outcome (completed, failed, expired, or excluded). After that, six outcomes apply in priority order: Vulnerable > Uncertain > Failed > Excluded > Not vulnerable. Only the single applicable finding is shown per row. Counts for Vulnerable, Uncertain, and Excluded only; no count for In progress, Not vulnerable, or Failed.

#### Scenario: Finding column header
- **WHEN** a user views the reports table
- **THEN** the column header is "Finding" with a help icon and popover explaining priority and states

#### Scenario: Finding by priority
- **WHEN** a product has any report in pending, queued, or sent state → display "In progress", no count, outlined grey label and InProgressIcon (even if some other repositories already have a vulnerable or uncertain result)
- **WHEN** no reports are pending, queued, or sent, and the product has one or more vulnerable repositories → display "Vulnerable" + count, red (danger) label
- **WHEN** no reports are pending, queued, or sent, zero vulnerable, and one or more uncertain → display "Uncertain" + count, orange (warning) label
- **WHEN** no reports are pending, queued, or sent, zero vulnerable, zero uncertain, no failed/expired reports, and one or more excluded components (`statusCounts["excluded"]` > 0) → display "Excluded" + count, with label styling as defined (e.g. grey or info)
- **WHEN** no reports are pending, queued, or sent, 100% of reports are completed and 100% are not vulnerable and no excluded components → display "Not vulnerable", no count, green (success) label

#### Scenario: Excluded state uses submission failure count
- **WHEN** a product has excluded components (submissionFailures length > 0) and no higher-priority finding
- **THEN** the Finding column displays "Excluded" with the count equal to `statusCounts["excluded"]` (length of product submissionFailures)
- **AND** the count is shown in the same format as Vulnerable and Uncertain (e.g. "3 Excluded")

### Requirement: Reports Page Tabs and Single Repositories
The Reports page SHALL display two tabs: **SBOMs** (default) and **Single Repositories**. Selecting a tab SHALL switch content and update the URL: `/reports` for SBOMs, `/reports/single-repositories` for Single Repositories. Direct navigation to either URL SHALL show the corresponding tab. Spacing between tab bar and content SHALL use PatternFly Stack/StackItem with the standard spacer.

#### Scenario: Tabs and URL
- **WHEN** a user is on the Reports page
- **THEN** two tabs are shown; SBOMs tab shows the product-level reports table (filtering, sorting, pagination as in Reports Table Display/Filtering); Single Repositories tab shows a table of reports without `report.metadata.product_id`
- **AND** clicking a tab navigates to its URL; browser Back/Forward SHALL switch tabs correctly

#### Scenario: Single Repositories table
- **WHEN** the Single Repositories tab is active
- **THEN** a table is shown that conforms to the **repository-reports-table** specification (columns, Finding column logic, shared InProgressStatus/FailedStatus, single Finding filter, pagination, loading and empty/error behavior)
- **AND** data is from `/api/v1/reports` with a parameter returning only reports where `report.metadata.product_id` is absent; pagination, sorting, and filtering are server-side
- **AND** "View" navigates to `/reports/component/:cveId/:reportId`; empty and error states are displayed when applicable

#### Scenario: Implementation and test data
- **WHEN** implementing the feature
- **THEN** Single Repositories tab content SHALL live in a dedicated component (e.g. `SingleRepositoriesTable.tsx`) reusing patterns from `RepositoryReportsTable`
- **AND** devservices/test data SHALL include at least one report without `report.metadata.product_id` (e.g. under `src/test/resources/devservices/reports/`) for verification

### Requirement: Repos Analyzed column format
The reports table SHALL display the "Repos Analyzed" column using the same calculation as the report page Details card: num completed from `statusCounts["completed"]` and num submitted from `product.data.submittedCount`. The display SHALL use the same shared formatter as the report details card, with the optional suffix "analyzed" (e.g. "5/10 analyzed").

#### Scenario: Repos Analyzed uses completed and submittedCount
- **WHEN** a user views the reports table
- **THEN** the Repos Analyzed column shows values in the form {completed}/{submitted} with the suffix "analyzed" (e.g. "5/10 analyzed")
- **AND** completed is the value of `statusCounts["completed"]` (or 0 if absent)
- **AND** submitted is the value of `product.data.submittedCount`
- **AND** the same shared formatting logic is used as for the report page Details card (with suffix enabled for the table)

### Requirement: Reports Toolbar Per-Page Selection
When the reports table toolbar is used with pagination, the toolbar SHALL accept optional `perPageOptions` and `onPerPageSelect` and SHALL pass them to the PatternFly Pagination component. When provided, the user SHALL be able to select a different page size from the options; selecting a new per-page value SHALL invoke the caller's handler so pagination state (e.g. page and perPage) can be updated (typically resetting to page 1).

#### Scenario: Per-page options displayed and selectable
- **WHEN** the reports toolbar is rendered with pagination and `perPageOptions` (e.g. 10, 20, 50, 100) and `onPerPageSelect` are provided
- **THEN** the Pagination component displays a per-page dropdown with the given options
- **AND** when the user selects a new per-page value, `onPerPageSelect` is called with the new value so the caller can update state and refetch

#### Scenario: Backward compatibility when options not provided
- **WHEN** the reports toolbar is rendered with pagination but `perPageOptions` or `onPerPageSelect` are omitted
- **THEN** the Pagination component still renders with page navigation (onSetPage)
- **AND** the per-page control may show no options or a default so existing callers do not break

