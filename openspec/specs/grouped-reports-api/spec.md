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

#### Scenario: API response format
- **WHEN** a client requests `/api/v1/reports/grouped`
- **THEN** the API returns a JSON array of grouped report objects, one per product_id
- **AND** each grouped report object includes the following fields:
  - `sbomName`: String populated from the first report's `metadata.sbom_name`
  - `productId`: String populated from the first report's `metadata.product_id`
  - `cveId`: String populated from the first report's `input.scan.vulns[0].vuln_id`
  - `cveStatusCounts`: Map<String, Integer> created by iterating over all reports in the group, mapping each report's `output.analysis[0].justification.status` to the number of reports with that status
  - `statusCounts`: Map<String, Integer> created by iterating over all reports in the group, mapping each report's status (calculated using `getStatus` method from `ReportRepositoryService.java`) to the number of reports with that status
  - `completedAt`: String that is empty if any report's `input.scan.completed_at` is empty, otherwise the latest `completed_at` value from all reports in the group
  - `numReports`: Integer representing the number of reports in this product group

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
- **AND** post-processing in Java extracts and computes the response fields (sbomName, productId, cveId, cveStatusCounts, statusCounts, completedAt, numReports) from the grouped results

#### Scenario: API error handling
- **WHEN** a client requests `/api/v1/reports/grouped` AND an error occurs
- **THEN** the API returns an appropriate HTTP error status code (500 for internal server errors)
- **AND** the error response follows standard REST error response format

