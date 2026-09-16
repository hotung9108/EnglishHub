import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Lắng nghe trên tất cả IP (0.0.0.0) cho phép Docker container expose port ra host
    port: 5173,
    watch: {
      usePolling: true, // Bắt buộc cho file change detection qua Docker volume trên Windows/WSL
    },
  },
})

