package com.redhat.ecosystemappeng.morpheus.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.FunctionCounter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.runtime.Startup;
import jakarta.annotation.Priority;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentMap;
import java.util.function.Supplier;

@Startup
@Priority(2)
public class AgentMorpheusMetrics {

    static final Set JUSTIFICATIONS_ERRORS = Set.of("uncertain","insufficient_intel");
    static final Set STATE_ERRORS = Set.of("failed","unknown","expired");

    private final MeterRegistry registry;

    private final AgentMorpheusBusinessInsights agentMorpheusBusinessInsights;

    AgentMorpheusMetrics(MeterRegistry registry,AgentMorpheusBusinessInsights agentMorpheusBusinessInsights) {
        this.agentMorpheusBusinessInsights = agentMorpheusBusinessInsights;
        // Register counter metric as per agent morpheus justification label
        this.registry = registry;
        ConcurrentMap<String, Long> justificationLabelsInSystem = agentMorpheusBusinessInsights.getJustificationLabelsInSystem();
        for (Map.Entry<String, Long> label : justificationLabelsInSystem.entrySet()) {
             Gauge.builder(String.format("morpheus_results_label_%s_count", label.getKey()),
                           () -> agentMorpheusBusinessInsights.countJustificationLabels(label.getKey()))
                    .description(String.format("Counter of reports returned with result label=%s", label.getKey()))
                    .baseUnit("operations")
                    .tag("type", "business")
                    .tag("is_erroneous_result", JUSTIFICATIONS_ERRORS.contains(label.getKey()) ? "true" : "false" )
                    .tag("is_positive_result", label.getKey().equals("vulnerable") ? "true" : "false")
                    .register(this.registry);



        }
        ConcurrentMap<String, Long> statesOfReports = agentMorpheusBusinessInsights.getStatesOfReports();
        for (Map.Entry<String, Long> state : statesOfReports.entrySet()) {
             Gauge.builder(String.format("morpheus_reports_state_%s_total", state.getKey()),
                           () -> agentMorpheusBusinessInsights.countStateOfReports(state.getKey()))
                    .description(String.format("Counter of reports ended with state=%s", state.getKey()))
                    .tag("type", "business")
                    .tag("is_erroneous_result", STATE_ERRORS.contains(state.getKey()) ? "true" : "false" )
                    .register(this.registry);

        }

    }

@Startup
@Produces
public Gauge rateOfSuccessfulReports() {
        return Gauge.builder("morpheus_rate_of_successful_reports",
                             () -> agentMorpheusBusinessInsights.calculateRateOfSuccessfulReports())
                    .description("rate of reports with state of completed or not failed/unknown")
                    .tag("type", "business")
                    .register(this.registry);
    }

@Startup
@Produces
public Gauge rateOfSuccessfulResults() {
        return Gauge.builder("morpheus_rate_of_successful_results",
                             () -> agentMorpheusBusinessInsights.calculateRateOfSuccessfulResults())
                    .description("rate of reports with a concrete positive result of analysis , not uncertain or insufficient_intel")
                    .tag("type", "business")
                    .register(this.registry);
    }



}

