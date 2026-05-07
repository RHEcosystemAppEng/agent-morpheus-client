// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import {
  Alert,
  AlertVariant,
  Content,
  ContentVariants,
  List,
  ListItem,
  Stack,
} from "@patternfly/react-core";
import { getSbomMetadataValidationIssueCopy } from "../constants/sbomMetadataValidationMessages";
import type { SbomValidationIssueEntry } from "../utils/errorHandling";

export interface RequestAnalysisSubmitErrorAlertsProps {
  sbomValidationIssues: SbomValidationIssueEntry[] | null;
  error: string | null;
}

const GENERIC_SUBMIT_ALERT_TITLE = "Error submitting analysis request";

/**
 * Inline danger alerts for request-analysis submit failures: structured SBOM metadata issues and/or generic API error.
 */
const RequestAnalysisSubmitErrorAlerts: React.FC<RequestAnalysisSubmitErrorAlertsProps> = ({
  sbomValidationIssues,
  error,
}) => {
  if (!sbomValidationIssues?.length && !error) {
    return null;
  }

  return (
    <Stack hasGutter style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}>
      {sbomValidationIssues?.map((issue, index) => {
        const copy = getSbomMetadataValidationIssueCopy(issue.code);
        const expectedLabels = issue.expectedLabels ?? [];
        return (
          <Alert
            key={`${issue.code}-${index}`}
            variant={AlertVariant.danger}
            title={copy.title}
            isInline
          >
            <Stack hasGutter>
              {copy.description ? (
                <Content>
                  <Content component={ContentVariants.p}>{copy.description}</Content>
                </Content>
              ) : null}
              {expectedLabels.length > 0 ? (
                <List component="ul">
                  {expectedLabels.map((label) => (
                    <ListItem key={label}>{label}</ListItem>
                  ))}
                </List>
              ) : null}
            </Stack>
          </Alert>
        );
      })}
      {error ? (
        <Alert variant={AlertVariant.danger} title={GENERIC_SUBMIT_ALERT_TITLE} isInline>
          {error}
        </Alert>
      ) : null}
    </Stack>
  );
};

export default RequestAnalysisSubmitErrorAlerts;
