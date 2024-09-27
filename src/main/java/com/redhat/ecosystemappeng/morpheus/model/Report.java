package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Set;

public record Report(String id,
    String startedAt,
    String completedAt,
    String imageName,
    String imageTag,
    Set<String> vulns,
    String filePath) {

}
