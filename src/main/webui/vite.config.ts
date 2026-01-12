import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Load environment variables from .env files
// mode is always 'development' 
const env = loadEnv('development', process.cwd(), '');

// Check if running in standalone mode (not through Quarkus)
const isStandalone = env.VITE_STANDALONE === 'true' || process.env.VITE_STANDALONE === 'true';
const baseConfig = {
  plugins: [react()],
};

const getConfig = () => {
  if (isStandalone) {
    // Use loaded env vars, fallback to process.env for backwards compatibility
    const apiBaseUrl = env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL;
    if (!apiBaseUrl) {
      console.error('Please provide the API base URL in the VITE_API_BASE_URL environment variable');
      process.exit(1);
    }
    const apiToken = env.API_TOKEN || process.env.API_TOKEN;
    if (!apiToken) {
      console.error('Please provide the API token in the API_TOKEN environment variable');
      process.exit(1);
    }
    const config = {
      ...baseConfig,
      server: {
        port: 3000,
        proxy: {
          '/api/v1': {
            target: apiBaseUrl,
            changeOrigin: true,
            secure: false, // Set to false if backend uses self-signed certificates
            headers: {
              'Authorization': `Bearer ${apiToken}`,
            },
            rewrite: (path) => {
              const rewritten = path.replace(/^\/api\/v1/, '');
              const fullUrl = `${apiBaseUrl}${rewritten}`;
              console.log('[Proxy] Rewriting path:', path, '->', rewritten);
              console.log('[Proxy] Full target URL:', fullUrl);
              return rewritten;
            },
            // Enable verbose logging (check Vite dev server console)
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('[Proxy] Sending request:', req.method, req.url);
                console.log('[Proxy] Target:', proxyReq.path);
              });
            } 
          }
        }
      }
    }
    return config;
  } else {
    return baseConfig;
  }
};

const config = getConfig();

// https://vitejs.dev/config/
export default defineConfig(config);
