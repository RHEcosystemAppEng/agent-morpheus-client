package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.ReportSseMessage;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.subscription.MultiEmitter;
import jakarta.enterprise.context.ApplicationScoped;

/**
 * Fan-out for report/product catalog changes. One Multi subscriber per connected browser tab.
 */
@ApplicationScoped
public class ReportSseBroadcaster {

  private static final Logger LOGGER = Logger.getLogger(ReportSseBroadcaster.class);

  private final CopyOnWriteArrayList<MultiEmitter<? super ReportSseMessage>> subscribers = new CopyOnWriteArrayList<>();

  public Multi<ReportSseMessage> subscribe() {
    return Multi.<ReportSseMessage>createFrom().emitter(emitter -> {
      subscribers.add(emitter);
      emitter.onTermination(() -> subscribers.remove(emitter));
    });
  }

  /** Coarse signal: any reports/products list or detail the UI caches may have changed. */
  public void publishCatalogChanged() {
    emit(new ReportSseMessage("catalog", null, null));
  }

  private void emit(ReportSseMessage message) {
    List<MultiEmitter<? super ReportSseMessage>> snapshot = new ArrayList<>(subscribers);
    for (MultiEmitter<? super ReportSseMessage> emitter : snapshot) {
      try {
        emitter.emit(message);
      } catch (Exception e) {
        LOGGER.debug("Dropping SSE subscriber after emit failure", e);
        subscribers.remove(emitter);
      }
    }
  }
}
