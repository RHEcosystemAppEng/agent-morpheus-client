# request-analysis-modal Specification

## Purpose
The request analysis modal allows users to submit SBOM files with vulnerability IDs for product analysis. The modal collects a CVE ID and an SBOM file, then submits them to the backend API for processing.
## Requirements
### Requirement: Request Analysis Modal API Integration
The RequestAnalysisModal component SHALL call the `/api/v1/product/new` API endpoint when the user submits the form. The API call SHALL include the selected SBOM file and the entered vulnerability ID (CVE ID) as required parameters.

#### Scenario: Successful API submission
- **WHEN** a user enters a valid CVE ID and selects an SBOM file
- **AND** the user clicks the "Submit Analysis Request" button
- **THEN** the modal calls `/api/v1/product/new` with the vulnerability ID as a query parameter and the file as multipart/form-data
- **AND** the submit button shows a loading state during the API call
- **AND** upon successful response (202 Accepted), the modal closes
- **AND** the user receives feedback that the request was submitted successfully

#### Scenario: API error handling
- **WHEN** a user submits the form
- **AND** the API call fails (400, 500, or network error)
- **THEN** the modal displays a user-friendly error message
- **AND** the modal remains open so the user can correct the issue and retry
- **AND** the submit button is re-enabled

#### Scenario: Form validation before API call
- **WHEN** a user attempts to submit the form
- **AND** either the CVE ID is empty or no file is selected
- **THEN** the submit button remains disabled
- **AND** no API call is made

#### Scenario: API call uses generated client
- **WHEN** the modal submits the form
- **THEN** the API call MUST use the generated OpenAPI client (`ProductEndpointService.postApiV1ProductNew`)
- **AND** the API call MUST use the `useApi` hook with `immediate: false` option so the API call only executes when the user submits the form, not automatically on component mount
- **AND** the implementation MUST use the `refetch` function returned by `useApi` to trigger the API call on form submission
- **AND** the implementation MUST maintain type safety with TypeScript

