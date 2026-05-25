# repository-reports-table Specification

## Purpose
Defines structure and behavior of the repository reports table for **embedded SBOM-linked** contexts (**report-page**), **Standalone** **`/reports/single-repositories`**, and **RPM** **`/reports/rpm`** (RPM Reports tab variant).
## Requirements
### Requirement: RPM Reports tab table variant

The RPM tab (see **reports-table**, route **`/reports/rpm`**) SHALL list only standalone RPM checker reports via **`inputType=rpm`** on **`GET /api/v1/reports`** per **rpm-package-checker-report** (**`metadata.product_id`** MUST be absent for every row—see **reports-input-type**).

Every **`GET /api/v1/reports`** from this tab SHALL include **`inputType=rpm`** alongside paging/sorting/other active filters.

RPM tab layouts SHALL omit the **`git_repo`** (**Repository Name**) toolbar search/filter control shown on **`/reports/single-repositories`**.

For RPM layouts, artifact-identifying columns before Finding SHALL header **Package** and **Architecture** instead of Repository and Commit ID. The **Package** cell SHALL format **`name`-`version`-`release`** (hyphens U+002D) from **`report.input.image.target_package`** fields **only when** **name**, **version**, **release** are each non-empty after trim; otherwise nothing. The **Architecture** cell SHALL display trimmed **target_package.arch** or nothing.

#### Scenario: RPM tab query parameters

- **WHEN** the RPM tab fetches paginated rows
- **THEN** **`inputType=rpm`** is included on each **`GET /api/v1/reports`** request

#### Scenario: Package cell hyphen-delimited triple

- **WHEN** **target_package** supplies non-empty trimmed **name**, **version**, **release**
- **THEN** **Package** shows hyphen-delimited NVR

### Requirement: Table structure and Finding column

The repository reports table SHALL display columns: **ID** (first column, width 10%), Repository, Commit ID, Finding, **Date Requested**, and **Date Completed** when embedded on the SBOM report page or **`/reports/single-repositories`**. When **`/reports/rpm`** (RPM Reports tab) is shown, artifact-identifying columns before Finding SHALL omit Repository and Commit ID and SHALL display **Package** and **Architecture** per **RPM Reports tab table variant** above.

The ID column SHALL display `report.id` as a link to the report page (component route: `/reports/component/{cveId}/{report.id}`; product route: `/reports/product/{productId}/{cveId}/{report.id}`). The **Date Requested** column SHALL display `metadata.submitted_at` when present, in the format "DD Month YYYY, HH:MM:SS AM/PM"; when `metadata.submitted_at` is missing, the cell SHALL display "-". The **Date Completed** column SHALL display `report.completedAt` in the same format. All date fields SHALL use the format "DD Month YYYY, HH:MM:SS AM/PM" (e.g., "07 July 2025, 10:14:02 PM").

The table SHALL display a single **Finding** column (no separate "Analysis state" or "ExploitIQ Status" column). The Finding cell SHALL show, per row: if the report's analysis state is **completed**, the ExploitIQ status (Vulnerable, Not vulnerable, or Uncertain) from the vulnerability justification; if the report's analysis state is **pending**, **queued**, or **sent**, "In progress" using the shared InProgressStatus component (grey outline label, InProgressIcon); if the report's analysis state is **expired** or **failed**, "Failed" using the shared FailedStatus component (grey filled label, ExclamationCircleIcon). Styling SHALL match the Finding column in the reports table for in-progress and failed states.

#### Scenario: Repository reports table columns
- **WHEN** a user views the repository reports table
- **THEN** the table displays columns: ID (first, width 10%, showing report.id as a link to the report page), Repository, Commit ID, Finding, Date Requested (metadata.submitted_at or empty), and Date Completed (completedAt; dates in format "DD Month YYYY, HH:MM:SS AM/PM")

#### Scenario: Finding cell logic
- **WHEN** a user views a row in the repository reports table
- **THEN** the Finding cell shows: "Vulnerable", "Not vulnerable", or "Uncertain" (with same label colors as reports table) when the report state is completed and vulnerability justification is available; "In progress" (grey outline, InProgressIcon) when the report state is pending, queued, or sent; "Failed" (grey filled, ExclamationCircleIcon) when the report state is expired or failed
- **AND** In progress and Failed use the shared InProgressStatus and FailedStatus components so styling matches the reports table Finding column

### Requirement: Finding filter and toolbar
The repository reports table toolbar SHALL provide a single **Finding** filter (not separate Analysis state and ExploitIQ Status filters); **RPM** **`/reports/rpm`** layouts SHALL NOT expose **`git_repo`** / Repository Name filter controls (see **RPM Reports tab table variant** above). The Finding filter SHALL allow selecting exactly one finding value (e.g. Vulnerable, Not vulnerable, Uncertain, In progress, Failed), or none. When the user selects a Finding value, the table SHALL pass the corresponding backend parameter(s) to the reports API: "In progress" maps to status values for pending, queued, sent; "Failed" maps to status values for expired, failed; "Vulnerable", "Not vulnerable", and "Uncertain" map to exploitIqStatus (or equivalent API parameter) so that the backend returns only rows matching the selected finding. When no Finding value is selected, the table SHALL not apply a finding filter (no status/exploitIqStatus restriction from this filter).

#### Scenario: Finding filter and backend parameters
- **WHEN** the repository reports table toolbar displays filters
- **THEN** a single **Finding** filter is shown (replacing separate Analysis state and ExploitIQ status filters)
- **AND** the Finding filter SHALL allow selecting exactly one finding value (e.g. Vulnerable, Not vulnerable, Uncertain, In progress, Failed), or none
- **AND** when the user selects a Finding value, the table SHALL pass the corresponding backend parameter(s) to the reports API so that the backend returns only rows matching the selected finding
- **AND** when the user clears the Finding filter (no value selected), the table SHALL request data without finding-based status or exploitIqStatus filter parameters

