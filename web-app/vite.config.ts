import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  optimizeDeps: {
    esbuildOptions: { 
      target: "es2022",
      supported: {
        bigint: true,
        'top-level-await': true
      }
    },
    exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js', '@aztec/bb.js'],
    // Force include lighter dependencies
    include: ['poseidon-lite', '@zk-kit/imt']
  },
  build: {
    // Disable source maps to avoid magic-string issues
    sourcemap: false,
    // Increase chunk size warnings threshold
    chunkSizeWarningLimit: 3000,
    // Target newer environments that support top-level await and large dependencies
    target: ['chrome89', 'edge89', 'firefox89', 'safari15'],
    // Optimize chunking for large dependencies
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Skip problematic files entirely
          if (id.includes('@aztec/bb.js')) {
            return undefined;
          }
          if (id.includes('@noir-lang/noir_js')) {
            return 'noir-js';
          }
          if (id.includes('poseidon-lite') || id.includes('@zk-kit/imt')) {
            return 'crypto-libs';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['buffer', 'process'],
      // To exclude specific polyfills, add them to this list
      exclude: [
        'fs', // Excludes the polyfill for `fs` and `node:fs`.
      ],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Override the default polyfills for specific modules.
      overrides: {
        // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
        fs: 'memfs',
      },
      protocolImports: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
