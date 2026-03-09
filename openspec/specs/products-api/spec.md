# products-api Specification

## Purpose
Define the REST API for listing and querying product (report) summaries, including sort and filter behavior.

## Requirements
### Requirement: Products API Endpoint
The `/api/v1/reports/product` endpoint SHALL support sorting by CVE ID in addition to the existing sort fields. Valid `sortField` values SHALL include `name`, `submittedAt`, `completedAt`, and `cveId` (default `submittedAt`).

#### Scenario: Sort by CVE ID
- **WHEN** a client requests the products list with `sortField=cveId`
- **THEN** the response SHALL list products sorted by CVE ID

##### Sorting Parameters
- **`sortField`** (optional, default: `submittedAt`): Field to sort by. Valid values:
  - `name`: Sort by product name
  - `submittedAt`: Sort by submitted timestamp
  - `completedAt`: Sort by completed timestamp
  - `cveId`: Sort by CVE ID (NEW)

