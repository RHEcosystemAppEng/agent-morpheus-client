# repository-report-page Specification

## Description
A detailed view page that displays comprehensive information about a specific repository report, including vulnerability analysis results, analysis state, and download options for VEX and report data.

## Purpose
View individual repository report details for a specific CVE, image, and tag combination within an SBOM report or as a standalone component report.

When the API report status is a **failing** state (`failed` or `expired` from the backend), the UI treats it as **Failed** everywhere: **Analysis State** and the CVE line use the same **Failed** label as repository findings tables. The `error.type` field is not shown; only **Failure reason** (`report.error.message`) explains the outcome. The **Analysis Q&A** card is omitted, and agent-only detail rows (CVSS Score, Intel Reliability Score, Reason, Summary) are not shown.

## Requirements
### Requirement: Repository Report Page Routes
The repository report page SHALL support multiple route patterns.

#### Scenario: SBOM report route pattern
- **WHEN** a user navigates to `/reports/product/:productId/:cveId/:reportId`
- **THEN** the repository report page displays with a SBOM report breadcrumb showing the SBOM report ID and CVE ID

#### Scenario: Component route pattern
- **WHEN** a user navigates to `/reports/component/:cveId/:reportId`
- **THEN** the repository report page displays without an SBOM report breadcrumb

#### Scenario: Legacy route pattern
- **WHEN** a user navigates to `/reports/:productId/:cveId/:reportId`
- **THEN** the repository report page displays (supported for backward compatibility)

### Requirement: Repository Report Page Breadcrumb Navigation
The repository report page SHALL display a hierarchical breadcrumb navigation at the top of the page showing the navigation path from the reports list through the SBOM report/CVE report (if applicable) to the individual repository report.

#### Scenario: Breadcrumb for SBOM report route
- **WHEN** a user views the repository report page at `/reports/product/:productId/:cveId/:reportId`
- **THEN** a breadcrumb navigation is displayed at the top of the page with three items:
  - First item: "Reports" displayed as a clickable link that navigates to `/reports` (reports list page)
  - Second item: SBOM Report ID and CVE ID (format: `<product_id>/<CVE ID>`) displayed as a clickable link that navigates to `/reports/product/:productId/:cveId` (SBOM report/CVE report page)
  - Third item: Report identifier (format: `<CVE ID> | <image name> | <image tag>`) displayed as non-clickable text indicating the current page

#### Scenario: Breadcrumb for component route
- **WHEN** a user views the repository report page at `/reports/component/:cveId/:reportId`
- **THEN** a breadcrumb navigation is displayed at the top of the page with two items:
  - First item: "Reports" displayed as a clickable link that navigates to `/reports` (reports list page)
  - Second item: Report identifier (format: `<CVE ID> | <image name> | <image tag>`) displayed as non-clickable text indicating the current page
- **AND** no SBOM report/CVE breadcrumb item is displayed

#### Scenario: Breadcrumb SBOM report ID from report metadata
- **WHEN** a user views the repository report page with a SBOM report route
- **THEN** the SBOM report ID in the second breadcrumb item is extracted from `report.metadata.product_id`
- **AND** if `product_id` is not available in metadata, the SBOM report ID from route parameters is used

#### Scenario: Breadcrumb CVE ID from route
- **WHEN** a user views the repository report page
- **THEN** the CVE ID in the second breadcrumb item (for SBOM report routes) is extracted from the `cveId` route parameter

#### Scenario: Breadcrumb report identifier from report data
- **WHEN** a user views the repository report page with report data loaded
- **THEN** the report identifier breadcrumb item displays in the format `<CVE ID> | <image name> | <image tag>`
- **AND** the CVE ID is extracted from the vulnerability output matching the route `cveId` parameter (`vuln.vuln_id`)
- **AND** the image name and tag are extracted from `report.input.image.name` and `report.input.image.tag` respectively
- **AND** if image name or tag is missing, empty string is used

#### Scenario: Breadcrumb navigation to reports list
- **WHEN** a user clicks the "Reports" breadcrumb item on the repository report page
- **THEN** the application navigates to `/reports` (reports list page)

#### Scenario: Breadcrumb navigation to SBOM report/CVE report
- **WHEN** a user clicks the SBOM report ID/CVE ID breadcrumb item on the repository report page (SBOM report route only)
- **THEN** the application navigates to `/reports/product/:productId/:cveId` where `:productId` and `:cveId` are extracted from the route parameters

### Requirement: Repository Report Page Content
The repository report page SHALL display report details in a structured layout with cards showing different aspects of the repository report, including the analysis state of the report.

The repository report page SHALL display an inline warning alert with the title "AI usage notice" and the message "Always review AI generated content prior to use." The alert SHALL be positioned below the page title and above the report detail cards to remind users to review AI-generated content.

