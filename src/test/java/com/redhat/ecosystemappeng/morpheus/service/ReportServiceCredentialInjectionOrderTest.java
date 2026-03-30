package com.redhat.ecosystemappeng.morpheus.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequestId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Verifies that credentialId is injected into the report JSON before the report is saved to MongoDB.
 */
class ReportServiceCredentialInjectionOrderTest {

  private static final String CREDENTIAL_ID = "cred-test-uuid";
  private static final String CVE_ID = "CVE-2024-1234";

  private final ObjectMapper mapper = new ObjectMapper();
  private final List<String> callOrder = new ArrayList<>();

  private SbomReportService sbomReportService;

  @BeforeEach
  void setUp() throws Exception {
    sbomReportService = new SbomReportService();
    setField("cycloneDxParsingService", new StubCycloneDxParsingService());
    setField("reportService", new TrackingReportService(callOrder, mapper));
    setField("credentialProcessingService", new TrackingCredentialProcessingService(callOrder));
    setField("productRepository", new StubProductRepositoryService());
    setField("userService", new StubUserService());
    setField("objectMapper", mapper);
  }

  @Test
  void submitCycloneDx_injectsCredentialBeforeSave() throws Exception {
    sbomReportService.submitCycloneDx(CVE_ID, new ByteArrayInputStream(new byte[0]), CREDENTIAL_ID);

    assertEquals(
        List.of("inject", "save", "submit"),
        callOrder,
        "credentialId must be injected BEFORE saveReport() and submit() so it is " +
        "persisted in MongoDB and included in the Morpheus payload."
    );
  }

  @Test
  void submitCycloneDx_withoutCredential_skipsInject() throws Exception {
    sbomReportService.submitCycloneDx(CVE_ID, new ByteArrayInputStream(new byte[0]), null);

    assertEquals(List.of("save", "submit"), callOrder,
        "Without a credential, inject must not be called.");
  }

  @Test
  void submitCycloneDx_invalidCveId_throwsBeforeAnyPersistence() {
    assertThrows(Exception.class,
        () -> sbomReportService.submitCycloneDx("INVALID", new ByteArrayInputStream(new byte[0]), CREDENTIAL_ID));

    assertEquals(List.of(), callOrder,
        "Nothing must be persisted when CVE ID validation fails.");
  }

  // ── stubs & trackers ──────────────────────────────────────────────────────

  class TrackingCredentialProcessingService extends CredentialProcessingService {
    private final List<String> order;

    TrackingCredentialProcessingService(List<String> order) {
      this.order = order;
    }

    @Override
    public void injectCredentialId(com.fasterxml.jackson.databind.JsonNode reportNode, String credentialId) {
      order.add("inject");
      // actually inject so the JSON is mutated correctly
      super.injectCredentialId(reportNode, credentialId);
    }
  }

  class TrackingReportService extends ReportService {
    private final List<String> order;
    private final ObjectMapper mapper;

    TrackingReportService(List<String> order, ObjectMapper mapper) {
      this.order = order;
      this.mapper = mapper;
    }

    @Override
    public ReportData createCycloneDxReportData(ParsedCycloneDx parsedCycloneDx, String productId,
        String cveId, boolean useUniqueScanId) {
      ObjectNode report = mapper.createObjectNode();
      report.set("input", mapper.createObjectNode());
      report.set("metadata", mapper.createObjectNode().put("product_id", productId));
      return new ReportData(new ReportRequestId(null, "scan-id"), report);
    }

    @Override
    public ReportData saveReport(ReportData reportData) {
      order.add("save");
      return new ReportData(new ReportRequestId("db-id", reportData.reportRequestId().reportId()), reportData.report());
    }

    @Override
    public void submit(String id, com.fasterxml.jackson.databind.JsonNode report) {
      order.add("submit");
    }
  }

  class StubCycloneDxParsingService extends CycloneDxParsingService {
    @Override
    public ParsedCycloneDx parseCycloneDxFile(java.io.InputStream inputStream) {
      return new ParsedCycloneDx(mapper.createObjectNode(), "test-sbom", "1.0", null, null, null, null);
    }
  }

  class StubProductRepositoryService extends com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService {
    @Override
    public void save(com.redhat.ecosystemappeng.morpheus.model.Product product, String userId) {
      // no-op
    }
  }

  class StubUserService extends UserService {
    @Override
    public String getUserName() {
      return "test-user";
    }
  }

  private void setField(String name, Object value) throws Exception {
    Field field = SbomReportService.class.getDeclaredField(name);
    field.setAccessible(true);
    field.set(sbomReportService, value);
  }
}
