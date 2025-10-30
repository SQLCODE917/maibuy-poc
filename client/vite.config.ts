import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
    }),
  ],
  build: {
    sourcemap: true,
    cssCodeSplit: true,
    target: "es2020"
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://localhost:8080" }
  },
});

