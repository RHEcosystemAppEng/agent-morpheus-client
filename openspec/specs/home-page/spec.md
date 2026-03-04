# home-page Specification

## Description
The main landing page of the application that provides an entry point for users to request new vulnerability analyses, view system metrics, and access key features. The page displays an AI usage notice modal on first visit and presents quick access cards for common tasks.

## Purpose
Provide users with a central hub to request new analyses, view important system metrics, and navigate to key application features.

## Requirements
### Requirement: AI Usage Notice Modal
The home page SHALL display an AI usage notice modal on the first visit to the application. The modal SHALL only appear once per user and SHALL be tracked using browser localStorage.

#### Scenario: Modal displays on first visit
- **WHEN** a user visits the home page for the first time
- **AND** the user has not previously acknowledged the AI usage notice
- **THEN** a small modal is displayed with the title "AI usage notice"
- **AND** the modal contains information about Red Hat AI tool usage, internal use restrictions, and the need to review AI-generated content
- **AND** the modal displays a single "Acknowledge" button

#### Scenario: Modal acknowledgment
- **WHEN** a user clicks the "Acknowledge" button in the AI usage notice modal
- **THEN** the acknowledgment is saved to browser localStorage with the key "ai-usage-acknowledged"
- **AND** the modal is closed
- **AND** the user can continue to view the home page content

#### Scenario: Modal does not display on subsequent visits
- **WHEN** a user visits the home page
- **AND** the user has previously acknowledged the AI usage notice (localStorage contains "ai-usage-acknowledged")
- **THEN** the AI usage notice modal does not appear
- **AND** the home page content is displayed immediately

### Requirement: Home Page Content
The home page SHALL display a page title, introductory text, and two main content cards in a stacked layout.

#### Scenario: Page header displays
- **WHEN** a user views the home page
- **THEN** a page section displays with the heading "Home" and the description "Request new analysis and view important system data."

#### Scenario: Get Started Card displays
- **WHEN** a user views the home page
- **THEN** a Get Started card is displayed that provides quick access to:
  - Request analysis functionality
  - View reports functionality
  - Documentation access

#### Scenario: Metrics Card displays
- **WHEN** a user views the home page
- **THEN** a Metrics card is displayed showing "Last Week Metrics" including:
  - Successfully Analyzed count
  - Average Intel Reliability Score
  - False Positive Rate percentage
- **AND** the metrics are fetched from the `/api/v1/overview/metrics` endpoint
- **AND** if metrics are loading, skeleton loaders are displayed
- **AND** if metrics fail to load, an error alert is displayed
- **AND** if no metrics data is available, an empty state is displayed
