# reports-input-type Specification

## Purpose
TBD - created by archiving change reports-filter-by-artifact-kind. Update Purpose after archive.
## Requirements
### Requirement: inputType on GET /api/v1/reports

**`GET /api/v1/reports`** SHALL support an optional **`inputType`** query parameter with allowed values **`repository`** and **`rpm`** only. **`GET /api/v1/reports/product`** MUST NOT gain **`inputType`** or any parallel parameter as part of this capability.

When **`inputType`** is **omitted**, the server MUST NOT apply **`inputType`**-based filtering (result set follows paging, sorting, and all other query parameters only, with **no** restriction on **`metadata.product_id`** or pipeline mode from **`inputType`**).

When **`inputType`** is **`repository`** or **`rpm`**, every returned report SHALL have **`metadata.product_id`** absent (reports with a product id MUST be excluded). Additionally: **`inputType=repository`** SHALL return only reports whose **`input.image.pipeline_mode`** is **not** **`rpm_package_checker`**; **`inputType=rpm`** SHALL return only reports whose **`input.image.pipeline_mode`** **is** **`rpm_package_checker`**.

Any other **`inputType`** value SHALL be rejected with **HTTP 400** and a documented error.

Legacy **`withoutProduct`** and tab-only use of **`pipelineMode`** to distinguish RPM vs repository listings on **`GET /api/v1/reports`** SHALL be removed in favor of **`inputType`**.

#### Scenario: Omit inputType does not filter by product or pipeline

- **WHEN** a client calls **`GET /api/v1/reports`** without an **`inputType`** query parameter
- **THEN** the response MUST NOT be restricted by **`inputType`** rules (product-associated and standalone reports MAY both appear, subject to other filters)

#### Scenario: Repository excludes product_id and RPM checker

- **WHEN** a client calls **`GET /api/v1/reports`** with **`inputType=repository`**
- **THEN** every returned report SHALL have **`metadata.product_id`** absent
- **AND** **`input.image.pipeline_mode`** SHALL NOT be **`rpm_package_checker`**

#### Scenario: RPM excludes product_id and requires checker pipeline

- **WHEN** a client calls **`GET /api/v1/reports`** with **`inputType=rpm`**
- **THEN** every returned report SHALL have **`metadata.product_id`** absent
- **AND** **`input.image.pipeline_mode`** SHALL be **`rpm_package_checker`**

#### Scenario: Invalid inputType

- **WHEN** a client calls **`GET /api/v1/reports`** with **`inputType`** set to a value other than **`repository`** or **`rpm`**
- **THEN** the server responds with **HTTP 400**

