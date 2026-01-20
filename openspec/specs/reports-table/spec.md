# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view product-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each product/SBOM.
## Requirements
### Requirement: Reports Table Display
The application SHALL display a table of vulnerability analysis reports with columns that map directly to fields in the `GroupedReportRow` response from the `/api/v1/reports/grouped` API endpoint. The table columns SHALL be:
- **Report ID**: Maps to `GroupedReportRow.reportId` (product_id for products, actual report ID for components)
- **SBOM name**: Maps to `GroupedReportRow.reportId` (same as Report ID)
- **CVE ID**: Maps to `GroupedReportRow.cveId`
- **Repositories Analyzed**: Maps to `GroupedReportRow.repositoriesAnalyzed`
- **ExploitIQ Status**: Maps to `GroupedReportRow.cveStatusCounts`
- **Completion Date**: Maps to `GroupedReportRow.completedAt` and SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation

The reports table SHALL use the `/api/v1/reports/grouped` API endpoint to fetch data, which provides server-side grouping and aggregation for improved performance.

#### Scenario: Reports table displays product and CVE information
- **WHEN** a user views the reports page
- **THEN** the table displays one row per CVE per product/component with columns that map directly to `GroupedReportRow` fields
- **AND** the data is fetched from `/api/v1/reports/grouped` API endpoint
- **AND** each column displays the corresponding field value from the `GroupedReportRow` response

#### Scenario: Report ID and SBOM name columns map to reportId
- **WHEN** a user views the reports table
- **THEN** the "Report ID" column maps to `GroupedReportRow.reportId` and displays the product_id for product reports or the actual report ID for component reports
- **AND** the "SBOM name" column also maps to `GroupedReportRow.reportId` and displays the same value as the Report ID column

#### Scenario: Repositories Analyzed column displays
- **WHEN** a user views the reports table
- **THEN** the table displays a "Repositories Analyzed" column that maps directly to `GroupedReportRow.repositoriesAnalyzed`
- **AND** the column displays the value from `GroupedReportRow.repositoriesAnalyzed` which is in the format "completed/total analyzed" for product reports
- **AND** for component reports (reportType="component"), the column displays "1" as provided in `GroupedReportRow.repositoriesAnalyzed`

#### Scenario: ExploitIQ status column shows all status counts per CVE
- **WHEN** a user views the reports table AND the report has a completion date (completedAt is not empty)
- **THEN** the ExploitIQ status column maps directly to `GroupedReportRow.cveStatusCounts`
- **AND** the column displays all three status types with their counts from `cveStatusCounts`: "X vulnerable" in a red label, "Y not vulnerable" in a green label, and "Z uncertain" in an orange label
- **AND** any status with a count of 0 is hidden (not displayed)
- **AND** the status counts are read directly from the `cveStatusCounts` field in the `GroupedReportRow` response
- **AND** for product reports, `cveStatusCounts` contains aggregated counts from all component reports
- **AND** for component reports, `cveStatusCounts` contains the single report's justification.status mapped to count 1

#### Scenario: ExploitIQ status column shows blank during analysis
- **WHEN** a user views the reports table AND the report has no completion date (completedAt is empty or null)
- **THEN** the ExploitIQ status column displays nothing (blank/empty) to indicate the analysis is in progress
- **AND** this occurs when `GroupedReportRow.completedAt` is empty or null

#### Scenario: View Report button is always enabled
- **WHEN** a user views the reports table
- **THEN** the "View Report" button is enabled and can be clicked to view the report, regardless of analysis state

#### Scenario: View Report button navigation for products
- **WHEN** a user clicks the "View Report" button for a row with reportType="product"
- **THEN** the application navigates to `/Reports/:productId/:cveId` where `:productId` is the reportId (product_id) and `:cveId` is the CVE ID from the row data

#### Scenario: View Report button navigation for components
- **WHEN** a user clicks the "View Report" button for a row with reportType="component"
- **THEN** the application navigates to `/Reports/:cveId/:reportId` where `:cveId` is the CVE ID and `:reportId` is the actual report ID from the row data

#### Scenario: Completion date column name and display
- **WHEN** a user views the reports table
- **THEN** the completion date column is labeled "Completion Date" and maps directly to `GroupedReportRow.completedAt`
- **AND** when `GroupedReportRow.completedAt` has a value, the date is displayed in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST")
- **AND** when `GroupedReportRow.completedAt` is empty or null, the column displays " " (empty space)

#### Scenario: Default sorting by submittedAt
- **WHEN** a user first views the reports table
- **THEN** the table is sorted by submittedAt in descending order (newest reports first, oldest reports last) using server-side sorting
- **AND** the sorting is performed by the `/api/v1/reports/grouped` API endpoint
- **AND** the submittedAt column remains sortable by the user (ascending/descending)

#### Scenario: Server-side filtering and pagination
- **WHEN** a user applies filters or changes pagination on the reports table
- **THEN** the filters and pagination parameters are sent to the `/api/v1/reports/grouped` API endpoint
- **AND** the server performs filtering and pagination, returning only the requested page of filtered results
- **AND** the table displays the paginated results with correct total count from API response headers

