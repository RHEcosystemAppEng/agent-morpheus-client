package com.redhat.ecosystemappeng.morpheus.exception;

/**
 * Exception thrown when SBOM validation fails
 */
public class SbomValidationException extends IllegalArgumentException {
  public SbomValidationException(String message) {
    super(message);
  }

  public SbomValidationException(String message, Throwable cause) {
    super(message, cause);
  }
}

