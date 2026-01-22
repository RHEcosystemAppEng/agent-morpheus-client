package com.redhat.ecosystemappeng.morpheus.rest;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

/**
 * JAX-RS Application class to configure the base path for all REST endpoints.
 * All REST endpoints will be prefixed with /api/v1
 */
@ApplicationPath("/api/v1")
public class RestApplication extends Application {
}

