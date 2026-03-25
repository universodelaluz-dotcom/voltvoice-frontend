const express = require("express");
const path = require("path");
const { TikTokLiveConnection } = require("tiktok-live-connector");
const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function run(port = parseInt(process.env.PANEL_PORT, 10) || 3000) {
  const app = express();
  const TTS_URL = process.env.TTS_SERVICE_URL || "http://127.0.0.1:5002/say";

  // Cargar todas las API keys del .env
  const API_KEYS = [
    process.env.YOUTUBE_API_KEY_1,
    process.env.YOUTUBE_API_KEY_2,
    process.env.YOUTUBE_API_KEY_3,
    process.env.YOUTUBE_API_KEY_4,
  ].filter(key => key && key.trim() !== "");

  if (API_KEYS.length === 0) {
    console.error("[ERROR] No hay API keys configuradas en .env");
    process.exit(1);
  }

  console.log(`[panel] Cargadas ${API_KEYS.length} API keys`);

  let currentKeyIndex = 0;
  let youtube = null;

  function getNextApiKey() {
    const key = API_KEYS[currentKeyIndex];
    const keyNum = currentKeyIndex + 1;
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`[panel] 🔑 Usando API Key ${keyNum}/${API_KEYS.length}`);
    return key;
  }

  function initYouTube() {
    youtube = google.youtube({
      version: "v3",
      auth: getNextApiKey(),
    });
  }

  // Inicializar YouTube con primera key
  initYouTube();

  let tiktokClient = null;
  let youtubeVideoId = null;
  let youtubeLiveChatId = null;
  let youtubeInterval = null;
  let youtubePageToken = null;
  let currentChannel = null;
  let currentPlatform = null;
  let currentSpeed = 150; // Velocidad normal por defecto
  let currentVoice = null; // Voz seleccionada
  let readUsernames = true; // Leer nombres de usuario completos
  const MIN_INTERVAL_MS = 1200;
  let lastSpeak = 0;

  // Lista de palabras fuertes a censurar
  const badWords = [
    "mierda", "puta", "pendejo", "cabrón", "jodido", "culo", "coño",
    "carajo", "puto", "bastardo", "maldito", "hijo de", "culero",
    "mamada", "verga", "chingada", "chingado", "culada", "maricon",
    "marica", "pájaro", "boludo", "chamaco", "pelotudo"
  ];

  function censorBadWords(text) {
    let result = text;
    badWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      result = result.replace(regex, "*".repeat(word.length));
    });
    return result;
  }

  function formatUsername(username) {
    if (readUsernames) {
      return username;
    }
    // Solo primeros 10 caracteres si está desactivado
    return username.length > 10 ? username.substring(0, 10) + "..." : username;
  }

  function extractYouTubeVideoId(input) {
    const match = input.match(/(?:(?:studio\.)?youtube\.com\/(?:watch\?v=|live\/|shorts\/|embed\/|video\/)|youtu\.be\/)([^&\n?#/]+)/);
    if (match) return match[1];
    if (!input.includes("/")) return input.trim();
    return null;
  }

  let comments = [];
  const maxComments = 100;
  let speakQueue = [];
  let isProcessing = false;
  let processTimer = null;
  let processedMessages = new Set(); // IDs de mensajes ya procesados (TikTok + YouTube)

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  function slowDown() {
    const now = Date.now();
    if (now - lastSpeak < MIN_INTERVAL_MS) {
      return false;
    }
    lastSpeak = now;
    return true;
  }

  async function startQueueProcessor() {
    while (true) {
      if (speakQueue.length === 0) {
        isProcessing = false;
        await new Promise(resolve => setTimeout(resolve, 50));
        continue;
      }

      isProcessing = true;
      const text = speakQueue.shift();
      const remaining = speakQueue.length;
      const timestamp = new Date().toLocaleTimeString();

      console.log(`[${timestamp}] REPRODUCIENDO: "${text.substring(0, 50)}" (pendientes: ${remaining})`);

      try {
        const body = { text, rate: currentSpeed };
        if (currentVoice) {
          body.voice = currentVoice;
        }
        const res = await fetch(TTS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60000),
        });
        const data = await res.json();
        const duration = data.duration || 1500;

        console.log(`[${new Date().toLocaleTimeString()}] Esperando ${duration}ms...`);
        await new Promise(resolve => setTimeout(resolve, duration));
        console.log(`[${new Date().toLocaleTimeString()}] Listo`);
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error TTS:`, err.message);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // Iniciar procesador de cola en background
  startQueueProcessor().catch(err => console.error("[panel] Error en procesador:", err));

  let isMuted = false;

  app.post("/mute", (req, res) => {
    isMuted = !isMuted;
    if (isMuted) speakQueue.length = 0; // vaciar cola al mutear
    res.json({ muted: isMuted });
  });

  async function speakText(text) {
    if (isMuted) return;
    speakQueue.push(text);
    console.log(`[${new Date().toLocaleTimeString()}] Agregado a cola (${speakQueue.length} pendientes)`);
  }

  let sseClients = [];

  app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(":\n\n");
    sseClients.push(res);
    req.on("close", () => {
      sseClients = sseClients.filter(client => client !== res);
    });
  });

  function broadcastComment(message) {
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify(message)}\n\n`);
    });
  }

  app.post("/say", async (req, res) => {
    try {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const payload = await response.json();
      res.status(response.status).json(payload);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/connect", async (req, res) => {
    const { username, platform = "tiktok" } = req.body;
    console.log(`[panel] Connect request - platform: ${platform}, identifier: ${username}`);

    if (!username || username.trim() === "") {
      return res.status(400).json({ error: "Username o URL requerido" });
    }

    // Desconectar cliente anterior
    if (tiktokClient) {
      tiktokClient.disconnect();
      tiktokClient = null;
    }
    if (youtubeInterval) {
      clearInterval(youtubeInterval);
      youtubeInterval = null;
    }

    try {
      if (platform === "youtube") {
        const videoId = extractYouTubeVideoId(username);
        if (!videoId) {
          return res.status(400).json({ error: "URL o Video ID de YouTube inválido" });
        }

        console.log(`[panel] Conectando a YouTube Live (video: ${videoId})...`);
        youtubeVideoId = videoId;
        currentChannel = videoId;
        currentPlatform = "youtube";
        youtubePageToken = null;

        try {
          // Obtener el liveChatId del video
          const videoRes = await youtube.videos.list({
            part: "liveStreamingDetails",
            id: videoId,
          });

          if (!videoRes.data.items || videoRes.data.items.length === 0) {
            return res.status(400).json({ error: "Video no encontrado" });
          }

          youtubeLiveChatId = videoRes.data.items[0].liveStreamingDetails?.activeLiveChatId;

          if (!youtubeLiveChatId) {
            return res.status(400).json({ error: "Este video no tiene un chat en vivo activo" });
          }

          console.log(`[panel] ✓ Chat en vivo encontrado. Chat ID: ${youtubeLiveChatId}`);
          res.json({ status: "conectado", channel: videoId, platform: "youtube" });

          // Limpiar intervalo anterior si existe
          if (youtubeInterval) {
            clearInterval(youtubeInterval);
          }

          // Función para obtener mensajes de YouTube
          let pollingInterval = 10000; // Intervalo inicial: 10 segundos (optimizado para cuota)
          const pollYouTubeChat = async () => {
            try {
              const params = {
                liveChatId: youtubeLiveChatId,
                part: "snippet,authorDetails",
                maxResults: 50,
              };

              // Usar pageToken si existe para obtener solo mensajes nuevos
              if (youtubePageToken) {
                params.pageToken = youtubePageToken;
              }

              const messagesRes = await youtube.liveChatMessages.list(params);

              // YouTube nos dice cuánto esperar hasta la próxima llamada (ahorra cuota)
              if (messagesRes.data.pollingIntervalMillis) {
                pollingInterval = Math.max(10000, messagesRes.data.pollingIntervalMillis);
              }

              // Guardar el pageToken para la próxima llamada
              if (messagesRes.data.nextPageToken) {
                youtubePageToken = messagesRes.data.nextPageToken;
              }

              if (messagesRes.data.items && messagesRes.data.items.length > 0) {
                // Procesar en orden (antiguo a nuevo) para mantener secuencia correcta
                const items = messagesRes.data.items.reverse();

                const ignoredUsers = ["Nightbot", "nightbot"];

                items.forEach((item) => {
                  const author = item.authorDetails?.displayName || "Usuario";
                  const text = item.snippet?.displayMessage || "";
                  const messageId = item.id;

                  if (ignoredUsers.some(u => u.toLowerCase() === author.toLowerCase())) return;

                  if (text && text.trim()) {
                    const displayUser = formatUsername(author);
                    const fullMessage = `${displayUser}: ${text}`;
                    const cleanMessage = censorBadWords(fullMessage);

                    console.log("[panel] YouTube:", cleanMessage);
                    const commentObj = {
                      text: cleanMessage,
                      type: "chat",
                      timestamp: Date.now(),
                      messageId: messageId
                    };
                    comments.unshift(commentObj);
                    if (comments.length > maxComments) comments.pop();
                    broadcastComment(commentObj);
                    speakText(cleanMessage);
                  }
                });
              }
            } catch (err) {
              console.error("[panel] Error leyendo YouTube chat:", err.message);

              // Si es error de cuota agotada, rotar a siguiente API key
              if (err.message?.includes("quotaExceeded") || err.message?.includes("quota")) {
                console.warn("[panel] ⚠️ Cuota agotada, rotando a siguiente API key...");
                initYouTube(); // Reinicializar YouTube con siguiente key
              }
            }

            // Programar la próxima llamada con el intervalo que YouTube nos sugiere
            if (youtubeInterval) {
              youtubeInterval = setTimeout(pollYouTubeChat, pollingInterval);
            }
          };

          // Iniciar el polling
          youtubeInterval = setTimeout(pollYouTubeChat, pollingInterval);
        } catch (err) {
          console.error(`[panel] Error YouTube API: ${err.message}`);
          return res.status(500).json({ error: `Error YouTube: ${err.message}` });
        }
      } else {
        // TikTok
        tiktokClient = new TikTokLiveConnection(username);
        currentChannel = username;
        currentPlatform = "tiktok";

        // Timeout de 30 segundos para conexión
        let connectionTimeout = setTimeout(() => {
          console.error(`[panel] Timeout conectando a TikTok @${username}`);
          if (!res.headersSent) {
            res.status(500).json({ error: "Timeout conectando a TikTok. Verifica que el usuario esté en vivo." });
          }
          if (tiktokClient) {
            tiktokClient.disconnect();
            tiktokClient = null;
          }
        }, 30000);

        tiktokClient.on("connected", (state) => {
          clearTimeout(connectionTimeout);
          console.log(`[panel] Conectado a @${username}`, state);
          if (!res.headersSent) {
            res.json({ status: "conectado", channel: username, platform: "tiktok" });
          }
        });

        const ignoredUsers = ["Nightbot", "nightbot"];

        tiktokClient.on("chat", (data) => {
          const comment = (data.comment || "").trim();
          if (!comment) return;

          const user = data.user.nickname || data.user.uniqueId || "alguien";
          if (ignoredUsers.some(u => u.toLowerCase() === user.toLowerCase())) return;
          const displayUser = formatUsername(user);
          const message = `${displayUser}: ${comment}`;

          // Crear ID único usando datos que TikTok proporciona
          // Usar uniqueId del usuario + comentario (más preciso que timestamp)
          const messageId = `tiktok_${user}_${comment}`;

          // Si ya procesamos este mensaje exacto del mismo usuario, ignorar
          // (evita duplicados verdaderos sin filtrar mensajes diferentes)
          if (processedMessages.has(messageId)) {
            console.log("[panel] TikTok duplicado ignorado:", message);
            return;
          }

          // Marcar como procesado
          processedMessages.add(messageId);

          // Limpiar mensajes procesados muy antiguos (mantener últimos 500)
          if (processedMessages.size > 500) {
            const arr = Array.from(processedMessages);
            arr.slice(0, arr.length - 500).forEach(id => processedMessages.delete(id));
          }

          const cleanMessage = censorBadWords(message);

          console.log("[panel] Mensaje TikTok:", cleanMessage);
          const commentObj = { text: cleanMessage, type: "chat", timestamp: Date.now() };
          comments.unshift(commentObj);
          if (comments.length > maxComments) comments.pop();
          broadcastComment(commentObj);
          speakText(cleanMessage);
        });

        tiktokClient.on("gift", (data) => {
          const giftName = (data.giftName || "").trim();
          if (!giftName) return;

          const user = data.user.nickname || data.user.uniqueId || "alguien";
          const message = `${user} envió ${giftName}`;
          comments.unshift({ text: message, type: "gift", timestamp: Date.now() });
          if (comments.length > maxComments) comments.pop();
          speakText(message);
        });

        tiktokClient.on("error", (err) => {
          console.error("[panel] Error TikTok:", err);
        });

        tiktokClient.on("disconnected", (reason) => {
          console.log(`[panel] Desconectado: ${reason}`);
          currentChannel = null;
          currentPlatform = null;
        });

        console.log("[panel] Conectando a TikTok Live...");
        tiktokClient.connect();
      }
    } catch (err) {
      console.error(`[panel] Error: ${err.message}`);
      tiktokClient = null;
      youtubeInterval = null;
      currentChannel = null;
      currentPlatform = null;
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/disconnect", async (req, res) => {
    if (tiktokClient) {
      tiktokClient.disconnect();
      tiktokClient = null;
    }
    if (youtubeInterval) {
      clearInterval(youtubeInterval);
      youtubeInterval = null;
    }
    youtubeVideoId = null;
    youtubeLiveChatId = null;
    youtubePageToken = null;
    processedMessages.clear();
    currentChannel = null;
    currentPlatform = null;
    comments = [];
    res.json({ status: "desconectado" });
  });

  app.get("/comments", (req, res) => {
    res.json({ comments: comments.slice(0, 50) });
  });

  app.post("/skip", (req, res) => {
    console.log(`[panel] SKIP - vaciando cola (${speakQueue.length} pendientes)`);
    speakQueue = [];
    res.json({ status: "skipped", queue: speakQueue.length });
  });

  app.post("/speed", (req, res) => {
    const { speed } = req.body;
    if (typeof speed !== "number") {
      return res.status(400).json({ error: "Speed debe ser número" });
    }
    currentSpeed = Math.max(80, Math.min(300, speed));
    res.json({ speed: currentSpeed });
  });

  app.get("/voices", async (req, res) => {
    try {
      const response = await fetch("http://127.0.0.1:5002/voices");
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/voice", (req, res) => {
    const { voice } = req.body;
    if (typeof voice !== "string") {
      return res.status(400).json({ error: "Voice debe ser string" });
    }
    currentVoice = voice;
    console.log(`[panel] Voz seleccionada: ${currentVoice}`);
    res.json({ voice: currentVoice });
  });

  app.post("/read-usernames", (req, res) => {
    const { readUsernames: ru } = req.body;
    if (typeof ru !== "boolean") {
      return res.status(400).json({ error: "readUsernames debe ser booleano" });
    }
    readUsernames = ru;
    console.log(`[panel] Leer usernames: ${readUsernames}`);
    res.json({ readUsernames });
  });

  app.post("/custom-message", (req, res) => {
    const { text, username } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Mensaje inválido" });
    }

    let finalMessage = text.trim();

    // En TikTok, prepend el usuario; en YouTube, solo el mensaje
    if (currentPlatform === "tiktok" || currentPlatform === null) {
      finalMessage = `${username} dice: ${finalMessage}`;
    }
    // En YouTube, usa solo el mensaje sin usuario

    const cleanMessage = censorBadWords(finalMessage);
    console.log(`[panel] 🎤 Mensaje personalizado: ${cleanMessage}`);

    const commentObj = {
      text: cleanMessage,
      type: "custom",
      timestamp: Date.now(),
    };

    comments.unshift(commentObj);
    if (comments.length > maxComments) comments.pop();
    broadcastComment(commentObj);
    speakText(cleanMessage);

    res.json({ status: "ok", text: cleanMessage });
  });

  app.get("/status", (req, res) => {
    const connected = (!!tiktokClient || !!youtubeLiveChatId) && !!currentChannel;
    res.json({
      connected: connected,
      channel: currentChannel,
      platform: currentPlatform,
      speed: currentSpeed,
      currentKeyIndex: currentKeyIndex,
      totalKeys: API_KEYS.length,
      keyNumber: currentKeyIndex + 1,
    });
  });

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "panel.html"));
  });

  const server = app.listen(port, () => {
    console.log(`Panel listo en http://localhost:${port}`);
    console.log("Abre esa URL en el navegador para controlar TikTok Live.");
  });

  return server;
}

if (require.main === module) {
  run();
}

module.exports = { run };
