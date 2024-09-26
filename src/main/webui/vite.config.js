import { defineConfig } from 'vite'
import * as path from 'path'

export default defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  resolve: {
    alias: {
      './assets': path.resolve(__dirname, './assets'),
    }
  }
})