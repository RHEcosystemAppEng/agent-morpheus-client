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
- **WHEN** a user views the reports table AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays a product-level aggregate status for all rows belonging to the same product

#### Scenario: ExploitIQ status column shows placeholder for incomplete analysis
- **WHEN** a user views the reports table AND the analysis state is not "completed" (e.g., "pending", "queued", "sent", "analysing", "failed")
- **THEN** the ExploitIQ status column displays "--" to indicate the analysis is not yet complete

#### Scenario: View Report button is disabled for incomplete analysis
- **WHEN** a user views the reports table AND the analysis state is not "completed"
- **THEN** the "View Report" button is disabled and cannot be clicked

#### Scenario: View Report button is enabled for completed analysis
- **WHEN** a user views the reports table AND the analysis state is "completed"
- **THEN** the "View Report" button is enabled and can be clicked to view the report

#### Scenario: Vulnerable status display
- **WHEN** a product has one or more vulnerable components AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays "x/y Vulnerable" in a red label, where x is the count of vulnerable CVEs from `product.summary.cves` and y is the total component count from `product.data.submittedCount`

#### Scenario: Not vulnerable status display
- **WHEN** a product has the number of CVEs in `product.summary.cves` equal to `product.data.submittedCount` AND all analyzed CVEs have non-vulnerable status (status "false" or labels indicating not vulnerable) AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays "not vulnerable" in a green label

#### Scenario: Unknown status display
- **WHEN** a product's number of CVEs in `product.summary.cves` does not equal `product.data.submittedCount`, or scan status cannot be determined AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays "status unknown" in a gray label

