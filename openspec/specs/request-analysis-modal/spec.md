# request-analysis-modal Specification

## Purpose
TBD - created by archiving change connect-request-analysis-modal-to-upload-api. Update Purpose after archive.
## Requirements
### Requirement: Request Analysis Modal Submission
The request analysis modal SHALL submit the CVE ID and CycloneDX file to the `/api/v1/sbom-reports/upload-cyclonedx` API endpoint and navigate to the repository report page upon successful submission. When validation errors occur, the modal SHALL display field-specific error messages under the corresponding form fields.

#### Scenario: Successful submission and navigation
- **WHEN** a user fills in a valid CVE ID and selects a valid CycloneDX file in the request analysis modal
- **AND** clicks the "Submit Analysis Request" button
- **THEN** the modal creates a multipart form with the CVE ID and file
- **AND** calls the `/api/v1/sbom-reports/upload-cyclonedx` API endpoint using the generated OpenAPI client service
- **AND** displays a loading state (disables submit button) during the API call
- **AND** upon successful response (HTTP 202), extracts the `reportRequestId.id` field from the `ReportData` response
- **AND** navigates to the repository report page at `/reports/component/:cveId/:reportId` where `:cveId` is the CVE ID from the form and `:reportId` is the `reportRequestId.id` from the API response
- **AND** closes the modal

#### Scenario: Field-specific error display for CVE ID
- **WHEN** a user submits the request analysis modal
- **AND** the API call fails with HTTP 400 (Bad Request)
- **AND** the response contains a field-specific error for `cveId` (e.g., `{"cveId": "CVE ID format is invalid"}`)
- **THEN** the modal displays the error message under the CVE ID field using `FormHelperText` with error variant
- **AND** the error message is clearly visible and associated with the CVE ID input field
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: Field-specific error display for file
- **WHEN** a user submits the request analysis modal
- **AND** the API call fails with HTTP 400 (Bad Request)
- **AND** the response contains a field-specific error for `file` (e.g., `{"file": "File is not valid JSON"}`)
- **THEN** the modal displays the error message under the SBOM file field using `FormHelperText` with error variant
- **AND** the error message is clearly visible and associated with the file upload field
- **AND** the modal remains open
- **AND** the submit button is re-enabled
- **AND** the form data is preserved

#### Scenario: Multiple field-specific errors
- **WHEN** a user submits the request analysis modal
- **AND** the API call fails with HTTP 400 (Bad Request)
- **AND** the response contains field-specific errors for both `cveId` and `file` (e.g., `{"cveId": "CVE ID is required", "file": "File is not valid JSON"}`)
- **THEN** the modal displays error messages under both the CVE ID field and the SBOM file field
- **AND** each error message is displayed using `FormHelperText` with error variant under its corresponding field
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
- **THEN** the submit button is disabled
- **AND** a loading indicator is displayed (if applicable)
- **AND** the form cannot be modified during the upload
- **AND** the cancel button remains enabled to allow the user to cancel

#### Scenario: Form validation before submission
- **WHEN** a user attempts to submit the request analysis modal
- **THEN** the submit button is only enabled when both CVE ID and file are provided
- **AND** if either field is missing, the submit button remains disabled
- **AND** the form validation rules are enforced before API submission

