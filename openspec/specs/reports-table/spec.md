# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view product-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each product/SBOM.
## Requirements
### Requirement: Reports Table Display
The application SHALL display a table of vulnerability analysis reports with columns for SBOM name, CVE ID, ExploitIQ status, completion date, analysis state, and actions.

#### Scenario: Reports table displays product and CVE information
- **WHEN** a user views the reports page
- **THEN** the table displays one row per CVE per product with SBOM name, CVE ID, and other metadata

#### Scenario: ExploitIQ status column shows product-level aggregate status
- **WHEN** a user views the reports table
- **THEN** the ExploitIQ status column displays a product-level aggregate status for all rows belonging to the same product

#### Scenario: Vulnerable status display
- **WHEN** a product has one or more vulnerable components
- **THEN** the ExploitIQ status column displays "x/y Vulnerable" in a red label, where x is the count of vulnerable CVEs from `product.summary.cves` and y is the total component count from `product.data.submittedCount`

#### Scenario: Not vulnerable status display
- **WHEN** a product has the number of CVEs in `product.summary.cves` equal to `product.data.submittedCount` AND all analyzed CVEs have non-vulnerable status (status "false" or labels indicating not vulnerable)
- **THEN** the ExploitIQ status column displays "not vulnerable" in a green label

#### Scenario: Unknown status display
- **WHEN** a product's number of CVEs in `product.summary.cves` does not equal `product.data.submittedCount`, or scan status cannot be determined
- **THEN** the ExploitIQ status column displays "status unknown" in a gray label

