package com.redhat.ecosystemappeng.morpheus.service;

/**
 * Exception thrown when credential storage operations fail.
 */
public class CredentialStorageException extends RuntimeException {

    public CredentialStorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public CredentialStorageException(String message) {
        super(message);
    }
}
