# Invalid SPDX test fixtures

These SPDX documents trigger validation errors in `SpdxParsingService` (used by upload-spdx).

| File | Expected error |
|------|-----------------|
| `spdx-no-describeby.json` | No DESCRIBES relationship found in SPDX document |
| `spdx-describes-missing-package.json` | Product package not found: SPDXRef-Nonexistent-Product |
| `spdx-product-no-name.json` | Product name not found in DESCRIBES relationship package with SPDX ID: SPDXRef-Product-No-Name |
