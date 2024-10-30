package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Set;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record Report(String id,
    String result,
    String completedAt,
    String imageName,
    String imageTag,
    Set<VulnResult> vulns,
    String filePath) {

}
