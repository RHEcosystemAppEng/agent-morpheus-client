package com.redhat.ecosystemappeng.morpheus.service.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.audit.Eval;
import com.redhat.ecosystemappeng.morpheus.model.audit.Job;
import com.redhat.ecosystemappeng.morpheus.repository.EvalRepositoryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.constraints.NotEmpty;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.redhat.ecosystemappeng.morpheus.rest.audit.BaseAuditEndpoint.UNPROCESSABLE_ENTITY_HTTP_ERROR;
import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING;

@ApplicationScoped
public class EvalService {

    private static final Logger LOGGER = Logger.getLogger(EvalService.class);
    @Inject
    EvalRepositoryService repository;

    @Inject
    JobService jobService;

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
            if(Objects.nonNull(evals) && !evals.isEmpty()) {
                return transformEvalsJsonsToPojos(evals, false);
            }
            else {
                return List.of();
            }

        }
    }

    private List<Eval> transformEvalsJsonsToPojos(List<String> allEvals, boolean allowParallelProcessing) {
        if (allowParallelProcessing && allEvals.size() >= THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING) {
            return allEvals.parallelStream().map(deserializeEval()).collect(Collectors.toList());
        }
        else {
            return allEvals.stream().filter(Objects::nonNull).map(deserializeEval()).collect(Collectors.toList());
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

    public void saveMany(List<Eval> evals) {
        LOGGER.debugf("Saving list of Evals documents =>  %s", evals.stream().map(Eval::toString).collect(Collectors.joining(", ")));
        List<Job> jobsInDb = jobService.getAllJobs();
        List<String> JobsIdsInDB = jobsInDb.stream().map(Job::getJobId).toList();
        List<String> listOfEvalsJobs = evals.stream().map(Eval::getJobId).toList();
        for  (String jobId : listOfEvalsJobs) {
            int searchIndexFound = Collections.binarySearch(JobsIdsInDB, jobId);
            if (searchIndexFound < 0) {
                throw new WebApplicationException("Cannot save list of evals objects, as jobId=" + jobId + " doesn't exists in Jobs DB", Response.status(UNPROCESSABLE_ENTITY_HTTP_ERROR).build());

            }
        }
        repository.saveMany(evals);
    }
}
