/**
 * Builds a ReportRequest payload for the POST /api/v1/reports/new API (single-repository mode).
 * Keeps request construction out of the modal component.
 */

import type { ReportRequest } from "../generated-client/models/ReportRequest";
import type { InlineCredential } from "../generated-client/models/InlineCredential";

export interface SingleRepoFormInputs {
  cveId: string;
  sourceRepo: string;
  commitId: string;
  metadata?: Record<string, string>;
  credential?: {
    secretValue: string;
    userName?: string;
  };
}

/**
 * Builds a ReportRequest for single-repository analysis (analysisType "source").
 * Used when the user selects "Single Repository" in the request analysis modal.
 */
export function buildReportRequestForSingleRepo(
  inputs: SingleRepoFormInputs
): ReportRequest {
  const { cveId, sourceRepo, commitId, metadata = {}, credential } = inputs;

  const credentialPayload: InlineCredential | undefined =
    credential?.secretValue?.trim()
      ? {
          secretValue: credential.secretValue.trim(),
          ...(credential.userName?.trim()
            ? { userName: credential.userName.trim() }
            : {}),
        }
      : undefined;

  return {
    analysisType: "source",
    vulnerabilities: [cveId.trim().toUpperCase()],
    metadata,
    sourceRepo: sourceRepo.trim(),
    commitId: commitId.trim(),
    ...(credentialPayload ? { credential: credentialPayload } : {}),
  };
}
