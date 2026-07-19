import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: "https://event-production-2b1c.up.railway.app",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "https://event-production-2b1c.up.railway.app",
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
