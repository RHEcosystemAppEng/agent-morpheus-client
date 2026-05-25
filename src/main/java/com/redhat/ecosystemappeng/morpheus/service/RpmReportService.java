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

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.exception.ValidationException;
import com.redhat.ecosystemappeng.morpheus.model.NewRpmReportRequest;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequestId;
import com.redhat.ecosystemappeng.morpheus.model.TargetPackage;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.Image;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.PipelineMode;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.ReportInput;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.Scan;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.VulnId;
import com.redhat.ecosystemappeng.morpheus.validation.CveIdRules;
import com.redhat.ecosystemappeng.morpheus.validation.RpmArchitecture;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

/**
 * Builds, persists, and submits Morpheus report requests for the RPM package checker pipeline.
 */
@ApplicationScoped
public class RpmReportService {

  @Inject
  ReportService reportService;

  @Inject
  ObjectMapper objectMapper;

  @Inject
  UserService userService;

  private record ValidatedNewRpmReport(String name, String version, String release, String arch, String cveUppercase) {
  }

  /**
   * Validates RPM report fields (upload-spdx-style aggregated {@link ValidationException}),
   * builds Morpheus input with {@link PipelineMode#RPM_PACKAGE_CHECKER}, persists, and submits to the queue.
   */
  public ReportData persistAndSubmitNewRpmReport(NewRpmReportRequest request)
      throws JsonProcessingException, IOException {
    ValidatedNewRpmReport v = validateNewRpmReportRequest(request);
    ReportData reportData = generateRpmPackageCheckerReport(v);
    ReportData saved = reportService.saveReport(reportData);
    reportService.submit(saved.reportRequestId().id(), saved.report());
    return saved;
  }

  private ValidatedNewRpmReport validateNewRpmReportRequest(NewRpmReportRequest request) throws ValidationException {
    Map<String, String> errors = new HashMap<>();
    String name = trimmedOrNull(request.name());
    String version = trimmedOrNull(request.version());
    String release = trimmedOrNull(request.release());
    String arch = trimmedOrNull(request.arch());
    String rawCve = trimmedOrNull(request.cveId());
    putIfBlank(errors, "name", name, "Name is required");
    putIfBlank(errors, "version", version, "Version is required");
    putIfBlank(errors, "release", release, "Release is required");
    putIfBlank(errors, "arch", arch, "Architecture is required");
    RpmArchitecture.putArchFieldErrorIfNotAllowed(errors, arch);
    CveIdRules.putOfficialCveFieldErrorIfInvalid(errors, request.cveId());
    if (!errors.isEmpty()) {
      throw new ValidationException(errors);
    }
    return new ValidatedNewRpmReport(name, version, release, arch, rawCve.toUpperCase());
  }

  private ReportData generateRpmPackageCheckerReport(ValidatedNewRpmReport v) throws JsonProcessingException {
    String scanId = reportService.createUniqueScanId();
    Scan scan = new Scan(scanId, List.of(new VulnId(v.cveUppercase())));
    TargetPackage target = new TargetPackage(v.name(), v.version(), v.release(), v.arch(), "rpm");
    Image image = new Image(
        "source",
        null,
        null,
        null,
        null,
        null,
        null,
        PipelineMode.RPM_PACKAGE_CHECKER,
        target);

    ReportInput input = new ReportInput(scan, image);
    ObjectNode report = objectMapper.createObjectNode();
    report.set("input", objectMapper.convertValue(input, JsonNode.class));

    Map<String, String> metadata = new HashMap<>();
    metadata.put("user", userService.getUserName());
    report.set("metadata", objectMapper.convertValue(metadata, JsonNode.class));

    var reportRequestId = new ReportRequestId(null, scan.id());
    return new ReportData(reportRequestId, report);
  }

  private static String trimmedOrNull(String s) {
    if (s == null) {
      return null;
    }
    String t = s.trim();
    return t.isEmpty() ? null : t;
  }

  private static void putIfBlank(Map<String, String> errors, String field, String value, String msg) {
    if (value == null) {
      errors.put(field, msg);
    }
  }
}
