// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import type { AnalysisRequestFormModeHandlers, AnalysisRequestMode } from "../../hooks/useAnalysisRequestForm";

export interface RequestAnalysisModeToggleProps {
  mode: AnalysisRequestMode;
  isSubmitting: boolean;
  handlers: AnalysisRequestFormModeHandlers;
}

const RequestAnalysisModeToggle: React.FC<RequestAnalysisModeToggleProps> = ({
  mode,
  isSubmitting,
  handlers,
}) => (
  <ToggleGroup aria-label="Input type" areAllGroupsDisabled={isSubmitting}>
    <ToggleGroupItem
      text="SBOM"
      buttonId="mode-sbom"
      isSelected={mode === "sbom"}
      onChange={() => handlers.changeMode("sbom")}
    />
    <ToggleGroupItem
      text="Single Repository"
      buttonId="mode-single-repository"
      isSelected={mode === "single-repository"}
      onChange={() => handlers.changeMode("single-repository")}
    />
    <ToggleGroupItem
      text="RPM"
      buttonId="mode-rpm"
      isSelected={mode === "rpm"}
      onChange={() => handlers.changeMode("rpm")}
    />
  </ToggleGroup>
);

export default RequestAnalysisModeToggle;
