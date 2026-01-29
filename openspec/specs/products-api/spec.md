# products-api Specification

## Purpose
The products API provides a REST endpoint to retrieve reports grouped by product_id. It filters reports to only include those with `metadata.product_id`, sorts them by a configurable sort field, groups them by `metadata.product_id`, and returns paginated results.

## Requirements
### Requirement: Products Endpoint
The system SHALL provide a REST API endpoint `/api/v1/products` that filters reports to only include those with `metadata.product_id`, sorts them by a configurable sort field, groups them by `metadata.product_id`, and returns paginated results. The service logic SHALL be implemented in `ProductsService.java` separate from the existing ReportService.

#### Scenario: Filter reports by product_id
- **WHEN** a client requests `/api/v1/products`
- **THEN** the API filters reports to only include those that have `metadata.product_id` set
- **AND** reports without `metadata.product_id` are excluded from the results

#### Scenario: Sort reports by completed_at
- **WHEN** a client requests `/api/v1/products` with sort field `completedAt`
- **THEN** reports are sorted by `input.scan.completed_at` in the specified direction (ASC or DESC)
- **AND** sorting is applied before grouping

#### Scenario: Sort reports by sbom_name
- **WHEN** a client requests `/api/v1/products` with sort field `sbomName`
- **THEN** reports are sorted by `metadata.sbom_name` in the specified direction (ASC or DESC)
- **AND** sorting is applied before grouping

#### Scenario: Group reports by product_id
- **WHEN** a client requests `/api/v1/products` AND there are reports with product_id values
- **THEN** reports are grouped by their `metadata.product_id` value
- **AND** each group contains all reports sharing the same product_id value
- **AND** groups are ordered according to the sort field

#### Scenario: Paginated response
- **WHEN** a client requests `/api/v1/products` with pagination parameters (page and pageSize)
- **THEN** the API returns a paginated result containing only the requested page of products
- **AND** response headers include `X-Total-Pages` and `X-Total-Elements` following existing pagination patterns
- **AND** pagination is applied after filtering, sorting, and grouping

#### Scenario: Service implementation
- **WHEN** the products functionality is implemented
- **THEN** the service logic is implemented in `ProductsService.java` (not in the existing ReportService)
- **AND** the service file follows existing service patterns and conventions

#### Scenario: MongoDB aggregation implementation
- **WHEN** reports are fetched and grouped
- **THEN** the implementation uses `getCollection().aggregate()` pattern
- **AND** filtering is applied to include only reports with `metadata.product_id`
- **AND** sorting is applied before aggregation based on the sort field parameter
- **AND** the aggregation pipeline uses `$group` stage to group reports by `metadata.product_id` and push all reports into an array
- **AND** the aggregation pipeline includes `$skip` and `$limit` stages after `$group` to paginate the groups
- **AND** a separate count aggregation is used to determine the total number of groups for pagination headers
- **AND** post-processing in Java extracts and computes the response fields (sbomName, productId, cveId, cveStatusCounts, statusCounts, completedAt, numReports, firstReportId) from the grouped results

#### Scenario: API error handling
- **WHEN** a client requests `/api/v1/products` AND an error occurs
- **THEN** the API returns an appropriate HTTP error status code (500 for internal server errors)
- **AND** the error response follows standard REST error response format

### Requirement: Get Product by ID Endpoint
The system SHALL provide a REST API endpoint `/api/v1/products/{productId}` that retrieves product data for a specific product ID.

#### Scenario: Get product by ID
- **WHEN** a client requests `/api/v1/products/{productId}` with a valid product ID
- **THEN** the API returns a single `Product` object for that product_id
- **AND** the response structure matches the Products API Response Structure
- **AND** the API returns HTTP status 200

#### Scenario: Product not found
- **WHEN** a client requests `/api/v1/products/{productId}` with a product ID that does not exist
- **THEN** the API returns HTTP status 404 (Not Found)

#### Scenario: Get product by ID error handling
- **WHEN** a client requests `/api/v1/products/{productId}` AND an error occurs
- **THEN** the API returns an appropriate HTTP error status code (500 for internal server errors)
- **AND** the error response follows standard REST error response format

### Requirement: Products API Response Structure
The `/api/v1/products` API endpoint SHALL return a list of `Product` objects with the following structure:
- `sbomName`: String containing the SBOM name from the first report's `metadata.sbom_name`
- `productId`: String containing the product_id from `metadata.product_id` (required)
- `cveId`: String containing the CVE ID from the first report's `input.scan.vulns[0].vuln_id`
- `cveStatusCounts`: Map<String, Integer> containing ExploitIQ status counts (direct mapping from status to count), aggregated from all component reports for the product and CVE (required)
- `statusCounts`: Map<String, Integer> containing report status counts (direct mapping from status to count), aggregated from all component reports for the product (required)
- `completedAt`: String timestamp of when reports were completed - empty if any report's completed_at is empty, otherwise the latest value
- `numReports`: Integer containing the number of reports in this product group (required)
- `firstReportId`: String containing the MongoDB document _id (as hex string) of the first report in the group, always populated for navigation purposes

#### Scenario: Product response structure
- **WHEN** the API returns a product row
- **THEN** the `productId` field contains the product_id value from `metadata.product_id`
- **AND** the `sbomName` field contains the SBOM name from the first report's `metadata.sbom_name`
- **AND** the `cveId` field contains the CVE ID from the first report's `input.scan.vulns[0].vuln_id`
- **AND** the `cveStatusCounts` field contains aggregated status counts from all component reports for that product and CVE (direct map from status to count)
- **AND** the `statusCounts` field contains aggregated report status counts from all component reports for that product (direct map from status to count)
- **AND** the `completedAt` field contains the latest completion timestamp from component reports, or empty string if any report's completed_at is empty
- **AND** the `numReports` field contains the count of reports in the product group
- **AND** the `firstReportId` field contains the MongoDB document _id (as hex string) of the first report in the group for navigation purposes

