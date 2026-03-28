import { useState, useEffect, useRef } from 'react'
import { Play, Square, AlertCircle, Loader, MessageCircle, Volume2, VolumeX, Ban } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const isQuestion = (text) => {
  const trimmed = text.trim().toLowerCase()
  if (trimmed.includes('?')) return true
  const questionWords = /^(qué|que|cómo|como|cuándo|cuando|dónde|donde|por\s?qué|por\s?que|cuál|cual|quién|quien|cuánto|cuanto|what|how|when|where|why|who|which|is|are|do|does|can|will|would)\b/i
  return questionWords.test(trimmed)
}

const hasExcessiveEmojis = (text) => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  const emojis = text.match(emojiRegex) || []
  const nonEmoji = text.replace(emojiRegex, '').trim()
  return emojis.length > 5 || (emojis.length > 0 && nonEmoji.length === 0)
}

const hasLinks = (text) => /https?:\/\/|www\.|\.com|\.net|\.org|bit\.ly/i.test(text)

export default function TikTokLivePanel({ config = {} }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  const [tiktokUser, setTiktokUser] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ count: 0, uptime: 0 })
  const [donors, setDonors] = useState(new Set())
  const [nickOverrides, setNickOverrides] = useState({})
  const [editingNick, setEditingNick] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [bannedUsers, setBannedUsers] = useState(new Set())
  const [volume, setVolume] = useState(0.8)
  const wsRef = useRef(null)
  const statusIntervalRef = useRef(null)
  const speakQueueRef = useRef([])
  const isProcessingRef = useRef(false)
  const lastMessageRef = useRef('')
  const currentAudioRef = useRef(null)
  const disconnectedRef = useRef(false)
  const chatContainerRef = useRef(null)
  const bannedRef = useRef(new Set())
  const nickOverridesRef = useRef({})
  const configRef = useRef(config)
  const volumeRef = useRef(0.8)

  // Auto-scroll del chat al fondo cuando llegan mensajes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Mantener refs actualizados para acceso en callbacks del WebSocket
  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { bannedRef.current = bannedUsers }, [bannedUsers])
  useEffect(() => { nickOverridesRef.current = nickOverrides }, [nickOverrides])

  // Conectar a WebSocket cuando el usuario se conecte a TikTok
  useEffect(() => {
    if (!isConnected || !tiktokUser) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsURL = `${protocol}//${API_URL.replace(/^https?:\/\//, '')}/api/tiktok/ws`

    console.log('[TikTok] Conectando WebSocket a:', wsURL)

    const ws = new WebSocket(wsURL)

    ws.onopen = () => {
      console.log('[TikTok] WebSocket conectado')
      ws.send(JSON.stringify({ type: 'subscribe', username: tiktokUser }))
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        const c = configRef.current

        if (data.type === 'subscribed') {
          console.log('[TikTok] Suscrito a:', data.username)

        // === EVENTOS DE NOTIFICACIÓN ===
        } else if (data.data && data.data.type === 'gift') {
          const giftData = data.data
          console.log(`[TikTok] 🎁 Regalo de @${giftData.username}: ${giftData.giftName}`)
          setDonors(prev => new Set([...prev, giftData.username]))
          // Anunciar regalo
          if (c.announceGifts) {
            const text = `${giftData.username} envió ${giftData.giftName}`
            queueMessage(text, giftData.username, { isNotification: true })
          }

        } else if (data.data && data.data.type === 'follow') {
          if (c.announceFollowers) {
            const text = `Nuevo seguidor: ${data.data.username}`
            queueMessage(text, data.data.username, { isNotification: true })
          }

        } else if (data.data && data.data.type === 'like') {
          if (c.announceLikes && data.data.totalLikeCount) {
            const text = `Ya tienes ${data.data.totalLikeCount} likes`
            queueMessage(text, 'sistema', { isNotification: true })
          }

        } else if (data.data && data.data.type === 'share') {
          if (c.announceShares) {
            const text = `${data.data.username} compartió tu stream`
            queueMessage(text, data.data.username, { isNotification: true })
          }

        } else if (data.data && data.data.type === 'viewer_count') {
          if (c.announceViewers) {
            const text = `Hay ${data.data.viewerCount} personas viéndote`
            queueMessage(text, 'sistema', { isNotification: true })
          }

        } else if (data.data && data.data.type === 'battle') {
          if (c.announceBattles) {
            queueMessage('Batalla iniciada', 'sistema', { isNotification: true })
          }

        } else if (data.data && data.data.type === 'poll') {
          if (c.announcePolls) {
            const text = data.data.text || 'Nueva encuesta'
            queueMessage(text, 'sistema', { isNotification: true })
          }

        } else if (data.data && data.data.type === 'goal') {
          if (c.announceGoals) {
            const text = data.data.text || 'Avance en meta'
            queueMessage(text, 'sistema', { isNotification: true })
          }

        // === MENSAJES DE CHAT ===
        } else if (data.type === 'message') {
          const msg = data.data
          console.log('[TikTok] Nuevo mensaje:', msg.username, msg.text)

          const isBanned = bannedRef.current.has(msg.username)

          // Siempre mostrar el mensaje en el chat visual
          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              user: msg.username,
              nickname: msg.nickname || msg.username,
              text: msg.text,
              status: 'received',
              timestamp: new Date(),
              isDonor: msg.isDonor || donors.has(msg.username),
              isModerator: msg.isModerator || false,
              isBanned
            }
          ])

          // Si está baneado, no leer en voz
          if (isBanned) return

          // Filtro: solo donadores
          if (c.onlyDonors && !msg.isDonor && !donors.has(msg.username)) return

          // Filtro: solo moderadores
          if (c.onlyModerators && !msg.isModerator) return

          // Filtro: solo preguntas
          if (c.onlyQuestions && !isQuestion(msg.text)) return

          // Filtro: saltar repetidos
          if (c.skipRepeated && msg.text === lastMessageRef.current) return
          lastMessageRef.current = msg.text

          // Filtro: ignorar enlaces
          if (c.ignoreLinks && hasLinks(msg.text)) return

          // Filtro: ignorar emojis excesivos
          if (c.ignoreExcessiveEmojis && hasExcessiveEmojis(msg.text)) return

          // Filtro: largo mínimo
          if (c.minMessageLengthEnabled && msg.text.trim().length < c.minMessageLength) return

          // Limitar cola máxima
          if (c.maxQueueEnabled && speakQueueRef.current.length >= c.maxQueueSize) {
            console.log(`[TikTok] Cola llena (${c.maxQueueSize}), descartando mensaje`)
            return
          }

          // Limitar caracteres para donadores
          let textToSpeak = msg.text
          if (c.donorCharLimitEnabled && (msg.isDonor || donors.has(msg.username))) {
            textToSpeak = msg.text.substring(0, c.donorCharLimit)
          }

          // Construir texto final (usar nickname para lectura, no el username técnico)
          const displayName = nickOverridesRef.current[msg.username] || msg.nickname || msg.username
          const finalText = c.readOnlyMessage ? textToSpeak : `${displayName}: ${textToSpeak}`

          queueMessage(finalText, msg.username, { isDonor: msg.isDonor || donors.has(msg.username), isModerator: msg.isModerator })

        } else if (data.type === 'status') {
          if (data.data) {
            setStats({
              count: data.data.messageCount || 0,
              uptime: Math.floor((data.data.uptime || 0) / 1000)
            })
          }
        }
      } catch (err) {
        console.error('[TikTok] Error procesando WebSocket:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('[TikTok] WebSocket error:', error)
      setError('Error en conexión WebSocket')
    }

    ws.onclose = () => {
      console.log('[TikTok] WebSocket cerrado')
      setIsConnected(false)
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe' }))
        wsRef.current.close()
      }
    }
  }, [isConnected, tiktokUser])

  // Polling para actualizar estadísticas
  useEffect(() => {
    if (!isConnected || !tiktokUser) return

    statusIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/tiktok/status/${tiktokUser}`)
        const data = await response.json()
        if (data.success) {
          setStats({
            count: data.messageCount || 0,
            uptime: data.uptime || 0
          })
        }
      } catch (err) {
        console.error('[TikTok] Error actualizando stats:', err)
      }
    }, 2000)

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
      }
    }
  }, [isConnected, tiktokUser])

  // Cola de audio
  const queueMessage = (text, username, extra = {}) => {
    speakQueueRef.current.push({ text, username, ...extra })
    console.log(`[TikTok] Agregado a cola (${speakQueueRef.current.length} pendientes)`)
    processQueue()
  }

  const processQueue = async () => {
    if (isProcessingRef.current) return
    if (speakQueueRef.current.length === 0) return

    isProcessingRef.current = true

    while (speakQueueRef.current.length > 0) {
      if (disconnectedRef.current) break
      const item = speakQueueRef.current.shift()
      const { text, username } = item
      const remaining = speakQueueRef.current.length
      console.log(`[TikTok] REPRODUCIENDO: "${text.substring(0, 50)}" (pendientes: ${remaining})`)

      // Determinar voz: notificación > moderador > donador > general
      const c = configRef.current
      let voiceId = c.generalVoiceId || 'es-ES'
      if (c.donorVoiceEnabled && (item.isDonor || donors.has(username))) voiceId = c.donorVoiceId || 'Diego'
      if (c.modVoiceEnabled && item.isModerator) voiceId = c.modVoiceId || 'Lupita'
      if (c.notifVoiceEnabled && item.isNotification) voiceId = c.notifVoiceId || 'Lupita'

      try {
        const response = await fetch(`${API_URL}/api/tiktok/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: tiktokUser,
            messageUsername: username,
            messageText: text,
            voiceId
          })
        })

        const data = await response.json()

        if (data.audio) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.text === text ? { ...msg, status: 'playing' } : msg
            )
          )

          await new Promise((resolve) => {
            if (disconnectedRef.current) { resolve(); return }
            const audio = new Audio(data.audio)
            currentAudioRef.current = audio
            audio.playbackRate = c.audioSpeed || 1.0
            audio.volume = volumeRef.current
            audio.onended = () => {
              currentAudioRef.current = null
              console.log(`[TikTok] Audio terminado`)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.text === text ? { ...msg, status: 'done' } : msg
                )
              )
              resolve()
            }
            audio.onerror = () => { currentAudioRef.current = null; resolve() }
            audio.play().catch(() => { currentAudioRef.current = null; resolve() })
          })
        }
      } catch (err) {
        console.error('[TikTok] Error sintetizando:', err)
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    isProcessingRef.current = false
  }

  const handleConnect = async (e) => {
    e.preventDefault()

    if (!tiktokUser.trim()) {
      setError('Ingresa un usuario de TikTok válido')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/tiktok/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tiktokUser.trim() })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        disconnectedRef.current = false
        setIsConnected(true)
        setMessages([])
      } else {
        setError(data.error || 'Error conectando a TikTok')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      // Detener todo el audio inmediatamente
      disconnectedRef.current = true
      speakQueueRef.current = []
      isProcessingRef.current = false
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.src = ''
        currentAudioRef.current = null
      }

      await fetch(`${API_URL}/api/tiktok/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tiktokUser })
      })

      if (wsRef.current) {
        wsRef.current.close()
      }

      setIsConnected(false)
      setMessages([])
      setStats({ count: 0, uptime: 0 })
    } catch (err) {
      console.error('[TikTok] Error desconectando:', err)
    }
  }

  return (
    <div className={darkMode ? "bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6 mb-6" : "bg-white border border-indigo-200 rounded-lg p-6 mb-6 shadow-sm"}>
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-cyan-300" />
        <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>TikTok LIVE en Tiempo Real</h2>
        <span
          className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
            isConnected
              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
              : 'bg-gray-700/50 border border-gray-600/50 text-gray-300'
          }`}
        >
          {isConnected ? '🔴 EN VIVO' : 'DESCONECTADO'}
        </span>
      </div>

      {!isConnected ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={tiktokUser}
              onChange={(e) => setTiktokUser(e.target.value)}
              placeholder="Usuario de TikTok (sin @)"
              className={darkMode ? "flex-1 bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400" : "flex-1 bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
              disabled={isConnecting}
            />
            <button
              type="submit"
              disabled={isConnecting || !tiktokUser}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isConnecting ? 'Conectando...' : 'Conectar'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            ✓ Lee comentarios del chat de TikTok en vivo
            <br />
            ✓ Sintetiza automáticamente a voz
            <br />
            ✓ Reproduce mientras haces stream
          </p>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-2 gap-3 flex-1 mr-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
                <p className="text-xs text-gray-400">Comentarios</p>
                <p className="text-lg font-bold text-cyan-300">{stats.count}</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                <p className="text-xs text-gray-400">Tiempo</p>
                <p className="text-lg font-bold text-purple-300">{stats.uptime}s</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap"
            >
              <Square className="w-4 h-4" />
              Desconectar
            </button>
          </div>

          <div ref={chatContainerRef} className={darkMode ? "bg-[#0f0f23]/80 border border-cyan-400/20 rounded-lg p-4 h-64 overflow-y-auto space-y-2" : "bg-gray-50 border border-indigo-200 rounded-lg p-4 h-64 overflow-y-auto space-y-2"}>
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                <p>Esperando comentarios en vivo...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm pl-3 py-2 rounded-r transition-all duration-300 ${
                    msg.status === 'playing'
                      ? darkMode
                        ? 'border-l-2 border-cyan-400 bg-cyan-500/10'
                        : 'border-l-2 border-cyan-500 bg-cyan-50'
                      : msg.status === 'done'
                        ? 'border-l border-gray-600/30 pl-3 opacity-40'
                        : 'border-l border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {editingNick === msg.id ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingValue.trim()) {
                              setNickOverrides(prev => ({ ...prev, [msg.user]: editingValue.trim() }))
                            }
                            setEditingNick(null)
                          }
                          if (e.key === 'Escape') setEditingNick(null)
                        }}
                        onBlur={() => {
                          if (editingValue.trim()) {
                            setNickOverrides(prev => ({ ...prev, [msg.user]: editingValue.trim() }))
                          }
                          setEditingNick(null)
                        }}
                        className={`text-sm font-semibold px-1 py-0 rounded outline-none w-32 ${
                          darkMode ? 'bg-gray-700 text-cyan-300 border border-cyan-500/50' : 'bg-white text-cyan-600 border border-cyan-300'
                        }`}
                      />
                    ) : (
                      <div className="flex items-center gap-1 group/nick">
                        {/* Nick: click izquierdo = editar, click derecho = ban toggle */}
                        <p
                          onClick={() => {
                            if (!bannedUsers.has(msg.user)) {
                              setEditingNick(msg.id)
                              setEditingValue(nickOverrides[msg.user] || msg.nickname || msg.user)
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            setBannedUsers(prev => {
                              const next = new Set(prev)
                              if (next.has(msg.user)) next.delete(msg.user)
                              else next.add(msg.user)
                              bannedRef.current = next
                              return next
                            })
                          }}
                          className={`font-semibold cursor-pointer select-none px-1 rounded transition-colors ${
                            bannedUsers.has(msg.user)
                              ? 'text-red-400 bg-red-500/15 line-through'
                              : msg.status === 'playing'
                                ? 'text-cyan-400 hover:underline'
                                : 'text-cyan-300 hover:underline'
                          }`}
                          title={bannedUsers.has(msg.user) ? "Click derecho para desbloquear" : "Click para editar · Click derecho para silenciar"}
                        >
                          {nickOverrides[msg.user] || msg.nickname || msg.user}
                        </p>
                      </div>
                    )}
                    {msg.status === 'playing' && (
                      <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <p className={
                    msg.status === 'playing'
                      ? darkMode ? "text-white font-medium" : "text-gray-900 font-medium"
                      : darkMode ? "text-gray-300" : "text-gray-700"
                  }>{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Volumen */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setVolume(v => v > 0 ? 0 : 0.8)}
              className="hover:opacity-80 transition-opacity"
            >
              {volume === 0
                ? <VolumeX className="w-3.5 h-3.5 text-red-400" />
                : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              }
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 rounded-full appearance-none cursor-pointer accent-cyan-400"
              style={{
                background: `linear-gradient(to right, #22d3ee ${volume * 100}%, ${darkMode ? '#1e293b' : '#d1d5db'} ${volume * 100}%)`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
