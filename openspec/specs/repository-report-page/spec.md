# repository-report-page Specification

## Purpose
View individual repository report details for a specific CVE, image, and tag combination within a product report.
## Requirements
### Requirement: Repository Report Page Breadcrumb Navigation
The repository report page SHALL display a hierarchical breadcrumb navigation at the top of the page showing the navigation path from the reports list through the product/CVE report to the individual repository report.

#### Scenario: Breadcrumb displays three levels
- **WHEN** a user views the repository report page at `/Reports/:productId/:cveId/:reportId`
- **THEN** a breadcrumb navigation is displayed at the top of the page with three items:
  - First item: "Reports" displayed as a clickable link that navigates to `/Reports` (reports list page)
  - Second item: Product name and CVE ID (format: `<product name>/<CVE ID>`) displayed as a clickable link that navigates to `/Reports/:productId/:cveId` (product/CVE report page)
  - Third item: Report identifier (format: `<CVE ID> | <image name> | <image tag>`) displayed as non-clickable text indicating the current page

#### Scenario: Breadcrumb product name from report metadata
- **WHEN** a user views the repository report page
- **THEN** the product name in the second breadcrumb item is extracted from `report.metadata.product_name`
- **AND** if `product_name` is not available in metadata, the product ID from route parameters is used as fallback text

#### Scenario: Breadcrumb CVE ID from route
- **WHEN** a user views the repository report page
- **THEN** the CVE ID in the second breadcrumb item is extracted from the `cveId` route parameter

#### Scenario: Breadcrumb report identifier from report data
- **WHEN** a user views the repository report page with report data loaded
- **THEN** the third breadcrumb item displays the report identifier in the format `<CVE ID> | <image name> | <image tag>`
- **AND** the CVE ID is extracted from the vulnerability output matching the route `cveId` parameter
- **AND** the image name and tag are extracted from `report.input.image.name` and `report.input.image.tag` respectively

#### Scenario: Breadcrumb with missing product name
- **WHEN** a user views the repository report page and `report.metadata.product_name` is not available
- **THEN** the second breadcrumb item displays the product ID from route parameters as fallback text
- **AND** the breadcrumb link still functions correctly using the product ID from route parameters

#### Scenario: Breadcrumb navigation to reports list
- **WHEN** a user clicks the "Reports" breadcrumb item on the repository report page
- **THEN** the application navigates to `/Reports` (reports list page)

#### Scenario: Breadcrumb navigation to product/CVE report
- **WHEN** a user clicks the product name/CVE ID breadcrumb item on the repository report page
- **THEN** the application navigates to `/Reports/:productId/:cveId` where `:productId` and `:cveId` are extracted from the route parameters

