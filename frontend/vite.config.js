import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Never ship source maps to production — avoids exposing original
    // source structure and trims the build output significantly.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split heavy/rarely-changing vendor code into separate,
        // long-term-cacheable chunks so a change to app code doesn't
        // bust the cache for cytoscape/react and to silence Vite's
        // "large chunk" warning.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/')) return 'react';
            if (id.includes('cytoscape')) return 'cytoscape';
            if (id.includes('framer-motion')) return 'motion';
          }
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
