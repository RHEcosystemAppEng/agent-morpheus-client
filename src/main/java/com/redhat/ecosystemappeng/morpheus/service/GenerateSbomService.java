/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
            // Wrap SbomValidationException as SyftExecutionException; getMessage() includes image-metadata detail when structured
            LOGGER.errorf("Syft generated an invalid SBOM: %s for command: %s", e.getMessage(), String.join(" ", command));
            throw new SyftExecutionException(image, "Syft generated an invalid SBOM: " + e.getMessage());
        } catch (IOException e) {
            // Stream read from syft stdout/stderr or downstream I/O; include cause in the message shown on submission failures
            LOGGER.errorf(e, "Failed to read syft output for command: %s", String.join(" ", command));
            String detail = e.getMessage();
            String suffix = (detail != null && !detail.isBlank()) ? ": " + detail : "";
            throw new SyftExecutionException(image, "Failed to read syft output" + suffix);
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
