package com.redhat.ecosystemappeng.morpheus.service.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.audit.Eval;
import com.redhat.ecosystemappeng.morpheus.repository.EvalRepositoryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING;

@ApplicationScoped
public class EvalService {

    @Inject
    EvalRepositoryService repository;

    @Inject
    ObjectMapper mapper;

    public void removeByJobAndTrace(@NotEmpty String jobId, String traceId) {
        if(Objects.isNull(traceId) || traceId.isEmpty()) {
            repository.removeAllEvalsOfJob(jobId);
        }
        else {
            repository.removeAllEvalsOfJobAndTrace(jobId, traceId);
        }

    }

    public List<Eval> getCveAndApplicationEvals(String cveId, String component, String componentVersion, String metricName) {
        List<String> cveAndApplicationEvals = repository.findCveAndApplicationEvals(cveId, component, componentVersion, metricName);

        return transformEvalsJsonsToPojos(cveAndApplicationEvals, false);
    }

    public List<Eval> routeAllEndpointToServiceMethod(String jobId, String traceId) {
        List<String> evalsResult;
        if (Objects.nonNull(jobId) && !jobId.isEmpty()) {
            if (Objects.nonNull(traceId) && !traceId.isEmpty()) {
                evalsResult =  repository.findEvalsByJobAndTraceId(jobId, traceId);
            }
            else {
                evalsResult = repository.findEvalsByJobId(jobId);
            }
            return transformEvalsJsonsToPojos(evalsResult, false);
        }
//        Get all evals from DB if jobId not supplied, regardless of traceId value.
        else {
            List<String> evals = repository.findAll();
            return transformEvalsJsonsToPojos(evals, false);
        }
    }

    private List<Eval> transformEvalsJsonsToPojos(List<String> allEvals, boolean allowParallelProcessing) {
        if (allowParallelProcessing && allEvals.size() >= THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING) {
            return allEvals.parallelStream().map(deserializeEval()).collect(Collectors.toList());
        }
        else {
            return allEvals.stream().map(deserializeEval()).collect(Collectors.toList());
        }

    }


    private Function<String, Eval> deserializeEval()  {
        return this::deserializeOneEval;

    }
    private Eval deserializeOneEval(String evalJson)  {
        try {
            return this.mapper.readValue(evalJson, Eval.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
