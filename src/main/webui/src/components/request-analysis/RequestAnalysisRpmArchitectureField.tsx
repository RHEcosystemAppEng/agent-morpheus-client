// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import {
  FormGroup,
  FormSelect,
  FormSelectOption,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";
import type { RpmArchChoice } from "../../utils/requestAnalysisRpm";
import { RPM_ARCH_CHOICES } from "../../utils/requestAnalysisRpm";
import type { AnalysisRequestFormRpmArchHandlers } from "../../hooks/useAnalysisRequestForm";

export interface RequestAnalysisRpmArchitectureFieldProps {
  rpmArch: RpmArchChoice;
  rpmArchError: string | null;
  isSubmitting: boolean;
  handlers: AnalysisRequestFormRpmArchHandlers;
}

const RequestAnalysisRpmArchitectureField: React.FC<RequestAnalysisRpmArchitectureFieldProps> = ({
  rpmArch,
  rpmArchError,
  isSubmitting,
  handlers,
}) => (
  <FormGroup label="Architecture" isRequired fieldId="rpm-arch">
    <FormSelect
      id="rpm-arch"
      aria-label="RPM architecture"
      value={rpmArch}
      validated={rpmArchError ? "error" : "default"}
      isDisabled={isSubmitting}
      style={{ fontSize: "1rem" }}
      onChange={(event, value) => handlers.onRpmArchChange(event, value)}
    >
      {RPM_ARCH_CHOICES.map((choice) => (
        <FormSelectOption key={choice} value={choice} label={choice} />
      ))}
    </FormSelect>
    <FormHelperText>
      <HelperText>
        {rpmArchError && <HelperTextItem variant="error">{rpmArchError}</HelperTextItem>}
      </HelperText>
    </FormHelperText>
  </FormGroup>
);

export default RequestAnalysisRpmArchitectureField;
