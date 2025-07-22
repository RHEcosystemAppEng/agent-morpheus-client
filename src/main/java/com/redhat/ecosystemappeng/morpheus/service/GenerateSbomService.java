package com.redhat.ecosystemappeng.morpheus.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class GenerateSbomService {
    
    private static final Logger LOGGER = Logger.getLogger(PreProcessingService.class);

    @Inject
    ObjectMapper objectMapper;

    public JsonNode generate(String image) throws IOException {
        
        LOGGER.info("Generating SBOM for image: " + image);
        try {
            String[] command = new String[] {
                "syft",
                image,
                "-o",
                "cyclonedx-json",
            };
            ProcessBuilder pb = new ProcessBuilder(command);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }

            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            StringBuilder errorOutput = new StringBuilder();
            String errorLine;
            while ((errorLine = errorReader.readLine()) != null) {
                errorOutput.append(errorLine).append(System.lineSeparator());
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String rawError = errorOutput.toString();
                String cleanError = rawError.replaceAll("\u001B\\[[;\\d]*m", "");
                throw new IOException(cleanError.trim());
            }

            LOGGER.info("Successfully generated SBOM for image: " + image);
            LOGGER.debug("SBOM: " + output.toString());
            return objectMapper.readTree(output.toString());

        } catch (Exception e) {
            throw new IOException("Failed to generate SBOM for image '" + image + "' with error: " + e.getMessage(), e);
        }
    }
    
}
