// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useCallback, useMemo } from "react";
import type { DropEvent } from "@patternfly/react-core";
import { useNavigate } from "react-router";
import { ReportEndpointService } from "../generated-client/services/ReportEndpointService";
import { ReportRequest } from "../generated-client";
import type { ReportData } from "../generated-client/models/ReportData";
import { InlineCredential } from "../generated-client/models/InlineCredential";
import { parseRequestAnalysisSubmissionError } from "../utils/errorHandling";
import type { SbomValidationIssueEntry } from "../utils/errorHandling";
import {
  validateCveIdFormat,
  validateSourceRepoUrl,
  detectCredentialType,
} from "../utils/requestAnalysisValidation";
import {
  parseTrimmedRpmNvr,
  validateRpmPackageNvrBlur,
  RPM_PACKAGE_NVR_FORMAT_ERROR_MESSAGE,
  DEFAULT_RPM_ARCH,
  isRpmArchChoice,
  type RpmArchChoice,
} from "../utils/requestAnalysisRpm";
import {
  detectSbomFormat,
  SbomFormat,
  unsupportedSbomFormatMessage,
} from "../utils/requestAnalysisSbom";
import { buildSbomFormData, uploadSbomFile } from "../utils/requestAnalysisSubmit";

const FALLBACK_ERROR_MESSAGE = "An error occurred while submitting the analysis request.";

const VALIDATION_MESSAGE_REQUIRED = "Required";
const VALIDATION_MESSAGE_USERNAME_REQUIRED_FOR_PAT =
  "Username is required for Personal Access Token authentication";
const VALIDATION_MESSAGE_SBOM_FORMAT_DETECT_UNKNOWN =
  "An unknown error occurred while detecting the SBOM format";

export type AnalysisRequestMode = "sbom" | "single-repository" | "rpm";

export interface AnalysisRequestFormValues {
  mode: AnalysisRequestMode;
  cveId: string;
  fileValue: string;
  filename: string;
  sourceRepo: string;
  commitId: string;
  rpmPackageNvr: string;
  rpmArch: RpmArchChoice;
  isAuthenticationSecretChecked: boolean;
  authenticationSecret: string;
  username: string;
}

/** Stored inputs plus file reference used for SBOM submit (not exposed on the hook return surface). */
export interface AnalysisRequestStoredValues extends AnalysisRequestFormValues {
  selectedFile: File | null;
}

/**
 * Text inputs controlled via `handlers.onTextChange` / `onTextBlur` / `onTextKeyDown`.
 * Blur/`applyTextBlurValidation`: `commitId` no-ops (validated on submit only).
 */
export type AnalysisRequestFormTextField = keyof Pick<
  AnalysisRequestStoredValues,
  "cveId" | "sourceRepo" | "commitId" | "rpmPackageNvr" | "authenticationSecret" | "username"
>;

export interface AnalysisRequestFormErrors {
  cveId: string | null;
  /** SBOM upload / server field `file`; not `fileValue` / `filename` on values. */
  file: string | null;
  sourceRepo: string | null;
  commitId: string | null;
  rpmPackageNvr: string | null;
  rpmArch: string | null;
  authenticationSecret: string | null;
  username: string | null;
  error: string | null;
  sbomValidationIssues: SbomValidationIssueEntry[] | null;
}

function combineRpmCoordinateFieldErrors(fieldErrors: Record<string, string>): string | null {
  const msgs = ["name", "version", "release"]
    .map((k) => fieldErrors[k])
    .filter((m): m is string => typeof m === "string" && m.trim() !== "");
  if (msgs.length === 0) {
    return null;
  }
  return msgs.join(" ");
}

function createInitialFormErrors(): AnalysisRequestFormErrors {
  return {
    cveId: null,
    file: null,
    sourceRepo: null,
    commitId: null,
    rpmPackageNvr: null,
    rpmArch: null,
    authenticationSecret: null,
    username: null,
    error: null,
    sbomValidationIssues: null,
  };
}

