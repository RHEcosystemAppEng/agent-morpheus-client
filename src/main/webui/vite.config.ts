import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Check if running in standalone mode (not through Quarkus)
const isStandalone = process.env.VITE_STANDALONE === 'true';
const baseConfig = {
  plugins: [react()],
};

const getConfig = () => {
  if (isStandalone) {
    const apiBaseUrl = process.env.VITE_API_BASE_URL;
    if (!apiBaseUrl) {
      console.error('Please provide the API base URL in the VITE_API_BASE_URL environment variable');
      process.exit(1);
    }
    const config = {
      ...baseConfig,
      server: {
        port: 3000,
        proxy: {
          '/api': {
            target: apiBaseUrl,
            changeOrigin: true,
            secure: false, // Set to false if backend uses self-signed certificates
            rewrite: (path) => {
              const rewritten = path.replace(/^\/api/, '');
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
