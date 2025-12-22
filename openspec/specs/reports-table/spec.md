# reports-table Specification

## Purpose
The reports table displays vulnerability analysis reports in a tabular format, allowing users to view product-level analysis results. The table provides aggregate ExploitIQ status indicators that summarize the overall vulnerability posture of each product/SBOM.
## Requirements
### Requirement: Reports Table Display
The application SHALL display a table of vulnerability analysis reports with columns for SBOM name, CVE ID, Repositories Analyzed, ExploitIQ status, completion date, analysis state, and actions. The completion date column SHALL display dates in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST"), including the day, full month name, year, time with seconds, AM/PM indicator, and timezone abbreviation.

#### Scenario: Reports table displays product and CVE information
- **WHEN** a user views the reports page
- **THEN** the table displays one row per CVE per product with SBOM name, CVE ID, and other metadata

#### Scenario: Repositories Analyzed column displays
- **WHEN** a user views the reports table
- **THEN** the table displays a "Repositories Analyzed" column
- **AND** the column shows the format "analyzedCount / submittedCount analyzed" where analyzedCount is the count of repositories with "completed" state from `productSummary.summary.componentStates`
- **AND** only repositories with "completed" state are counted, not all component states

#### Scenario: ExploitIQ status column shows all status counts per CVE
- **WHEN** a user views the reports table AND the analysis state is "completed"
- **THEN** the ExploitIQ status column displays all three status types with their counts: "X vulnerable" in a red label, "Y not vulnerable" in a green label, and "Z uncertain" in an orange label
- **AND** any status with a count of 0 is hidden (not displayed)

#### Scenario: ExploitIQ status column shows blank during analysis
- **WHEN** a user views the reports table AND the analysis state is "analysing" (i.e., analysis has not yet finished)
- **THEN** the ExploitIQ status column displays nothing (blank/empty) to indicate the analysis is in progress

#### Scenario: View Report button is always enabled
- **WHEN** a user views the reports table
- **THEN** the "View Report" button is enabled and can be clicked to view the report, regardless of analysis state

#### Scenario: View Report button navigation
- **WHEN** a user clicks the "View Report" button in the actions column
- **THEN** the application navigates to `/Reports/:productId/:cveId` where `:productId` is the product ID and `:cveId` is the CVE ID from the row data

#### Scenario: Completion date column name and display
- **WHEN** a user views the reports table
- **THEN** the completion date column is labeled "Completion Date"
- **AND** when a report has a completion date, showing the date in the format "DD Month YYYY, HH:MM:SS AM/PM TZ" (e.g., "07 July 2025, 10:14:02 PM EST") when available, or " " when no completion date is available

#### Scenario: Default sorting by completion date
- **WHEN** a user first views the reports table
- **THEN** the table is sorted by Completion Date in descending order (newest reports first, oldest reports last)
- **AND** the Completion Date column remains sortable by the user (ascending/descending)
