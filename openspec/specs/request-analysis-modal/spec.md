# request-analysis-modal Specification

## Purpose
Provides a modal interface for users to request analysis of CycloneDX Software Bill of Materials (SBOM) files with CVE ID validation and optional private repository authentication credentials.
## Requirements
### Requirement: Request Analysis Modal Submission
The request analysis modal SHALL accept both SPDX (multi-component) and CycloneDX (single component) SBOM file formats. The modal SHALL display that it accepts both formats in the UI. The modal SHALL use the standard PatternFly `FileUpload` component for file selection instead of a drag-and-drop area. The modal SHALL perform basic parsing of the uploaded SBOM file to detect if it is SPDX 2.3 or CycloneDX 1.6 format. The modal SHALL distinguish between JSON parsing errors and unsupported format errors. If the file cannot be parsed as JSON, the modal SHALL immediately display a file validation error message "File is not valid JSON" under the file upload field and prevent the API call from being made. If the file is valid JSON but the format is not recognized as SPDX 2.3 or CycloneDX 1.6, the modal SHALL display a format validation error message under the file upload field. When a valid SPDX 2.3 file is detected, the modal SHALL submit to the `/api/v1/products/upload-spdx` API endpoint with optional credentials when the private repository switch is enabled, and navigate to the product page upon successful submission. When a valid CycloneDX 1.6 file is detected, the modal SHALL submit to the `/api/v1/products/upload-cyclonedx` API endpoint with optional credentials when the private repository switch is enabled, and navigate to the repository report page upon successful submission. When validation errors occur, the modal SHALL display field-specific error messages under the corresponding form fields. The modal SHALL validate the CVE ID format using the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$` when the field loses focus (blur event), when the user presses Enter in the field, or when the user clicks submit, and display an error message if the format is invalid. When the user clicks submit, the modal SHALL validate that both CVE ID and file fields are provided and display "Required" error messages under any empty fields. The modal SHALL prevent the API call when CVE ID format is invalid, required fields are missing, file is not valid JSON, or file format is not recognized. The submit button SHALL be disabled during submission progress or when the private repository switch is on and the authentication secret is empty.

#### Scenario: File selection using standard FileUpload component
- **WHEN** a user views the request analysis modal
- **THEN** the SBOM file field displays a standard PatternFly `FileUpload` component
- **AND** the component shows a browse button labeled "Upload" and a placeholder text "Drag and drop a file or upload one"
- **AND** users can click the browse button to select a file from their file system
- **AND** users can drag and drop a file onto the component
- **AND** when a file is selected, the filename is displayed in the component
- **AND** users can clear the selected file using a clear button

#### Scenario: Invalid JSON file error display
- **WHEN** a user selects a file that is not valid JSON using the FileUpload component
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal attempts to parse the file as JSON
- **AND** detects that the file is not valid JSON (JSON parsing fails)
- **AND** immediately displays a file validation error message "File is not valid JSON" under the file upload field
- **AND** prevents the API call from being made
- **AND** the modal remains open with the form data preserved
- **AND** the submit button remains enabled (only disabled during actual submission progress)

#### Scenario: Unsupported SBOM format error display (valid JSON but unsupported format)
- **WHEN** a user selects a file that is valid JSON but not recognized as SPDX 2.3 or CycloneDX 1.6 format using the FileUpload component
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal parses the file as JSON successfully
- **AND** determines the file is not a supported format (not SPDX 2.3 or CycloneDX 1.6)
- **AND** displays a format validation error message under the file upload field
- **AND** the error message clearly indicates the file format is not supported (e.g., "File format not supported. Please upload an SPDX 2.3 or CycloneDX 1.6 file.")
- **AND** prevents the API call from being made
- **AND** the modal remains open with the form data preserved
- **AND** the submit button remains enabled (only disabled during actual submission progress)

#### Scenario: Successful SPDX submission with credentials and navigation to product page
- **WHEN** a user fills in a valid CVE ID and selects a valid SPDX 2.3 file using the FileUpload component in the request analysis modal
- **AND** enables the "Private repository" switch and provides valid credentials (authentication secret and optionally username)
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal validates the CVE ID format matches the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **AND** parses the file as JSON successfully
- **AND** detects it is SPDX 2.3 format
- **AND** creates a multipart form with the vulnerability ID, file, and credentials (secretValue and optionally username)
- **AND** calls the `/api/v1/products/upload-spdx` API endpoint using the generated OpenAPI client service with the credentials included in the form data
- **AND** displays a loading state (disables submit button) during the API call
- **AND** upon successful response (HTTP 202), extracts the `productId` field from the response
- **AND** navigates to the product page at `/reports/product/:productId/:cveId` where `:productId` is from the API response and `:cveId` is the CVE ID from the form
- **AND** closes the modal

#### Scenario: Successful SPDX submission without credentials and navigation to product page
- **WHEN** a user fills in a valid CVE ID and selects a valid SPDX 2.3 file using the FileUpload component in the request analysis modal
- **AND** does not enable the "Private repository" switch
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal validates the CVE ID format matches the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **AND** parses the file as JSON successfully
- **AND** detects it is SPDX 2.3 format
- **AND** creates a multipart form with the vulnerability ID and file (without credentials)
- **AND** calls the `/api/v1/products/upload-spdx` API endpoint using the generated OpenAPI client service
- **AND** displays a loading state (disables submit button) during the API call
- **AND** upon successful response (HTTP 202), extracts the `productId` field from the response
- **AND** navigates to the product page at `/reports/product/:productId/:cveId` where `:productId` is from the API response and `:cveId` is the CVE ID from the form
- **AND** closes the modal

#### Scenario: Successful CycloneDX submission and navigation to report page
- **WHEN** a user fills in a valid CVE ID and selects a valid CycloneDX 1.6 file using the FileUpload component in the request analysis modal
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal validates the CVE ID format matches the official CVE regex pattern `^CVE-[0-9]{4}-[0-9]{4,19}$`
- **AND** parses the file as JSON successfully
- **AND** detects it is CycloneDX 1.6 format
- **AND** creates a multipart form with the CVE ID and file
- **AND** calls the `/api/v1/products/upload-cyclonedx` API endpoint using the generated OpenAPI client service
- **AND** displays a loading state (disables submit button) during the API call
- **AND** upon successful response (HTTP 202), extracts the `reportRequestId.id` field from the `ReportData` response
- **AND** navigates to the repository report page at `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID from the form and `:reportId` is the `reportRequestId.id` from the API response
- **AND** closes the modal

