package com.redhat.ecosystemappeng.morpheus.service.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.audit.Job;
import com.redhat.ecosystemappeng.morpheus.model.audit.Trace;
import com.redhat.ecosystemappeng.morpheus.repository.TraceRepositoryService;
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
public class TraceService {

    private static final Logger LOGGER = Logger.getLogger(TraceService.class);
    @Inject
    TraceRepositoryService repository;

    @Inject
    JobService jobService;

    @Inject
    ObjectMapper mapper;

    public void removeByJobAndTrace(@NotEmpty String jobId, String traceId) {
        if(Objects.isNull(traceId) || traceId.isEmpty()) {
            repository.removeAllTracesOfJob(jobId);
        }
        else {
            repository.removeAllTracesOfJobAndTrace(jobId, traceId);
        }

    }

    public List<Trace> routeAllEndpointToServiceMethod(String jobId, String traceId) {
        List<String> evalsResult;
        if (Objects.nonNull(jobId) && !jobId.isEmpty()) {
            if (Objects.nonNull(traceId) && !traceId.isEmpty()) {
                evalsResult =  repository.findTracesByJobAndTraceId(jobId, traceId);
            }
            else {
                evalsResult = repository.findTracesByJobId(jobId);
            }
            return transformTracesJsonsToPojos(evalsResult, false);
        }
//        Get all evals from DB if jobId not supplied, regardless of traceId value. (traceId depends on the jobId and needs it).
        else {
            List<String> evals = repository.findAll();
            if(Objects.nonNull(evals) && !evals.isEmpty()) {
                return transformTracesJsonsToPojos(evals, false);
            }
            else {
                return List.of();
            }

        }
    }

    private List<Trace> transformTracesJsonsToPojos(List<String> allTraces, boolean allowParallelProcessing) {
        if (allowParallelProcessing && allTraces.size() >= THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING) {
            return allTraces.parallelStream().map(deserializeTrace()).collect(Collectors.toList());
        }
        else {
            return allTraces.stream().filter(Objects::nonNull).map(deserializeTrace()).collect(Collectors.toList());
        }

    }


    private Function<String, Trace> deserializeTrace()  {
        return this::deserializeOneTrace;

    }
    private Trace deserializeOneTrace(String traceJson)  {
        try {
            return this.mapper.readValue(traceJson, Trace.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public void saveMany(List<Trace> traces, boolean skipReferentialIntegrity) {
        LOGGER.debugf("Saving list of Traces documents =>  %s", traces.stream().map(Trace::toString).collect(Collectors.joining(", ")));
        if (!skipReferentialIntegrity) {
            List<Job> jobsInDb = jobService.getAllJobs();
            List<String> JobsIdsInDB = jobsInDb.stream().map(Job::getJobId).toList();
            List<String> listOfTracesJobs = traces.stream().map(Trace::getJobId).toList();
            for  (String jobId : listOfTracesJobs) {
                int searchIndexFound = Collections.binarySearch(JobsIdsInDB, jobId);
                if (searchIndexFound < 0) {
                    throw new WebApplicationException("Cannot save list of traces objects, as jobId=" + jobId + " doesn't exists in Jobs DB", Response.status(UNPROCESSABLE_ENTITY_HTTP_ERROR).build());

                }
            }
        }
        repository.saveMany(traces);
    }
}