### Requirement: RPM package substring filter

The **`GET /api/v1/reports`** endpoint SHALL accept an optional query parameter **`rpmPackage`**.

When **`rpmPackage`** is present and non-empty after trim, the result set SHALL include only report documents whose **`input.image.target_package`** has **name**, **version**, and **release** each non-empty after trim, **and** the case-insensitive **substring** condition holds on the concatenation **`name`** + **U+002D** + **`version`** + **U+002D** + **`release`** using the **same** logical joining as the **Package** column (no extra spaces).

The match SHALL treat the **`rpmPackage`** parameter value as a **literal** substring (**not** a regular expression vocabulary): characters such as `.` (full stop) **U+002E** and **hyphen** **U+002D** MUST match themselves only (no regex metacharacter interpretation).

Documents missing a complete **`name`**/**`version`**/**`release`** triple (after trim) SHALL NOT satisfy this filter, consistent with displaying an empty Package cell.

The RPM Reports tab (**`/reports/rpm`**) SHALL expose a toolbar **Package** search control bound to **`rpmPackage`**. When the control is empty, **`rpmPackage`** SHALL be omitted from the request. **`/reports/single-repositories`** and embedded report-page layouts SHALL NOT show this Package search control.

#### Scenario: Backend literal substring match

- **WHEN** a caller invokes **`GET /api/v1/reports`** with **`rpmPackage`** set to **`3.1.2`**
- **THEN** responses include only reports where **`target_package`** has non-empty trimmed **name**, **version**, and **release** **and** the joined string contains **`3.1.2`** as a contiguous literal substring ignoring English letter case (**e.g.** matches **`LIBARCHIVE-3.1.2-14.el7_9.1`**)

#### Scenario: Incomplete triple does not match

- **WHEN** **`rpmPackage`** is non-empty **and** a document has a missing or blank **name**, **version**, or **release** field (after trim) on **`target_package`**
- **THEN** that document SHALL NOT appear in **`GET /api/v1/reports`** results filtered by **`rpmPackage`**

#### Scenario: Substring spans name, version, and release boundaries

- **WHEN** **`rpmPackage`** is a contiguous substring of the joined **`name`-`version`-`release`** string that is **not** wholly contained inside **exactly one** of **name**, **version**, or **release** alone (**e.g.** on **`libarchive-3.1.2-14.el7_9.1`** the value **`archive-3.1`** spans **name** into **version**; **`2-14.el7`** spans **version** into **release**)
- **THEN** reports whose full joined triple contains that literal substring SHALL match **because** filtering evaluates the **concatenated** display string **not** independent per-field substring tests

#### Scenario: RPM tab toolbar

- **WHEN** a user is on **`/reports/rpm`**
- **THEN** a Package search filter is visible **and** non-empty entries include **`rpmPackage`** on **`GET /api/v1/reports`** alongside **`inputType=rpm`** and other active filters

#### Scenario: Non-RPM layouts omit Package toolbar control

- **WHEN** a user views **`/reports/single-repositories`** **or** the embedded repository reports table on a report page
- **THEN** the Package (**`rpmPackage`**) toolbar control SHALL NOT appear

### Requirement: Pagination and loading behavior

The repository reports table SHALL use backend pagination via `/api/v1/reports` with `page`, `pageSize`, and list parameters appropriate to layout (**`inputType=repository`** on **`/reports/single-repositories`**, **`inputType=rpm`** on **`/reports/rpm`**; both values imply **no** **`metadata.product_id`** per **reports-input-type**, plus **`gitRepo`** (repository tab), **`rpmPackage`** where used (RPM tab), **`vulnId`**, **aggregated Finding parameters** as implemented). The table SHALL display a loading skeleton only on the initial load when the table is first displayed. When users change sort order or filters, the existing table data SHALL remain visible while new data loads in the background; the table SHALL update with new data once the API call completes, without showing the skeleton.

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

### Requirement: CVE ID filter (Standalone repository tables)

The repository reports table toolbar SHALL support an optional **CVE ID** filter. The CVE filter SHALL surface on **`/reports/single-repositories`** and **`/reports/rpm`**; it SHALL stay hidden in embedded SBOM-linked contexts (**report-page** routing by product/component CVE).

When visible, **`vulnId`** SHALL transmit entered values; clearing the CVE filter SHALL omit **`vulnId`** from the request while other standalone-tab parameters (**`Finding`**, **`inputType`**, repository **`gitRepo`** / RPM **`rpmPackage`** search text where applicable, etc.) remain applied per **`reports-input-type`** and this specification.

#### Scenario: CVE toolbar on `/reports/single-repositories`

- **WHEN** a user views the Single Repositories tab
- **THEN** the CVE ID filter SHALL be visible and wired to **`vulnId`** as implemented

#### Scenario: CVE toolbar on `/reports/rpm`

- **WHEN** a user views the RPM tab
- **THEN** the CVE ID filter SHALL use the same **`vulnId`** semantics as the Single Repositories tab

#### Scenario: CVE toolbar hidden when embedded on report page

- **WHEN** the repository reports table is embedded in an SBOM report-linked context
- **THEN** the CVE manual filter SHALL NOT appear

#### Scenario: Clearing CVE filter on standalone tabs

- **WHEN** a user clears the CVE filter on **`/reports/single-repositories`** or **`/reports/rpm`**
- **THEN** **`vulnId`** SHALL be omitted from the **`GET /api/v1/reports`** request
- **AND** other filters (**Finding**, **`inputType`**, **`gitRepo`**, **`rpmPackage`** where applicable, etc.) SHALL remain unchanged

