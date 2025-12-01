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
} from "@patternfly/react-core";
import { UploadIcon } from "@patternfly/react-icons";

interface RequestAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * RequestAnalysisModal component - displays modal for requesting analysis
 */
const RequestAnalysisModal: React.FC<RequestAnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [cveId, setCveId] = useState("");
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [showStatus, setShowStatus] = useState(false);

  const handleCveIdChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setCveId(value);
  };

  // Show status once a file has been uploaded
  useEffect(() => {
    if (!showStatus && currentFiles.length > 0) {
      setShowStatus(true);
    }
  }, [currentFiles.length, showStatus]);

  // Check if both fields are filled
  const isFormValid = cveId.trim() !== "" && currentFiles.length > 0;

  const handleSubmit = () => {
    // TODO: Implement submit logic
    console.log("Submitting analysis request:", { cveId, files: currentFiles });
  };

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    setCurrentFiles((prevFiles) =>
      prevFiles.filter((file) => !namesOfFilesToRemove.includes(file.name))
    );
  };

  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // Only allow 1 file - replace existing file if one is dropped
    const firstFile = droppedFiles[0];
    if (firstFile) {
      // Take only the first file if multiple are dropped
      setCurrentFiles([firstFile]);
    }
  };

  const handleReadSuccess = (_data: string, _file: File) => {
    // File read successfully - can be used for validation if needed
  };

  const handleReadFail = (_error: DOMException, _file: File) => {
    // Handle read error if needed
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="request-analysis-modal-title"
      aria-describedby="request-analysis-modal-description"
    >
      <ModalHeader
        title="Request Analysis"
        labelId="request-analysis-modal-title"
      />
      <br />
      <ModalBody>
        <Form>
          <FormGroup label="CVE ID" isRequired fieldId="cve-id">
            <TextInput
              isRequired
              type="text"
              id="cve-id"
              name="cve-id"
              value={cveId}
              onChange={handleCveIdChange}
              placeholder="Enter CVE ID"
            />
            <br />
            <div
              style={{
                marginTop: "var(--pf-v5-global--spacer--xs)",
                fontSize: "var(--pf-v5-global--FontSize--sm)",
                color: "var(--pf-v5-global--Color--200)",
              }}
            >
              Enter the CVE identifier to analyze (e.g. CVE-2024-50602)
            </div>
          </FormGroup>
          <br />
          <FormGroup label="SBOM file" isRequired fieldId="sbom-file">
            <MultipleFileUpload
              onFileDrop={handleFileDrop}
              dropzoneProps={{
                accept: {
                  "application/json": [".json"],
                  "application/xml": [".xml"],
                  "text/xml": [".xml"],
                },
              }}
            >
              <MultipleFileUploadMain
                titleIcon={<UploadIcon />}
                titleText="Drag and drop file here"
                titleTextSeparator="or"
                infoText="Accepted file types: JSON, XML (1 file only)"
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
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="submit"
          variant="primary"
          onClick={handleSubmit}
          isDisabled={!isFormValid}
        >
          Submit Analysis Request
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default RequestAnalysisModal;
