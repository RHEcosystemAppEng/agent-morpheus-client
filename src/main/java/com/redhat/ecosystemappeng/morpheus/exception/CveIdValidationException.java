package com.redhat.ecosystemappeng.morpheus.exception;

/**
 * Exception thrown when CVE ID validation fails
 */
public class CveIdValidationException extends IllegalArgumentException {
  public CveIdValidationException(String message) {
    super(message);
  }

  public CveIdValidationException(String message, Throwable cause) {
    super(message, cause);
  }
}

