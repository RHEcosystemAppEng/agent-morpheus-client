# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view SBOM report-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each SBOM report.
## Requirements
### Requirement: Reports Table Display
The application SHALL display a table of vulnerability analysis reports with columns that map to fields in the `SbomReport` response from the `/api/v1/sbom-reports` API endpoint. The table columns SHALL be:
- **SBOM Report ID**: Maps to `SbomReport.sbomReportId` (displayed as a clickable link)
- **SBOM name**: Maps to `SbomReport.sbomName`
- **CVE ID**: Maps to `SbomReport.cveId`
- **Repositories Analyzed**: Calculated from `SbomReport.statusCounts` (format: "completedCount / totalCount analyzed" where completedCount is from `statusCounts["completed"]` and totalCount is the sum of all values in `statusCounts`)
- **ExploitIQ Status**: Calculated from `SbomReport.cveStatusCounts` (maps "TRUE"/"true" -> vulnerable, "FALSE"/"false" -> not vulnerable, "UNKNOWN"/"unknown" -> uncertain)
- **Submitted Date**: Maps to `SbomReport.submittedAt` and SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation
- **Completion Date**: Maps to `SbomReport.completedAt` and SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation. This column SHALL NOT be sortable.

The reports table SHALL use the `/api/v1/sbom-reports` API endpoint to fetch data, which provides server-side grouping and aggregation for improved performance.

The reports table SHALL automatically refresh data every 15 seconds by re-fetching from the `/api/v1/sbom-reports` API endpoint.

The reports table SHALL compare the entire SbomReport objects between the previous and current data during auto-refresh using deep comparison. The table SHALL only trigger a rerender if any field in any SbomReport object has changed (including analysis states, completion dates, status counts, CVE status counts, or any other field). This optimization SHALL prevent unnecessary rerenders and UI jumps when the data remains unchanged.

The reports table SHALL display a loading skeleton only on the initial page load when first entering the reports page. When users change sort order or filters, the existing table data SHALL remain visible while new data loads in the background. The table SHALL update with new data once the API call completes, without showing the skeleton. This prevents visual disruption and table jumping during user interactions.

#### Scenario: Loading skeleton on initial page load
- **WHEN** a user first navigates to the reports page
- **THEN** a loading skeleton is displayed while the initial data is being fetched
- **AND** the skeleton shows placeholder rows matching the table structure
- **AND** once data is loaded, the skeleton is replaced with the actual table data

#### Scenario: No skeleton on sort change
- **WHEN** a user changes the sort order (e.g., clicks a column header to sort)
- **THEN** the existing table data remains visible
- **AND** the table updates with sorted data once the API call completes
- **AND** no loading skeleton is displayed during the sort operation

#### Scenario: No skeleton on filter change
- **WHEN** a user changes a filter value (e.g., enters text in SBOM Name or CVE ID search field)
- **THEN** the existing table data remains visible
- **AND** the table updates with filtered data once the API call completes
- **AND** no loading skeleton is displayed during the filter operation

#### Scenario: Reports table displays SBOM report and CVE information
- **WHEN** a user views the reports page
- **THEN** the table displays one row per CVE per SBOM report with columns that map to `SbomReport` fields
- **AND** the data is fetched from `/api/v1/sbom-reports` API endpoint
- **AND** each column displays the corresponding field value or calculated value from the `SbomReport` response

#### Scenario: SBOM Report ID and SBOM name columns
- **WHEN** a user views the reports table
- **THEN** the "SBOM Report ID" column maps to `SbomReport.sbomReportId` and displays the sbom_report_id as a clickable link
- **AND** the "SBOM name" column maps to `SbomReport.sbomName` and displays the SBOM name from the first report's metadata

#### Scenario: Repositories Analyzed column displays
- **WHEN** a user views the reports table
- **THEN** the table displays a "Repositories Analyzed" column that is calculated from `SbomReport.statusCounts`
- **AND** the column displays the value in the format "completedCount / totalCount analyzed" where:
  - `completedCount` is the value from `SbomReport.statusCounts["completed"]` (or 0 if not present)
  - `totalCount` is the sum of all values in `SbomReport.statusCounts`

