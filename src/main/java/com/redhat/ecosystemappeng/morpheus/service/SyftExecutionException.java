package com.redhat.ecosystemappeng.morpheus.service;

import java.io.IOException;

/**
 * Exception thrown when syft command execution fails.
 * Extends IOException to maintain compatibility with existing error handling.
 */
public class SyftExecutionException extends IOException {
    
    private final String target;
    
    public SyftExecutionException(String target, String message) {
        super(message);
        this.target = target;
    }
    
    public SyftExecutionException(String target, String message, Throwable cause) {
        super(message, cause);
        this.target = target;
    }
    
    /**
     * Get the syft target that failed
     */
    public String getTarget() {
        return target;
    }
}

