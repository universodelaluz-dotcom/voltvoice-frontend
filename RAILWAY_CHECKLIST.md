# 🚀 VoltVoice - Railway Deployment Checklist

## ✅ PASO 1: Preparar GitHub (5 min)

- [ ] Abre tu repositorio GitHub (o crea uno nuevo)
- [ ] Copia la carpeta `backend/` al repo
- [ ] Haz `git push`

**O usa Railway CLI (sin GitHub):**
```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## ✅ PASO 2: Crear Proyecto en Railway (5 min)

1. Ve a: https://railway.app
2. Crea cuenta con GitHub
3. Click "New Project"
4. Selecciona "Deploy from GitHub" (o "Deploy via CLI")
5. Selecciona repo

---

## ✅ PASO 3: Agregar PostgreSQL (3 min)

En Dashboard de Railway:
1. Click "+ Add Service"
2. Busca "PostgreSQL"
3. Click "Add PostgreSQL"
4. Railway crea la DB automáticamente

---

## ✅ PASO 4: Configurar Variables (5 min)

En Railway → Variables → Agregar:

```
DATABASE_URL = (Railway lo genera automático)
PORT = 8000
NODE_ENV = production
FRONTEND_URL = https://landing-page-zeta-two-23.vercel.app
BACKEND_URL = https://voltvoice-backend.railway.app

MERCADO_PAGO_ACCESS_TOKEN = APP_USR-321299952980044-100609-a87787449103b2cec28b568309afc698-174576838
MERCADO_PAGO_PUBLIC_KEY = APP_USR-df93f1dd-8db5-4269-bf98-87c37c13bf06

ELEVENLABS_API_KEY = (obtener de https://elevenlabs.io)
```

**Donde dice `BACKEND_URL`, Railway te da el URL final**

---

## ✅ PASO 5: Ejecutar Migraciones (2 min)

En Railway CLI o terminal:
```bash
railway run npm run migrate
```

Esto crea las tablas en PostgreSQL.

---

## ✅ PASO 6: Actualizar Frontend (2 min)

En Vercel (landing-page), actualizar `.env.local`:
```
NEXT_PUBLIC_API_URL = https://voltvoice-backend.railway.app
```

Luego hacer `git push` para que Vercel redeploy automáticamente.

---

## ✅ PASO 7: Probar (2 min)

**Probar Backend:**
```
https://voltvoice-backend.railway.app/api/health
```

Debería retornar:
```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-03-24T..."
}
```

**Probar Frontend:**
```
https://landing-page-zeta-two-23.vercel.app/app
```

Hacer click en "Comprar Más" → Debería ir a Mercado Pago

---

## 📊 Resultado Final:

```
✅ Landing: https://landing-page-zeta-two-23.vercel.app
✅ Backend: https://voltvoice-backend.railway.app
✅ Database: PostgreSQL en Railway
✅ Pagos: Mercado Pago funcionando
✅ Voces: ElevenLabs listo para conectar
```

---

## 🆘 Si algo falla:

1. **"Cannot connect to database"**
   - Verifica `DATABASE_URL` en Railway variables
   - Asegúrate de ejecutar `railway run npm run migrate`

2. **"Mercado Pago error"**
   - Copia bien el Access Token (sin espacios)
   - Verifica que esté en `MERCADO_PAGO_ACCESS_TOKEN`

3. **"Frontend no conecta con backend"**
   - En Vercel, actualiza `NEXT_PUBLIC_API_URL`
   - Haz `vercel env pull` para traer variables

---

**Tiempo total estimado: 25-30 minutos** ⏱️

¿Necesitas ayuda en algún paso?
