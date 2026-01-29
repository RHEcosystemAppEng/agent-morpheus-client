package com.redhat.ecosystemappeng.morpheus.model.audit;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum BatchType {
    INTEGRATION_TESTS,
    CONFUSION_MATRIX

}
