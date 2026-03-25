# 🔊 VoltVoice - Web Version

Lee chats en vivo de TikTok y YouTube, convirtiéndolos a voz automáticamente.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- Docker + Docker Compose (para DB)
- NPM o Yarn

### 1️⃣ Clonar y configurar

```bash
# Copiar archivos de configuración
cp backend/.env.example backend/.env

# Editar backend/.env y agregar tus API keys:
# - YOUTUBE_API_KEY_1 (obligatorio)
# - JWT_SECRET (puede ser cualquier string largo)
# - STRIPE_SECRET_KEY (opcional por ahora)
```

### 2️⃣ Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

### 3️⃣ Levantar bases de datos (opcional, por ahora)

```bash
docker-compose up -d
```

Este comando levanta:
- **PostgreSQL** en `localhost:5432`
- **Redis** en `localhost:6379`

### 4️⃣ Ejecutar la app

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Debería ver:
```
╔══════════════════════════════════════╗
║   🔊 VoltVoice Web Backend Started   ║
╠══════════════════════════════════════╣
║ Server: http://localhost:5000
║ Env: development
║ Frontend: http://localhost:3000
╚══════════════════════════════════════╝
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5️⃣ Abrir en navegador

```
http://localhost:3000
```

---

## 📁 Estructura del proyecto

```
voltvoice-web/
├── backend/                    # API Node.js + Express
│   ├── server.js              # Servidor principal
│   ├── services/              # Lógica de negocio
│   │   ├── tts.service.js
│   │   ├── tiktok.service.js
│   │   └── youtube.service.js
│   ├── routes/                # Endpoints REST
│   ├── middleware/            # Auth, logging, etc
│   ├── config.js              # Configuración centralizada
│   └── package.json
│
├── frontend/                  # UI Web
│   ├── public/
│   │   └── index.html         # Interfaz actual (vanilla JS)
│   ├── src/                   # Pronto: React components
│   └── package.json
│
├── docker-compose.yml         # PostgreSQL + Redis
└── README.md
```

---

## 🔌 API Endpoints

### Autenticación
```
POST /api/auth/register      # Crear cuenta
POST /api/auth/login         # Iniciar sesión
POST /api/auth/logout        # Cerrar sesión
```

### Streams
```
GET  /api/streams            # Listar mis streams
POST /api/streams            # Crear nuevo stream
```

### TTS (Text-to-Speech)
```
POST /api/tts/synthesize     # Convertir texto a audio
GET  /api/tts/preview        # Escuchar preview
```

### Health
```
GET /api/health              # Estado del servidor
```

---

## 🔐 Seguridad

- Las **API keys nunca van al frontend** (quedan en backend `.env`)
- Frontend solo se comunica con backend vía HTTP + JWT
- Tokens guardados en `localStorage` (TODO: mejorar a HttpOnly cookies)

---

## 📊 Próximos pasos

### Prioritarios:
- [ ] Base de datos PostgreSQL + ORM (Prisma)
- [ ] Autenticación real (hash de passwords)
- [ ] Integración Stripe para pagos
- [ ] Historial de streams por usuario
- [ ] WebSockets para eventos en vivo

### Mejoras UI:
- [ ] Migrar a React + Vite
- [ ] Dashboard más bonito
- [ ] Página de login/signup

### Escalabilidad:
- [ ] Rate limiting + throttling
- [ ] Caching con Redis
- [ ] Monitoreo y alertas
- [ ] Deploy a AWS/Heroku/Railway

---

## 🛠️ Desarrollo

### Agregar nueva ruta
1. Crear archivo en `backend/routes/`
2. Importar en `server.js`
3. Usar `app.use('/api/nombre', routes)`

### Agregar nuevo servicio
1. Crear en `backend/services/`
2. Exportar funciones
3. Importar en rutas donde se necesite

---

## 🐛 Troubleshooting

**Error: EADDRINUSE (puerto en uso)**
```bash
# Liberar puerto 5000
lsof -ti:5000 | xargs kill -9

# O cambiar PORT en backend/.env
PORT=5001
```

**Error: Cannot find module**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

**No se conecta a DB**
```bash
# Verificar que Docker está corriendo
docker ps

# Levantar servicios
docker-compose up -d
```

---

## 📝 Licencia

ISC

---

## 📞 Soporte

Para bugs o ideas:
1. Abre un issue en GitHub
2. Describe el problema paso a paso
3. Incluye logs y versión de Node

---

**¡Listo! Ahora tienes VoltVoice en web. 🚀**
