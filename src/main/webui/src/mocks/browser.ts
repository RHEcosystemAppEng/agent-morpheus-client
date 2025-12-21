/**
 * MSW browser setup
 *
 * This file initializes the MSW Service Worker in the browser.
 * The service worker intercepts network requests and returns mock responses.
 *
 * To use mocks:
 * 1. Run: npm run msw:init (one-time setup to copy the worker file)
 * 2. Set VITE_ENABLE_MSW=true in your environment
 * 3. Start your dev server
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Set up MSW worker with our mock handlers
 * This worker will intercept all HTTP requests matching our handlers
 */
export const worker = setupWorker(...handlers);

/**
 * Start the MSW worker
 * Call this function to enable mocking
 */
export async function startMocking() {
  if (typeof window === "undefined") {
    // Not in browser environment
    return;
  }

  try {
    await worker.start({
      // Configure MSW to log requests in development
      onUnhandledRequest: "warn",
      // Service worker script location
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });
    console.log("[MSW] Mock Service Worker started successfully");
  } catch (error) {
    console.error("[MSW] Failed to start Mock Service Worker:", error);
    console.error("[MSW] Make sure you have run: npm run msw:init");
  }
}

/**
 * Stop the MSW worker
 * Call this function to disable mocking
 */
export function stopMocking() {
  if (typeof window === "undefined") {
    return;
  }

  worker.stop();
  console.log("[MSW] Mock Service Worker stopped");
}
