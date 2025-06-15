package com.redhat.ecosystemappeng.morpheus.model;

import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ReportData(ReportRequestId reportRequestId, JsonNode report) {

}
