package com.redhat.ecosystemappeng.morpheus.rest;

import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

@ServerEndpoint("/notifications")
@ApplicationScoped
public class NotificationSocket {

  private static final Logger LOGGER = Logger.getLogger(NotificationSocket.class);

  Session session;
  
  @OnOpen
  public void onOpen(Session session) {
    this.session = session;
  }

  @OnClose
  public void onClose(Session session) {
    this.session = null;
  }

  @OnMessage
  public void onMessage(String message) {
    if(this.session != null) {
      session.getAsyncRemote().sendText(message, result -> {
        if (result.getException() != null) {
          LOGGER.error("Unable to send message: " + result.getException());
        }
      });
    }
  }
}
