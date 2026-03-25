@echo off
echo.
echo ╔════════════════════════════════════════════════╗
echo ║  🔊 VoltVoice Web - Setup                      ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado
    echo Descárgalo en: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado
node --version

REM Crear .env si no existe
if not exist "backend\.env" (
    echo ℹ️  Creando backend\.env desde .env.example...
    copy "backend\.env.example" "backend\.env"
    echo ⚠️  IMPORTANTE: Edita backend\.env y agrega:
    echo    - YOUTUBE_API_KEY_1 (obligatorio)
    echo    - JWT_SECRET (puedes usar cualquier string largo)
)

echo.
echo 📦 Instalando dependencias del backend...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando backend
    pause
    exit /b 1
)
cd ..

echo.
echo 📦 Instalando dependencias del frontend...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error instalando frontend
    pause
    exit /b 1
)
cd ..

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  ✅ Setup completado!                          ║
echo ╚════════════════════════════════════════════════╝
echo.
echo Para ejecutar:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Luego abre: http://localhost:3000
echo.
pause
