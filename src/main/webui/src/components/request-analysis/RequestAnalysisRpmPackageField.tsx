// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import {
  FormGroup,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";
import type { AnalysisRequestFormRpmPackageHandlers } from "../../hooks/useAnalysisRequestForm";

/** Example N-V-R for placeholder — matches sibling spec narratives. */
const RPM_PACKAGE_NVR_PLACEHOLDER_EXAMPLE = "e.g. openssl-3.0.7-5.el9";

const RPM_PACKAGE_NVR_HELPER =
  "Use hyphens between the package name, version, and release (N-V-R).";

export interface RequestAnalysisRpmPackageFieldProps {
  rpmPackageNvr: string;
  rpmPackageNvrError: string | null;
  isSubmitting: boolean;
  handlers: AnalysisRequestFormRpmPackageHandlers;
}

const RequestAnalysisRpmPackageField: React.FC<RequestAnalysisRpmPackageFieldProps> = ({
  rpmPackageNvr,
  rpmPackageNvrError,
  isSubmitting,
  handlers,
}) => (
  <FormGroup label="Package N-V-R" isRequired fieldId="rpm-package-nvr">
    <TextInput
      isRequired
      type="text"
      id="rpm-package-nvr"
      name="rpm-package-nvr"
      value={rpmPackageNvr}
      onChange={(e, v) => handlers.onTextChange("rpmPackageNvr", e, v)}
      onBlur={() => handlers.onTextBlur("rpmPackageNvr")}
      onKeyDown={(e) => handlers.onTextKeyDown("rpmPackageNvr", e)}
      isDisabled={isSubmitting}
      validated={rpmPackageNvrError ? "error" : "default"}
      placeholder={RPM_PACKAGE_NVR_PLACEHOLDER_EXAMPLE}
      style={{ fontSize: "1rem" }}
    />
    <FormHelperText>
      <HelperText>
        <HelperTextItem>{RPM_PACKAGE_NVR_HELPER}</HelperTextItem>
        {rpmPackageNvrError && (
          <HelperTextItem variant="error">{rpmPackageNvrError}</HelperTextItem>
        )}
      </HelperText>
    </FormHelperText>
  </FormGroup>
);

export default RequestAnalysisRpmPackageField;