The repository report page SHALL automatically refresh data every 5 seconds by re-fetching from the `/api/v1/reports/{id}` endpoint, but only when the report status is not "completed" or "failed". When the report status is "completed" or "failed", auto-refresh SHALL stop.

The repository report page SHALL compare the report status between the previous and current data during auto-refresh. The page SHALL only trigger a rerender if the report status has changed. This optimization SHALL prevent unnecessary rerenders and UI jumps when the report status remains unchanged. Note: Only the status field is compared, not the entire report object.

The repository report page SHALL display a Feedback card after the RepositoryAdditionalDetailsCard (Additional Details card) in the same grid only when the report status is "completed".

#### Scenario: CVE repository report details card (DetailsCard)
- **WHEN** a user views the repository report page with report data loaded
- **THEN** the `CVE repository report details` card (DetailsCard) displays a description list whose first row is **Finding**, computed from the report API `status` field and the vulnerability analysis justification (same **Failed** presentation as repository findings tables when status is a failing state)
- **AND** when analysis is in a failing state, **Failure reason** appears next, showing `report.error.message` only
- **AND** **CVE** is shown as an internal app link to the CVE details route for the current report
- **AND** **Repository URL** is shown as follows: when the code entry in `report.input.image.source_info` includes both `git_repo` and `ref`, the field is an external link whose URL is the repository base (trim trailing `/`, strip a trailing `.git` suffix, then trim trailing `/` again) followed by `/commit/` and the `ref` value, so the link opens the code snapshot for that revision; the visible link text matches that URL; when only `git_repo` is present, the link targets and displays `git_repo`; when neither is usable, **Not available** is shown
- **AND** **Image URL** shows the pull reference (for example `registry/repository:tag`, or `registry/repository@sha256:…`) as link text on an external anchor whose `href` is a best-effort HTTPS browse URL for that image (same reference is valid for `podman pull` / `docker pull`); when the report is source-based (for example `analysis_type` is `source` or the image `name` is an `http`/`https` URL), **Not available** is shown
- **AND** when analysis is not in a failing state, additional rows include CVSS Score, Intel Reliability Score, Reason, and Summary
- **AND** the Analysis Q&A card (ChecklistCard) is not shown when analysis is in a failing state

#### Scenario: Auto-refresh prevents unnecessary rerenders
- **WHEN** the repository report page auto-refreshes AND the report status has not changed
- **THEN** the page SHALL compare only the report status between the previous and current data
- **AND** the page SHALL skip the state update (prevent rerender) if the report status is unchanged
- **AND** the page SHALL trigger a rerender if the report status has changed
- **AND** this optimization SHALL prevent UI jumps and visual disruption when the report status remains unchanged
- **AND** note that only the status field is compared, not the entire report object

#### Scenario: Feedback card displayed after Additional Details
- **WHEN** a user views the repository report page with report data loaded AND the report status is "completed"(Feedback card not shown when report not completed)
- **THEN** a Feedback card is displayed in the same grid after the RepositoryAdditionalDetailsCard (Additional Details card)
- **AND** the Feedback card has the title "Feedback" and the subtitle "Your feedback will be used to improve the accuracy of our AI models."(for more details see feedback-report spec )


### Requirement: Download Feature
The repository report page SHALL provide a download button that allows users to download either the VEX (Vulnerability Exploitability eXchange) data or the complete report as JSON files.

#### Scenario: Download dropdown menu
- **WHEN** a user clicks the **Download** button
- **THEN** a dropdown menu opens displaying two options:
  - "VEX" option for downloading VEX data
  - "Report" option for downloading the complete report data

#### Scenario: VEX download availability
- **WHEN** a user views the repository report page
- **AND** the report contains VEX data (component is in a vulnerable status)
- **THEN** the "VEX" option in the download dropdown is enabled and clickable
- **AND** when the user clicks the "VEX" option, a JSON file is downloaded containing the VEX data from `report.output.vex`
- **AND** the downloaded file is named in the format `vex-{cveId}-{reportId}.json`

#### Scenario: VEX download disabled
- **WHEN** a user views the repository report page
- **AND** the report does not contain VEX data (`report.output.vex` is null or undefined, indicating the component is not in a vulnerable status)
- **THEN** the "VEX" option in the download dropdown is disabled (not clickable)
- **AND** the disabled state visually indicates that VEX data is not available

#### Scenario: Report download
- **WHEN** a user clicks the "Report" option in the download dropdown
- **THEN** a JSON file is downloaded containing the complete report data
- **AND** the downloaded file is named in the format `report-{cveId}-{reportId}.json`
- **AND** the report download option is always available regardless of VEX data availability

