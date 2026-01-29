# repository-report-page Specification

## Purpose
View individual repository report details for a specific CVE, image, and tag combination within a product report or as a standalone component report.
## Requirements
### Requirement: Repository Report Page Routes
The repository report page SHALL support multiple route patterns:
- `/reports/product/:productId/:cveId/:reportId` - Product route (shows product breadcrumb)
- `/reports/component/:cveId/:reportId` - Component route (no product breadcrumb)
- `/reports/:productId/:cveId/:reportId` - Legacy route (supported for backward compatibility)

### Requirement: Repository Report Page Breadcrumb Navigation
The repository report page SHALL display a hierarchical breadcrumb navigation at the top of the page showing the navigation path from the reports list through the product/CVE report (if applicable) to the individual repository report.

#### Scenario: Breadcrumb for product route
- **WHEN** a user views the repository report page at `/reports/product/:productId/:cveId/:reportId`
- **THEN** a breadcrumb navigation is displayed at the top of the page with three items:
  - First item: "Reports" displayed as a clickable link that navigates to `/reports` (reports list page)
  - Second item: Product ID and CVE ID (format: `<product_id>/<CVE ID>`) displayed as a clickable link that navigates to `/reports/product/:productId/:cveId` (product/CVE report page)
  - Third item: Report identifier (format: `<CVE ID> | <image name> | <image tag>`) displayed as non-clickable text indicating the current page

#### Scenario: Breadcrumb for component route
- **WHEN** a user views the repository report page at `/reports/component/:cveId/:reportId`
- **THEN** a breadcrumb navigation is displayed at the top of the page with two items:
  - First item: "Reports" displayed as a clickable link that navigates to `/reports` (reports list page)
  - Second item: Report identifier (format: `<CVE ID> | <image name> | <image tag>`) displayed as non-clickable text indicating the current page
- **AND** no product/CVE breadcrumb item is displayed

#### Scenario: Breadcrumb product ID from report metadata
- **WHEN** a user views the repository report page with a product route
- **THEN** the product ID in the second breadcrumb item is extracted from `report.metadata.product_id`
- **AND** if `product_id` is not available in metadata, the product ID from route parameters is used

#### Scenario: Breadcrumb CVE ID from route
- **WHEN** a user views the repository report page
- **THEN** the CVE ID in the second breadcrumb item (for product routes) is extracted from the `cveId` route parameter

#### Scenario: Breadcrumb report identifier from report data
- **WHEN** a user views the repository report page with report data loaded
- **THEN** the report identifier breadcrumb item displays in the format `<CVE ID> | <image name> | <image tag>`
- **AND** the CVE ID is extracted from the vulnerability output matching the route `cveId` parameter (`vuln.vuln_id`)
- **AND** the image name and tag are extracted from `report.input.image.name` and `report.input.image.tag` respectively
- **AND** if image name or tag is missing, empty string is used

#### Scenario: Breadcrumb navigation to reports list
- **WHEN** a user clicks the "Reports" breadcrumb item on the repository report page
- **THEN** the application navigates to `/reports` (reports list page)

#### Scenario: Breadcrumb navigation to product/CVE report
- **WHEN** a user clicks the product ID/CVE ID breadcrumb item on the repository report page (product route only)
- **THEN** the application navigates to `/reports/product/:productId/:cveId` where `:productId` and `:cveId` are extracted from the route parameters

### Requirement: Repository Report Page Content
The repository report page SHALL display report details in a structured layout with cards showing different aspects of the repository report.

#### Scenario: Page title displays
- **WHEN** a user views the repository report page with report data loaded
- **THEN** a page title is displayed with the format "CVE Repository Report: <CVE ID> | <image name> | <image tag>"
- **AND** the report identifier portion is displayed in a smaller font size

#### Scenario: Report details cards display
- **WHEN** a user views the repository report page with report data loaded
- **THEN** the page displays three cards in a Grid layout:
  - DetailsCard: Shows report details for the specific CVE
  - ChecklistCard: Shows vulnerability checklist information
  - RepositoryAdditionalDetailsCard: Shows additional repository report details

#### Scenario: Report data validation
- **WHEN** a user views the repository report page
- **THEN** the page validates that the report exists and contains the specified CVE ID
- **AND** if the report is not found, an error message is displayed: "Report not found - The selected report with id: {reportId} has not been found."
- **AND** if the CVE ID is not found in the report, an error message is displayed: "Vulnerability not found - The vulnerability {cveId} was not found in the report with id: {reportId}."

#### Scenario: Report page loading state
- **WHEN** report data is being fetched
- **THEN** the page displays a loading skeleton

#### Scenario: Report page error state
- **WHEN** report data fetch fails
- **THEN** the page displays an appropriate error message based on the error status:
  - 404: "Report not found - The selected report with id: {reportId} has not been found."
  - Other errors: "Could not retrieve the selected report - {error status}: {error message} - The selected report with id: {reportId} could not be retrieved."

