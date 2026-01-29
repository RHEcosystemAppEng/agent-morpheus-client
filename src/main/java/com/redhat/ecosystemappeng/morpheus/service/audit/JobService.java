package com.redhat.ecosystemappeng.morpheus.service.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.audit.Job;
import com.redhat.ecosystemappeng.morpheus.repository.JobRepositoryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@ApplicationScoped
public class JobService extends AuditService {

  private static final Logger LOGGER = Logger.getLogger(JobService.class);

   @Inject
  JobRepositoryService repository;

  @Inject
  ObjectMapper mapper;

  public void save(Job job)  {
    LOGGER.debugf("Saving Job %s", job.getJobId());
      try {
          String jobJSON = mapper.writeValueAsString(job);
          LOGGER.debugf("job payload to be written to DB: %s %s", System.lineSeparator() ,mapper.writerWithDefaultPrettyPrinter().writeValueAsString(job));
          repository.save(jobJSON);
      } catch (JsonProcessingException e) {
          throw new RuntimeException(e);
      }
  }

  public void saveMany(List<Job> jobs) {
      LOGGER.debugf("Saving list of Jobs ids =>  %s", jobs.stream().map(Job::getJobId).collect(Collectors.joining(", ")));
      repository.saveMany(jobs);
  }
  
  public Job getById(String id) {
    LOGGER.debugf("Getting job %s by internal id", id);
    String jobJSON = repository.findById(id);
    if (Objects.nonNull(jobJSON)) {
        return deserializeOneJob(jobJSON);
    }
    else{
        throw new NotFoundException("Job with Internal id=" + id + " not found");
    }


  }

  public Job getByJobId(String jobId)  {
    LOGGER.debugf("Getting job %s by job Id", jobId);
    String jobJSON = repository.findByJobId(jobId);
      if (Objects.nonNull(jobJSON)) {
          return deserializeOneJob(jobJSON);
      }
      else{
          throw new NotFoundException("Job with jobId=" + jobId + " not found");
      }
  }


  public List<Job> getAllJobs() {
    LOGGER.debugf("Getting all jobs");
      List<String> allJobs = repository.findAll();
      if (Objects.nonNull(allJobs)) {
          return transformJobsJsonsToPojos(allJobs);
      }
      else{
          throw new NotFoundException("There are no jobs in the database");
      }

  }


  public List<Job> getAllJobsByBatchId(String batchId) {
      LOGGER.debugf("Getting all jobs documents of batchId %s", batchId);
      List<String> allJobs = repository.findAllJobsByBatchId(batchId);
      if(Objects.nonNull(allJobs)){
          return transformJobsJsonsToPojos(allJobs);
      }
      else {
          throw new NotFoundException(String.format("There are no jobs associated with batchId= %s in the database", batchId));
      }
  }

  public List<Job> getAllJobsByCve(String cveId) {
      LOGGER.debugf("Getting all jobs documents of vulnerability %s", cveId);
      List<String> allJobs = repository.findAllJobsByCve(cveId);
      if (Objects.nonNull(allJobs)) {
          return transformJobsJsonsToPojos(allJobs);
      }
      else {
          throw new NotFoundException(String.format("There are no jobs associated with cveId= %s in the database", cveId));
      }

  }

public List<Job> getAllJobsByCveAndApplication(String cveId, String appName, String appVersion) {
      LOGGER.debugf("Getting all jobs documents of vulnerability %s", cveId);
      List<String> allJobs = repository.findAllJobsByCveAndComponent(cveId, appName, appVersion);
      if (Objects.nonNull(allJobs)) {
          return transformJobsJsonsToPojos(allJobs);
      }
      else {
          throw new NotFoundException(String.format("There are no jobs associated with cveId= %s, appName= %s and appversion= %s in the database", cveId, appName, appVersion));
      }
  }


  public void remove(String id) {
    LOGGER.debugf("Removing Job internal id %s", id);
    repository.removeById(id);

  }

  public void removeByJobId(String jobId) {
    LOGGER.debugf("Removing Job jobId %s", jobId);
    repository.removeByJobId(jobId);
  }

  public void removeMany(List<String> ids) {
    LOGGER.debugf("Removing internal Jobs ids %s", ids.toString());
    repository.removeMany(ids);
  }

  public void removeManyJobsIds(List<String> ids) {
    LOGGER.debugf("Removing Jobs ids %s", ids.toString());
    repository.removeManyJobsIds(ids);
  }

  private List<Job> transformJobsJsonsToPojos(List<String> allJobs)  {
        if (allJobs.size() >= THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING) {
            return allJobs.parallelStream().map(deserializeJob()).collect(Collectors.toList());
        }
        else {
            return allJobs.stream().map(deserializeJob()).collect(Collectors.toList());
        }
    }

  private Function<String, Job> deserializeJob()  {
        return this::deserializeOneJob;
    }

  private Job deserializeOneJob(String jobJSON)  {
      try {
          return this.mapper.readValue(jobJSON, Job.class);
      } catch (JsonProcessingException e) {
          throw new RuntimeException(e);
      }
  }

    public List<Job> routeAllEndpointToServiceMethod(String batchId, String cveId, String component, String componentVersion) {
      if (!batchId.trim().isEmpty() && !cveId.isEmpty() ) {
          throw new IllegalArgumentException("Wrong assignment of query parameters, populate only one of the following: batchId or cveId or (cveId , component and component version)");
      }
//      If all query parameters not populated, just route to service method to get all jobs.
      else if (batchId.trim().isEmpty() && cveId.trim().isEmpty() && component.trim().isEmpty() && componentVersion.trim().isEmpty() ) {
          return this.getAllJobs();
      }
//    Otherwise, if batchId query parameter populated, then just route to service method to get all jobs of this batchId
      else if (!batchId.trim().isEmpty()){
          return this.getAllJobsByBatchId(batchId);
//    Otherwise, if cve, component, componentVersion query parameter all populated , then just route to service method to get all jobs of this combination of a versioned application and a cve.
      } else if (!cveId.trim().isEmpty() &&  !component.trim().isEmpty() && !componentVersion.trim().isEmpty() ) {
          return this.getAllJobsByCveAndApplication(cveId, component, componentVersion);
      }
      //    Otherwise, if cve populated alone , then just route to service method to get all jobs runs of analysis runs checked for exploitability of the given cveId.
      else if (!cveId.trim().isEmpty()){
          return this.getAllJobsByCve(cveId);
      }
      else {
          throw new IllegalArgumentException("Wrong assignment of query parameters, Populating component or componentVersion or both of them together without CVE is not supported.");
      }
    }
}
