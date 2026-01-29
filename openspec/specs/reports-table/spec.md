# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view product-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each product/SBOM.
## Requirements
### Requirement: Reports Table Display
The application SHALL display a table of vulnerability analysis reports with columns that map to fields in the `Product` response from the `/api/v1/products` API endpoint. The table columns SHALL be:
- **Product ID**: Maps to `Product.productId` (displayed as a clickable link)
- **SBOM name**: Maps to `Product.sbomName`
- **CVE ID**: Maps to `Product.cveId`
- **Repositories Analyzed**: Calculated from `Product.statusCounts` (format: "completedCount / totalCount analyzed" where completedCount is from `statusCounts["completed"]` and totalCount is the sum of all values in `statusCounts`)
- **ExploitIQ Status**: Calculated from `Product.cveStatusCounts` (maps "TRUE"/"true" -> vulnerable, "FALSE"/"false" -> not vulnerable, "UNKNOWN"/"unknown" -> uncertain)
- **Completion Date**: Maps to `Product.completedAt` and SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation

The reports table SHALL use the `/api/v1/products` API endpoint to fetch data, which provides server-side grouping and aggregation for improved performance.

#### Scenario: Reports table displays product and CVE information
- **WHEN** a user views the reports page
- **THEN** the table displays one row per CVE per product with columns that map to `Product` fields
- **AND** the data is fetched from `/api/v1/products` API endpoint
- **AND** each column displays the corresponding field value or calculated value from the `Product` response

#### Scenario: Product ID and SBOM name columns
- **WHEN** a user views the reports table
- **THEN** the "Product ID" column maps to `Product.productId` and displays the product_id as a clickable link
- **AND** the "SBOM name" column maps to `Product.sbomName` and displays the SBOM name from the first report's metadata

#### Scenario: Repositories Analyzed column displays
- **WHEN** a user views the reports table
- **THEN** the table displays a "Repositories Analyzed" column that is calculated from `Product.statusCounts`
- **AND** the column displays the value in the format "completedCount / totalCount analyzed" where:
  - `completedCount` is the value from `Product.statusCounts["completed"]` (or 0 if not present)
  - `totalCount` is the sum of all values in `Product.statusCounts`

#### Scenario: ExploitIQ status column shows all status counts per CVE
- **WHEN** a user views the reports table AND the analysis is completed (all reports have "completed" state)
- **THEN** the ExploitIQ status column is calculated from `Product.cveStatusCounts`
- **AND** the column displays status types with their counts: "X Vulnerable" in a red label, "Y Not Vulnerable" in a green label, and "Z Uncertain" in an orange label
- **AND** status values are mapped from `cveStatusCounts`: "TRUE" or "true" -> vulnerable count, "FALSE" or "false" -> not vulnerable count, "UNKNOWN" or "unknown" -> uncertain count
- **AND** any status with a count of 0 is hidden (not displayed)
- **AND** the status counts are aggregated from all component reports in the product group

#### Scenario: ExploitIQ status column shows blank during analysis
- **WHEN** a user views the reports table AND the analysis is not completed (not all reports have "completed" state)
- **THEN** the ExploitIQ status column displays nothing (blank/empty) to indicate the analysis is in progress
- **AND** this occurs when the analysis state is not "completed" (determined by checking if all reports in `Product.statusCounts` have "completed" state)

#### Scenario: Product ID link navigation
- **WHEN** a user clicks the "Product ID" link in a table row
- **THEN** the application navigates based on `Product.numReports`:
  - If `numReports === 1`, navigate to `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID and `:reportId` is `Product.firstReportId`
  - Otherwise, navigate to `/reports/product/:productId/:cveId` where `:productId` is `Product.productId` and `:cveId` is the CVE ID

#### Scenario: Completion date column name and display
- **WHEN** a user views the reports table
- **THEN** the completion date column is labeled "Completion Date" and maps to `Product.completedAt`
- **AND** when the analysis is completed AND `Product.completedAt` has a value, the date is displayed in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST")
- **AND** when the analysis is not completed OR `Product.completedAt` is empty or null, the column displays " " (empty space)

#### Scenario: Default sorting by completedAt
- **WHEN** a user first views the reports table
- **THEN** the table is sorted by completedAt in descending order (newest reports first, oldest reports last) using server-side sorting
- **AND** the sorting is performed by the `/api/v1/products` API endpoint with `sortField=completedAt` and `sortDirection=DESC`
- **AND** the completedAt and sbomName columns are sortable by the user (ascending/descending)

#### Scenario: Server-side filtering and pagination
- **WHEN** a user applies filters or changes pagination on the reports table
- **THEN** the filters and pagination parameters are sent to the `/api/v1/products` API endpoint
- **AND** the server performs filtering and pagination, returning only the requested page of filtered results
- **AND** the table displays the paginated results with correct total count from API response headers (`X-Total-Pages` and `X-Total-Elements`)

