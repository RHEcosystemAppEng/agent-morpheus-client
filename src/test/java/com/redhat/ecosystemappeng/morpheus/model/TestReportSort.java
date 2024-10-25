package com.redhat.ecosystemappeng.morpheus.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;

public class TestReportSort {

  private static final List<Report> REPORTS = List.of(
      buildReport("a", "2023-10-09T19:35:59.667440"),
      buildReport("b", null),
      buildReport(null, "2025-10-09T19:35:59.667440"),
      buildReport(null, null),
      buildReport("c", "2024-10-09T19:35:59.667440"));

  private static Report buildReport(String id, String completedAt) {
    return new Report(id, null, completedAt, null, null, null, null);
  }

  @Test
  void testCompareId_Asc() {
    var sort = new ReportSort(List.of(new SortField("id", SortType.ASC)));
    List<Report> expected = List.of(REPORTS.get(0), REPORTS.get(1), REPORTS.get(4), REPORTS.get(2), REPORTS.get(3));

    var sorted = REPORTS.stream().sorted(sort::compare).toList();

    for (int i = 0; i < sorted.size(); i++) {
      assertEquals(expected.get(i).id(), sorted.get(i).id());
    }
  }

  @Test
  void testCompareId_Desc() {
    var sort = new ReportSort(List.of(new SortField("id", SortType.DESC)));
    List<Report> expected = List.of(REPORTS.get(0), REPORTS.get(1), REPORTS.get(4), REPORTS.get(2), REPORTS.get(3))
        .reversed();

    var sorted = REPORTS.stream().sorted(sort::compare).toList();

    for (int i = 0; i < sorted.size(); i++) {
      assertEquals(expected.get(i).id(), sorted.get(i).id());
    }
  }

  @Test
  void testCompareCompletedAt_Asc() {
    var sort = new ReportSort(List.of(new SortField("completedAt", SortType.ASC)));
    List<Report> expected = List.of(
        REPORTS.get(1),
        REPORTS.get(3),
        REPORTS.get(0),
        REPORTS.get(4),
        REPORTS.get(2));

    var sorted = REPORTS.stream().sorted(sort::compare).toList();

    for (int i = 0; i < sorted.size(); i++) {
      assertEquals(expected.get(i).completedAt(), sorted.get(i).completedAt());
    }
  }

  @Test
  void testCompareCompletedAt_Desc() {
    var sort = new ReportSort(List.of(new SortField("completedAt", SortType.DESC)));
    List<Report> expected = List.of(
        REPORTS.get(1),
        REPORTS.get(3),
        REPORTS.get(0),
        REPORTS.get(4),
        REPORTS.get(2)).reversed();

    var sorted = REPORTS.stream().sorted(sort::compare).toList();

    for (int i = 0; i < sorted.size(); i++) {
      assertEquals(expected.get(i).completedAt(), sorted.get(i).completedAt());
    }
  }

  @Test
  void testDefault() {
    assertEquals(new ReportSort(Collections.emptyList()),
        new ReportSort(List.of(new SortField("completedAt", SortType.DESC))));
  }

  @Test
  void testInvalidField() {
    assertThrows(IllegalArgumentException.class,
        () -> new ReportSort(List.of(new SortField("id", SortType.ASC), new SortField("invalid", SortType.DESC))));
  }

}
