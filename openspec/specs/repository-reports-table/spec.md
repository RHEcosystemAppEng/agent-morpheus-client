# repository-reports-table Specification

## Purpose
Defines the structure and behavior of the repository reports table. This table is used in two places: embedded on the report page (filtered by product and CVE) and as the Single Repositories tab table. Both SHALL conform to this specification.
## Requirements
### Requirement: Table structure and Finding column
The repository reports table SHALL display columns: **ID** (first column, width 10%), Repository, Commit ID, Finding, **Date Requested**, and **Date Completed**. The ID column SHALL display `report.id` as a link to the report page (component route: `/reports/component/{cveId}/{report.id}`; product route: `/reports/product/{productId}/{cveId}/{report.id}`). The **Date Requested** column SHALL display `metadata.submitted_at` when present, in the format "DD Month YYYY, HH:MM:SS AM/PM"; when `metadata.submitted_at` is missing, the cell SHALL display "-". The **Date Completed** column SHALL display `report.completedAt` in the same format. All date fields SHALL use the format "DD Month YYYY, HH:MM:SS AM/PM" (e.g., "07 July 2025, 10:14:02 PM").

The table SHALL display a single **Finding** column (no separate "Analysis state" or "ExploitIQ Status" column). The Finding cell SHALL show, per row: if the report's analysis state is **completed**, the ExploitIQ status (Vulnerable, Not vulnerable, or Uncertain) from the vulnerability justification; if the report's analysis state is **pending**, **queued**, or **sent**, "In progress" using the shared InProgressStatus component (grey outline label, InProgressIcon); if the report's analysis state is **expired** or **failed**, "Failed" using the shared FailedStatus component (grey filled label, ExclamationCircleIcon). Styling SHALL match the Finding column in the reports table for in-progress and failed states.

#### Scenario: Repository reports table columns
- **WHEN** a user views the repository reports table
- **THEN** the table displays columns: ID (first, width 10%, showing report.id as a link to the report page), Repository, Commit ID, Finding, Date Requested (metadata.submitted_at or empty), and Date Completed (completedAt; dates in format "DD Month YYYY, HH:MM:SS AM/PM")

#### Scenario: Finding cell logic
- **WHEN** a user views a row in the repository reports table
- **THEN** the Finding cell shows: "Vulnerable", "Not vulnerable", or "Uncertain" (with same label colors as reports table) when the report state is completed and vulnerability justification is available; "In progress" (grey outline, InProgressIcon) when the report state is pending, queued, or sent; "Failed" (grey filled, ExclamationCircleIcon) when the report state is expired or failed
- **AND** In progress and Failed use the shared InProgressStatus and FailedStatus components so styling matches the reports table Finding column

### Requirement: Finding filter and toolbar
The repository reports table toolbar SHALL provide a single **Finding** filter (not separate Analysis state and ExploitIQ status filters). The Finding filter SHALL allow selecting exactly one finding value (e.g. Vulnerable, Not vulnerable, Uncertain, In progress, Failed), or none. When the user selects a Finding value, the table SHALL pass the corresponding backend parameter(s) to the reports API: "In progress" maps to status values for pending, queued, sent; "Failed" maps to status values for expired, failed; "Vulnerable", "Not vulnerable", and "Uncertain" map to exploitIqStatus (or equivalent API parameter) so that the backend returns only rows matching the selected finding. When no Finding value is selected, the table SHALL not apply a finding filter (no status/exploitIqStatus restriction from this filter).

#### Scenario: Finding filter and backend parameters
- **WHEN** the repository reports table toolbar displays filters
- **THEN** a single **Finding** filter is shown (replacing separate Analysis state and ExploitIQ status filters)
- **AND** the Finding filter SHALL allow selecting exactly one finding value (e.g. Vulnerable, Not vulnerable, Uncertain, In progress, Failed), or none
- **AND** when the user selects a Finding value, the table SHALL pass the corresponding backend parameter(s) to the reports API so that the backend returns only rows matching the selected finding
- **AND** when the user clears the Finding filter (no value selected), the table SHALL request data without finding-based status or exploitIqStatus filter parameters

