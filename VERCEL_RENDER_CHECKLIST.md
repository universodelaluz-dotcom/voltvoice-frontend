# VoltVoice - Checklist de Deploy (Vercel + Render)

## 1) Backend en Render (`voltvoice-backend`)

- Branch: `main`
- Root directory: backend del repo `voltvoice-backend`
- Build command: `npm install`
- Start command: `npm start`

### Variables requeridas (Render)

- `NODE_ENV=production`
- `PORT=10000` (o el puerto que Render inyecte)
- `DATABASE_URL=<postgres_url>`
- `JWT_SECRET=<secreto_largo>`
- `FRONTEND_URL=https://voltvoice-frontend.vercel.app`
- `BACKEND_URL=https://voltvoice-backend.onrender.com`
- `MERCADO_PAGO_ACCESS_TOKEN=<token>`
- `PAYPAL_CLIENT_ID=<id>`
- `PAYPAL_CLIENT_SECRET=<secret>`
- `PAYPAL_MODE=live` (o `sandbox` si pruebas)
- `ELEVENLABS_API_KEY=<key>` (si usas ElevenLabs)
- `GOOGLE_CLIENT_ID=<id>` (si usas Google login)
- `RECAPTCHA_SECRET=<secret>` (recomendado)

### Verificación backend

- `GET https://voltvoice-backend.onrender.com/api/health` responde `status: ok`
- `GET https://voltvoice-backend.onrender.com/api/paypal/client-id` responde sin 500

## 2) Frontend en Vercel (`voltvoice-frontend`)

- Branch: `main`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

### Variables requeridas (Vercel)

- `VITE_API_URL=https://voltvoice-backend.onrender.com`
- `VITE_GOOGLE_CLIENT_ID=<id>` (si usas Google login)
- `VITE_RECAPTCHA_SITE_KEY=<site_key>` (si usas reCAPTCHA)

### Verificación frontend

- `https://voltvoice-frontend.vercel.app` carga sin error de consola de API base URL
- Login / signup funciona
- Flujo de pago (crear orden y captura) funciona

## 3) Smoke test final

- Registro/login
- Panel principal carga estadísticas
- Síntesis de voz responde
- Compra de tokens/plan acredita saldo una sola vez
- CORS sin errores entre `vercel.app` y `onrender.com`
