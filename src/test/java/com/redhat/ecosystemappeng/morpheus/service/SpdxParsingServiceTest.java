package com.redhat.ecosystemappeng.morpheus.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SpdxParsingServiceTest {

  private SpdxParsingService service;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @BeforeEach
  void setUp() throws Exception {
    service = new SpdxParsingService();
    var field = SpdxParsingService.class.getDeclaredField("objectMapper");
    field.setAccessible(true);
    field.set(service, objectMapper);
  }

  @Test
  void parse_rejectsNullRoot() {
    SbomValidationException ex = assertThrows(SbomValidationException.class, () -> service.parse((JsonNode) null));
    assertEquals("Invalid document: expected a JSON object (SPDX SBOM).", ex.getMessage());
  }

  @Test
  void parse_rejectsMissingSpdxVersion() throws Exception {
    String json = """
        {"name": "test", "packages": [], "relationships": []}
        """;
    JsonNode root = objectMapper.readTree(json);
    SbomValidationException ex = assertThrows(SbomValidationException.class, () -> service.parse(root));
    assertEquals("Document is not a valid SPDX SBOM: missing spdxVersion field.", ex.getMessage());
  }

  @Test
  void parse_rejectsUnsupportedSpdxVersion() throws Exception {
    String json = """
        {"spdxVersion": "SPDX-2.2", "name": "test", "packages": [], "relationships": []}
        """;
    JsonNode root = objectMapper.readTree(json);
    SbomValidationException ex = assertThrows(SbomValidationException.class, () -> service.parse(root));
    assertEquals("Unsupported SPDX version: SPDX-2.2. Only SPDX-2.3 is supported.", ex.getMessage());
  }

  @Test
  void parse_acceptsSpdx23_thenFailsOnDescribes() throws Exception {
    Path fixture = Path.of("src/test/resources/devservices/spdx-sboms/invalid/spdx-no-describeby.json");
    JsonNode root = objectMapper.readTree(Files.readString(fixture));
    SbomValidationException ex = assertThrows(SbomValidationException.class, () -> service.parse(root));
    assertEquals("No DESCRIBES relationship found in SPDX document", ex.getMessage());
  }
}
