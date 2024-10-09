package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Set;

public record Report(String id,
    String result,
    String completedAt,
    String imageName,
    String imageTag,
    Set<VulnResult> vulns,
    String filePath) {

}
