package com.redhat.ecosystemappeng.morpheus.exception;

/**
 * Exception thrown when CVE ID validation fails (e.g. missing, empty, or invalid format).
 */
public class CveIdValidationException extends IllegalArgumentException {
  /** Message when no CVE ID is provided. */
  public static final String MESSAGE_REQUIRED = "CVE ID is required";

  public CveIdValidationException(String cveId, String message) {
    super(buildMessage(cveId, message));
  }

  private static String buildMessage(String cveId, String message) {
    if (cveId == null || cveId.trim().isEmpty()) {
      return MESSAGE_REQUIRED;
    }
    return "Invalid CVE ID: " + cveId + ". " + message;
  }
}
