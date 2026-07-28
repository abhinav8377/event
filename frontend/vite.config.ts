import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_API_TARGET || "https://event-production-2b1c.up.railway.app"

  return {
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
          target: apiTarget,
          changeOrigin: true,
        },
        "/socket.io": {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) return "react-vendor"
            if (id.includes("node_modules/@reduxjs/toolkit/") || id.includes("node_modules/react-redux/") || id.includes("node_modules/swr/")) return "state"
            if (id.includes("node_modules/framer-motion/") || id.includes("node_modules/lucide-react/") || id.includes("node_modules/clsx/")) return "ui-vendor"
            if (id.includes("node_modules/recharts/")) return "charts"
            if (id.includes("node_modules/leaflet/") || id.includes("node_modules/react-leaflet/")) return "maps"
            if (id.includes("node_modules/react-quill-new/")) return "editor"
            if (id.includes("node_modules/@clerk/")) return "auth"
          },
        },
      },
    },
  }
})