#### Scenario: Format error clearing on file change
- **WHEN** a user has a format validation error or JSON parsing error displayed under the file upload field
- **AND** the user selects a different file using the FileUpload component
- **THEN** the error message is cleared
- **AND** the error message no longer displays under the file upload field

#### Scenario: File clear functionality
- **WHEN** a user has selected a file using the FileUpload component
- **AND** clicks the clear button on the FileUpload component
- **THEN** the selected file is removed
- **AND** the filename is cleared from the component
- **AND** any file-related error messages are cleared

#### Scenario: API field-specific error display for SPDX upload
- **WHEN** a user submits a valid SPDX 2.3 file in the request analysis modal
- **AND** the API call to `/api/v1/products/upload-spdx` fails with HTTP 400 (Bad Request)
- **AND** the response contains field-specific errors for `cveId`, `file`, or both
- **THEN** the modal displays the error message(s) under the corresponding field(s) using `FormHelperText` with error variant
- **AND** each error message is clearly visible and associated with its input field
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: API credential error display for SPDX upload
- **WHEN** a user submits a valid SPDX 2.3 file with credentials in the request analysis modal
- **AND** the API call to `/api/v1/products/upload-spdx` fails with HTTP 400 (Bad Request) due to invalid credentials
- **AND** the response contains an error message about credential validation
- **THEN** the modal displays the error message using the Alert component
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: API field-specific error display for CycloneDX upload
- **WHEN** a user submits a valid CycloneDX 1.6 file in the request analysis modal
- **AND** the API call to `/api/v1/products/upload-cyclonedx` fails with HTTP 400 (Bad Request)
- **AND** the response contains field-specific errors for `cveId`, `file`, or both
- **THEN** the modal displays the error message(s) under the corresponding field(s) using `FormHelperText` with error variant
- **AND** each error message is clearly visible and associated with its input field
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: Error message clearing on field modification
- **WHEN** a user has a field-specific error displayed under a form field
- **AND** the user modifies the corresponding field (enters text in CVE ID field or selects a new file using FileUpload)
- **THEN** the error message for that field is cleared
- **AND** the error message no longer displays under the modified field

#### Scenario: Non-field-specific error handling
- **WHEN** a user submits the request analysis modal with a valid file format
- **AND** the API call fails with a non-validation error (429, 500, or network error)
- **THEN** the modal displays an appropriate error message using the Alert component
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: Loading state during submission
- **WHEN** a user clicks the "Submit Analysis Request" button
- **AND** the form validation passes (CVE ID format is valid, file is provided, file is valid JSON, and file format is recognized)
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
- **THEN** the submit button is enabled regardless of CVE ID and file field values
- **AND** the submit button is disabled when submission is in progress (`isSubmitting` state is true)
- **AND** the submit button is disabled when the private repository switch is on and the authentication secret field is empty
- **AND** CVE ID format validation errors are shown on blur, Enter key press, or submit click
- **AND** required field validation errors are shown when the user clicks submit
- **AND** JSON parsing errors are shown when the user clicks submit
- **AND** format validation errors are shown when the user clicks submit

### Requirement: Private Repository Authentication
The request analysis modal SHALL provide optional authentication credentials for private repository access. When the "Private repository" switch is toggled on, the modal SHALL display an authentication secret field inside a secondary Card. The modal SHALL automatically detect the credential type (SSH private key or Personal Access Token) based on the secret value content and display a colored Label indicator showing the detected type. For Personal Access Token credentials, the modal SHALL display a username field. The modal SHALL validate that the authentication secret is provided when the switch is on, and that the username is provided when a Personal Access Token is detected. The submit button SHALL be disabled when the switch is on and the authentication secret is empty. All credential fields and errors SHALL be cleared when the switch is toggled off. When submitting SPDX files, the modal SHALL include credentials in the form data sent to the `/api/v1/products/upload-spdx` endpoint when the private repository switch is enabled. When submitting CycloneDX files, the modal SHALL include credentials in the form data sent to the `/api/v1/products/upload-cyclonedx` endpoint when the private repository switch is enabled.

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

