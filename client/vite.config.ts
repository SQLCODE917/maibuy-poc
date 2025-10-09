import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: { sourcemap: false, cssCodeSplit: true, target: "es2020" },
  server: { proxy: { "/api": "http://localhost:8080" } }
});

