# 🚀 VoltVoice Web - INICIO RÁPIDO

## ✅ Estado: LISTO PARA CORRER

Todo está instalado y configurado. Solo necesitas 2 comandos en 2 terminales.

---

## 🎯 EN 30 SEGUNDOS

### Terminal 1 - Backend (API)
```bash
cd backend
npm start
```

**Esperas a ver:**
```
╔══════════════════════════════════════╗
║   🔊 VoltVoice Web Backend Started   ║
╠══════════════════════════════════════╣
║ Server: http://localhost:5000
║ Env: development
║ Frontend: http://localhost:3000
╚══════════════════════════════════════╝
```

### Terminal 2 - Frontend (UI)
```bash
cd frontend
npm run dev
```

**Esperas a ver:**
```
  VITE v... dev server running at:

  > Local: http://localhost:5173/
```

### Abre navegador
```
http://localhost:3000
```

✨ **¡Listo! Ya tienes VoltVoice funcionando.**

---

## 📁 Archivos importantes ahora

```
✅ backend/
   ├── server.js            ← Express principal
   ├── .env                 ← Tus configuraciones
   ├── routes/
   │   ├── auth.routes.js   ← Login/register
   │   └── stream.routes.js ← Streams + TTS
   └── services/
       └── tts.service.js   ← Google TTS (BACKEND PURO)

✅ frontend/
   ├── public/
   │   └── index.html       ← UI actual (vanilla JS)
   └── package.json

✅ docker-compose.yml       ← PostgreSQL + Redis (opcional)
```

---

## 🔄 Cómo funciona ahora

```
Usuario abre http://localhost:3000
          ↓
        Frontend (HTML)
          ↓
    Hace request: POST /api/tts/synthesize
                   + texto a sintetizar
          ↓
        Backend Express
          ↓
    Usa Google TTS (keys en .env, SEGURO)
          ↓
    Retorna URL de audio descargable
          ↓
    Frontend reproduce audio en navegador
```

**Las API keys NUNCA salen del backend ✅**

---

## 🎮 Prueba la app

1. **Dashboard**: Ver tus streams
2. **Crear Stream**: TikTok o YouTube
3. **Settings**: Prueba de voz ("Hola VoltVoice")
4. **Account**: Tu plan + logout

---

## 🔧 Si necesitas ajustar

### Cambiar puerto backend
```bash
# backend/.env
PORT=5001
```

### Agregar tu API key de YouTube
```bash
# backend/.env
YOUTUBE_API_KEY_1=AIzaSyD...
```

### Cambiar idioma/velocidad de voz
```bash
# Editar backend/services/tts.service.js
lang: 'es-ES',  // o 'en-US', 'es-MX', etc
```

---

## 📦 Próximas tareas (después)

- [ ] Base de datos real (PostgreSQL con Prisma)
- [ ] Autenticación real (sign up/login)
- [ ] Stripe para pagos
- [ ] WebSockets para streams en vivo
- [ ] Migrar UI a React

---

## 🐛 Si algo no funciona

**Backend no inicia:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm start
```

**Frontend no carga:**
```bash
cd frontend
npm run dev
```

**Puerto en uso:**
```bash
# Linux/Mac:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 📞 Estructura para agregar features

### Agregar nuevo endpoint
```javascript
// backend/routes/miendpoint.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/algo', verifyToken, async (req, res) => {
  // Tu lógica aquí
  res.json({ message: 'OK' });
});

export default router;
```

Luego en `server.js`:
```javascript
import miEndpoint from './routes/miendpoint.routes.js';
app.use('/api/miendpoint', miEndpoint);
```

---

**¡Ahora tienes tu app en web! 🎉**

Para escalar a producción (Stripe, DB real, deploy), avísame cuando esté listo.
