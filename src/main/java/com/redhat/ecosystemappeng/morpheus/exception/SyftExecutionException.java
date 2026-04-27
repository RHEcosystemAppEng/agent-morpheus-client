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

package com.redhat.ecosystemappeng.morpheus.exception;

/**
 * Exception thrown when syft command execution fails.
 * Extends RuntimeException for use in async and non-IO call paths.
 */
public class SyftExecutionException extends RuntimeException {

    private final String image;

    public SyftExecutionException(String image, String message) {
        super(message);
        this.image = image;
    }

    public SyftExecutionException(String image, String message, Throwable cause) {
        super(message, cause);
        this.image = image;
    }
    
    /**
     * Get the syft target that failed
     */
    public String getImage() {
        return image;
    }
}

