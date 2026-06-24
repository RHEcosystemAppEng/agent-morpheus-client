# MSW (Mock Service Worker) Setup

This directory contains the MSW (Mock Service Worker) configuration for API mocking in development and testing.

## What is MSW?

MSW (Mock Service Worker) is a library that intercepts HTTP requests at the network level using Service Workers. This allows you to:

- **Develop frontend features** without needing a running backend
- **Test components** with consistent mock data
- **Simulate different API responses** (success, errors, edge cases)
- **Work offline** or with unreliable network connections

## Quick Start

### 1. Initial Setup (One-time)

The MSW service worker file has already been initialized. If you need to reinitialize it:

```bash
npm run msw:init
```

This copies the `mockServiceWorker.js` file to the `public/` directory.

### 2. Enable Mocking

To enable MSW mocking, set the `VITE_ENABLE_MSW` environment variable to `true`:

**Option A: Using npm script (recommended)**

```bash
npm run dev:msw
```

**Option B: Using environment variable**

```bash
VITE_ENABLE_MSW=true npm run dev
```

**Option C: Create a `.env` file**
Create a `.env` file in `src/main/webui/` with:

```
VITE_ENABLE_MSW=true
```

Then run:

```bash
npm run dev
```

### 3. Verify Mocking is Active

When MSW is enabled, you should see this message in the browser console:

```
[MSW] Mock Service Worker started successfully
```

## File Structure

```
src/mocks/
├── README.md          # This file
├── handlers.ts        # Mock request handlers (API endpoint mocks)
└── browser.ts         # Browser setup and initialization
```

## How It Works

1. **Service Worker**: MSW registers a Service Worker (`mockServiceWorker.js`) that intercepts all HTTP requests
2. **Handlers**: The `handlers.ts` file defines which requests to intercept and what responses to return
3. **Integration**: `main.tsx` conditionally loads MSW based on the `VITE_ENABLE_MSW` environment variable
4. **Browser Setup**: `browser.ts` configures MSW for browser environments

## Adding New Mock Handlers

To add a new API endpoint mock, edit `src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  // ... existing handlers ...

  // Add your new handler
  http.get("/api/your-endpoint", () => {
    return HttpResponse.json({
      // Your mock data here
    });
  }),
];
```

### Handler Examples

**GET request with query parameters:**

```typescript
http.get('/api/reports', ({ request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get('page');
  // ... use query params to customize response
  return HttpResponse.json(mockData);
}),
```

**POST request with body:**

```typescript
http.post('/api/reports/new', async ({ request }) => {
  const body = await request.json();
  // ... use request body
  return HttpResponse.json({ id: 'new-id' });
}),
```

**Dynamic route parameters:**

```typescript
http.get('/api/reports/:id', ({ params }) => {
  const { id } = params;
  // ... use id parameter
  return HttpResponse.json(mockData);
}),
```

**Error responses:**

```typescript
http.get('/api/reports/:id', ({ params }) => {
  return HttpResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}),
```

## Current Mock Handlers

The following API endpoints are currently mocked:

- `GET /api/reports/product` - List all products
- `GET /api/reports/product/:id` - Get product by ID
- `GET /api/reports` - List reports (with pagination and filtering)
- `GET /api/reports/:id` - Get report by ID
- `GET /api/reports/summary` - Get reports summary
- `POST /api/reports/new` - Create new report
- `DELETE /api/reports/:id` - Delete report
- `DELETE /api/reports/product/:id` - Delete product
- `POST /api/reports/:id/submit` - Submit report to ExploitIQ
- `POST /api/reports/:id/retry` - Retry report analysis

## Customizing Mock Data

Edit the mock data generators in `handlers.ts`:

```typescript
const generateMockProductSummary = (
  id: string,
  name: string
): ProductSummary => {
  // Modify this function to return different mock data
  return {
    // ... your custom data structure
  };
};
```

## Disabling MSW

To disable MSW:

1. **Remove the environment variable:**

   ```bash
   # Don't set VITE_ENABLE_MSW, or set it to false
   npm run dev
   ```

2. **Or unregister the service worker:**
   - Open browser DevTools
   - Go to Application → Service Workers
   - Click "Unregister" for the MSW worker

## Troubleshooting

### MSW not intercepting requests

1. **Check if MSW is enabled:**

   - Look for `[MSW] Mock Service Worker started successfully` in console
   - If missing, ensure `VITE_ENABLE_MSW=true` is set

2. **Check service worker registration:**

   - Open DevTools → Application → Service Workers
   - Verify the worker is registered and active

3. **Check handler matching:**
   - MSW logs unhandled requests as warnings
   - Ensure your handler URL pattern matches the actual request URL

### Service Worker not found

If you see errors about `mockServiceWorker.js` not found:

```bash
npm run msw:init
```

This will copy the worker file to `public/mockServiceWorker.js`.

### Requests still going to real backend

- Ensure MSW is enabled (`VITE_ENABLE_MSW=true`)
- Check that the handler URL patterns match your API calls exactly
- Verify the service worker is active in DevTools

## Best Practices

1. **Keep mock data realistic**: Use data structures that match your real API responses
2. **Test edge cases**: Add handlers for error scenarios (404, 500, etc.)
3. **Document mock behavior**: Add comments explaining what each handler simulates
4. **Version control**: Commit the `mockServiceWorker.js` file to version control
5. **Don't use in production**: MSW is only for development/testing

## Resources

- [MSW Documentation](https://mswjs.io/docs/)
- [MSW GitHub](https://github.com/mswjs/msw)
- [MSW Examples](https://github.com/mswjs/examples)
