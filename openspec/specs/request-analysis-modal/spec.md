# request-analysis-modal Specification

## Purpose
TBD - created by archiving change connect-request-analysis-modal-to-upload-api. Update Purpose after archive.
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

