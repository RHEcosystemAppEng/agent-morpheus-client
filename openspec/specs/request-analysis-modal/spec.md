# request-analysis-modal Specification

## Purpose
Provides a modal interface for users to request analysis of CycloneDX Software Bill of Materials (SBOM) files with CVE ID validation and optional private repository authentication credentials.
## Requirements
### Requirement: Request Analysis Modal Submission
The request analysis modal SHALL support two submission paths depending on the selected mode. When **SBOM** mode is selected, the modal SHALL submit the CVE ID and CycloneDX file to the `/api/v1/products/upload-cyclonedx` API endpoint. When **Single Repository** mode is selected, the modal SHALL submit a `ReportRequest` body (including CVE ID in `vulnerabilities`, `sourceRepo`, `commitId`, `analysisType: "source"`, required `metadata`, and optional `credential`) to the `POST /api/v1/reports/new` API endpoint using the generated OpenAPI client. In both cases the modal SHALL navigate to the repository report page upon successful response (HTTP 202) and close. When validation errors occur, the modal SHALL display field-specific error messages under the corresponding form fields. The modal SHALL validate the CVE ID format using the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$` when the field loses focus (blur event), when the user presses Enter in the field, or when the user clicks submit, and display an error message if the format is invalid. For SBOM mode the modal SHALL validate that CVE ID and file are provided; for Single Repository mode the modal SHALL validate that CVE ID, Source Repository, and Commit ID are provided, and that the Source Repository value is a valid HTTP or HTTPS URL only (git: and git@ URLs are not accepted); the modal SHALL validate the Source Repository URL format when the field loses focus (blur) when non-empty and when the user clicks submit, and display an error under the Source Repository field if the format is invalid. The modal SHALL display "Required" under any empty required fields. The modal SHALL prevent the API call when CVE ID format is invalid, required fields are missing, or (in Single Repository mode) Source Repository URL format is invalid. The submit button SHALL be disabled during submission progress.

#### Scenario: Successful submission and navigation (SBOM mode)
- **WHEN** the user selects SBOM mode and fills in a valid CVE ID and selects a valid CycloneDX file in the request analysis modal
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal validates the CVE ID format matches the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **AND** creates a multipart form with the CVE ID and file
- **AND** calls the `/api/v1/products/upload-cyclonedx` API endpoint using the generated OpenAPI client service
- **AND** upon successful response (HTTP 202), extracts the `reportRequestId.id` field from the `ReportData` response
- **AND** navigates to the repository report page at `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID from the form and `:reportId` is the `reportRequestId.id` from the API response
- **AND** closes the modal

#### Scenario: Successful submission and navigation (Single Repository mode)
- **WHEN** the user selects Single Repository mode and fills in a valid CVE ID, Source Repository (HTTP or HTTPS URL), and Commit ID in the request analysis modal
- **AND** optionally toggles Private repository and provides credentials
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal validates the CVE ID format, required fields (Source Repository, Commit ID), and Source Repository URL format (HTTP/HTTPS only)
- **AND** builds a `ReportRequest` with `analysisType: "source"`, `vulnerabilities` containing the CVE ID, `sourceRepo`, `commitId`, `metadata`, and optional `credential`
- **AND** calls the `POST /api/v1/reports/new` API endpoint using the generated OpenAPI client (e.g. ReportEndpointService) with `submit: true`
- **AND** upon successful response (HTTP 202), extracts the `reportRequestId.id` from the response
- **AND** navigates to the repository report page at `/reports/component/:cveId/:reportId`
- **AND** closes the modal

#### Scenario: API field-specific error display
- **WHEN** a user submits the request analysis modal
- **AND** the API call fails with HTTP 400 (Bad Request)
- **AND** the response contains field-specific errors for `cveId`, `file` (SBOM mode), `sourceRepo`, `commitId` (Single Repository mode), or other known fields
- **THEN** the modal displays the error message(s) under the corresponding field(s) using `FormHelperText` with error variant
- **AND** each error message is clearly visible and associated with its input field
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: Error message clearing on field modification
- **WHEN** a user has a field-specific error displayed under a form field
- **AND** the user modifies the corresponding field (enters text in CVE ID, file selection, Source Repository, Commit ID, or credential fields)
- **THEN** the error message for that field is cleared
- **AND** the error message no longer displays under the modified field

#### Scenario: Non-field-specific error handling
- **WHEN** a user submits the request analysis modal
- **AND** the API call fails with a non-validation error (429, 500, or network error)
- **THEN** the modal displays an appropriate error message using the Alert component
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: Loading state during submission
- **WHEN** a user clicks the "Submit Analysis Request" button
- **AND** the form validation passes for the selected mode (SBOM: CVE ID and file; Single Repository: CVE ID, Source Repository, Commit ID, and Source Repository URL format HTTP/HTTPS only)
- **THEN** the submit button is disabled only during the API call submission progress
- **AND** a loading indicator is displayed (if applicable)
- **AND** the form cannot be modified during the request
- **AND** the cancel button remains enabled to allow the user to cancel

