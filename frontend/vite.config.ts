import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDocker = fs.existsSync('/.dockerenv')
const defaultStorageTarget = isDocker ? 'http://minio:9000' : 'http://127.0.0.1:9000'

const env = loadEnv(process.env.NODE_ENV || 'development', __dirname, '')
const backendTarget = env.VITE_BACKEND_PROXY_TARGET || process.env.VITE_BACKEND_PROXY_TARGET || 'https://api-staging.hotung9108.me'
const isStaging = backendTarget.includes('hotung9108.me')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true, // Lắng nghe trên tất cả IP (0.0.0.0) cho phép Docker container expose port ra host
    port: 5173,
    watch: {
      usePolling: true, // Bắt buộc cho file change detection qua Docker volume trên Windows/WSL
    },
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
        ...(isStaging
          ? {
              headers: {
                Origin: 'https://staging.hotung9108.me',
                Referer: 'https://staging.hotung9108.me/',
              },
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  proxyReq.setHeader('Origin', 'https://staging.hotung9108.me');
                  proxyReq.setHeader('Referer', 'https://staging.hotung9108.me/');
                });
              },
            }
          : {}),
      },
      '/s3-upload': {
        target: env.VITE_STORAGE_PROXY_TARGET || process.env.VITE_STORAGE_PROXY_TARGET || defaultStorageTarget,
        changeOrigin: true,
        headers: {
          Host: 'minio:9000',
        },
        rewrite: (p) => p.replace(/^\/s3-upload/, ''),
      },
    },
  },
})
