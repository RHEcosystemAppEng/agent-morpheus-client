package com.redhat.ecosystemappeng.morpheus.health;

import java.io.IOException;
import java.net.ConnectException;
import java.net.UnknownHostException;

final class HealthUtils {
    private HealthUtils() {
    }

    static String resolveReason(Throwable e) {
        if (e == null)
            return "Unknown error";
        Throwable cause = e.getCause() != null ? e.getCause() : e;
        String msg = cause.getMessage();
        String className = cause.getClass().getSimpleName();
        // Specific exceptions
        if (className.equals("TimeoutException") || className.contains("Timeout")) {
            return "Request timed out";
        }
        if (cause instanceof ConnectException)
            return "Connection refused";
        if (cause instanceof UnknownHostException)
            return "Unknown host";
        // Generic exceptions
        if (msg != null) {
            int idx = msg.indexOf(":");
            if (idx >= 0) {
                return msg.substring(idx + 1).trim();
            }
            return msg;
        }
        // Fallback
        if (cause instanceof IOException) {
            return "Network error";
        }

        return className;
    }
}
