// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Copy for CycloneDX image SBOM metadata validation (codes must match backend SbomValidationIssueCode).
 */
export const SBOM_METADATA_VALIDATION_ISSUES = {
  MISSING_SOURCE_CODE_URL: {
    title: "Invalid SBOM: Missing source code URL",
    description:
      "Your SBOM must include a source code URL. Ensure one of the following labels is present in your metadata:",
    labels: [
      "io.openshift.build.source-location",
      "upstream-source-url",
      "org.opencontainers.image.source",
      "repo_url",
    ],
  },
  MISSING_SOURCE_COMMIT_ID: {
    title: "Invalid SBOM: Missing source code commit ID",
    description:
      "Your SBOM must include a source code commit ID. Ensure one of the following labels is present in your metadata:",
    labels: [
      "image.source.commit-id",
      "io.openshift.build.commit.id",
      "upstream-source-ref",
      "org.opencontainers.image.revision",
    ],
  },
} as const;

export type SbomMetadataValidationIssueCode = keyof typeof SBOM_METADATA_VALIDATION_ISSUES;

export function getSbomMetadataValidationIssueCopy(code: string): {
  title: string;
  description: string;
  labels: readonly string[];
} {
  if (code in SBOM_METADATA_VALIDATION_ISSUES) {
    return SBOM_METADATA_VALIDATION_ISSUES[code as SbomMetadataValidationIssueCode];
  }
  return {
    title: "Invalid SBOM",
    description: "The SBOM could not be validated. Please review your file and try again.",
    labels: [],
  };
}
