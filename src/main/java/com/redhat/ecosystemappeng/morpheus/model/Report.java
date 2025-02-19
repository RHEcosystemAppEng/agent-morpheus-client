package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Map;
import java.util.Set;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record Report(
    String id,
    String name,
    String startedAt,
    String completedAt,
    String imageName,
    String imageTag,
    String state,
    Set<VulnResult> vulns,
    Map<String, String> metadata) {

}
