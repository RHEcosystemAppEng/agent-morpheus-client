package com.redhat.ecosystemappeng.morpheus.exception;

/**
 * Exception thrown when syft command execution fails.
 * Extends RuntimeException for use in async and non-IO call paths.
 */
public class SyftExecutionException extends RuntimeException {

    private final String image;

    public SyftExecutionException(String image, String message) {
        super(message);
        this.image = image;
    }

    public SyftExecutionException(String image, String message, Throwable cause) {
        super(message, cause);
        this.image = image;
    }
    
    /**
     * Get the syft target that failed
     */
    public String getImage() {
        return image;
    }
}

