package com.redhat.ecosystemappeng.morpheus.metrics;


import com.mongodb.client.MongoCollection;
import com.redhat.ecosystemappeng.morpheus.model.Report;
import com.redhat.ecosystemappeng.morpheus.repository.ReportRepositoryService;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.scheduler.Scheduled;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.bson.Document;

import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.redhat.ecosystemappeng.morpheus.metrics.AgentMorpheusMetrics.JUSTIFICATIONS_ERRORS;
import static com.redhat.ecosystemappeng.morpheus.metrics.AgentMorpheusMetrics.STATE_ERRORS;
import static java.util.stream.Collectors.groupingBy;

@Singleton
@Priority(1)
public class AgentMorpheusBusinessInsights {

//    "false_positive": "false_positive",
//            "code_not_present": "code_not_present",
//            "code_not_reachable": "code_not_reachable",
//            "requires_configuration": "requires_configuration",
//            "requires_dependency": "requires_dependency",
//            "requires_environment": "requires_environment",
//            "compiler_protected": "protected_by_compiler",
//            "runtime_protected": "protected_at_runtime",
//            "perimeter_protected": "protected_at_perimeter",
//            "mitigating_control_protected": "protected_by_mitigating_control",
//            "uncertain": "uncertain",
//            "vulnerable": "vulnerable"

    private static final Set<String> ALL_JUSTIFICATION_LABELS = Set.of("false_positive","code_not_present",
                                                               "code_not_reachable","requires_configuration","requires_dependency","requires_environment",
                                                               "protected_by_compiler","protected_at_runtime","protected_at_perimeter","protected_by_mitigating_control"
                                                               ,"uncertain","vulnerable");

    @Inject
    ReportRepositoryService reportRepositoryService;

    public ConcurrentMap<String, Long> getStatesOfReports() {
        return statesOfReports;
    }

    public ConcurrentMap<String, Long> getJustificationLabelsInSystem() {
        return justificationLabelsInSystem;
    }

    public Double countJustificationLabels(String labelKey) {
        return Double.valueOf(justificationLabelsInSystem.get(labelKey));
    }

    public Long countStateOfReports(String state) {
        return this.statesOfReports.get(state);
    }

    private ConcurrentMap<String, Long> justificationLabelsInSystem;
    private ConcurrentMap<String, Long> statesOfReports;


    public Double calculateRateOfSuccessfulReports() {
        int numberOfSuccesses = statesOfReports.entrySet().stream()
                                                           .filter(element -> !STATE_ERRORS.contains(element.getKey()))
                                                           .map(t->t.getValue()).mapToInt(num->num.intValue()).sum();

        int allCases = statesOfReports.entrySet().stream().map(t->t.getValue()).mapToInt(num->num.intValue()).sum();
        return (double) numberOfSuccesses / allCases;

    }

    public Double calculateRateOfSuccessfulResults() {
        int numOfSuccessfulResults = justificationLabelsInSystem.entrySet().stream()
                                                                            .filter(element -> !JUSTIFICATIONS_ERRORS.contains(element.getKey()))
                                                                            .map(t->t.getValue()).mapToInt(num->num.intValue()).sum();

        int allCases = justificationLabelsInSystem.entrySet().stream().map(t->t.getValue()).mapToInt(num->num.intValue()).sum();
        return (double) numOfSuccessfulResults / allCases;

    }


    @PostConstruct
    public void PrepareMetricsOnStartup() {
        this.justificationLabelsInSystem = loadJustificationLabelsFromDB();
        this.statesOfReports = loadStateOfReportsFromDB();
    }

    @Scheduled(every = "8s")
    void loadJustificationLabels() {
        this.justificationLabelsInSystem = loadJustificationLabelsFromDB();
        this.statesOfReports = loadStateOfReportsFromDB();
    }

    private ConcurrentMap<String, Long> loadJustificationLabelsFromDB() {
        MongoCollection<Document> allReportsDocuments = reportRepositoryService.getCollection();
        Map<String, Long> mappings = StreamSupport.stream(allReportsDocuments.find(new Document()).spliterator(), false).map(reportRepositoryService::toReport)
                .map(report -> report.vulns().stream()
                        .filter(vuln -> Objects.nonNull(vuln.justification()))
                        .map(vuln -> vuln.justification().label()).collect(Collectors.toList()))
                .flatMap(list -> list.stream())
                .collect(groupingBy(Function.identity(), Collectors.counting()));

        ALL_JUSTIFICATION_LABELS.forEach(label -> {
            mappings.computeIfAbsent(label,s-> 0L);
        });

        return new ConcurrentHashMap<>(mappings);


    }

    private ConcurrentMap<String, Long> loadStateOfReportsFromDB() {
        MongoCollection<Document> allReportsDocuments = reportRepositoryService.getCollection();
        Map<String, Long> mappings = StreamSupport.stream(allReportsDocuments.find(new Document()).spliterator(), false).map(reportRepositoryService::toReport)
                .map(this::calculateStateFromDocument)
                .collect(groupingBy(Function.identity(), Collectors.counting()));

        return new ConcurrentHashMap<>(mappings);

    }

    private String calculateStateFromDocument(Report report) {
         return report.state();
    }
}
