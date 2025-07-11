import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Development build configuration to bypass @aztec/bb.js issues
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Use larger chunk size to reduce splitting
    chunkSizeWarningLimit: 5000,
    // Disable source maps completely
    sourcemap: false,
    // Target newer environments that support top-level await
    target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
    // Use different format
    lib: undefined,
    rollupOptions: {
      // Don't try to optimize the problematic library
      external: [],
      output: {
        format: 'es',
        // Put everything in one chunk to avoid splitting issues
        manualChunks: undefined,
        // Disable inlining of dynamic imports
        inlineDynamicImports: false,
      }
    }
  },
  optimizeDeps: {
    // Don't pre-bundle the problematic packages
    exclude: ['@aztec/bb.js'],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        bigint: true
      }
    }
  },
}); 