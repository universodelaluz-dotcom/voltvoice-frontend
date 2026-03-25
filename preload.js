// Preload script - corre en contexto aislado
// Aquí puedes exponer APIs seguras del main process al renderer

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  appVersion: "1.0.0",
});
