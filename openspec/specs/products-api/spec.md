# products-api Specification

## Purpose
TBD - created by archiving change revert-groupby-to-products-table. Update Purpose after archive.
## Requirements
### Requirement: Products API Endpoint
The `/api/v1/reports/product` endpoint SHALL support sorting by CVE ID in addition to the existing sort fields.

##### Sorting Parameters
- **`sortField`** (optional, default: `submittedAt`): Field to sort by. Valid values:
  - `name`: Sort by product name
  - `submittedAt`: Sort by submitted timestamp
  - `completedAt`: Sort by completed timestamp
  - `cveId`: Sort by CVE ID (NEW)

