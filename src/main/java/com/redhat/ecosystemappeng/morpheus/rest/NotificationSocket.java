/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.rest;

import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import java.util.Objects;

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
    if(Objects.nonNull(this.session)) {
      session.getAsyncRemote().sendText(message, result -> {
        if (Objects.nonNull(result.getException())) {
          LOGGER.error("Unable to send message: " + result.getException());
        }
      });
    }
  }
}
