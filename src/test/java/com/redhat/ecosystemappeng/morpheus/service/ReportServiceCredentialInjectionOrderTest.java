package com.redhat.ecosystemappeng.morpheus.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.model.ParsedCycloneDx;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequestId;
import com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService;
import io.quarkus.test.InjectMock;
import io.quarkus.test.component.QuarkusComponentTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

/**
 * Verifies that credentialId is injected into the report JSON before the report is saved to MongoDB.
 */
@QuarkusComponentTest
class ReportServiceCredentialInjectionOrderTest {

  private static final String CREDENTIAL_ID = "cred-test-uuid";
  private static final String CVE_ID = "CVE-2024-1234";

  @Inject
  SbomReportService sbomReportService;

  @InjectMock
  CycloneDxParsingService cycloneDxParsingService;

  @InjectMock
  ReportService reportService;

  @InjectMock
  CredentialProcessingService credentialProcessingService;

  @InjectMock
  ProductRepositoryService productRepository;

  @InjectMock
  UserService userService;

  private final ObjectMapper mapper = new ObjectMapper();

  @BeforeEach
  void setUp() throws Exception {
    ObjectNode report = mapper.createObjectNode();
    report.set("input", mapper.createObjectNode());

    ParsedCycloneDx parsedCycloneDx = new ParsedCycloneDx(
        mapper.createObjectNode(), "test-sbom", "1.0", null, null, null, null);

    ReportData reportData = new ReportData(new ReportRequestId(null, "scan-id"), report);
    ReportData savedReportData = new ReportData(new ReportRequestId("db-id", "scan-id"), report);

    Mockito.when(cycloneDxParsingService.parseCycloneDxFile(any())).thenReturn(parsedCycloneDx);
    Mockito.when(reportService.createCycloneDxReportData(any(), any(), any(), eq(false))).thenReturn(reportData);
    Mockito.when(reportService.saveReport(any())).thenReturn(savedReportData);
    Mockito.when(userService.getUserName()).thenReturn("test-user");
  }

  @Test
  void submitCycloneDx_injectsCredentialBeforeSave() throws Exception {
    sbomReportService.submitCycloneDx(CVE_ID, new ByteArrayInputStream(new byte[0]), CREDENTIAL_ID);

    InOrder inOrder = Mockito.inOrder(credentialProcessingService, reportService);
    assertDoesNotThrow(() -> {
      inOrder.verify(credentialProcessingService).injectCredentialId(any(JsonNode.class), eq(CREDENTIAL_ID));
      inOrder.verify(reportService).saveReport(any());
      inOrder.verify(reportService).submit(any(), any(JsonNode.class));
    }, "credentialId must be injected BEFORE saveReport() and submit(), " +
       "otherwise it is not persisted in MongoDB and not included in the Morpheus payload");
  }

  @Test
  void submitCycloneDx_withoutCredential_skipsInject() throws Exception {
    sbomReportService.submitCycloneDx(CVE_ID, new ByteArrayInputStream(new byte[0]), null);

    Mockito.verify(credentialProcessingService, Mockito.never()).injectCredentialId(any(), any());
    Mockito.verify(reportService).saveReport(any());
    Mockito.verify(reportService).submit(any(), any());
  }

  @Test
  void submitCycloneDx_invalidCveId_throwsBeforeAnyPersistence() throws Exception {
    assertThrows(Exception.class,
        () -> sbomReportService.submitCycloneDx("INVALID", new ByteArrayInputStream(new byte[0]), CREDENTIAL_ID));

    Mockito.verify(credentialProcessingService, Mockito.never()).injectCredentialId(any(), any());
    Mockito.verify(reportService, Mockito.never()).saveReport(any());
    Mockito.verify(reportService, Mockito.never()).submit(any(), any());
  }
}
