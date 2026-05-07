package com.redhat.ecosystemappeng.morpheus.exception;

import java.util.List;

/**
 * Exception thrown when SBOM validation fails
 */
public class SbomValidationException extends IllegalArgumentException {

  private final List<SbomValidationIssueCode> structuredIssues;

  public SbomValidationException(String message) {
    super(message);
    this.structuredIssues = List.of();
  }

  public SbomValidationException(String message, Throwable cause) {
    super(message, cause);
    this.structuredIssues = List.of();
  }

  public SbomValidationException(List<SbomValidationIssueCode> structuredIssues) {
    super(SbomValidationMessages.summaryForStructuredImageMetadataIssues(structuredIssues));
    this.structuredIssues = List.copyOf(structuredIssues);
  }

  public List<SbomValidationIssueCode> getStructuredIssues() {
    return structuredIssues;
  }

  public boolean hasStructuredIssues() {
    return !structuredIssues.isEmpty();
  }
}

