import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const staticPages = ['/precios/', '/faq/', '/como-funciona/']

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-public-static-pages',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (staticPages.includes(req.url)) {
            const slug = req.url.replace(/\//g, '')
            const file = path.resolve(__dirname, 'public', slug, 'index.html')
            if (fs.existsSync(file)) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              res.end(fs.readFileSync(file))
              return
            }
          }
          next()
        })
      },
    },
  ],
  root: process.env.VITE_ROOT || '.',
  publicDir: 'public',
  server: {
    host: true,
    allowedHosts: ['.ngrok-free.dev', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
