import React, { useState, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  FileUpload,
  DropEvent,
  Button,
  Alert,
  AlertVariant,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Switch,
  Label,
  Popover,
  FormGroupLabelHelp,
  Card,
  CardBody,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import { KeyIcon, SecurityIcon } from "@patternfly/react-icons";
import { useNavigate } from "react-router";
import { ProductEndpointService } from "../generated-client/services/ProductEndpointService";
import { ReportEndpointService } from "../generated-client/services/ReportEndpointService";
import type { ReportData } from "../generated-client/models/ReportData";
import { parseRequestAnalysisSubmissionError } from "../utils/errorHandling";
import { InlineCredential } from "../generated-client/models/InlineCredential";
import { ReportRequest } from "../generated-client";

const FALLBACK_ERROR_MESSAGE = "An error occurred while submitting the analysis request.";
// CVE ID pattern matching backend validation: ^CVE-[0-9]{4}-[0-9]{4,19}$
const CVE_ID_PATTERN = /^CVE-[0-9]{4}-[0-9]{4,19}$/;
// Repository URL: HTTP/HTTPS only (git: and git@ are not accepted)
const REPO_URL_HTTP_HTTPS = /^https?:\/\/.+/;

export type RequestAnalysisMode = "sbom" | "single-repository";

// SBOM format constants
const SPDX_VERSION = "2.3" as const;
const CYCLONEDX_VERSION = "1.6" as const;

// SBOM format enum
enum SbomFormat {
  SPDX = "SPDX",
  CycloneDX = "CycloneDX",
}

interface RequestAnalysisModalProps {
  onClose: () => void;
}

/**
 * RequestAnalysisModal component - displays modal for requesting analysis
 */
const RequestAnalysisModal: React.FC<RequestAnalysisModalProps> = ({
  onClose,
}) => {
  const navigate = useNavigate();
  const labelHelpRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<RequestAnalysisMode>("sbom");
  const [cveId, setCveId] = useState("");
  const [fileValue, setFileValue] = useState("");
  const [filename, setFilename] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceRepo, setSourceRepo] = useState("");
  const [commitId, setCommitId] = useState("");
  const [sourceRepoError, setSourceRepoError] = useState<string | null>(null);
  const [commitIdError, setCommitIdError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cveIdError, setCveIdError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAuthenticationSecretChecked, setIsAuthenticationSecretChecked] = useState(false);
  const [authenticationSecret, setAuthenticationSecret] = useState("");
  const [authenticationSecretError, setAuthenticationSecretError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  /**
   * Validates CVE ID format using the official CVE regex pattern
   * @param cveId CVE ID to validate
   * @returns Error message if invalid, null if valid
   */
  const validateCveIdFormat = (cveId: string): string | null => {
    if (!cveId || cveId.trim() === "") {
      return null; // Empty validation handled separately as "Required"
    }
    if (!CVE_ID_PATTERN.test(cveId.trim())) {
      return "CVE ID format is invalid. Must match the official CVE pattern CVE-YYYY-NNNN+";
    }
    return null;
  };

  /**
   * Validates Source Repository URL format (HTTP/HTTPS only; git: and git@ are rejected).
   * @returns Error message if invalid, null if valid or empty (empty handled as "Required")
   */
  const validateSourceRepoUrl = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    if (!REPO_URL_HTTP_HTTPS.test(trimmed)) {
      return "Source Repository must be a valid HTTP or HTTPS URL (e.g. https://github.com/org/repo)";
    }
    try {
      new URL(trimmed);
      return null;
    } catch {
      return "Source Repository must be a valid HTTP or HTTPS URL (e.g. https://github.com/org/repo)";
    }
  };

  const handleModeChange = (newMode: RequestAnalysisMode) => {
    setError(null);
    setFileError(null);
    setSourceRepoError(null);
    setCommitIdError(null);
    setAuthenticationSecretError(null);
    setUsernameError(null);
    setMode(newMode);
  };

  /**
   * Auto-detects credential type based on content.
   * Matches backend logic in InlineCredential.detectType()
   * @param secret Secret value to analyze
   * @returns "SSH_KEY" | "PAT" | null
   */
  const detectCredentialType = (secret: string): "SSH_KEY" | "PAT" | null => {
    if (!secret || secret.trim() === "") {
      return null;
    }
    // SSH key detection: starts with "-----BEGIN" and contains "-----END"
    if (secret.startsWith("-----BEGIN") && secret.includes("-----END")) {
      return "SSH_KEY";
    }
    return "PAT";
  };

  /** Optional credential for submit (private repo on + secret present); includes userName only for PAT. */
  const getCredentialForSubmit = (): InlineCredential | undefined => {
    if (!isAuthenticationSecretChecked || !authenticationSecret.trim()) {
      return undefined;
    }
    const secretValue = authenticationSecret.trim();
    const credentialType = detectCredentialType(authenticationSecret);
    return {
      secretValue,
      ...(credentialType === "PAT" && username.trim() !== ""
        ? { userName: username.trim() }
        : {}),
    };
  };

  /**
   * Detects SBOM format by parsing the file content
   * @param file The file to check
   * @returns SbomFormat if recognized, null if valid JSON but unsupported format
   * @throws Error if file is not valid JSON
   */
  const detectSbomFormat = async (file: File): Promise<SbomFormat | null> => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      // Check for SPDX format
      if (json.SPDXID && json.spdxVersion === `SPDX-${SPDX_VERSION}`) {
        return SbomFormat.SPDX;
      }
      // Check for CycloneDX format
      if (json.bomFormat === SbomFormat.CycloneDX && json.specVersion === CYCLONEDX_VERSION) {
        return SbomFormat.CycloneDX;
      }
      return null;
    } catch {
      throw new Error("File is not valid JSON");
    }
  };
  const handleCveIdChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setCveId(value);
    // Clear error when user modifies the field
    if (cveIdError) {
      setCveIdError(null);
    }
  };

  const handleCveIdBlur = () => {
    const trimmedCveId = cveId.trim();
    if (trimmedCveId !== "") {
      const formatError = validateCveIdFormat(trimmedCveId);
      setCveIdError(formatError);
    }
  };

  const handleCveIdKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission on Enter
      const trimmedCveId = cveId.trim();
      if (trimmedCveId !== "") {
        const formatError = validateCveIdFormat(trimmedCveId);
        setCveIdError(formatError);
      }
    }
  };

  const handlePrivateRepoSwitchChange = (
    _event: React.FormEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setIsAuthenticationSecretChecked(checked);
    if (!checked) {
      setAuthenticationSecret("");
      setAuthenticationSecretError(null);
      setUsername("");
      setUsernameError(null);
    }
  };

  const handleAuthenticationSecretChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setAuthenticationSecret(value);
    if (authenticationSecretError) {
      setAuthenticationSecretError(null);
    }
  };

  const handleAuthenticationSecretBlur = () => {
    const trimmedSecret = authenticationSecret.trim();
    if (isAuthenticationSecretChecked && trimmedSecret === "") {
      setAuthenticationSecretError("Required");
    }
  };

  const handleUsernameChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setUsername(value);
    if (usernameError) {
      setUsernameError(null);
    }
  };

  const handleUsernameBlur = () => {
    const credentialType = detectCredentialType(authenticationSecret);
    const trimmedUsername = username.trim();
    if (credentialType === "PAT" && trimmedUsername === "") {
      setUsernameError("Username is required for Personal Access Token authentication");
    }
  };

  /**
   * Handles errors from the API submission using the shared error parsing utility.
   * Sets field-level and generic error state without API-specific logic in the component.
   */
  const handleSubmitError = (err: unknown): void => {
    const { fieldErrors, genericMessage } = parseRequestAnalysisSubmissionError(
      err,
      FALLBACK_ERROR_MESSAGE
    );
    setCveIdError(fieldErrors.cveId ?? null);
    setFileError(fieldErrors.file ?? null);
    setSourceRepoError(fieldErrors.sourceRepo ?? null);
    setCommitIdError(fieldErrors.commitId ?? null);
    setError(genericMessage);
  };

  /**
   * Clears all form error states
   */
  const clearAllErrors = () => {
    setError(null);
    setCveIdError(null);
    setFileError(null);
    setSourceRepoError(null);
    setCommitIdError(null);
    setAuthenticationSecretError(null);
    setUsernameError(null);
  };
    
  const createFormData = (cveId: string, file: File) => {
    const formData: { cveId: string; file: File; secretValue?: string; userName?: string } = {
      cveId: cveId,
      file: file,
    };
    if (isAuthenticationSecretChecked && authenticationSecret.trim() !== "") {
      formData.secretValue = authenticationSecret.trim();
      const credentialType = detectCredentialType(authenticationSecret);
      if (credentialType === "PAT" && username.trim() !== "") {
        formData.userName = username.trim();
      }
    }
    return formData;
    
  };
  /**
   * Uploads SBOM file and handles response based on format
   */
  const uploadSbomFile = async (
    file: File,
    cveId: string,
    sbomFormat: SbomFormat
  ): Promise<void> => {
    // Determine API function and navigation path based on format
    let apiCall: () => Promise<any>;
    let getNavigationPath: (response: any) => string;

    const formData = createFormData(cveId, file);
    if (sbomFormat === SbomFormat.SPDX) {
      // Build form data for SPDX with CVE ID and optional credentials      
      apiCall = () =>
        ProductEndpointService.postApiV1ProductsUploadSpdx({
          formData,
        });
      getNavigationPath = (response: Record<string, any>) =>
        `/reports/product/${response.productId}/${cveId}`;
    } else {      
            
      apiCall = () =>
        ProductEndpointService.postApiV1ProductsUploadCyclonedx({
          formData,
        });
      getNavigationPath = (response: ReportData) =>
        `/reports/component/${cveId}/${response.reportRequestId.reportId}`;
    }

    // Call API and navigate using unified code path
    const response = await apiCall();
    const navigationPath = getNavigationPath(response);
    navigate(navigationPath);
    onClose();
  };

  const handleSubmit = async () => {
    clearAllErrors();

    const trimmedCveId = cveId.trim();
    let hasValidationErrors = false;

    if (trimmedCveId === "") {
      setCveIdError("Required");
      hasValidationErrors = true;
    } else {
      const formatError = validateCveIdFormat(trimmedCveId);
      if (formatError) {
        setCveIdError(formatError);
        hasValidationErrors = true;
      }
    }

    if (mode === "sbom") {
      if (!selectedFile || !filename || filename === "") {
        setFileError("Required");
        hasValidationErrors = true;
      }
    } else {
      const trimmedSourceRepo = sourceRepo.trim();
      if (trimmedSourceRepo === "") {
        setSourceRepoError("Required");
        hasValidationErrors = true;
      } else {
        const urlError = validateSourceRepoUrl(trimmedSourceRepo);
        if (urlError) {
          setSourceRepoError(urlError);
          hasValidationErrors = true;
        }
      }
      if (commitId.trim() === "") {
        setCommitIdError("Required");
        hasValidationErrors = true;
      }
    }

    if (isAuthenticationSecretChecked) {
      const trimmedSecret = authenticationSecret.trim();
      if (trimmedSecret === "") {
        setAuthenticationSecretError("Required");
        hasValidationErrors = true;
      } else {
        const credentialType = detectCredentialType(trimmedSecret);
        if (credentialType === "PAT") {
          const trimmedUsername = username.trim();
          if (trimmedUsername === "") {
            setUsernameError("Username is required for Personal Access Token authentication");
            hasValidationErrors = true;
          }
        }
      }
    }

    if (hasValidationErrors) {
      return;
    }

    setIsSubmitting(true);

    if (mode === "single-repository") {
      try {
        const credential = getCredentialForSubmit();
        const requestBody: ReportRequest = {
          analysisType: "source",
          vulnerabilities: [trimmedCveId],
          metadata: {},
          sourceRepo: sourceRepo.trim(),
          commitId: commitId.trim(),
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
        setIsSubmitting(false);
      }
      return;
    }

    const file = selectedFile;
    if (!file) {
      setFileError("Required");
      setIsSubmitting(false);
      return;
    }

    let sbomFormat: SbomFormat | null = null;
    try {
      sbomFormat = await detectSbomFormat(file);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFileError(err.message);
      } else {        
        setFileError("An unknown error occurred while detecting the SBOM format");
        console.error(err);        
      }      
      setIsSubmitting(false);
      return;
    }
    if (!sbomFormat) {      
      setIsSubmitting(false);
      setFileError(`File format not supported. Please upload an ${SbomFormat.SPDX} ${SPDX_VERSION} or ${SbomFormat.CycloneDX} ${CYCLONEDX_VERSION} file.`);
      return;
    }
    try {
      // Detect SBOM format                 
      await uploadSbomFile(file, trimmedCveId, sbomFormat);
    } catch (err: unknown) {            
      handleSubmitError(err);      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileInputChange = (_event: DropEvent, file: File) => {
    setFilename(file.name);
    setFileValue(file.name);
    setSelectedFile(file);
    // Clear errors when user adds a file
    if (fileError) {
      setFileError(null);
    }
  };

  const handleClear = (_event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setFilename("");
    setFileValue("");
    setSelectedFile(null);
    // Clear errors when user clears file
    if (fileError) {
      setFileError(null);
    }
  };
  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={true}
      onClose={isSubmitting ? undefined : onClose}
      aria-labelledby="request-analysis-modal-title"
      aria-describedby="request-analysis-modal-description"
    >
      <ModalHeader
        title="Request Analysis"
        labelId="request-analysis-modal-title"
      />
      <ModalBody>
        {error && (
          <Alert
            variant={AlertVariant.danger}
            title="Error submitting analysis request"
            isInline
            style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
          >
            {error}
          </Alert>
        )}
        <Form>
          <ToggleGroup
            aria-label="Input type"
            areAllGroupsDisabled={isSubmitting}
          >
            <ToggleGroupItem
              text="SBOM"
              buttonId="mode-sbom"
              isSelected={mode === "sbom"}
              onChange={() => handleModeChange("sbom")}
            />
            <ToggleGroupItem
              text="Single Repository"
              buttonId="mode-single-repository"
              isSelected={mode === "single-repository"}
              onChange={() => handleModeChange("single-repository")}
            />
          </ToggleGroup>
          <FormGroup label="CVE ID" isRequired fieldId="cve-id">
            <TextInput
              isRequired
              type="text"
              id="cve-id"
              name="cve-id"
              value={cveId}
              onChange={handleCveIdChange}
              onBlur={handleCveIdBlur}
              onKeyDown={handleCveIdKeyDown}
              isDisabled={isSubmitting}
              validated={cveIdError ? "error" : "default"}
              placeholder="e.g. CVE-2024-50602"
            />
            <FormHelperText>
              <HelperText>
                {cveIdError && (
                  <HelperTextItem variant="error">{cveIdError}</HelperTextItem>
                )}
              </HelperText>
            </FormHelperText>
          </FormGroup>
          {mode === "sbom" && (
            <FormGroup label="SBOM file" isRequired fieldId="sbom-file">
              <FileUpload
                id="sbom-file"
                value={fileValue}
                filename={filename}
                filenamePlaceholder="Drag and drop a file or upload one"
                onFileInputChange={handleFileInputChange}
                onClearClick={handleClear}
                browseButtonText="Upload"
                isDisabled={isSubmitting}
                accept=".json"
              />
              <FormHelperText>
                <HelperText>
                  {fileError ? (
                    <HelperTextItem variant="error">{fileError}</HelperTextItem>
                  ) : (
                    <HelperTextItem>
                      Supported formats: JSON {SbomFormat.SPDX} {SPDX_VERSION} and JSON {SbomFormat.CycloneDX} {CYCLONEDX_VERSION}
                    </HelperTextItem>
                  )}
                </HelperText>
              </FormHelperText>
            </FormGroup>
          )}
          {mode === "single-repository" && (
            <>
              <FormGroup
                label="Source Repository"
                isRequired
                fieldId="source-repo"
              >
                <TextInput
                  isRequired
                  type="text"
                  id="source-repo"
                  name="source-repo"
                  value={sourceRepo}
                  onChange={(_e, value) => {
                    setSourceRepo(value);
                    if (sourceRepoError) setSourceRepoError(null);
                  }}
                  onBlur={() => {
                    if (sourceRepo.trim() !== "") {
                      const urlError = validateSourceRepoUrl(sourceRepo);
                      setSourceRepoError(urlError);
                    }
                  }}
                  placeholder="e.g. https://github.com/org/repo"
                  isDisabled={isSubmitting}
                  validated={sourceRepoError ? "error" : "default"}
                />
                <FormHelperText>
                  <HelperText>
                    {sourceRepoError && (
                      <HelperTextItem variant="error">{sourceRepoError}</HelperTextItem>
                    )}
                  </HelperText>
                </FormHelperText>
              </FormGroup>
              <FormGroup label="Commit ID" isRequired fieldId="commit-id">
                <TextInput
                  isRequired
                  type="text"
                  id="commit-id"
                  name="commit-id"
                  value={commitId}
                  onChange={(_e, value) => {
                    setCommitId(value);
                    if (commitIdError) setCommitIdError(null);
                  }}
                  placeholder="e.g. v1.0.0, f76b3537930637666e7be8000008f69731ea642d"
                  isDisabled={isSubmitting}
                  validated={commitIdError ? "error" : "default"}
                />
                <FormHelperText>
                  <HelperText>
                    {commitIdError && (
                      <HelperTextItem variant="error">{commitIdError}</HelperTextItem>
                    )}
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            </>
          )}
          <Switch
            id="private-repo-switch"
            label="Private repository"
            isChecked={isAuthenticationSecretChecked}
            onChange={handlePrivateRepoSwitchChange}
            isDisabled={isSubmitting}
          />
          {isAuthenticationSecretChecked && (
            <Card
              variant="secondary"
            >
              <CardBody>
                <FormGroup
                  label="Authentication secret"
                  isRequired
                  fieldId="authentication-secret"
                  labelHelp={
                    <Popover
                      triggerRef={labelHelpRef}
                      bodyContent="Provide an SSH private key or Personal Access Token to authenticate with the private repository."
                    >
                      <FormGroupLabelHelp
                        ref={labelHelpRef}
                        aria-label="More info about authentication secret"
                      />
                    </Popover>
                  }
                >
                  <TextInput
                    isRequired
                    type="password"
                    id="authentication-secret"
                    name="authentication-secret"
                    value={authenticationSecret}
                    onChange={handleAuthenticationSecretChange}
                    onBlur={handleAuthenticationSecretBlur}
                    isDisabled={isSubmitting}
                    validated={authenticationSecretError ? "error" : "default"}
                  />
                  <FormHelperText>
                    <HelperText>
                      {authenticationSecretError ? (
                        <HelperTextItem variant="error">
                          {authenticationSecretError}
                        </HelperTextItem>
                      ) : (
                        <HelperTextItem>
                          Accepts SSH private keys or Personal Access Tokens. Type will be auto-detected.
                        </HelperTextItem>
                      )}
                    </HelperText>
                  </FormHelperText>
                  {detectCredentialType(authenticationSecret) === "SSH_KEY" && (
                    <Label color="purple" icon={<KeyIcon />} style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}>
                      SSH key detected
                    </Label>
                  )}
                  {detectCredentialType(authenticationSecret) === "PAT" && (
                    <Label color="teal" icon={<SecurityIcon />} style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}>
                      Personal access token detected
                    </Label>
                  )}
                </FormGroup>
                {detectCredentialType(authenticationSecret) === "PAT" && (
                  <FormGroup
                    label="Username"
                    isRequired
                    fieldId="username"
                    style={{ marginTop: "var(--pf-t--global--spacer--md)" }}
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="username"
                      name="username"
                      value={username}
                      onChange={handleUsernameChange}
                      onBlur={handleUsernameBlur}
                      isDisabled={isSubmitting}
                      validated={usernameError ? "error" : "default"}
                    />
                    {usernameError && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            {usernameError}
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FormGroup>
                )}
              </CardBody>
            </Card>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="submit"
          variant="primary"
          onClick={handleSubmit}
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Analysis Request"}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isSubmitting}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RequestAnalysisModal;
