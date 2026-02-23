package com.redhat.ecosystemappeng.morpheus.service.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.audit.Batch;
import com.redhat.ecosystemappeng.morpheus.model.audit.BatchType;
import com.redhat.ecosystemappeng.morpheus.repository.BatchRepositoryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.NotFoundException;
import org.jboss.logging.Logger;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.redhat.ecosystemappeng.morpheus.repository.AuditRepository.ALL_LANGUAGES_BATCH_LANGUAGE_ID;

@ApplicationScoped
public class BatchService extends AuditService {

  private static final Logger LOGGER = Logger.getLogger(BatchService.class);

  @Inject
  BatchRepositoryService repository;

  @Inject
  ObjectMapper mapper;

  public void save(Batch batch)  {
    LOGGER.infof("Saving batch %s", batch.getBatchId());

      String batchJSON;
      try {
          batchJSON = mapper.writeValueAsString(batch);
          LOGGER.debugf("batch payload to be written to DB: %s %s", System.lineSeparator() ,mapper.writerWithDefaultPrettyPrinter().writeValueAsString(batch));
      } catch (JsonProcessingException e) {
          throw new RuntimeException(e);
      }
      repository.save(batchJSON);
  }
  
  public Batch getById(String id) {
    LOGGER.debugf("Getting batch %s by internal id", id);
    String batchJson = repository.findById(id);
    return deserializeOneBatch(batchJson);

  }

  public Batch getByBatchId(String batchId)  {
    LOGGER.debugf("Getting Batch %s by batch Id", batchId);
    String batchJSON = repository.findByBatchId(batchId);
    if(Objects.nonNull(batchJSON)) {
       return deserializeOneBatch(batchJSON);
    }
    else {
        throw new NotFoundException("Batch with id=" + batchId + " not found");
    }

  }


  public List<Batch> getAllBatches()  {
    LOGGER.debugf("Getting all batches");
      List<String> allBatches = repository.findAll();
      return transformBatchesJsonsToPojos(allBatches, false);
  }

  public List<Batch> getMixedLanguagesBatches() {
    LOGGER.debugf("Getting all Mixed Languages batches");
      List<String> allBatches = repository.findAllMixedLanguagesBatches();
      if (Objects.nonNull(allBatches)) {
          return transformBatchesJsonsToPojos(allBatches, false);
      }
      else if (this.apiBlankListResultReturnsError) {
          throw new NotFoundException("Batches documents for mixed/all languages were not found");
      }
      else {
          return Collections.emptyList();
      }

  }

  public List<Batch> getAllBatchesByLanguage(String language) {
    LOGGER.debugf("Getting all batches of language %s", language);
      List<String> allBatches = repository.findAllBatchesByLanguage(language);
      if(Objects.nonNull(allBatches) && !allBatches.isEmpty()) {
          return transformBatchesJsonsToPojos(allBatches, false);
      }
      else if (this.apiBlankListResultReturnsError) {
          throw new NotFoundException("Batches documents for language=" + language + " were not found");
      }
      else {
          return Collections.emptyList();
      }
  }

  public Batch getLatestBatch(boolean languageSpecific, String language, BatchType batchType) {
    LOGGER.debugf("Getting latest %s batch of type %s", languageSpecific ? language : "Mixed Languages",batchType);
      String latestExecutedBatch = repository.findLatestExecutedBatch(languageSpecific, language, batchType);
      if(Objects.nonNull(latestExecutedBatch)) {
        return deserializeOneBatch(latestExecutedBatch);
      }
      else {
          throw new NotFoundException("There are no batches found for batch type=" + batchType.name() + ", and" + getExceptionMessageBasedOnCriteria(languageSpecific, language));
      }
  }

    private static String getExceptionMessageBasedOnCriteria(boolean languageSpecific, String language) {
        if (languageSpecific) {
            return String.format(" language %s ", language);
        }
        else {
            return " mixed languages";
        }

    }


    public void remove(String id) {
    LOGGER.debugf("Removing Batch internal id %s", id);
    repository.removeById(id);

  }

  public void removeByBatchId(String batchId) {
    LOGGER.debugf("Removing batch batchId %s", batchId);
    if(!repository.removeByBatchId(batchId)) {
        throw new NotFoundException(String.format("BatchId= %s not found, thus cannot be deleted", batchId));
    }
  }

  public void removeMany(List<String> ids) {
    LOGGER.debugf("Removing internal Batches ids %s", ids.toString());
    repository.removeMany(ids);
  }

  public void removeManyBatchIds(List<String> ids) {
    LOGGER.debugf("Removing Jobs ids %s", ids.toString());
    repository.removeManyBatchIds(ids);
  }

  private List<Batch> transformBatchesJsonsToPojos(List<String> allJobs, boolean allowParallelProcessing) {
        if (allowParallelProcessing && allJobs.size() >= THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING) {
            return allJobs.parallelStream().map(deserializeJob()).collect(Collectors.toList());
        }
        else {
            return allJobs.stream().map(deserializeJob()).collect(Collectors.toList());
        }

    }


  private Function<String, Batch> deserializeJob()  {
        return this::deserializeOneBatch;

    }
  private Batch deserializeOneBatch(String batchJson)  {
      try {
          return this.mapper.readValue(batchJson, Batch.class);
      } catch (JsonProcessingException e) {
          throw new RuntimeException(e);
      }
  }

    public List<Batch> routeAllEndpointToServiceMethod(@Valid @Pattern(regexp = REGEX_ALLOWED_LANGUAGES) String language) {
      if (language.trim().equalsIgnoreCase(ALL_LANGUAGES_BATCH_LANGUAGE_ID)) {
          return this.getMixedLanguagesBatches();
      }
      else if (language.trim().isEmpty()) {
         return this.getAllBatches();
      }
      else {
          return this.getAllBatchesByLanguage(language);
      }
    }

    public Batch routeLatestToServiceMethod(String language, BatchType batchType) {
        if (language.trim().isBlank()) {
            throw new IllegalArgumentException("Language parameter cannot be blank for retrieving latest batch, must be a specific allowed language or 'all'");
        }
        if(language.trim().equalsIgnoreCase(ALL_LANGUAGES_BATCH_LANGUAGE_ID)) {
            return this.getLatestBatch(false, language , batchType);
        }
        else {
            return this.getLatestBatch(true, language, batchType);
        }
    }
}
