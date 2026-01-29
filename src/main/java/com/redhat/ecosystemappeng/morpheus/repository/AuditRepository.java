package com.redhat.ecosystemappeng.morpheus.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.inject.Inject;

public class AuditRepository {

//    Names of all fields in MongoDB Audit Collections
    public static final String JOBS_COLLECTION = "jobs";
    public static final String BATCHES_COLLECTION = "batches";
    public static final String BATCH_TYPE_FIELD_NAME = "batch_type";
    public static final String LANGUAGE_FIELD_NAME = "app_language";
    public static final String ALL_LANGUAGES_BATCH_LANGUAGE_ID = "all";
    public static final String EXECUTION_START_TIMESTAMP = "execution_start_timestamp";
    public static final String JOB_ID_FIELD_NAME = "job_id";
    public static final String BATCH_ID_FIELD_NAME = "batch_id";
    public static final String CVE_FIELD_NAME = "cve";
    public static final String COMPONENT_FIELD_NAME = "component";
    public static final String COMPONENT_VERSION_FIELD_NAME = "component_version";
    public static final String LLM_NODE_FIELD_NAME = "llm_node";
    public static final String METRIC_NAME_FIELD_NAME = "metric_name";
    public static final String METRIC_VALUE_FIELD_NAME = "metric_value";
    public static final String INTERNAL_COLLECTION_ID = "_id";


    @Inject
    protected ObjectMapper mapper;

}
