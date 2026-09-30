import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8787" },
  },
  // Preview builds ship as one script so they can be inlined into a single hosted page.
  build: process.env.VITE_PREVIEW === "1" ? { rollupOptions: { output: { inlineDynamicImports: true } } } : undefined,
  test: {
    environment: "node",
  },
} as never);
