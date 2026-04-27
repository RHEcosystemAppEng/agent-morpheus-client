// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@patternfly/react-core/dist/styles/base.css";

/**
 * Conditionally enable MSW mocking based on environment variable
 * This function does NOT affect normal app behavior when MSW is disabled.
 * When VITE_ENABLE_MSW is not set to "true", this returns immediately.
 */
async function enableMocking() {
  const shouldEnable = import.meta.env.VITE_ENABLE_MSW === "true";

  if (!shouldEnable) {
    // Return immediately - app starts normally without any MSW code loaded
    return;
  }

  // Only load MSW code when explicitly enabled
  const { startMocking } = await import("./mocks/browser");
  await startMocking();
}

/**
 * Start the app
 * - If MSW is disabled (default): app starts immediately as before
 * - If MSW is enabled: wait for mock setup, then start app
 *
 * This ensures the original functionality is preserved when MSW is not enabled.
 */
enableMocking().then(() => {
  // This is the EXACT same code that was here originally
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