#### Scenario: CVE ID format validation
- **WHEN** a user enters a CVE ID that does not match the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$` in the request analysis modal
- **AND** the CVE ID field loses focus (blur event), the user presses Enter in the field, or the user clicks submit
- **THEN** the modal validates the CVE ID format
- **AND** displays an error message under the CVE ID field indicating the format is invalid
- **AND** the error message clearly describes the required format (e.g., "CVE ID format is invalid. Must match the official CVE pattern CVE-YYYY-NNNN+")
- **AND** if validation occurs on submit click, the API call is prevented and the modal remains open with form data preserved

#### Scenario: Required field validation on submit (SBOM mode)
- **WHEN** the user has SBOM mode selected and clicks the "Submit Analysis Request" button
- **AND** the CVE ID field is empty, no file has been selected, or both
- **THEN** the modal validates that required fields are provided before making the API call
- **AND** displays a "Required" error message under each empty field (CVE ID field, file field, or both)
- **AND** prevents the API call from being made
- **AND** the modal remains open with the form data preserved

#### Scenario: Required field validation on submit (Single Repository mode)
- **WHEN** the user has Single Repository mode selected and clicks the "Submit Analysis Request" button
- **AND** the CVE ID field is empty, Source Repository is empty, Commit ID is empty, or any combination
- **THEN** the modal validates that CVE ID, Source Repository, and Commit ID are provided before making the API call
- **AND** displays a "Required" error message under each empty field
- **AND** prevents the API call from being made
- **AND** the modal remains open with the form data preserved

#### Scenario: Source Repository URL format validation (invalid)
- **WHEN** the user has Single Repository mode selected and enters a non-empty value in the Source Repository field that is not a valid HTTP or HTTPS URL (e.g. missing scheme, invalid host, or a git: or git@ URL which is not accepted)
- **AND** the Source Repository field loses focus (blur) or the user clicks submit
- **THEN** the modal validates the Source Repository URL format (HTTP/HTTPS only)
- **AND** displays an error message under the Source Repository field indicating the URL format is invalid
- **AND** if validation occurs on submit click, the API call is prevented and the modal remains open with form data preserved

#### Scenario: Source Repository URL format validation (valid / on blur)
- **WHEN** the user has Single Repository mode selected and enters a valid HTTP or HTTPS URL in the Source Repository field (e.g. https://github.com/org/repo)
- **AND** the Source Repository field loses focus (blur)
- **THEN** the modal validates the Source Repository URL format
- **AND** no error is displayed under the Source Repository field for URL format
- **AND** the user may submit when other required fields are satisfied

#### Scenario: Submit button and validation behavior
- **WHEN** the request analysis modal is displayed
- **THEN** the submit button is enabled when required fields for the selected mode are satisfied (or as per existing rules for SBOM)
- **AND** the submit button is disabled when submission is in progress (`isSubmitting` state is true)
- **AND** the submit button is disabled when the private repository switch is on and the authentication secret field is empty
- **AND** CVE ID format validation errors are shown on blur, Enter key press, or submit click
- **AND** required field validation errors are shown when the user clicks submit
- **AND** in Single Repository mode, Source Repository URL format validation (HTTP/HTTPS only) errors are shown on blur or submit click

### Requirement: Private Repository Authentication
The request analysis modal SHALL provide optional authentication credentials for private repository access. When the "Private repository" switch is toggled on, the modal SHALL display an authentication secret field inside a secondary Card. The modal SHALL automatically detect the credential type (SSH private key or Personal Access Token) based on the secret value content and display a colored Label indicator showing the detected type. For Personal Access Token credentials, the modal SHALL display a username field. The modal SHALL validate that the authentication secret is provided when the switch is on, and that the username is provided when a Personal Access Token is detected. The submit button SHALL be disabled when the switch is on and the authentication secret is empty. All credential fields and errors SHALL be cleared when the switch is toggled off.

#### Scenario: Private repository switch
- **WHEN** a user toggles the "Private repository" switch on in the request analysis modal
- **THEN** the modal displays an authentication secret field (password input type) inside a secondary Card
- **AND** the authentication secret field is marked as required
- **AND** the authentication secret field has a label help popover explaining "Provide an SSH private key or Personal Access Token to authenticate with the private repository."
- **AND** helper text below the field reads "Accepts SSH private keys or Personal Access Tokens. Type will be auto-detected."
- **AND** the submit button is disabled until the authentication secret is provided

#### Scenario: Auto-detect SSH private key
- **WHEN** a user enters a value in the authentication secret field that starts with "-----BEGIN" and contains "-----END"
- **THEN** the modal automatically detects the credential type as SSH private key
- **AND** displays a purple Label with a key icon below the field showing "SSH key detected"
- **AND** does NOT display the username field (username is not required for SSH keys)

#### Scenario: Auto-detect Personal Access Token
- **WHEN** a user enters a value in the authentication secret field that does NOT start with "-----BEGIN"
- **THEN** the modal automatically detects the credential type as Personal Access Token
- **AND** displays a teal Label with a security icon below the field showing "Personal access token detected"
- **AND** displays a username field below the authentication secret field
- **AND** the username field is marked as required

#### Scenario: Authentication secret validation
- **WHEN** the "Private repository" switch is on
- **AND** the user clicks submit without entering an authentication secret
- **THEN** the modal displays a "Required" error message under the authentication secret field
- **AND** prevents the API call from being made
- **AND** the modal remains open with form data preserved

#### Scenario: Username validation for PAT
- **WHEN** the "Private repository" switch is on
- **AND** the user enters a Personal Access Token (detected type is PAT)
- **AND** the user clicks submit without entering a username
- **THEN** the modal displays an error message "Username is required for Personal Access Token authentication" under the username field
- **AND** prevents the API call from being made
- **AND** the modal remains open with form data preserved

#### Scenario: Clear credentials on switch off
- **WHEN** the "Private repository" switch is on
- **AND** the user has entered values in the authentication secret field and/or username field
- **AND** the user toggles the "Private repository" switch off
- **THEN** the authentication secret value is cleared
- **AND** the username value is cleared
- **AND** all authentication-related error messages are cleared
- **AND** the authentication secret and username fields are no longer displayed

#### Scenario: Clear authentication errors on field modification
- **WHEN** a user has an authentication secret error or username error displayed
- **AND** the user modifies the corresponding field (enters text in authentication secret or username field)
- **THEN** the error message for that field is cleared
- **AND** the error message no longer displays under the modified field

### Requirement: Request Analysis Mode Selector
The request analysis modal SHALL offer two input modes selectable via a PatternFly ToggleGroup with tab-like functionality: **SBOM** and **Single Repository**. The modal SHALL render a `ToggleGroup` containing two `ToggleGroupItem` components, one with text "SBOM" and one with text "Single Repository". Exactly one item SHALL be selected at a time; the selected item SHALL indicate the active mode. The ToggleGroup SHALL have an appropriate `aria-label` (e.g. for input type or analysis mode). When the user selects the other item, the mode SHALL switch and the selection state SHALL update accordingly; when the mode is switched, the modal SHALL clear the generic (Alert) error and all field-specific errors except the CVE ID field error, so that errors from the previous mode are not shown but the CVE ID error (if any) is preserved. In both modes the modal SHALL display the CVE ID field, the Private repository switch, and when the switch is on the authentication secret (token) and username fields. When **SBOM** is selected the modal SHALL show the SBOM file upload field. When **Single Repository** is selected the modal SHALL show the Source Repository and Commit ID fields instead of the SBOM file field.

#### Scenario: Mode selector visibility and selection
- **WHEN** the request analysis modal is opened
- **THEN** a ToggleGroup is displayed with two items: "SBOM" and "Single Repository"
- **AND** SBOM mode is selected by default (SBOM item is selected)
- **AND** exactly one ToggleGroupItem is selected at any time
- **AND** clicking the non-selected item switches the mode and updates the selection to that item

#### Scenario: Clear errors when switching mode
- **WHEN** the user has one mode selected (SBOM or Single Repository) and one or more errors are displayed (e.g. generic Alert error, CVE ID error, file error, Source Repository error, Commit ID error, or authentication-related errors)
- **AND** the user clicks the other ToggleGroup item to switch to the opposite mode
- **THEN** the modal clears the generic error and all field-specific errors except the CVE ID error
- **AND** the CVE ID error (if any) remains visible after the mode switch; all other error messages are cleared
- **AND** the form fields for the newly selected mode are shown without stale errors from the previous mode (except CVE ID which is shared)

#### Scenario: Shared fields in both modes
- **WHEN** either SBOM or Single Repository mode is selected
- **THEN** the CVE ID field is visible and required
- **AND** the Private repository switch is visible
- **AND** when the Private repository switch is on, the authentication secret (token) and username (for PAT) fields are shown in a secondary Card as in the existing Private Repository Authentication requirement

#### Scenario: SBOM mode shows file field
- **WHEN** the user selects the SBOM item in the ToggleGroup
- **THEN** the SBOM file upload field is displayed
- **AND** the Source Repository and Commit ID fields are not displayed

#### Scenario: Single Repository mode shows repository fields
- **WHEN** the user selects the Single Repository item in the ToggleGroup
- **THEN** the Source Repository and Commit ID input fields are displayed
- **AND** the SBOM file upload field is not displayed

