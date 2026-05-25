// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Form,
  Button,
} from "@patternfly/react-core";
import { useAnalysisRequestForm } from "../../hooks/useAnalysisRequestForm";
import RequestAnalysisSubmitErrorAlerts from "./RequestAnalysisSubmitErrorAlerts";
import RequestAnalysisModeToggle from "./RequestAnalysisModeToggle";
import RequestAnalysisCveIdField from "./RequestAnalysisCveIdField";
import RequestAnalysisSbomFileField from "./RequestAnalysisSbomFileField";
import RequestAnalysisSingleRepositoryFields from "./RequestAnalysisSingleRepositoryFields";
import RequestAnalysisPrivateRepositorySection from "./RequestAnalysisPrivateRepositorySection";
import RequestAnalysisRpmPackageField from "./RequestAnalysisRpmPackageField";
import RequestAnalysisRpmArchitectureField from "./RequestAnalysisRpmArchitectureField";

export type { AnalysisRequestMode } from "../../hooks/useAnalysisRequestForm";

interface RequestAnalysisModalProps {
  onClose: () => void;
}

/**
 * Request Analysis modal shell: composes form hook and tab/body subcomponents.
 */
const RequestAnalysisModal: React.FC<RequestAnalysisModalProps> = ({ onClose }) => {
  const { values, errors, state, handlers } = useAnalysisRequestForm({ onClose });

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={true}
      onClose={state.isSubmitting ? undefined : onClose}
      aria-labelledby="request-analysis-modal-title"
      aria-describedby="request-analysis-modal-description"
    >
      <ModalHeader title="Request Analysis" labelId="request-analysis-modal-title" />
      <ModalBody>
        <RequestAnalysisSubmitErrorAlerts
          sbomValidationIssues={errors.sbomValidationIssues}
          error={errors.error}
        />
        <Form>
          <RequestAnalysisModeToggle
            mode={values.mode}
            isSubmitting={state.isSubmitting}
            handlers={handlers}
          />
          <RequestAnalysisCveIdField
            cveId={values.cveId}
            cveIdError={errors.cveId}
            isSubmitting={state.isSubmitting}
            handlers={handlers}
          />
          {values.mode === "sbom" && (
            <RequestAnalysisSbomFileField
              fileValue={values.fileValue}
              filename={values.filename}
              fileError={errors.file}
              isSubmitting={state.isSubmitting}
              handlers={handlers}
            />
          )}
          {values.mode === "single-repository" && (
            <RequestAnalysisSingleRepositoryFields
              sourceRepo={values.sourceRepo}
              sourceRepoError={errors.sourceRepo}
              commitId={values.commitId}
              commitIdError={errors.commitId}
              isSubmitting={state.isSubmitting}
              handlers={handlers}
            />
          )}
          {values.mode === "rpm" && (
            <>
              <RequestAnalysisRpmPackageField
                rpmPackageNvr={values.rpmPackageNvr}
                rpmPackageNvrError={errors.rpmPackageNvr}
                isSubmitting={state.isSubmitting}
                handlers={handlers}
              />
              <RequestAnalysisRpmArchitectureField
                rpmArch={values.rpmArch}
                rpmArchError={errors.rpmArch}
                isSubmitting={state.isSubmitting}
                handlers={handlers}
              />
            </>
          )}
          {values.mode !== "rpm" && (
            <RequestAnalysisPrivateRepositorySection
              isAuthenticationSecretChecked={values.isAuthenticationSecretChecked}
              authenticationSecret={values.authenticationSecret}
              authenticationSecretError={errors.authenticationSecret}
              username={values.username}
              usernameError={errors.username}
              isSubmitting={state.isSubmitting}
              handlers={handlers}
            />
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="submit"
          variant="primary"
          onClick={handlers.submit}
          isDisabled={state.submitDisabled}
          isLoading={state.isSubmitting}
        >
          {state.isSubmitting ? "Submitting..." : "Submit Analysis Request"}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RequestAnalysisModal;
