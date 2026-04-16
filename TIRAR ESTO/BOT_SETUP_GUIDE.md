# 🤖 Setup Guía - Sistema de Bot con IA Roleplay

## Variables de Entorno Requeridas

### Frontend (`.env.local` o `.env`)

```env
# API Backend
VITE_API_URL=https://voltvoice-backend.onrender.com

# Inworld AI Realtime API
VITE_INWORLD_API_KEY=tu_api_key_de_inworld
VITE_INWORLD_WORKSPACE_ID=tu_workspace_id
```

### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/voltvoice
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Inworld (si se necesita en backend)
INWORLD_API_KEY=tu_api_key_de_inworld
```

## Pasos de Configuración

### 1. Obtener Credenciales de Inworld

1. Ir a [Inworld Platform](https://platform.inworld.ai)
2. Crear cuenta / loguear
3. Crear nuevo workspace
4. Ir a Settings → API Keys
5. Generar nuevo API Key
6. Copiar:
   - `API Key` → `VITE_INWORLD_API_KEY`
   - `Workspace ID` → `VITE_INWORLD_WORKSPACE_ID`

### 2. Configurar Frontend

1. Navegar a `/frontend`
2. Crear archivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Agregar variables de Inworld
4. Guardar y reiniciar dev server:
   ```bash
   npm run dev
   ```

### 3. Migración de BD

Las tablas se crean automáticamente al iniciar el backend:
- `bot_characters` - Personajes custom
- `bot_moderations_log` - Log de acciones de moderación

No requiere migración manual.

## Componentes Creados

### Backend
- **`botContextService.js`** - Agregación de data en vivo + histórica
- **`bot.js`** - API endpoints (6 rutas principales + 4 de moderación)

### Frontend
- **`BotPanel.jsx`** - Panel principal de invocación
- **`AIRoleplayWorkshop.jsx`** - Gestión de personajes
- **`AudioVisualizer.jsx`** - Visualizador de forma de onda
- **`ActionConfirmation.jsx`** - Confirmación de acciones de mod
- **`inworldRealtimeService.js`** - Integración con Inworld API

### DB
- `bot_characters` table
- `bot_moderations_log` table

## API Endpoints

### Personajes
- `GET /api/bot/characters` - Listar personajes del usuario
- `POST /api/bot/characters` - Crear personaje
- `PATCH /api/bot/characters/:id` - Editar personaje
- `DELETE /api/bot/characters/:id` - Eliminar personaje

### Contexto
- `GET /api/bot/context/:tiktok_username` - Obtener contexto del stream

### Invocación
- `POST /api/bot/invoke` - Invocar personaje con pregunta

### Moderación
- `POST /api/bot/action/execute` - Ejecutar acción de mod
- `GET /api/bot/actions/log` - Historial de acciones
- `POST /api/bot/action/suggest` - Sugerir acciones
- `DELETE /api/bot/actions/log/:id` - Eliminar entrada del log

## Características

✅ **Creación de Personajes**
- Crear personajes custom con nombre, descripción, y system prompt
- Asignar voz clonada a cada personaje
- Editar/eliminar personajes

✅ **Invocación**
- Botón visual + shortcut (Ctrl+B)
- Input de texto O micrófono
- Integración con Inworld Realtime API
- Respuesta en audio con visualizador

✅ **Acceso a Datos**
- Contexto en vivo: viewers, likes, donadores
- Contexto histórico: top donadores, top comentaristas, followers
- Personalizado con data del stream en el system prompt

✅ **Moderación**
- Acciones: ban, mute, kick, timeout, clear
- Confirmación triple: visual + voz + shortcut
- Log de todas las acciones

✅ **Modos de Respuesta**
- Audio (voz sintetizada con Inworld)
- Texto (respuesta escrita)
- Ambos (audio + texto)

## Próximos Pasos Opcionales

1. **Integración con bans existentes** - Conectar `bot_moderations_log` con sistema de bans actual
2. **Análisis automático de spam** - Endpoint para detectar spam en chat
3. **Historias/escenarios** - Guardar contexto de conversaciones
4. **WebRTC** - Usar en lugar de WebSocket para mejor latencia

## Troubleshooting

### "WebSocket not connected"
- Verificar que `VITE_INWORLD_API_KEY` y `VITE_INWORLD_WORKSPACE_ID` son correctos
- Verificar que Inworld workspace existe y es accesible

### "Error deploying bot"
- Verificar que las tablas `bot_characters` y `bot_moderations_log` fueron creadas
- Revisar logs del backend para errores de migración

### Visualizador de audio no muestra
- Verificar que AudioContext está habilitado en el browser
- Intentar en un navegador diferente

## Ejemplo de Uso

1. **Crear personaje:**
   - Ir a "Taller de Asistentes"
   - Click "Nuevo Personaje"
   - Llenar form (nombre, descripción, system prompt)
   - Click "Crear Personaje"

2. **Invocar personaje:**
   - Abrir "Invocar Personaje"
   - Seleccionar personaje de dropdown
   - Escribir o grabar pregunta
   - Click "Invocar [Personaje]"
   - Escuchar respuesta con visualizador

3. **Ver acciones de moderación:**
   - Historial en `/api/bot/actions/log`
   - Cada acción registrada con timestamp y razón

