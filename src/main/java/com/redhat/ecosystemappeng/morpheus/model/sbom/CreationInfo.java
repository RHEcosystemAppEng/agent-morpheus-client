package com.redhat.ecosystemappeng.morpheus.model.sbom;

import java.util.List;

public record CreationInfo(String created, List<String> creators, String licenseListVersion) {
  
}
