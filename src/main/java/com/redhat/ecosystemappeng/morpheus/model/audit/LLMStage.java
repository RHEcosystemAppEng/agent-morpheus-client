package com.redhat.ecosystemappeng.morpheus.model.audit;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum LLMStage {
    CALCULATE_CVE_SCORE,
    CHECKLIST_GENERATION,
    AGENT_LOOP,
    SUMMARIZE,
    JUSTIFICATION,
    CVSS_CALCULATION
}
