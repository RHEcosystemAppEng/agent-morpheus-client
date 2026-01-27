## Overview Metrics

### Requirement: Overview Metrics Calculation

The system SHALL calculate three metrics for the home page dashboard based on reports completed in the last 7 days (last week). All metrics SHALL use the same base count of completed reports from the last week, calculated once and reused across all metric calculations.

#### Scenario: Calculate completed reports count

- **WHEN** the overview metrics endpoint is called
- **THEN** the system calculates the count of reports where `input.scan.completed_at` is not null and the date is within the last 7 days
- **AND** this count is stored as a variable for use in all three metric calculations

### Requirement: Successfully Analyzed Count Metric

The system SHALL return the count (not percentage) of reports that were completed in the last week. This metric SHALL be the same value as the base completed reports count.

#### Scenario: Return completed reports count

- **WHEN** calculating the successfully analyzed metric
- **THEN** the system returns the count of reports with `input.scan.completed_at` not null and date within last 7 days
- **AND** the value is a whole number (count), not a percentage

### Requirement: Average Reliability Score Metric

The system SHALL calculate the average intel_score from the first analysis item (index 0) in completed reports from the last week. The calculation SHALL use manual sum and division (not MongoDB aggregation). Only reports with non-null intel_score values in the first analysis item SHALL be included.

#### Scenario: Calculate average using sum and division

- **WHEN** calculating the average reliability score
- **THEN** the system sums all `output.analysis.0.intel_score` values from completed reports in the last week (excluding null values)
- **AND** divides the sum by the count of completed reports (from requirement 1)
- **AND** returns the result as a number (not percentage)

### Requirement: False Positive Rate Metric

The system SHALL calculate the percentage of false positives in completed reports from the last week. The calculation SHALL use only the first analysis item (index 0) of each report's analysis array, without unwinding the array. The formula SHALL be: (count of reports with `output.analysis.0.justification.status` equal to "FALSE" / total completed reports count) \* 100.

#### Scenario: Calculate false positive percentage using first item only

- **WHEN** calculating the false positive rate
- **THEN** the system counts reports where `output.analysis.0.justification.status` equals "FALSE" from completed reports in the last week
- **AND** divides this count by the total completed reports count (from requirement 1)
- **AND** multiplies by 100 to get a percentage
- **AND** does not unwind the analysis array (uses only index [0])
