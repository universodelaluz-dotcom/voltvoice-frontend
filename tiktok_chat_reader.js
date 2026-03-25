const { WebcastPushConnection } = require("tiktok-live-connector");

const TTS_URL = process.env.TTS_SERVICE_URL || "http://127.0.0.1:5002/say";
const CHANNEL = process.env.TIKTOK_USERNAME || "";
const MIN_INTERVAL_MS = 1200;

if (!CHANNEL) {
  console.error(
    "Configura TIKTOK_USERNAME (usuario sin @). Puedes exportarlo con `set TIKTOK_USERNAME=tu_usuario` antes de ejecutar.",
  );
  process.exit(1);
}

let lastSpeak = 0;

function slowDown() {
  const now = Date.now();
  if (now - lastSpeak < MIN_INTERVAL_MS) {
    return false;
  }
  lastSpeak = now;
  return true;
}

async function speak(text) {
  if (!slowDown()) {
    return;
  }

  try {
    await fetch(TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, rate: 160 }),
      signal: AbortSignal.timeout(1500),
    });
    console.log("Se leyó:", text);
  } catch (err) {
    console.error("Error al llamar al servicio TTS:", err.message);
  }
}

const client = new WebcastPushConnection({
  debug: false,
  enableExtendedGiftInfo: true,
});

client.connect(CHANNEL);

client.on("connected", () => {
  console.log(`Conectado a ${CHANNEL}. Esperando chat...`);
});

client.on("disconnected", (reason) => {
  console.log("Desconectado:", reason);
});

client.on("comment", (data) => {
  const user = data.user.uniqueId || data.user.nickname || "alguien";
  const message = `${user}: ${data.comment}`;
  console.log("Comentario recibido:", message);
  speak(message);
});

client.on("gift", (data) => {
  const message = `${data.user.uniqueId || "alguien"} envió ${data.giftName}`;
  speak(message);
});

process.on("SIGINT", () => {
  console.log("Cerrando...");
  client.disconnect();
  process.exit();
});
