const { run: runTTS } = require("./tts_service");
const { run: runPanel } = require("./control_panel/panel_server");
const { spawn } = require("child_process");

const servers = [
  { name: "TTS", instance: runTTS() },
  { name: "Panel", instance: runPanel() },
];

function shutdown() {
  console.log("Deteniendo servicios...");
  servers.forEach(({ name, instance }) => {
    if (instance && typeof instance.close === "function") {
      console.log(`Cerrando ${name}...`);
      instance.close();
    }
  });
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Voltvoice Launcher: presiona Ctrl+C para detener.");

// Abre el navegador automáticamente después de 1 segundo
setTimeout(() => {
  const url = "http://localhost:3000";
  console.log(`\n🌐 Abriendo navegador en ${url}...`);

  const platform = process.platform;

  if (platform === "win32") {
    // En Windows, intenta con explorer primero
    try {
      spawn("explorer", [url], { detached: true, stdio: "ignore" }).unref();
    } catch (e) {
      console.log("[launcher] No se pudo abrir el navegador. Abre manualmente: http://localhost:3000");
    }
  } else if (platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}, 1500);
