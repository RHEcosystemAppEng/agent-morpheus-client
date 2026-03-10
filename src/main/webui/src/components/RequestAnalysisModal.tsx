import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  DropEvent,
  Button,
  Alert,
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
import { UploadIcon, KeyIcon, SecurityIcon } from "@patternfly/react-icons";
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
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [showStatus, setShowStatus] = useState(false);
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

  // Show status once a file has been uploaded
  useEffect(() => {
    if (!showStatus && currentFiles.length > 0) {
      setShowStatus(true);
    }
  }, [currentFiles.length, showStatus]);

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

  const handleSubmit = async () => {
    setError(null);
    setCveIdError(null);
    setFileError(null);
    setSourceRepoError(null);
    setCommitIdError(null);
    setAuthenticationSecretError(null);
    setUsernameError(null);

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
      if (currentFiles.length === 0) {
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

    try {
      const credential = getCredentialForSubmit();
      if (mode === "single-repository") {        
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
        const reportId = response.reportRequestId.id;
        navigate(`/reports/component/${trimmedCveId}/${reportId}`);
        onClose();
      } else {
        const file = currentFiles[0]!;
        const formData: {
          cveId: string;
          file: File;
          secretValue?: string;
          userName?: string;
        } = {
          cveId: trimmedCveId,
          file,
          ...credential,
        };
        const response: ReportData = await ProductEndpointService.postApiV1ProductsUploadCyclonedx({
          formData,
        });
        const reportId = response.reportRequestId.id;
        navigate(`/reports/component/${trimmedCveId}/${reportId}`);
        onClose();
      }
    } catch (err: unknown) {
      handleSubmitError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    setCurrentFiles((prevFiles) =>
      prevFiles.filter((file) => !namesOfFilesToRemove.includes(file.name))
    );
    // Clear error when user removes file
    if (fileError) {
      setFileError(null);
    }
  };

  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // Only allow 1 file - replace existing file if one is dropped
    const firstFile = droppedFiles[0];
    if (firstFile) {
      setCurrentFiles([firstFile]);
      // Clear error when user adds a file
      if (fileError) {
        setFileError(null);
      }
    }
  };

  const handleReadSuccess = (_data: string, _file: File) => {
    // File read successfully
  };
  const handleReadFail = (_error: DOMException, _file: File) => {
    // Handle read error if needed
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={true}
      onClose={onClose}
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
            variant="danger"
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
              <MultipleFileUpload
                onFileDrop={handleFileDrop}
                dropzoneProps={{
                  accept: {
                    "application/json": [".json"],
                    "application/xml": [".xml"],
                    "text/xml": [".xml"],
                  },
                  disabled: isSubmitting,
                  multiple: false,
                }}
              >
                <MultipleFileUploadMain
                  titleIcon={<UploadIcon />}
                  titleText="Drag and drop file here"
                  titleTextSeparator="or"
                  infoText="Accepted file types: CycloneDX 1.6 JSON"
                />
                {showStatus && (
                  <MultipleFileUploadStatus
                    statusToggleText={`${currentFiles.length} file${
                      currentFiles.length !== 1 ? "s" : ""
                    } uploaded`}
                    statusToggleIcon="success"
                    aria-label="Current uploads"
                  >
                    {currentFiles.map((file) => (
                      <MultipleFileUploadStatusItem
                        file={file}
                        key={file.name}
                        onClearClick={() => removeFiles([file.name])}
                        onReadSuccess={handleReadSuccess}
                        onReadFail={handleReadFail}
                      />
                    ))}
                  </MultipleFileUploadStatus>
                )}
              </MultipleFileUpload>
              {fileError && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">{fileError}</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
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
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RequestAnalysisModal;
