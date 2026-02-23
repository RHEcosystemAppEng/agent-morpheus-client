package com.redhat.ecosystemappeng.morpheus.service.audit;

import org.eclipse.microprofile.config.inject.ConfigProperty;

public class AuditService {

  public static final int THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING = 100;
  public static final String REGEX_PATTERN_FOR_CVE = "CVE-\\d{4}-\\d{4,7}";
  public static final String REGEX_ALLOWED_LANGUAGES = "go|python|c|javascript|java|all|\\s*";

    @ConfigProperty(name = "exploitiq.audit.list-api.blank-list.error", defaultValue = "false")
    protected Boolean apiBlankListResultReturnsError;
}
