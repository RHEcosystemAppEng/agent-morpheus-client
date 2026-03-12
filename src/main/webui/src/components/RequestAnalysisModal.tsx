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
} from "@patternfly/react-core";
import { KeyIcon, SecurityIcon } from "@patternfly/react-icons";
import { useNavigate } from "react-router";
import { ProductEndpointService } from "../generated-client/services/ProductEndpointService";
import type { ReportData } from "../generated-client/models/ReportData";
import { getErrorMessage, isValidationError } from "../utils/errorHandling";

const FALLBACK_ERROR_MESSAGE = "An error occurred while submitting the analysis request.";
// CVE ID pattern matching backend validation: ^CVE-[0-9]{4}-[0-9]{4,19}$
const CVE_ID_PATTERN = /^CVE-[0-9]{4}-[0-9]{4,19}$/;

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
  const [cveId, setCveId] = useState("");
  const [fileValue, setFileValue] = useState("");
  const [filename, setFilename] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  /**
   * Detects SBOM format by parsing the file content
   * @param file The file to check
   * @returns SbomFormat if recognized, null if valid JSON but unsupported format
   * @throws Error if file is not valid JSON
   */
  const detectSbomFormat = async (file: File): Promise<SbomFormat | null> => {    
    try {
      let text = await file.text();
      let json = JSON.parse(text);
      // Check for SPDX format
      if (json.SPDXID && json.spdxVersion === `SPDX-${SPDX_VERSION}`) {
        return SbomFormat.SPDX;
      }
      // Check for CycloneDX format
      if (json.bomFormat === SbomFormat.CycloneDX && json.specVersion === CYCLONEDX_VERSION) {
        return SbomFormat.CycloneDX;
      }    
      return null;      
    } catch (e) {
      // If file is not valid JSON, throw error
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
   * Handles errors from the API submission, setting field-specific or generic error messages
   * @param err The error caught from the API call
   */
  const handleSubmitError = (err: unknown): void => {
    // Handle field-specific validation errors (400)
    if (isValidationError(err)) {
      // TypeScript now knows err.body is ValidationErrorResponse
        let hasFieldErrors = false;
        
        // Set field-specific errors
        if (err.body.errors?.cveId) {
          setCveIdError(err.body.errors.cveId);
          hasFieldErrors = true;
        }
        if (err.body.errors?.file) {
          setFileError(err.body.errors.file);
          hasFieldErrors = true;
        }
        // If validation errors exist but don't match known fields, show generic error
        if (!hasFieldErrors) {
          setError("Invalid request data. Please check your inputs.");
        }     
    } else {
      // Handle non-validation errors (429, 500, network, etc.)
      const errorMessage = getErrorMessage(err, FALLBACK_ERROR_MESSAGE);
      setError(errorMessage);
    }
  };

  /**
   * Clears all form error states
   */
  const clearAllErrors = () => {
    setError(null);
    setCveIdError(null);
    setFileError(null);
    setAuthenticationSecretError(null);
    setUsernameError(null);
  };
    
  const createFormData = (cveId: string, file: File) => {
    const formData: { cveId: string; file: File; secretValue?: string; username?: string } = {
      cveId: cveId,
      file: file,
    };
    if (isAuthenticationSecretChecked && authenticationSecret.trim() !== "") {
      formData.secretValue = authenticationSecret.trim();
      const credentialType = detectCredentialType(authenticationSecret);
      if (credentialType === "PAT" && username.trim() !== "") {
        formData.username = username.trim();
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
        `/reports/component/${cveId}/${response.reportRequestId.id}`;
    }

    // Call API and navigate using unified code path
    const response = await apiCall();
    const navigationPath = getNavigationPath(response);
    navigate(navigationPath);
    onClose();
  };

  const handleSubmit = async () => {
    clearAllErrors();

    // Validate required fields
    const trimmedCveId = cveId.trim();
    let hasValidationErrors = false;

    if (trimmedCveId === "") {
      setCveIdError("Required");
      hasValidationErrors = true;
    } else {
      const cveFormatError = validateCveIdFormat(trimmedCveId);
      if (cveFormatError) {
        setCveIdError(cveFormatError);
        hasValidationErrors = true;
      }
    }

    if (!selectedFile || !filename || filename === "") {
      setFileError("Required");
      hasValidationErrors = true;
    }

    // Validate authentication credentials if checkbox is checked
    if (isAuthenticationSecretChecked) {
      const trimmedSecret = authenticationSecret.trim();
      if (trimmedSecret === "") {
        setAuthenticationSecretError("Required");
        hasValidationErrors = true;
      } else {
        const credentialType = detectCredentialType(trimmedSecret);
        // Validate username for PAT
        if (credentialType === "PAT") {
          const trimmedUsername = username.trim();
          if (trimmedUsername === "") {
            setUsernameError("Username is required for Personal Access Token authentication");
            hasValidationErrors = true;
          }
        }
      }
    }

    // Prevent API call if validation fails
    if (hasValidationErrors) {
      return;
    }

    const file = selectedFile;
    if (!file) {
      setFileError("Required");
      return;
    }

    
    setIsSubmitting(true);

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
              placeholder="Enter CVE ID"
              isDisabled={isSubmitting}
              validated={cveIdError ? "error" : "default"}
            />
            <FormHelperText>
              <HelperText>
                {cveIdError ? (
                  <HelperTextItem variant="error">{cveIdError}</HelperTextItem>
                ) : (
                  <HelperTextItem>
                    Enter the CVE identifier to analyze (e.g. CVE-2024-50602)
                  </HelperTextItem>
                )}
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup 
            label="SBOM file" 
            isRequired 
            fieldId="sbom-file"
          >
            <FileUpload
              id="sbom-file"
              value={fileValue}
              filename={filename}
              filenamePlaceholder="Drag and drop a file or upload one"
              onFileInputChange={handleFileInputChange}
              onClearClick={handleClear}
              browseButtonText="Upload"
              isDisabled={isSubmitting}
              accept=".json,.xml"
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
