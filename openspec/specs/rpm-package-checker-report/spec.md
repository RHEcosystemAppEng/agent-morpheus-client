# rpm-package-checker-report Specification

## Purpose

Shared normative rule for treating a persisted analysis document as **RPM package checker** vs **repository (non-RPM)** for UI branching, layouts, and list filtering (**repository report detail**, RPM tab routing, breadcrumbs).

## Requirements

### Requirement: RPM package checker report classification

A stored analysis report SHALL qualify as **RPM package checker report** (**RPM checker**) when **`report.input.image.pipeline_mode`** is exactly **`rpm_package_checker`**. Reports that do not satisfy this predicate SHALL not be classified as RPM checker for branching in UI (repository report detail layout, RPM tab listing, toolbar filters, etc.).

Systems SHALL use this definition consistently wherever **RPM checker** branching is referenced in **repository-report-page**, **reports-table** (RPM tab), and **repository-reports-table** (RPM variant); other capabilities SHOULD align when referencing RPM checker analyses (for example **`document-titles`** rules that cite **`pipeline_mode`**).

#### Scenario: RPM checker matches pipeline_mode

- **WHEN** a report **input.image.pipeline_mode** equals **rpm_package_checker**
- **THEN** the report SHALL classify as RPM checker for spec-driven behavior.

#### Scenario: Missing or alternate pipeline_mode

- **WHEN** **pipeline_mode** is absent, null, empty, or any value other than **rpm_package_checker**
- **THEN** the report SHALL NOT classify as RPM checker solely from this field predicate.
