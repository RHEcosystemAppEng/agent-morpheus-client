package com.redhat.ecosystemappeng.morpheus.model;

import java.util.Comparator;
import java.util.List;

public record ReportSort(List<SortField> fields) {

  private static final String COMPLETED_AT = "completedAt";
  private static final String ID = "id";

  private static final List<String> VALID_SORT_FIELDS = List.of(COMPLETED_AT, ID);

  public ReportSort {
    if (fields == null || fields.isEmpty()) {
      fields = List.of(new SortField(COMPLETED_AT, SortType.DESC));
    }
    fields.stream().map(SortField::field).forEach(f -> {
      if(!VALID_SORT_FIELDS.contains(f)) {
        throw new IllegalArgumentException("Invalid sortField: " + f);
      }
    });
  }

  private Comparator<Report> addComparator(Comparator<Report> base, Comparator<Report> added) {
    if (base == null) {
      return added;
    }
    return base.thenComparing(added);
  }

  public int compare(Report a, Report b) {
    Comparator<Report> result = null;
    for(var f : fields) {
      Comparator<Report> fieldComparator = null;
      if (f.field().equals(ID)) {
        if (SortType.ASC.equals(f.type())) {
          fieldComparator = Comparator.comparing(Report::id, Comparator.nullsLast(Comparator.naturalOrder()));
        } else {
          fieldComparator = Comparator.comparing(Report::id, Comparator.nullsFirst(Comparator.reverseOrder()));
        }
      }
      if (f.field().equals(COMPLETED_AT)) {
        if (SortType.ASC.equals(f.type())) {
          fieldComparator = Comparator.comparing(Report::completedAt, Comparator.nullsFirst(Comparator.naturalOrder()));
        } else {
          fieldComparator = Comparator.comparing(Report::completedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        }
      }

      result = addComparator(result, fieldComparator);
    };
    if (result == null) {
      return 0;
    }
    return result.compare(a, b);
  }
}
