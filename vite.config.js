// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // CoinGecko (markets & chart)
      "/cg": {
        target: "https://api.coingecko.com/api/v3",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/cg/, ""),
      },
      // exchangerate.host (money changer)
      "/er": {
        target: "https://api.exchangerate.host",
        changeOrigin: true,
        rewrite: p => p.replace(/^\/er/, ""),
      },
    },
  },
});