const CLEARED_SUBMISSION_ERRORS: AnalysisRequestFormErrors = createInitialFormErrors();

function createInitialStoredValues(): AnalysisRequestStoredValues {
  return {
    mode: "sbom",
    cveId: "",
    fileValue: "",
    filename: "",
    selectedFile: null,
    sourceRepo: "",
    commitId: "",
    rpmPackageNvr: "",
    rpmArch: DEFAULT_RPM_ARCH,
    isAuthenticationSecretChecked: false,
    authenticationSecret: "",
    username: "",
  };
}

function getClientValidationErrors(s: AnalysisRequestStoredValues): Partial<AnalysisRequestFormErrors> | null {
  const errors: Partial<AnalysisRequestFormErrors> = {};
  const trimmedCveId = s.cveId.trim();
  if (trimmedCveId === "") {
    errors.cveId = VALIDATION_MESSAGE_REQUIRED;
  } else {
    const formatError = validateCveIdFormat(trimmedCveId);
    if (formatError) {
      errors.cveId = formatError;
    }
  }

  if (s.mode === "sbom") {
    if (!s.selectedFile || !s.filename || s.filename === "") {
      errors.file = VALIDATION_MESSAGE_REQUIRED;
    }
  } else if (s.mode === "single-repository") {
    const trimmedSourceRepo = s.sourceRepo.trim();
    if (trimmedSourceRepo === "") {
      errors.sourceRepo = VALIDATION_MESSAGE_REQUIRED;
    } else {
      const urlError = validateSourceRepoUrl(trimmedSourceRepo);
      if (urlError) {
        errors.sourceRepo = urlError;
      }
    }
    if (s.commitId.trim() === "") {
      errors.commitId = VALIDATION_MESSAGE_REQUIRED;
    }
  } else if (s.mode === "rpm") {
    const pkg = s.rpmPackageNvr.trim();
    if (pkg === "") {
      errors.rpmPackageNvr = VALIDATION_MESSAGE_REQUIRED;
    } else if (!parseTrimmedRpmNvr(pkg)) {
      errors.rpmPackageNvr = RPM_PACKAGE_NVR_FORMAT_ERROR_MESSAGE;
    }
  }

  if (s.mode !== "rpm" && s.isAuthenticationSecretChecked) {
    const trimmedSecret = s.authenticationSecret.trim();
    if (trimmedSecret === "") {
      errors.authenticationSecret = VALIDATION_MESSAGE_REQUIRED;
    } else {
      const credentialType = detectCredentialType(trimmedSecret);
      if (credentialType === "PAT") {
        const trimmedUsername = s.username.trim();
        if (trimmedUsername === "") {
          errors.username = VALIDATION_MESSAGE_USERNAME_REQUIRED_FOR_PAT;
        }
      }
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

function getCredentialForSubmit(s: AnalysisRequestStoredValues): InlineCredential | undefined {
  if (!s.isAuthenticationSecretChecked || !s.authenticationSecret.trim()) {
    return undefined;
  }
  const secretValue = s.authenticationSecret.trim();
  const credentialType = detectCredentialType(secretValue);
  return {
    secretValue,
    ...(credentialType === "PAT" && s.username.trim() !== ""
      ? { userName: s.username.trim() }
      : {}),
  };
}

export interface UseAnalysisRequestFormOptions {
  onClose: () => void;
}

export interface AnalysisRequestFormStateSlice {
  isSubmitting: boolean;
  submitDisabled: boolean;
}

export interface AnalysisRequestFormHandlers {
  changeMode: (newMode: AnalysisRequestMode) => void;
  onTextChange: (
    field: AnalysisRequestFormTextField,
    event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => void;
  onTextBlur: (field: AnalysisRequestFormTextField) => void;
  onTextKeyDown: (
    field: AnalysisRequestFormTextField,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => void;
  onRpmArchChange: (event: React.FormEvent<HTMLSelectElement>, value: string) => void;
  onPrivateRepoSwitch: (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => void;
  onFileInputChange: (_event: DropEvent, file: File) => void;
  onClearFile: (_event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  submit: () => Promise<void>;
}

/** Handlers used by CVE id field leaf. */
export type AnalysisRequestFormCveHandlers = Pick<
  AnalysisRequestFormHandlers,
  "onTextChange" | "onTextBlur" | "onTextKeyDown"
>;

/** Handlers used by single-repository text fields leaf. */
export type AnalysisRequestFormRepositoryTextHandlers = Pick<
  AnalysisRequestFormHandlers,
  "onTextChange" | "onTextBlur" | "onTextKeyDown"
>;

/** RPM package NVR leaf (blur/Enter parity with CVE). */
export type AnalysisRequestFormRpmPackageHandlers = Pick<
  AnalysisRequestFormHandlers,
  "onTextChange" | "onTextBlur" | "onTextKeyDown"
>;

/** Handlers used by private repo credential section leaf. */
export type AnalysisRequestFormPrivateRepoHandlers = Pick<
  AnalysisRequestFormHandlers,
  "onTextChange" | "onTextBlur" | "onTextKeyDown" | "onPrivateRepoSwitch"
>;

/** Handlers used by SBOM file upload leaf. */
export type AnalysisRequestFormFileHandlers = Pick<
  AnalysisRequestFormHandlers,
  "onFileInputChange" | "onClearFile"
>;

/** Handlers used by analysis mode toggle leaf. */
export type AnalysisRequestFormModeHandlers = Pick<AnalysisRequestFormHandlers, "changeMode">;

/** Handlers for RPM architecture `FormSelect`. */
export type AnalysisRequestFormRpmArchHandlers = Pick<AnalysisRequestFormHandlers, "onRpmArchChange">;

export interface UseAnalysisRequestFormResult {
  values: AnalysisRequestFormValues;
  state: AnalysisRequestFormStateSlice;
  errors: AnalysisRequestFormErrors;
  handlers: AnalysisRequestFormHandlers;
}

export function useAnalysisRequestForm({
  onClose,
}: UseAnalysisRequestFormOptions): UseAnalysisRequestFormResult {
  const navigate = useNavigate();

  const [values, setValues] = useState<AnalysisRequestStoredValues>(createInitialStoredValues);
  const [errors, setErrors] = useState(createInitialFormErrors);
  const [state, setState] = useState<{ isSubmitting: boolean }>({
    isSubmitting: false,
  });

  const changeMode = useCallback((newMode: AnalysisRequestMode) => {
    setErrors((prev) => ({
      ...prev,
      ...CLEARED_SUBMISSION_ERRORS,
      cveId: prev.cveId,
    }));
    setValues((prev) => {
      const nextMode = newMode;
      if (nextMode === "rpm" || prev.mode === "rpm") {
        return {
          ...prev,
          mode: nextMode,
          rpmPackageNvr: "",
          rpmArch: DEFAULT_RPM_ARCH,
        };
      }
      return { ...prev, mode: nextMode };
    });
  }, []);

  const handleSubmitError = useCallback((err: unknown): void => {
    const { fieldErrors, genericMessage, sbomValidationIssues: issues } =
      parseRequestAnalysisSubmissionError(err, FALLBACK_ERROR_MESSAGE);
    const rpmCombined = combineRpmCoordinateFieldErrors(fieldErrors);
    setErrors((prev) => ({
      ...prev,
      cveId: fieldErrors.cveId ?? null,
      file: fieldErrors.file ?? null,
      sourceRepo: fieldErrors.sourceRepo ?? null,
      commitId: fieldErrors.commitId ?? null,
      rpmPackageNvr: rpmCombined ?? null,
      rpmArch: fieldErrors.arch ?? null,
      sbomValidationIssues: issues && issues.length > 0 ? issues : null,
      error: genericMessage,
    }));
  }, []);

  const flushCveIdFormatValidation = useCallback(() => {
    setValues((v) => {
      const trimmedCveId = v.cveId.trim();
      if (trimmedCveId !== "") {
        const cveErr = validateCveIdFormat(trimmedCveId);
        setErrors((e) => ({ ...e, cveId: cveErr }));
      }
      return v;
    });
  }, []);

  const onTextChange = useCallback(
    (field: AnalysisRequestFormTextField, _event: React.FormEvent<HTMLInputElement>, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
    },
    []
  );

  const onRpmArchChange = useCallback(
    (_event: React.FormEvent<HTMLSelectElement>, value: string) => {
      if (!isRpmArchChoice(value)) {
        return;
      }
      setValues((prev) => ({ ...prev, rpmArch: value }));
      setErrors((prev) => (prev.rpmArch ? { ...prev, rpmArch: null } : prev));
    },
    []
  );

  const applyTextBlurValidation = useCallback(
    (field: AnalysisRequestFormTextField) => {
      switch (field) {
        case "commitId":
          break;
        case "cveId":
          flushCveIdFormatValidation();
          break;
        case "sourceRepo":
          setValues((v) => {
            if (v.sourceRepo.trim() !== "") {
              setErrors((e) => ({
                ...e,
                sourceRepo: validateSourceRepoUrl(v.sourceRepo),
              }));
            }
            return v;
          });
          break;
        case "authenticationSecret":
          setValues((v) => {
            const trimmedSecret = v.authenticationSecret.trim();
            if (v.isAuthenticationSecretChecked && trimmedSecret === "") {
              setErrors((e) => ({
                ...e,
                authenticationSecret: VALIDATION_MESSAGE_REQUIRED,
              }));
            }
            return v;
          });
          break;
        case "username":
          setValues((v) => {
            const credentialType = detectCredentialType(v.authenticationSecret);
            if (credentialType === "PAT" && v.username.trim() === "") {
              setErrors((e) => ({
                ...e,
                username: VALIDATION_MESSAGE_USERNAME_REQUIRED_FOR_PAT,
              }));
            }
            return v;
          });
          break;
        case "rpmPackageNvr":
          setValues((v) => {
            const err = validateRpmPackageNvrBlur(v.rpmPackageNvr);
            setErrors((e) => ({ ...e, rpmPackageNvr: err }));
            return v;
          });
          break;
      }
    },
    [flushCveIdFormatValidation]
  );

  const onTextBlur = useCallback(
    (field: AnalysisRequestFormTextField) => {
      applyTextBlurValidation(field);
    },
    [applyTextBlurValidation]
  );

  const onTextKeyDown = useCallback(
    (field: AnalysisRequestFormTextField, event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      applyTextBlurValidation(field);
    },
    [applyTextBlurValidation]
  );

  const onPrivateRepoSwitch = useCallback(
    (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
      if (!checked) {
        setValues((prev) => ({
          ...prev,
          isAuthenticationSecretChecked: false,
          authenticationSecret: "",
          username: "",
        }));
        setErrors((prev) => ({
          ...prev,
          authenticationSecret: null,
          username: null,
        }));
      } else {
        setValues((prev) => ({ ...prev, isAuthenticationSecretChecked: true }));
      }
    },
    []
  );

  const onFileInputChange = useCallback((_event: DropEvent, file: File) => {
    setValues((prev) => ({
      ...prev,
      filename: file.name,
      fileValue: file.name,
      selectedFile: file,
    }));
    setErrors((prev) => (prev.file ? { ...prev, file: null } : prev));
  }, []);

  const onClearFile = useCallback((_event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setValues((prev) => ({
      ...prev,
      filename: "",
      fileValue: "",
      selectedFile: null,
    }));
    setErrors((prev) => (prev.file ? { ...prev, file: null } : prev));
  }, []);

  const submit = useCallback(async () => {
    const validationErrors = getClientValidationErrors(values);
    if (validationErrors) {
      setErrors((prev) => ({ ...prev, ...CLEARED_SUBMISSION_ERRORS, ...validationErrors }));
      return;
    }
    setErrors((prev) => ({ ...prev, ...CLEARED_SUBMISSION_ERRORS }));

    const trimmedCveId = values.cveId.trim();

    if (values.mode === "single-repository") {
      setState({ isSubmitting: true });
      try {
        const credential = getCredentialForSubmit(values);
        const requestBody: ReportRequest = {
          analysisType: "source",
          vulnerabilities: [trimmedCveId],
          metadata: {},
          sourceRepo: values.sourceRepo.trim(),
          commitId: values.commitId.trim(),
          credential,
        };
        const response: ReportData = await ReportEndpointService.postApiV1ReportsNew({
          requestBody,
          submit: true,
        });
        const reportId = response.reportRequestId.reportId;
        navigate(`/reports/component/${trimmedCveId}/${reportId}`);
        onClose();
      } catch (err: unknown) {
        handleSubmitError(err);
      } finally {
        setState({ isSubmitting: false });
      }
      return;
    }

    if (values.mode === "rpm") {
      setState({ isSubmitting: true });
      try {
        const trimmedPkg = values.rpmPackageNvr.trim();
        const coords = parseTrimmedRpmNvr(trimmedPkg);
        if (!coords) {
          setErrors((prev) => ({
            ...prev,
            rpmPackageNvr: RPM_PACKAGE_NVR_FORMAT_ERROR_MESSAGE,
          }));
          return;
        }
        const response: ReportData = await ReportEndpointService.postApiV1ReportsNewRpmReport({
          requestBody: {
            name: coords.name,
            version: coords.version,
            release: coords.release,
            arch: values.rpmArch,
            cveId: trimmedCveId,
          },
        });
        const reportId = response.reportRequestId.reportId;
        navigate(`/reports/component/${trimmedCveId}/${reportId}`);
        onClose();
      } catch (err: unknown) {
        handleSubmitError(err);
      } finally {
        setState({ isSubmitting: false });
      }
      return;
    }

    setState({ isSubmitting: true });
    try {
      const file = values.selectedFile;
      if (!file) {
        setErrors((prev) => ({ ...prev, file: VALIDATION_MESSAGE_REQUIRED }));
        setState({ isSubmitting: false });
        return;
      }

      let sbomFormat: SbomFormat | null = null;
      try {
        sbomFormat = await detectSbomFormat(file);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrors((prev) => ({ ...prev, file: err.message }));
        } else {
          setErrors((prev) => ({
            ...prev,
            file: VALIDATION_MESSAGE_SBOM_FORMAT_DETECT_UNKNOWN,
          }));
          console.error(err);
        }
        setState({ isSubmitting: false });
        return;
      }
      if (!sbomFormat) {
        setErrors((prev) => ({ ...prev, file: unsupportedSbomFormatMessage() }));
        setState({ isSubmitting: false });
        return;
      }

      const formData = buildSbomFormData(
        trimmedCveId,
        file,
        values.isAuthenticationSecretChecked,
        values.authenticationSecret,
        values.username
      );
      await uploadSbomFile(trimmedCveId, sbomFormat, formData, navigate, onClose);
    } catch (err: unknown) {
      handleSubmitError(err);
    } finally {
      setState({ isSubmitting: false });
    }
  }, [values, navigate, onClose, handleSubmitError]);

  const submitDisabled =
    state.isSubmitting ||
    (values.mode !== "rpm" &&
      values.isAuthenticationSecretChecked &&
      values.authenticationSecret.trim() === "");

  const { selectedFile: _selectedFile, ...exportedValues } = values;

  const handlers = useMemo(
    (): AnalysisRequestFormHandlers => ({
      changeMode,
      onTextChange,
      onTextBlur,
      onTextKeyDown,
      onRpmArchChange,
      onPrivateRepoSwitch,
      onFileInputChange,
      onClearFile,
      submit,
    }),
    [
      changeMode,
      onTextChange,
      onTextBlur,
      onTextKeyDown,
      onRpmArchChange,
      onPrivateRepoSwitch,
      onFileInputChange,
      onClearFile,
      submit,
    ]
  );

  return {
    values: exportedValues,
    state: {
      isSubmitting: state.isSubmitting,
      submitDisabled,
    },
    errors,
    handlers,
  };
}

