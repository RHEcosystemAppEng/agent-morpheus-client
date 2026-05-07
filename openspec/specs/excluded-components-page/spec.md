# excluded-components-page Specification

## Purpose
TBD - created by archiving change add-excluded-components-page. Update Purpose after archive.
## Requirements
### Requirement: Excluded components page route and layout
The application SHALL provide a dedicated page at route `/reports/product/excluded-components/:productId/:cveId` for viewing excluded components for a product. The page SHALL display the title "Excluded components" and the subtitle "Components that were excluded from analysis due to technical errors or scope definitions".

#### Scenario: Excluded components page route
- **WHEN** a user navigates to `/reports/product/excluded-components/:productId/:cveId` with valid `productId` and `cveId`
- **THEN** the Excluded components page is displayed
- **AND** the page title is "Excluded components"
- **AND** the page subtitle is "Components that were excluded from analysis due to technical errors or scope definitions"

#### Scenario: Excluded components page breadcrumb
- **WHEN** a user views the Excluded components page
- **THEN** the breadcrumb SHALL display: first item "Reports" as a clickable link to `/reports`; second item "<product name> / <CVE ID>" as link to report page; third item "Excluded components" as non-clickable text (current page)
- **AND** product name and CVE ID SHALL be obtained from the route parameters and product API data

### Requirement: Excluded components table
The Excluded components page SHALL display a table with three columns: Component, Package URL, and Error. The table SHALL be populated directly from the product's `submissionFailures` field (array of FailedComponent). Each row SHALL display: Component (component name and version from `submissionFailures[].name` and `submissionFailures[].version`), Package URL (`submissionFailures[].image`), Error (`submissionFailures[].error`).

When a row represents a container image component whose CycloneDX SBOM was produced by Syft (or otherwise processed through the same image-metadata validation path) and validation failed because required **source code URL** and/or **commit ID** metadata is missing from the SBOM, the Error text SHALL NOT be the generic phrase **"SBOM metadata validation failed"** alone. It SHALL state clearly which category of metadata is missing (source code URL, commit ID, or both). It MAY include a Syft-specific prefix (e.g. that Syft produced an invalid SBOM) when the failure is attributed to Syft-generated SBOM output. It MAY list accepted CycloneDX `metadata.properties` names (as configured for the deployment) so operators know which labels to add.

#### Scenario: Table displays excluded components
- **WHEN** a user views the Excluded components page and the product has one or more entries in `product.data.submissionFailures`
- **THEN** a table is displayed with columns "Component", "Package URL", and "Error"
- **AND** each row corresponds to one entry in `submissionFailures`
- **AND** the Component column displays the component name and version (e.g. from `name` and `version` fields)
- **AND** the Package URL column displays the value of `image` (purl or image reference)
- **AND** the Error column displays the error message from `error`

#### Scenario: Missing image SBOM source metadata error is explicit
- **WHEN** a submission failure is recorded because the CycloneDX SBOM for an image scan lacks required source URL and/or commit metadata (structured validation issue)
- **THEN** the `submissionFailures[].error` value shown in the Error column SHALL explicitly indicate whether the source code URL, the commit ID, or both are missing
- **AND** the message SHALL NOT consist solely of the generic text **"SBOM metadata validation failed"**

#### Scenario: Table empty state
- **WHEN** a user views the Excluded components page and the product has no entries in `submissionFailures` (empty array or undefined)
- **THEN** the table displays an empty state message

#### Scenario: Page loading state
- **WHEN** product data is being fetched for the Excluded components page
- **THEN** a loading state (e.g. skeleton) is displayed until data is available

