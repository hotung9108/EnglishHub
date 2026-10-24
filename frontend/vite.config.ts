import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDocker = fs.existsSync('/.dockerenv')
const defaultStorageTarget = isDocker ? 'http://minio:9000' : 'http://127.0.0.1:9000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Lắng nghe trên tất cả IP (0.0.0.0) cho phép Docker container expose port ra host
    port: 5173,
    watch: {
      usePolling: true, // Bắt buộc cho file change detection qua Docker volume trên Windows/WSL
    },
    proxy: {
      '/s3-upload': {
        target: process.env.VITE_STORAGE_PROXY_TARGET || defaultStorageTarget,
        changeOrigin: true,
        headers: {
          Host: 'minio:9000',
        },
        rewrite: (p) => p.replace(/^\/s3-upload/, ''),
      },
    },
  },
})
