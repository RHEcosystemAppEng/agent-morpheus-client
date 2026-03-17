# feedback-report Specification

## Purpose
Allow users to submit structured feedback on a repository report so that AI model accuracy can be improved. Feedback is collected via a card on the repository report page. The backend receives feedback via REST and forwards it to an external feedback service .

## Requirements

### Requirement: Feedback Card Content
The Feedback card SHALL display the title "Feedback" and the subtitle "Your feedback will be used to improve the accuracy of our AI models." and SHALL be implemented as `FeedbackReportCard`.

#### Scenario: Card placement and labels
- **WHEN** a user views the repository report page with report data loaded and status "completed"
- **THEN** the Feedback card is shown after the Additional Details card with title "Feedback" and subtitle "Your feedback will be used to improve the accuracy of our AI models."

### Requirement: Feedback Form Fields
The card SHALL collect the following. Required fields SHALL be marked with an asterisk. The Submit Feedback button SHALL be disabled until all required fields are set, then enabled and primary.

- **Accuracy** (dropdown, required): “How accurate do you find ExploitIQ's assessment? *” — options: Very Accurate, Mostly Accurate, Somewhat Inaccurate, Incorrect.
- **Reasoning** (dropdown, required): “Is the reasoning and summary of findings clear, complete, and well-supported? *” — options: Yes, Mostly, Somewhat, No.
- **Checklist** (dropdown, required): “Were the checklist questions and explanations easy to understand? *” — options: Yes, Mostly, Somewhat, No.
- **Rating** (1–5, required): “Rate the response (1 = Poor, 5 = Excellent): *”
- **Comment** (TextArea, optional): “Do you have any additional feedback or suggestions to improve the analysis?”

#### Scenario: Required fields and submit state
- **WHEN** a user views the Feedback card
- **THEN** the three dropdowns and the rating are shown as required; comment is optional
- **AND** Submit Feedback is disabled until all required fields are set, then enabled and primary

#### Scenario: Optional comment
- **WHEN** the user submits feedback
- **THEN** comment may be omitted; when provided, it is sent as `comment` in the payload

### Requirement: Frontend API Usage
The card SHALL use only the generated client: `FeedbackResourceService.postApiV1Feedback` for submit (e.g. via `useExecuteApi`) and `FeedbackResourceService.getApiV1FeedbackExists` for existence check (e.g. via `useApi`). The request body SHALL conform to `Feedback` (reportId, response/aiResponse, rating, accuracy, reasoning, checklist, optional comment). When feedback already exists for the report, the card SHALL show an already-submitted state instead of the form.

#### Scenario: Submit via generated client
- **WHEN** the user fills required fields and clicks "Submit Feedback"
- **THEN** the app calls `postApiV1Feedback` with the collected data and no direct fetch/axios

#### Scenario: Already-submitted state
- **WHEN** the card loads and `getApiV1FeedbackExists` returns exists true for the report
- **THEN** the card shows the already-submitted state (e.g. “Thank you! You already submitted feedback on this report.”) and does not show the feedback form

### Requirement: Backend Feedback Processing
The backend SHALL expose REST endpoints for submitting feedback and checking whether feedback exists for a report. It SHALL forward submission to an external feedback service (e.g. Flask API) and return success or error accordingly. It SHALL not persist feedback locally; the external service is the source of truth.

#### Scenario: Submit feedback flow
- **WHEN** the client sends POST to `/api/v1/feedback` with a valid JSON body (reportId, response, rating, accuracy, reasoning, checklist, optional comment)
- **THEN** FeedbackResource receives the request and forwards the DTO to FeedbackService
- **AND** FeedbackService calls the external FeedbackApi (configurable feedback-api client) to submit the feedback
- **AND** on success the backend returns 200 with body `{"status":"success"}`
- **AND** on external call failure the backend returns 500 with an error message

#### Scenario: Check feedback existence flow
- **WHEN** the client sends GET to `/api/v1/feedback/{reportId}/exists` (to decide whether to show the form or already-submitted state)
- **THEN** FeedbackResource delegates to FeedbackService.checkFeedbackExists(reportId)
- **AND** FeedbackService calls the external FeedbackApi to determine if feedback exists for that report
- **AND** the backend returns 200 with body `{"exists":true}` or `{"exists":false}`

#### Scenario: Backend error handling
- **WHEN** the external feedback API call fails (submit or exists check)
- **THEN** the backend logs the error and returns 500 with a JSON error payload
- **AND** the client receives a non-2xx response and may display an error message
