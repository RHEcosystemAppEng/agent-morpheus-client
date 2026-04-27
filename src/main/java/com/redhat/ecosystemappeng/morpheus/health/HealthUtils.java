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

package com.redhat.ecosystemappeng.morpheus.health;

import java.io.IOException;
import java.net.ConnectException;
import java.net.UnknownHostException;

final class HealthUtils {
    private HealthUtils() {
    }

    static String resolveReason(Throwable e) {
        if (e == null)
            return "Unknown error";
        Throwable cause = e.getCause() != null ? e.getCause() : e;
        String msg = cause.getMessage();
        String className = cause.getClass().getSimpleName();
        // Specific exceptions
        if (className.equals("TimeoutException") || className.contains("Timeout")) {
            return "Request timed out";
        }
        if (cause instanceof ConnectException)
            return "Connection refused";
        if (cause instanceof UnknownHostException)
            return "Unknown host";
        // Generic exceptions
        if (msg != null) {
            int idx = msg.indexOf(":");
            if (idx >= 0) {
                return msg.substring(idx + 1).trim();
            }
            return msg;
        }
        // Fallback
        if (cause instanceof IOException) {
            return "Network error";
        }

        return className;
    }
}
