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
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "state": ["@reduxjs/toolkit", "react-redux", "swr"],
            "ui-vendor": ["framer-motion", "lucide-react", "clsx"],
            "charts": ["recharts"],
            "maps": ["leaflet", "react-leaflet"],
            "editor": ["react-quill-new"],
            "auth": ["@clerk/clerk-react"],
          },
        },
      },
    },
  }
})
