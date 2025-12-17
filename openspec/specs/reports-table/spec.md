# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view product-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each product/SBOM.
## Requirements
### Requirement: Reports Table Display
The application SHALL display a table of vulnerability analysis reports with columns for SBOM name, CVE ID, ExploitIQ status, completion date, analysis state, and actions. The completion date column SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation.

#### Scenario: Reports table displays product and CVE information
- **WHEN** a user views the reports page
- **THEN** the table displays one row per CVE per product with SBOM name, CVE ID, and other metadata

#### Scenario: ExploitIQ status column shows repository status counts per CVE
- **WHEN** a user views the reports table AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays repository status counts for that specific CVE, showing counts for Vulnerable, Not Vulnerable, Uncertain, and Failed repositories

#### Scenario: ExploitIQ status column shows blank during analysis
- **WHEN** a user views the reports table AND the analysis state is "analysing" (i.e., analysis has not yet finished)
- **THEN** the ExploitIQ status column displays nothing (blank/empty) to indicate the analysis is in progress

#### Scenario: View Report button is always enabled
- **WHEN** a user views the reports table
- **THEN** the "View Report" button is enabled and can be clicked to view the report, regardless of analysis state

#### Scenario: Vulnerable status display when vulnerable repositories exist
- **WHEN** a CVE has one or more repositories marked as Vulnerable (justification status "true") AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays "X Vulnerable" in a red label, where X is the count of vulnerable repositories for that CVE
- **AND** if there are additional statuses (Uncertain or Failed), those counts are also displayed
- **AND** "Not Vulnerable" count is NOT displayed together with "Vulnerable"

#### Scenario: Not vulnerable status display when no vulnerable repositories
- **WHEN** a CVE has no repositories marked as Vulnerable AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays "X Not Vulnerable" in a green label, where X is the count of not vulnerable repositories for that CVE
- **AND** if there are additional statuses (Uncertain or Failed), those counts are also displayed

#### Scenario: View Report button navigation
- **WHEN** a user clicks the "View Report" button in the actions column
- **THEN** the application navigates to `/Reports/:productId/:cveId` where `:productId` is the product ID and `:cveId` is the CVE ID from the row data

#### Scenario: Completion date column name and display
- **WHEN** a user views the reports table
- **THEN** the completion date column is labeled "Completion Date" (not "Report Completion Date")
- **AND** when a report has a completion date, it displays the date in the format "DD/MM/YYYY HH:MM" (e.g., "07/07/2025 22:14")

#### Scenario: Default sorting by completion date
- **WHEN** a user first views the reports table
- **THEN** the table is sorted by Completion Date in descending order (newest reports first, oldest reports last)
- **AND** the Completion Date column remains sortable by the user (ascending/descending)
