const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { run: runTTS } = require("./tts_service");
const { run: runPanel } = require("./control_panel/panel_server");
const { spawn } = require("child_process");

let mainWindow;
let ttsServer;
let panelServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets", "icon.png"),
  });

  mainWindow.loadURL("http://localhost:3000");

  // Abre DevTools en desarrollo (comentar para producción)
  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
  });

  // Crear menú
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: "VoltVoice",
      submenu: [
        {
          label: "Salir",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Acerca de",
          click: () => {
            require("electron").dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Acerca de VoltVoice",
              message: "VoltVoice",
              detail:
                "Lector de Chat para TikTok Live\nVersión 1.0.0\n\nDesarrollado por OpusVolt Labs\nwww.opusvoltlabs.com\n\nUsa Google TTS con fallback a Windows TTS",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on("ready", () => {
  // Iniciar servidores en background sin mostrar ventana
  try {
    ttsServer = runTTS();
    panelServer = runPanel();
  } catch (err) {
    console.error("Error iniciando servidores:", err);
  }

  // Esperar un poco para que los servidores arranquen
  setTimeout(() => {
    createWindow();
  }, 1500);
});

app.on("window-all-closed", () => {
  // Cerrar servidores
  if (ttsServer) ttsServer.close();
  if (panelServer) panelServer.close();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
