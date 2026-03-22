package com.redhat.ecosystemappeng.morpheus.service;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.SyftExecutionException;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class GenerateSbomService {
    
    private static final Logger LOGGER = Logger.getLogger(GenerateSbomService.class);
    private static final int EXIT_CODE_SUCCESS = 0;
    private static final String SYFT_CACHE_DIR_ENV = "SYFT_CACHE_DIR";

    @ConfigProperty(name = "morpheus.syft.cache.dir")
    String syftCacheDir;

    @Inject
    CycloneDxParsingService cycloneDxParsingService;

    public ParsedCycloneDx generate(String image) throws SyftExecutionException, InterruptedException {
        String outputString = "";
        String[] command = new String[] {
            "syft",
            image,
            "-o",
            "cyclonedx-json",
        };
        Process process = null;
        try {
            LOGGER.info("Running syft with command: " + String.join(" ", command));
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.environment().put(SYFT_CACHE_DIR_ENV, syftCacheDir);
            process = pb.start();

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

                LOGGER.error("Syft execution failed with error: " + rawError + " for command: " + String.join(" ", command));                
                throw new SyftExecutionException(image, "Syft execution failed");
            }

            LOGGER.info("Successfully generated SBOM for image: " + image);
            
            // Parse and validate the CycloneDX output using CycloneDxParsingService
            outputString = output.toString();
            try (InputStream outputStream = new ByteArrayInputStream(outputString.getBytes(StandardCharsets.UTF_8))) {
                ParsedCycloneDx parsedCycloneDx = cycloneDxParsingService.parseCycloneDxFile(outputStream);
                return parsedCycloneDx;
            }
        } catch (SbomValidationException e) {
            // Wrap SbomValidationException as SyftExecutionException; preserve original message for submission failures
            LOGGER.errorf("Syft produced an invalid SBOM: %s for command: %s", e.getMessage(), String.join(" ", command));
            throw new SyftExecutionException(image, "Syft produced an invalid SBOM: " + e.getMessage());
        } catch (IOException e) {
            // Wrap IOExceptions from stream operations or JSON parsing as SyftExecutionException
            // since they occur during syft execution
            LOGGER.errorf("Failed to read syft output: %s for command: %s", outputString, String.join(" ", command));
            throw new SyftExecutionException(image, "Failed to read syft output");
        } catch (Exception e) {
            // Wrap other exceptions as SyftExecutionException; preserve original message for submission failures
            LOGGER.errorf("Unexpected error generating SBOM for image: %s: %s", image, e.getMessage());
            throw new SyftExecutionException(image, "Unexpected error generating SBOM for image");
        } finally {
            if (Objects.nonNull(process) && process.isAlive()) {
                process.destroy();
            }
        }
    }    
}
