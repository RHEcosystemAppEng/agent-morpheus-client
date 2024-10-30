package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ReportFilter(String vulnId) {
  
  public boolean filterByVulnId(Report report) {
    if(vulnId == null || vulnId.trim().isBlank()) {
      return true;
    }
    return report.vulns().stream().anyMatch(v -> v.vulnId().equalsIgnoreCase(this.vulnId));
  }
}
