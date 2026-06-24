import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  // Same-origin /api so the session cookie stays host-only (mirrors the Vercel rewrite in prod).
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 400,
    minify: "esbuild",
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/@remix-run/") ||
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform/") ||
            id.includes("node_modules/react-smooth") ||
            id.includes("node_modules/react-transition-group") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }
          // Data fetching
          if (id.includes("node_modules/@tanstack/")) {
            return "query";
          }
          // Charts — lazy, only loaded when DashboardPage is visited
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/d3/") ||
            id.includes("node_modules/victory-")
          ) {
            return "charts";
          }
          // Excel — completely independent of React, heaviest lib
          if (id.includes("node_modules/xlsx")) {
            return "excel";
          }
          // No catch-all vendor — let Rollup auto-chunk the rest safely
        }
      }
    }
  },
  // Optimize deps pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query"
    ],
    exclude: ["xlsx"] // exclude heavy libs from pre-bundle, load on demand
  }
});