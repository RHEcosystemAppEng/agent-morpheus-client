# grouped-reports-api Specification

## Purpose
TBD - created by archiving change add-grouped-reports-api. Update Purpose after archive.
## Requirements
### Requirement: Grouped Reports Endpoint
The system SHALL provide a REST API endpoint `/api/v1/reports/grouped` that filters reports to only include those with `metadata.product_id`, sorts them by a configurable sort field, groups them by `metadata.product_id`, and returns paginated results. The service logic SHALL be implemented in a new service file separate from the existing ReportService.

#### Scenario: Filter reports by product_id
- **WHEN** a client requests `/api/v1/reports/grouped`
- **THEN** the API filters reports to only include those that have `metadata.product_id` set
- **AND** reports without `metadata.product_id` are excluded from the results

#### Scenario: Sort reports by completed_at
- **WHEN** a client requests `/api/v1/reports/grouped` with sort field `completedAt`
- **THEN** reports are sorted by `input.scan.completed_at` in the specified direction (ASC or DESC)
- **AND** sorting is applied before grouping

#### Scenario: Sort reports by sbom_name
- **WHEN** a client requests `/api/v1/reports/grouped` with sort field `sbomName`
- **THEN** reports are sorted by `input.metadata.sbom_name` in the specified direction (ASC or DESC)
- **AND** sorting is applied before grouping

#### Scenario: Group reports by product_id
- **WHEN** a client requests `/api/v1/reports/grouped` AND there are reports with product_id values
- **THEN** reports are grouped by their `metadata.product_id` value
- **AND** each group contains all reports sharing the same product_id value
- **AND** groups are ordered according to the sort field

#### Scenario: Paginated response
- **WHEN** a client requests `/api/v1/reports/grouped` with pagination parameters (page and pageSize)
- **THEN** the API returns a paginated result containing only the requested page of grouped reports
- **AND** response headers include `X-Total-Pages` and `X-Total-Elements` following existing pagination patterns
- **AND** pagination is applied after filtering, sorting, and grouping

#### Scenario: Service implementation in new file
- **WHEN** the grouped reports functionality is implemented
- **THEN** the service logic is implemented in a new service file `GroupedReportsService.java` (not in the existing ReportService)
- **AND** the new service file follows existing service patterns and conventions

#### Scenario: MongoDB aggregation implementation
- **WHEN** reports are fetched and grouped
- **THEN** the implementation uses `getCollection().filter().sort().aggregate()` pattern
- **AND** filtering is applied to include only reports with `metadata.product_id`
- **AND** sorting is applied before aggregation based on the sort field parameter
- **AND** the aggregation pipeline uses `$group` stage to group reports by `metadata.product_id` and push all reports into an array
- **AND** the aggregation pipeline includes `$skip` and `$limit` stages after `$group` to paginate the groups
- **AND** a separate count aggregation is used to determine the total number of groups for pagination headers
- **AND** post-processing in Java extracts and computes the response fields (reportId, reportType, cveId, repositoriesAnalyzed, cveStatusCounts, completedAt) from the grouped results

#### Scenario: API error handling
- **WHEN** a client requests `/api/v1/reports/grouped` AND an error occurs
- **THEN** the API returns an appropriate HTTP error status code (500 for internal server errors)
- **AND** the error response follows standard REST error response format

### Requirement: Grouped Reports API Response Structure
The `/api/v1/reports/grouped` API endpoint SHALL return a list of `GroupedReportRow` objects with the following structure:
- `reportId`: String containing the product_id if the report is part of a product (has product_id in metadata), or the actual report ID (input.scan.id) if it is a component report
- `reportType`: String enum with values "product" or "component" indicating whether the row represents a product-level aggregation or a single component report
- `cveId`: String containing the CVE ID
- `repositoriesAnalyzed`: String in format "completed/total" for product reports (aggregated count of completed repositories out of total), or "1" for component reports
- `cveStatusCounts`: Map<String, Integer> containing ExploitIQ status counts (direct mapping from status to count). For product reports, this SHALL be aggregated from all component reports for the specific CVE. For component reports, this SHALL contain the single report's justification.status mapped to count 1
- `completedAt`: String timestamp of when the report was completed (for products, this is the earliest completedAt from component reports)
- `firstReportId`: String containing the first report's ID (`input.scan.id`) from the group, always populated for navigation purposes

#### Scenario: Product report response structure
- **WHEN** the API returns a grouped report row for a report with product_id
- **THEN** the `reportId` field contains the product_id value
- **AND** the `reportType` field is "product"
- **AND** the `repositoriesAnalyzed` field contains "completed/total" format where completed and total are aggregated counts
- **AND** the `cveStatusCounts` field contains aggregated status counts from all component reports for that product and CVE (direct map from status to count)
- **AND** the `completedAt` field contains the earliest completion timestamp from component reports
- **AND** the `firstReportId` field contains the first report's ID (`input.scan.id`) from the group for navigation purposes

#### Scenario: Component report response structure
- **WHEN** the API returns a grouped report row for a report without product_id
- **THEN** the `reportId` field contains the actual report ID (input.scan.id)
- **AND** the `reportType` field is "component"
- **AND** the `repositoriesAnalyzed` field is "1"
- **AND** the `cveStatusCounts` field contains a direct map with the single report's justification.status as the key and count 1 as the value
- **AND** the `completedAt` field contains the completion timestamp from the single report
- **AND** the `firstReportId` field contains the same report ID as `reportId` (since there is only one report in the group)