#### Scenario: ExploitIQ status column shows all status counts per CVE
- **WHEN** a user views the reports table AND the analysis is completed (all reports have "completed" state)
- **THEN** the ExploitIQ status column is calculated from `SbomReport.cveStatusCounts`
- **AND** the column displays status types with their counts: "X Vulnerable" in a red label, "Y Not Vulnerable" in a green label, and "Z Uncertain" in an orange label
- **AND** status values are mapped from `cveStatusCounts`: "TRUE" or "true" -> vulnerable count, "FALSE" or "false" -> not vulnerable count, "UNKNOWN" or "unknown" -> uncertain count
- **AND** any status with a count of 0 is hidden (not displayed)
- **AND** the status counts are aggregated from all component reports in the SBOM report group

#### Scenario: ExploitIQ status column shows blank during analysis
- **WHEN** a user views the reports table AND the analysis is not completed (not all reports have "completed" state)
- **THEN** the ExploitIQ status column displays nothing (blank/empty) to indicate the analysis is in progress
- **AND** this occurs when the analysis is not completed (determined by checking if all reports in `SbomReport.statusCounts` have "completed" state)

#### Scenario: SBOM Report ID link navigation
- **WHEN** a user clicks the "SBOM Report ID" link in a table row
- **THEN** the application navigates based on `SbomReport.numReports`:
  - If `numReports === 1`, navigate to `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID and `:reportId` is `SbomReport.firstReportId`
  - Otherwise, navigate to `/reports/sbom-report/:sbomReportId/:cveId` where `:sbomReportId` is `SbomReport.sbomReportId` and `:cveId` is the CVE ID

#### Scenario: Submitted date column name and display
- **WHEN** a user views the reports table
- **THEN** the submitted date column is labeled "Submitted Date" and maps to `SbomReport.submittedAt`
- **AND** when `SbomReport.submittedAt` has a value, the date is displayed in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST")
- **AND** when `SbomReport.submittedAt` is empty or null, the column displays " " (empty space)

#### Scenario: Completion date column name and display
- **WHEN** a user views the reports table
- **THEN** the completion date column is labeled "Completion Date" and maps to `SbomReport.completedAt`
- **AND** when the analysis is completed AND `SbomReport.completedAt` has a value, the date is displayed in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST")
- **AND** when the analysis is not completed OR `SbomReport.completedAt` is empty or null, the column displays " " (empty space)
- **AND** the "Completion Date" column header is NOT clickable and does NOT support sorting

#### Scenario: Default sorting by submittedAt
- **WHEN** a user first views the reports table
- **THEN** the table is sorted by submittedAt in descending order (newest reports first, oldest reports last) using server-side sorting
- **AND** the sorting is performed by the `/api/v1/sbom-reports` API endpoint with `sortField=submittedAt` and `sortDirection=DESC`
- **AND** the SBOM Report ID, SBOM name, and Submitted Date columns are sortable by the user (ascending/descending)

#### Scenario: Sorting by SBOM Report ID
- **WHEN** a user clicks the SBOM Report ID column header to sort
- **THEN** the table is sorted by SBOM Report ID in alphabetical order using server-side sorting
- **AND** clicking again toggles between ascending (A-Z) and descending (Z-A) order
- **AND** the sorting is performed by the `/api/v1/sbom-reports` API endpoint with `sortField=sbomReportId` and the appropriate `sortDirection` (ASC or DESC)

#### Scenario: Sorting by SBOM Name
- **WHEN** a user clicks the SBOM name column header to sort
- **THEN** the table is sorted by SBOM name in alphabetical order using server-side sorting
- **AND** clicking again toggles between ascending (A-Z) and descending (Z-A) order
- **AND** the sorting is performed by the `/api/v1/sbom-reports` API endpoint with `sortField=sbomName` and the appropriate `sortDirection` (ASC or DESC)

#### Scenario: Sorting by Submitted Date
- **WHEN** a user clicks the Submitted Date column header to sort
- **THEN** the table is sorted by Submitted Date using server-side sorting
- **AND** clicking again toggles between descending (newest first) and ascending (oldest first) order
- **AND** the sorting is performed by the `/api/v1/sbom-reports` API endpoint with `sortField=submittedAt` and the appropriate `sortDirection` (ASC or DESC)

#### Scenario: Sort state in URL
- **WHEN** a user applies sorting to the reports table
- **THEN** the sort field and sort direction are stored as query parameters in the browser URL (e.g., `/reports?sortField=sbomReportId&sortDirection=ASC`)
- **AND** the URL can be shared with others to view the same sorted results
- **AND** when navigating back to the reports page, the sort state is restored from URL parameters
- **AND** sort parameters are combined with filter parameters in the URL (e.g., `/reports?sbomName=test&sortField=submittedAt&sortDirection=DESC`)

#### Scenario: Sort persistence across navigation
- **WHEN** a user applies sorting and then navigates away from the reports page
- **AND** the user navigates back to the reports page
- **THEN** the sort state is restored from URL query parameters
- **AND** the table displays the sorted results matching the restored sort state

#### Scenario: Server-side filtering and pagination
- **WHEN** a user applies filters or changes pagination on the reports table
- **THEN** the filters and pagination parameters are sent to the `/api/v1/sbom-reports` API endpoint
- **AND** the server performs filtering and pagination, returning only the requested page of filtered results
- **AND** the table displays the paginated results with correct total count from API response headers (`X-Total-Pages` and `X-Total-Elements`)

### Requirement: Reports Table Filtering

The reports table SHALL support filtering by SBOM Name and CVE ID. All filtering SHALL be performed server-side via the `/api/v1/sbom-reports` API endpoint. Filter state SHALL be persisted in the browser URL as query parameters to enable shareable links. The active filter attribute (which search/filter input is displayed) SHALL remain unchanged until the user manually changes it.

#### Scenario: SBOM Name text search filter
- **WHEN** a user enters text in the SBOM Name search field
- **THEN** the filter value is sent to `/api/v1/sbom-reports` as `sbomName` query parameter
- **AND** the API performs case-insensitive partial text matching on `metadata.sbom_name` field
- **AND** SBOM reports matching the search text are displayed in the table
- **AND** partial matches are supported (e.g., searching "test" matches "test-product" and "my-test-sbom")

#### Scenario: CVE ID text search filter
- **WHEN** a user enters text in the CVE ID search field
- **THEN** the filter value is sent to `/api/v1/sbom-reports` as `cveId` query parameter
- **AND** the API performs case-insensitive partial text matching on `input.scan.vulns[0].vuln_id` field
- **AND** SBOM reports with matching CVE IDs are displayed in the table
- **AND** partial matches are supported (e.g., searching "2024" matches "CVE-2024-1234" and "CVE-2024-5678")

#### Scenario: Filter combination
- **WHEN** a user applies multiple filters simultaneously
- **THEN** all active filters are combined with AND logic
- **AND** SBOM reports matching all filter criteria are displayed
- **AND** filter parameters are sent together in a single API request

#### Scenario: Clear filters
- **WHEN** a user clicks "Clear all filters"
- **THEN** all filter values are reset to empty/default
- **AND** the URL query parameters are removed
- **AND** the table displays all SBOM reports (unfiltered)

#### Scenario: Filter state in URL
- **WHEN** a user applies filters to the reports table
- **THEN** the filter values are stored as query parameters in the browser URL (e.g., `/reports?sbomName=test&cveId=CVE-2024`)
- **AND** the URL can be shared with others to view the same filtered results
- **AND** when navigating back to the reports page, the filter state is restored from URL parameters

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
- **WHEN** a user selects a filter attribute (e.g., "SBOM Name") from the attribute selector
- **AND** the user applies a filter value
- **THEN** the active filter attribute remains set to the selected attribute (e.g., "SBOM Name")
- **AND** the same filter input remains displayed even after the filter is applied
- **AND** the active attribute only changes when the user manually selects a different attribute from the attribute selector

#### Scenario: Auto-refresh every 15 seconds
- **WHEN** a user views the reports table
- **THEN** the table automatically refreshes data every 15 seconds by re-fetching from the `/api/v1/sbom-reports` API endpoint
- **AND** the auto-refresh continues while the page is visible
- **AND** the auto-refresh stops when the user navigates away from the page or the component is unmounted
- **AND** the auto-refresh preserves current pagination, sorting, and filter settings

#### Scenario: Auto-refresh prevents unnecessary rerenders
- **WHEN** the reports table auto-refreshes AND the SbomReport data for all visible rows has not changed
- **THEN** the table SHALL compare the entire SbomReport objects between the previous and current data using deep comparison
- **AND** the table SHALL skip the state update (prevent rerender) if all SbomReport objects are unchanged (all fields match)
- **AND** the table SHALL trigger a rerender if any field in any SbomReport object has changed
- **AND** this optimization SHALL prevent UI jumps and visual disruption when the data remains unchanged

