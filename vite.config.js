import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const staticPages = {
  '/faq/': path.resolve(__dirname, 'public', 'faq', 'index.html'),
  '/como-funciona/': path.resolve(__dirname, 'public', 'como-funciona', 'index.html'),
  '/precios/': path.resolve(__dirname, 'public', 'precios', 'index.html'),
  '/youtube/': path.resolve(__dirname, 'youtube.html'),
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-public-static-pages',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (Object.prototype.hasOwnProperty.call(staticPages, req.url)) {
            const file = staticPages[req.url]
            if (fs.existsSync(file)) {
              const rawHtml = fs.readFileSync(file, 'utf-8')
              const html = await server.transformIndexHtml(req.url, rawHtml)
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              res.end(html)
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
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        youtube: path.resolve(__dirname, 'youtube.html'),
      },
    },
  },
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