### Requirement: Pagination and loading behavior
The repository reports table SHALL use backend pagination via `/api/v1/reports` with `page` and `pageSize` query parameters. The table SHALL display a loading skeleton only on the initial load when the table is first displayed. When users change sort order or filters, the existing table data SHALL remain visible while new data loads in the background; the table SHALL update with new data once the API call completes, without showing the skeleton.

#### Scenario: Pagination
- **WHEN** a user views the repository reports table
- **THEN** the table displays pagination controls
- **AND** pagination uses backend pagination support via `/api/v1/reports` endpoint with `page` and `pageSize` query parameters
- **AND** users can navigate between pages of repository reports

#### Scenario: Loading skeleton on initial load
- **WHEN** the repository reports table is first displayed (initial load)
- **THEN** a loading skeleton is displayed while the initial data is being fetched
- **AND** the skeleton shows placeholder rows matching the table structure
- **AND** once data is loaded, the skeleton is replaced with the actual table data

#### Scenario: No skeleton on sort change
- **WHEN** a user changes the sort order in the repository reports table (e.g., clicks a column header to sort)
- **THEN** the existing table data remains visible
- **AND** the table updates with sorted data once the API call completes
- **AND** no loading skeleton is displayed during the sort operation

#### Scenario: No skeleton on filter change
- **WHEN** a user changes a filter value in the repository reports table (e.g., selects Finding filter or enters repository search text)
- **THEN** the existing table data remains visible
- **AND** the table updates with filtered data once the API call completes
- **AND** no loading skeleton is displayed during the filter operation

### Requirement: Error and empty states
The repository reports table SHALL display an error message when the reports data fetch fails. The repository reports table SHALL display an empty state message when no repository reports match the current context and filters.

#### Scenario: Error state
- **WHEN** reports data fetch fails
- **THEN** the table displays an error message

#### Scenario: Empty state
- **WHEN** no repository reports match the current context and filters
- **THEN** the table displays an empty state message

### Requirement: Default sort by submitted_at descending
The repository reports table SHALL be sorted by default in descending order by submitted_at (most recently requested first). Sorting SHALL be performed server-side via the reports API (e.g. `sortBy=submittedAt:DESC`).

#### Scenario: Default sort on first load
- **WHEN** a user first views the repository reports table
- **THEN** the table is sorted by submitted_at in descending order (most recently requested first)
- **AND** the sort is performed by the reports API with the appropriate sort parameter(s)
- **AND** the Date Requested column header reflects the active sort when applicable

### Requirement: CVE ID filter (Single Repositories only)
The repository reports table toolbar SHALL support an optional **CVE ID** filter. The CVE ID filter SHALL be displayed only when the table is used in the Single Repositories tab; it SHALL NOT be displayed when the table is embedded on the report page (product or component CVE context). When displayed, the user SHALL be able to enter or clear a CVE ID value (e.g. via a search or text input). When the user sets a CVE ID filter value, the table SHALL send that value to the reports API as the `vulnId` query parameter so that the backend returns only reports that include the specified vulnerability. When the filter is cleared, the table SHALL omit the parameter and show all reports (subject to other filters).

#### Scenario: CVE ID filter visible on Single Repositories tab
- **WHEN** a user views the repository reports table in the Single Repositories tab
- **THEN** the toolbar displays a CVE ID filter control (e.g. search or text input)
- **AND** the user can enter a CVE ID (e.g. CVE-2024-1234) to filter the table to reports that include that vulnerability
- **AND** the table requests data from the reports API with the `vulnId` query parameter set to the entered value

#### Scenario: CVE ID filter not shown on report page
- **WHEN** a user views the repository reports table embedded on the report page (product or component CVE context)
- **THEN** the toolbar does NOT display the CVE ID filter
- **AND** the table continues to use the existing product/CVE context for filtering (no user-facing CVE ID filter)

#### Scenario: Clearing CVE ID filter
- **WHEN** a user clears the CVE ID filter in the Single Repositories table
- **THEN** the table requests data from the reports API without the `vulnId` parameter (or with it omitted)
- **AND** the table shows repository reports according to the other active filters only

