package com.redhat.ecosystemappeng.morpheus.model.sbom;

import java.util.List;

public record Sbom(Product product, List<SbomPackage> packages) {
  
}
