package com.redhat.ecosystemappeng.morpheus.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class GenerateSbomService {
    
    private static final Logger LOGGER = Logger.getLogger(PreProcessingService.class);
    private static final int EXIT_CODE_SUCCESS = 0;
    private static final String SYFT_CACHE_DIR_ENV = "SYFT_CACHE_DIR";

    @ConfigProperty(name = "morpheus.syft.cache.dir")
    String syftCacheDir;

    @Inject
    ObjectMapper objectMapper;

    public JsonNode generate(String image) throws IOException, InterruptedException {
        
        LOGGER.info("Generating SBOM for image: " + image);
        String[] command = new String[] {
            "syft",
            image,
            "-o",
            "cyclonedx-json",
        };
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.environment().put(SYFT_CACHE_DIR_ENV, syftCacheDir);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }

        StringBuilder errorOutput = new StringBuilder();
        try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
            String errorLine;
            while ((errorLine = errorReader.readLine()) != null) {
                errorOutput.append(errorLine).append(System.lineSeparator());
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != EXIT_CODE_SUCCESS) {
            String rawError = errorOutput.toString();
            String cleanError = rawError.replaceAll("\u001B\\[[;\\d]*m", "");
            throw new IOException(cleanError.trim());
        }

        LOGGER.info("Successfully generated SBOM for image: " + image);
        LOGGER.debug("SBOM: " + output.toString());
        return objectMapper.readTree(output.toString());
    }
    
}
