package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ReportInput(Scan scan, Image image) {
  
}
