import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const sandboxVersion = readFileSync(resolve(__dirname, '../VERSION'), 'utf-8').trim()

export default defineConfig({
  plugins: [react(), basicSsl()],
  base: './',
  define: {
    'import.meta.env.VITE_SANDBOX_VERSION': JSON.stringify(sandboxVersion),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:7481',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
