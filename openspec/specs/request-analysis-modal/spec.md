# request-analysis-modal Specification

## Purpose
Provides a modal interface for users to request analysis of CycloneDX Software Bill of Materials (SBOM) files with CVE ID validation and optional private repository authentication credentials.
## Requirements
### Requirement: Request Analysis Modal Submission
The request analysis modal SHALL submit the CVE ID and CycloneDX file to the `/api/v1/products/upload-cyclonedx` API endpoint and navigate to the repository report page upon successful submission. When validation errors occur, the modal SHALL display field-specific error messages under the corresponding form fields. The modal SHALL validate the CVE ID format using the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$` when the field loses focus (blur event), when the user presses Enter in the field, or when the user clicks submit, and display an error message if the format is invalid. When the user clicks submit, the modal SHALL validate that both CVE ID and file fields are provided and display "Required" error messages under any empty fields. The modal SHALL prevent the API call when CVE ID format is invalid or required fields are missing. The submit button SHALL only be disabled during submission progress, not based on form validation state.

#### Scenario: Successful submission and navigation
- **WHEN** a user fills in a valid CVE ID and selects a valid CycloneDX file in the request analysis modal
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal validates the CVE ID format matches the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **AND** creates a multipart form with the CVE ID and file
- **AND** calls the `/api/v1/products/upload-cyclonedx` API endpoint using the generated OpenAPI client service
- **AND** displays a loading state (disables submit button) during the API call
- **AND** upon successful response (HTTP 202), extracts the `reportRequestId.id` field from the `ReportData` response
- **AND** navigates to the repository report page at `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID from the form and `:reportId` is the `reportRequestId.id` from the API response
- **AND** closes the modal

#### Scenario: API field-specific error display
- **WHEN** a user submits the request analysis modal
- **AND** the API call fails with HTTP 400 (Bad Request)
- **AND** the response contains field-specific errors for `cveId`, `file`, or both (e.g., `{"cveId": "CVE ID format is invalid"}`, `{"file": "File is not valid JSON"}`, or both)
- **THEN** the modal displays the error message(s) under the corresponding field(s) using `FormHelperText` with error variant
- **AND** each error message is clearly visible and associated with its input field
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: Error message clearing on field modification
- **WHEN** a user has a field-specific error displayed under a form field
- **AND** the user modifies the corresponding field (enters text in CVE ID field or selects a new file)
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
- **AND** the form validation passes (CVE ID format is valid and file is provided)
- **THEN** the submit button is disabled only during the API call submission progress
- **AND** a loading indicator is displayed (if applicable)
- **AND** the form cannot be modified during the upload
- **AND** the cancel button remains enabled to allow the user to cancel

#### Scenario: CVE ID format validation
- **WHEN** a user enters a CVE ID that does not match the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$` in the request analysis modal
- **AND** the CVE ID field loses focus (blur event), the user presses Enter in the field, or the user clicks submit
- **THEN** the modal validates the CVE ID format
- **AND** displays an error message under the CVE ID field indicating the format is invalid
- **AND** the error message clearly describes the required format (e.g., "CVE ID format is invalid. Must match the official CVE pattern CVE-YYYY-NNNN+")
- **AND** if validation occurs on submit click, the API call is prevented and the modal remains open with form data preserved

#### Scenario: Required field validation on submit
- **WHEN** a user clicks the "Submit Analysis Request" button
- **AND** the CVE ID field is empty, no file has been selected, or both
- **THEN** the modal validates that required fields are provided before making the API call
- **AND** displays a "Required" error message under each empty field (CVE ID field, file field, or both)
- **AND** prevents the API call from being made
- **AND** the modal remains open with the form data preserved
- **AND** the submit button remains enabled (only disabled during actual submission progress)

#### Scenario: Submit button and validation behavior
- **WHEN** the request analysis modal is displayed
- **THEN** the submit button is enabled regardless of form field values
- **AND** the submit button is only disabled when submission is in progress (`isSubmitting` state is true)
- **AND** CVE ID format validation errors are shown on blur, Enter key press, or submit click
- **AND** required field validation errors are shown when the user clicks submit

### Requirement: Private Repository Authentication
The request analysis modal SHALL provide optional authentication credentials for private repository access. When the "Private repository access" checkbox is checked, the modal SHALL display an authentication secret field. The modal SHALL automatically detect the credential type (SSH private key or Personal Access Token) based on the secret value content and display a visual indicator showing the detected type. For Personal Access Token credentials, the modal SHALL display a username field. The modal SHALL validate that the authentication secret is provided when the checkbox is checked, and that the username is provided when a Personal Access Token is detected. All credential fields and errors SHALL be cleared when the checkbox is unchecked.

#### Scenario: Private repository access checkbox
- **WHEN** a user checks the "Private repository access" checkbox in the request analysis modal
- **THEN** the modal displays an authentication secret field (password input type)
- **AND** the authentication secret field has a placeholder "Enter SSH private key or Personal Access Token"
- **AND** the authentication secret field is marked as required

#### Scenario: Auto-detect SSH private key
- **WHEN** a user enters a value in the authentication secret field that starts with "-----BEGIN" and contains "-----END"
- **THEN** the modal automatically detects the credential type as SSH private key
- **AND** displays a blue compact Label below the field showing "Detected: SSH private key"
- **AND** does NOT display the username field (username is not required for SSH keys)

#### Scenario: Auto-detect Personal Access Token
- **WHEN** a user enters a value in the authentication secret field that does NOT start with "-----BEGIN"
- **THEN** the modal automatically detects the credential type as Personal Access Token
- **AND** displays a blue compact Label below the field showing "Detected: Personal Access Token"
- **AND** displays a username field below the authentication secret field
- **AND** the username field is marked as required
- **AND** the username field has a placeholder "Enter username for PAT authentication"

#### Scenario: Authentication secret validation
- **WHEN** the "Private repository access" checkbox is checked
- **AND** the user clicks submit without entering an authentication secret
- **THEN** the modal displays a "Required" error message under the authentication secret field
- **AND** prevents the API call from being made
- **AND** the modal remains open with form data preserved

#### Scenario: Username validation for PAT
- **WHEN** the "Private repository access" checkbox is checked
- **AND** the user enters a Personal Access Token (detected type is PAT)
- **AND** the user clicks submit without entering a username
- **THEN** the modal displays an error message "Username is required for Personal Access Token authentication" under the username field
- **AND** prevents the API call from being made
- **AND** the modal remains open with form data preserved

#### Scenario: Clear credentials on checkbox uncheck
- **WHEN** the "Private repository access" checkbox is checked
- **AND** the user has entered values in the authentication secret field and/or username field
- **AND** the user unchecks the "Private repository access" checkbox
- **THEN** the authentication secret value is cleared
- **AND** the username value is cleared
- **AND** all authentication-related error messages are cleared
- **AND** the authentication secret and username fields are no longer displayed

#### Scenario: Clear authentication errors on field modification
- **WHEN** a user has an authentication secret error or username error displayed
- **AND** the user modifies the corresponding field (enters text in authentication secret or username field)
- **THEN** the error message for that field is cleared
- **AND** the error message no longer displays under the modified field

