package com.redhat.ecosystemappeng.morpheus.rest;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import com.redhat.ecosystemappeng.morpheus.model.GroupedReportRow;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.SortType;
import com.redhat.ecosystemappeng.morpheus.service.GroupedReportsService;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectMock;
import io.restassured.http.ContentType;

@QuarkusTest
class GroupedReportsEndpointTest {

    @InjectMock
    GroupedReportsService groupedReportsService;

    @Test
    void testGetGroupedReports_ReturnsExpectedResults() {
        // Arrange
        Map<String, Integer> cveStatusCounts = new HashMap<>();
        cveStatusCounts.put("FALSE", 2);
        cveStatusCounts.put("TRUE", 1);

        Map<String, Integer> statusCounts = new HashMap<>();
        statusCounts.put("completed", 3);

        GroupedReportRow row1 = new GroupedReportRow(
            "test-sbom-product-1",
            "product-1",
            "CVE-2024-12345",
            cveStatusCounts,
            statusCounts,
            "2025-01-15T11:05:00.000000",
            3
        );

        GroupedReportRow row2 = new GroupedReportRow(
            "test-sbom-product-2",
            "product-2",
            "CVE-2024-67890",
            Map.of("FALSE", 1),
            Map.of("completed", 1),
            "2025-01-16T10:05:00.000000",
            1
        );

        List<GroupedReportRow> mockResults = List.of(row1, row2);
        PaginatedResult<GroupedReportRow> mockPaginatedResult = new PaginatedResult<>(
            2L,  // totalElements
            1L,  // totalPages
            mockResults.stream()
        );

        when(groupedReportsService.getGroupedReports(
            eq("completedAt"),
            eq(SortType.DESC),
            any(Pagination.class)
        )).thenReturn(mockPaginatedResult);

        // Act & Assert
        given()
            .when()
            .queryParam("sortField", "completedAt")
            .queryParam("sortDirection", "DESC")
            .queryParam("page", 0)
            .queryParam("pageSize", 100)
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Pages", "1")
            .header("X-Total-Elements", "2")
            .body("$", hasSize(2))
            .body("[0].sbomName", equalTo("test-sbom-product-1"))
            .body("[0].productId", equalTo("product-1"))
            .body("[0].cveId", equalTo("CVE-2024-12345"))
            .body("[0].cveStatusCounts.FALSE", equalTo(2))
            .body("[0].cveStatusCounts.TRUE", equalTo(1))
            .body("[0].statusCounts.completed", equalTo(3))
            .body("[0].completedAt", equalTo("2025-01-15T11:05:00.000000"))
            .body("[0].numReports", equalTo(3))
            .body("[1].sbomName", equalTo("test-sbom-product-2"))
            .body("[1].productId", equalTo("product-2"))
            .body("[1].cveId", equalTo("CVE-2024-67890"))
            .body("[1].cveStatusCounts.FALSE", equalTo(1))
            .body("[1].statusCounts.completed", equalTo(1))
            .body("[1].completedAt", equalTo("2025-01-16T10:05:00.000000"))
            .body("[1].numReports", equalTo(1));
    }

    @Test
    void testGetGroupedReports_WithDefaultParameters() {
        // Arrange
        GroupedReportRow row = new GroupedReportRow(
            "test-sbom",
            "product-1",
            "CVE-2024-12345",
            Map.of("FALSE", 1),
            Map.of("completed", 1),
            "2025-01-15T10:05:00.000000",
            1
        );

        PaginatedResult<GroupedReportRow> mockPaginatedResult = new PaginatedResult<>(
            1L,
            1L,
            Stream.of(row)
        );

        when(groupedReportsService.getGroupedReports(
            eq("completedAt"),
            eq(SortType.DESC),
            any(Pagination.class)
        )).thenReturn(mockPaginatedResult);

        // Act & Assert
        given()
            .when()
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Pages", "1")
            .header("X-Total-Elements", "1")
            .body("$", hasSize(1))
            .body("[0].productId", equalTo("product-1"));
    }

    @Test
    void testGetGroupedReports_WithSortBySbomName() {
        // Arrange
        GroupedReportRow row = new GroupedReportRow(
            "test-sbom",
            "product-1",
            "CVE-2024-12345",
            Map.of("FALSE", 1),
            Map.of("completed", 1),
            "2025-01-15T10:05:00.000000",
            1
        );

        PaginatedResult<GroupedReportRow> mockPaginatedResult = new PaginatedResult<>(
            1L,
            1L,
            Stream.of(row)
        );

        when(groupedReportsService.getGroupedReports(
            eq("sbomName"),
            eq(SortType.ASC),
            any(Pagination.class)
        )).thenReturn(mockPaginatedResult);

        // Act & Assert
        given()
            .when()
            .queryParam("sortField", "sbomName")
            .queryParam("sortDirection", "ASC")
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", hasSize(1));
    }

    @Test
    void testGetGroupedReports_WithPagination() {
        // Arrange
        GroupedReportRow row = new GroupedReportRow(
            "test-sbom",
            "product-1",
            "CVE-2024-12345",
            Map.of("FALSE", 1),
            Map.of("completed", 1),
            "2025-01-15T10:05:00.000000",
            1
        );

        PaginatedResult<GroupedReportRow> mockPaginatedResult = new PaginatedResult<>(
            10L,  // totalElements
            2L,   // totalPages
            Stream.of(row)
        );

        when(groupedReportsService.getGroupedReports(
            eq("completedAt"),
            eq(SortType.DESC),
            any(Pagination.class)
        )).thenReturn(mockPaginatedResult);

        // Act & Assert
        given()
            .when()
            .queryParam("page", 0)
            .queryParam("pageSize", 5)
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("X-Total-Pages", "2")
            .header("X-Total-Elements", "10")
            .body("$", hasSize(1));
    }

    @Test
    void testGetGroupedReports_HandlesServiceException() {
        // Arrange
        when(groupedReportsService.getGroupedReports(
            anyString(),
            any(SortType.class),
            any(Pagination.class)
        )).thenThrow(new RuntimeException("Database connection failed"));

        // Act & Assert
        given()
            .when()
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(500)
            .contentType(ContentType.JSON)
            .body("error", notNullValue());
    }

    @Test
    void testGetGroupedReports_WithEmptyCompletedAt() {
        // Arrange
        GroupedReportRow row = new GroupedReportRow(
            "test-sbom",
            "product-1",
            "CVE-2024-12345",
            Map.of("FALSE", 1),
            Map.of("completed", 1),
            "",  // empty completedAt
            1
        );

        PaginatedResult<GroupedReportRow> mockPaginatedResult = new PaginatedResult<>(
            1L,
            1L,
            Stream.of(row)
        );

        when(groupedReportsService.getGroupedReports(
            eq("completedAt"),
            eq(SortType.DESC),
            any(Pagination.class)
        )).thenReturn(mockPaginatedResult);

        // Act & Assert
        given()
            .when()
            .get("/api/v1/reports/grouped")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("[0].completedAt", equalTo(""));
    }
}

