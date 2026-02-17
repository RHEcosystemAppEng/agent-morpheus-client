import React, { useState, useEffect } from "react";
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
} from "@patternfly/react-core";
import { UploadIcon } from "@patternfly/react-icons";
import { useNavigate } from "react-router";
import { ProductEndpointService } from "../generated-client/services/ProductEndpointService";
import type { ReportData } from "../generated-client/models/ReportData";
import { getErrorMessage, isValidationError } from "../utils/errorHandling";

const FALLBACK_ERROR_MESSAGE = "An error occurred while submitting the analysis request.";
// CVE ID pattern matching backend validation: ^CVE-[0-9]{4}-[0-9]{4,19}$
const CVE_ID_PATTERN = /^CVE-[0-9]{4}-[0-9]{4,19}$/;
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
  const [cveId, setCveId] = useState("");
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cveIdError, setCveIdError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

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

  // Show status once a file has been uploaded
  useEffect(() => {
    if (!showStatus && currentFiles.length > 0) {
      setShowStatus(true);
    }
  }, [currentFiles.length, showStatus]);

  // Note: Submit button is only disabled during submission progress, not based on form validation

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

  const handleSubmit = async () => {
    // Clear previous errors
    setError(null);
    setCveIdError(null);
    setFileError(null);

    // Validate required fields
    const trimmedCveId = cveId.trim();
    let hasValidationErrors = false;

    if (trimmedCveId === "") {
      setCveIdError("Required");
      hasValidationErrors = true;
    } else {
      // Validate CVE ID format
      const formatError = validateCveIdFormat(trimmedCveId);
      if (formatError) {
        setCveIdError(formatError);
        hasValidationErrors = true;
      }
    }

    if (currentFiles.length === 0) {
      setFileError("Required");
      hasValidationErrors = true;
    }

    // Prevent API call if validation fails
    if (hasValidationErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const file = currentFiles[0];
      const formData = {
        cveId: cveId.trim(),
        file: file,
      };

      const response: ReportData = await ProductEndpointService.postApiV1ProductsUploadCyclonedx({
        formData,
      });

      // Extract report ID from response
      const reportId = response.reportRequestId.id;

      // Navigate to repository report page
      navigate(`/reports/component/${cveId.trim()}/${reportId}`);

      // Close modal
      onClose();
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
            style={{ marginBottom: "var(--pf-v5-global--spacer--md)" }}
          >
            {error}
          </Alert>
        )}
        <Form>
          <FormGroup 
            label="CVE ID" 
            isRequired 
            fieldId="cve-id"
          >
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
                  <HelperTextItem>Enter the CVE identifier to analyze (e.g. CVE-2024-50602)</HelperTextItem>
                )}
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup 
            label="SBOM file" 
            isRequired 
            fieldId="sbom-file"
          >
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
