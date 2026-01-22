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
