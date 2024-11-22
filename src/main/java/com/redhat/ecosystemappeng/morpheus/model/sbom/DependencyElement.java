package com.redhat.ecosystemappeng.morpheus.model.sbom;

import java.util.List;

public record DependencyElement(
    String _id,
    String name,
    String versionInfo,
    String purl,
    List<DependencyElement> dependencies) {
}
