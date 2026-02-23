package com.redhat.ecosystemappeng.morpheus.service;

/**
 * Exception thrown when file validation fails
 */
public class FileValidationException extends IllegalArgumentException {
  public FileValidationException(String message) {
    super(message);
  }

  public FileValidationException(String message, Throwable cause) {
    super(message, cause);
  }
}

