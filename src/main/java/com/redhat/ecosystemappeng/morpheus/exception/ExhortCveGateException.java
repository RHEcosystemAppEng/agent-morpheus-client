package com.redhat.ecosystemappeng.morpheus.exception;

/**
 * Thrown when the Exhort (dependency analytics) CVE gate fails: the requested CVE
 * is not present in the component's dependency tree, or Exhort is unavailable.
 */
public class ExhortCveGateException extends RuntimeException {

    public ExhortCveGateException(String message) {
        super(message);
    }

    public ExhortCveGateException(String message, Throwable cause) {
        super(message, cause);
    }
}
