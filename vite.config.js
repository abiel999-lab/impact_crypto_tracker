// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const base = (env.VITE_BASE || "/").trim() || "/";

  return {
    base,                       // Hostinger di root domain → "/"
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    server: {
      host: false,              // tampilkan 1 link saja (Local)
      port: 5173,
      strictPort: true,
      proxy: {
        // CoinGecko (markets & chart)
        "/cg": {
          target: "https://api.coingecko.com/api/v3",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/cg/, ""),
        },
        // Fawaz exchange-api (sumber utama money changer)
        "/fxa": {
          target: "https://cdn.jsdelivr.net/gh/fawazahmed0/exchange-api@1",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/fxa/, ""),
        },
        // open.er-api.com (fallback)
        "/era": {
          target: "https://open.er-api.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/era/, ""),
        },
        // (opsional) exchangerate.host kalau masih dipakai
        // "/er": {
        //   target: "https://api.exchangerate.host",
        //   changeOrigin: true,
        //   rewrite: (p) => p.replace(/^\/er/, ""),
        // },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    build: {
      target: "es2020",
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) return "vendor";
          },
        },
      },
    },
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    envPrefix: "VITE_",
  };
});
