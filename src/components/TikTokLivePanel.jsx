import { useState, useEffect, useRef } from 'react'
import { Play, Square, AlertCircle, Loader, MessageCircle, Volume2, VolumeX, Ban, Pause, RotateCcw, Highlighter, X } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const isQuestion = (text) => {
  const trimmed = text.trim().toLowerCase()
  if (trimmed.includes('?')) return true
  const questionWords = /^(qué|que|cómo|como|cuándo|cuando|dónde|donde|por\s?qué|por\s?que|cuál|cual|quién|quien|cuánto|cuanto|what|how|when|where|why|who|which|is|are|do|does|can|will|would)\b/i
  return questionWords.test(trimmed)
}

const hasExcessiveEmojis = (text, maxAllowed = 3) => {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  const emojis = text.match(emojiRegex) || []
  const nonEmoji = text.replace(emojiRegex, '').trim()
  return emojis.length > maxAllowed || (emojis.length > 0 && nonEmoji.length === 0)
}

const hasLinks = (text) => /https?:\/\/|www\.|\.com|\.net|\.org|bit\.ly/i.test(text)

const getPlainNick = (nickname) => {
  // Eliminar emojis del nickname
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  let cleanNick = nickname.replace(emojiRegex, '')

  // Eliminar números, caracteres especiales - mantener SOLO letras (con acentos) y espacios
  cleanNick = cleanNick.replace(/[^a-zA-Z\u00C0-\u00FF ]/g, '')

  // Limpiar espacios múltiples y espacios al inicio/final
  return cleanNick.trim().replace(/\s+/g, ' ')
}

const removeEmojis = (text) => {
  // Eliminar todos los emojis del texto
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
  return text.replace(emojiRegex, '').trim()
}

// Obtener token del localStorage
const getAuthToken = () => localStorage.getItem('sv-token') || ''

// Funciones para interactuar con API de bans y nicks
const apiBans = {
  async getAll() {
    try {
      const res = await fetch(`${API_URL}/api/bans`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('[API] Error getting bans:', err.message)
      return []
    }
  },

  async add(username) {
    try {
      const res = await fetch(`${API_URL}/api/bans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, reason: 'Banned from chat' })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('[API] Error adding ban:', err.message)
      return null
    }
  },

  async remove(username) {
    try {
      const res = await fetch(`${API_URL}/api/bans/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('[API] Error removing ban:', err.message)
      return null
    }
  }
}

const apiNicks = {
  async getAll() {
    try {
      const res = await fetch(`${API_URL}/api/nicks`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('[API] Error getting nicks:', err.message)
      return {}
    }
  },

  async set(username, newNickname) {
    try {
      const res = await fetch(`${API_URL}/api/nicks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, newNickname })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('[API] Error setting nick:', err.message)
      return null
    }
  },

  async remove(username) {
    try {
      const res = await fetch(`${API_URL}/api/nicks/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('[API] Error removing nick:', err.message)
      return null
    }
  }
}

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
  const connectedAtRef = useRef(null)
  const [donors, setDonors] = useState(new Set())
  const [nickOverrides, setNickOverrides] = useState({})
  const [editingNick, setEditingNick] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [bannedUsers, setBannedUsers] = useState(new Set())
  const [volume, setVolume] = useState(0.8)
  const [isPaused, setIsPaused] = useState(false)
  const [highlightedUsers, setHighlightedUsers] = useState({})
  const [highlightMode, setHighlightMode] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#06b6d4')
  const [showHighlightPanel, setShowHighlightPanel] = useState(false)
  const [highlightRules, setHighlightRules] = useState({
    moderators: { enabled: false, color: '#a855f7' },
    donors: { enabled: false, color: '#f59e0b' },
    banned: { enabled: false, color: '#ef4444' },
    subscribers: { enabled: false, color: '#ec4899' },
    topFans: { enabled: false, color: '#06b6d4' },
  })
  const isPausedRef = useRef(false)
  const wsRef = useRef(null)
  const statusIntervalRef = useRef(null)
  const speakQueueRef = useRef([])
  const isProcessingRef = useRef(false)
  const lastMessageRef = useRef({}) // { username: lastText }
  const currentAudioRef = useRef(null)
  const disconnectedRef = useRef(false)
  const chatContainerRef = useRef(null)
  const bannedRef = useRef(new Set())
  const nickOverridesRef = useRef({})
  const configRef = useRef(config)
  const volumeRef = useRef(0.8)
  // Cooldown por tipo de notificación (timestamp del último anuncio)
  const lastNotifTime = useRef({ like: 0, viewer_count: 0, share: 0, follow: 0, gift: 0 })

  // Auto-scroll del chat al fondo cuando llegan mensajes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Mantener refs actualizados para acceso en callbacks del WebSocket
  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])
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

    ws.onopen = async () => {
      console.log('[TikTok] WebSocket conectado')
      ws.send(JSON.stringify({ type: 'subscribe', username: tiktokUser }))

      // Cargar bans y nicks desde BD
      const bans = await apiBans.getAll()
      const nicks = await apiNicks.getAll()

      setBannedUsers(new Set(bans.map(b => b.banned_username)))
      setNickOverrides(nicks)
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        const c = configRef.current

        // Si está pausado, ignorar todo excepto el ping de subscribed/status
        if (isPausedRef.current && data.type !== 'subscribed' && data.type !== 'status') return

        if (data.type === 'subscribed') {
          console.log('[TikTok] Suscrito a:', data.username)

        // Helper cooldown: solo anuncia si pasó suficiente tiempo
        const canAnnounce = (type, cooldownSecs) => {
          const now = Date.now()
          if (now - lastNotifTime.current[type] < cooldownSecs * 1000) return false
          lastNotifTime.current[type] = now
          return true
        }

        // === EVENTOS DE NOTIFICACIÓN ===
        } else if (data.data && data.data.type === 'gift') {
          const giftData = data.data
          console.log(`[TikTok] 🎁 Regalo de @${giftData.username}: ${giftData.giftName}`)
          setDonors(prev => new Set([...prev, giftData.username]))
          if (c.announceGifts && canAnnounce('gift', c.giftCooldown || 5)) {
            const text = `${giftData.username} envió ${giftData.giftName}`
            queueMessage(text, giftData.username, { isNotification: true })
          }

        } else if (data.data && data.data.type === 'follow') {
          if (c.announceFollowers && canAnnounce('follow', c.followCooldown || 10)) {
            const text = `Nuevo seguidor: ${data.data.username}`
            queueMessage(text, data.data.username, { isNotification: true })
          }

        } else if (data.data && data.data.type === 'like') {
          if (c.announceLikes && data.data.totalLikeCount && canAnnounce('like', c.likeCooldown || 60)) {
            const text = `Ya tienes ${data.data.totalLikeCount} likes`
            queueMessage(text, 'sistema', { isNotification: true })
          }

        } else if (data.data && data.data.type === 'share') {
          if (c.announceShares && canAnnounce('share', c.shareCooldown || 15)) {
            const text = `${data.data.username} compartió tu stream`
            queueMessage(text, data.data.username, { isNotification: true })
          }

        } else if (data.data && data.data.type === 'viewer_count') {
          if (c.announceViewers && canAnnounce('viewer_count', c.viewerCooldown || 120)) {
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
              isSubscriber: msg.isSubscriber || false,
              isTopGifter: msg.topGifterRank > 0,
              isBanned
            }
          ])
          // Sumar al contador de comentarios
          setStats(prev => ({ ...prev, count: prev.count + 1 }))

          // Si está baneado, no leer en voz
          if (isBanned) return

          // Filtro: solo donadores
          if (c.onlyDonors && !msg.isDonor && !donors.has(msg.username)) return

          // Filtro: solo moderadores
          if (c.onlyModerators && !msg.isModerator) return

          // Filtro: solo preguntas
          if (c.onlyQuestions && !isQuestion(msg.text)) return

          // Filtro: saltar repetidos (por usuario, no global)
          const normalizedText = msg.text.trim().toLowerCase()
          if (c.skipRepeated && normalizedText === lastMessageRef.current[msg.username]) return
          lastMessageRef.current[msg.username] = normalizedText

          // Filtro: ignorar enlaces
          if (c.ignoreLinks && hasLinks(msg.text)) return

          // Filtro: no leer emojis en chat (quitar todos los emojis del texto)
          let textToProcess = msg.text
          if (c.stripChatEmojis) {
            textToProcess = removeEmojis(textToProcess)
            if (!textToProcess.trim()) return
          }

          // Filtro: limpiar emojis excesivos del texto (no ignorar el mensaje)
          if (c.ignoreExcessiveEmojis && hasExcessiveEmojis(textToProcess, parseInt(c.maxEmojisAllowed) || 3)) {
            textToProcess = removeEmojis(textToProcess)
            if (!textToProcess.trim()) return
          }

          // Filtro: largo mínimo
          if (c.minMessageLengthEnabled && textToProcess.trim().length < c.minMessageLength) return

          // Limitar cola máxima
          if (c.maxQueueEnabled && speakQueueRef.current.length >= c.maxQueueSize) {
            console.log(`[TikTok] Cola llena (${c.maxQueueSize}), descartando mensaje`)
            return
          }

          // Limitar caracteres en todos los mensajes
          let textToSpeak = textToProcess
          if (c.donorCharLimitEnabled) {
            textToSpeak = textToProcess.substring(0, c.donorCharLimit)
          }

          // Construir texto final (usar nickname para lectura, no el username técnico)
          let displayName = nickOverridesRef.current[msg.username] || msg.nickname || msg.username

          // Si está activado, eliminar emojis y caracteres especiales del nickname
          if (c.onlyPlainNicks && !nickOverridesRef.current[msg.username]) {
            displayName = getPlainNick(displayName)
          }

          const finalText = c.readOnlyMessage ? textToSpeak : `${displayName}: ${textToSpeak}`

          queueMessage(finalText, msg.username, { isDonor: msg.isDonor || donors.has(msg.username), isModerator: msg.isModerator })

        } else if (data.type === 'status') {
          // Stats manejados localmente (timer + contador de mensajes)
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

  // Timer local de uptime — sube 1 segundo cada segundo mientras está conectado
  useEffect(() => {
    if (!isConnected) return
    connectedAtRef.current = connectedAtRef.current || Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - connectedAtRef.current) / 1000)
      setStats(prev => ({ ...prev, uptime: elapsed }))
    }, 1000)
    return () => clearInterval(interval)
  }, [isConnected])

  // Cola de audio
  const queueMessage = (text, username, extra = {}) => {
    speakQueueRef.current.push({ text: text.toLowerCase(), username, ...extra })
    console.log(`[TikTok] Agregado a cola (${speakQueueRef.current.length} pendientes)`)
    processQueue()
  }

  const processQueue = async () => {
    if (isProcessingRef.current) return
    if (speakQueueRef.current.length === 0) return
    if (isPausedRef.current) return

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
        connectedAtRef.current = Date.now()
        setStats({ count: 0, uptime: 0 })
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

  const handlePause = () => {
    if (!isPaused) {
      // Pausar: detener audio actual y vaciar cola
      isPausedRef.current = true
      setIsPaused(true)
      speakQueueRef.current = []
      isProcessingRef.current = false
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.src = ''
        currentAudioRef.current = null
      }
    } else {
      // Reanudar: limpiar cola vieja y arrancar desde cero
      isPausedRef.current = false
      setIsPaused(false)
      speakQueueRef.current = []
      isProcessingRef.current = false
    }
  }

  const handleRefresh = () => {
    speakQueueRef.current = []
    isProcessingRef.current = false
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
    // Si estaba pausado, reanudar también
    if (isPausedRef.current) {
      isPausedRef.current = false
      setIsPaused(false)
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
      connectedAtRef.current = null
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
                <p className="text-lg font-bold text-purple-300">
                  {stats.uptime < 60
                    ? `${stats.uptime}s`
                    : `${Math.floor(stats.uptime / 60)}m ${stats.uptime % 60}s`}
                </p>
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
              messages.map((msg, idx) => {
                // Color: primero reglas por tipo, luego override manual
                const autoColor = (highlightRules.moderators.enabled && msg.isModerator) ? highlightRules.moderators.color
                  : (highlightRules.topFans.enabled && msg.isTopGifter) ? highlightRules.topFans.color
                  : (highlightRules.donors.enabled && msg.isDonor) ? highlightRules.donors.color
                  : (highlightRules.subscribers.enabled && msg.isSubscriber) ? highlightRules.subscribers.color
                  : (highlightRules.banned.enabled && msg.isBanned) ? highlightRules.banned.color
                  : null
                const hlColor = highlightedUsers[msg.user] || autoColor
                return (
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
                  style={hlColor ? { backgroundColor: `${hlColor}20`, borderLeftColor: hlColor, borderLeftWidth: '3px' } : undefined}
                >
                  <div className="flex items-center justify-between">
                    {editingNick === msg.id ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            if (editingValue.trim()) {
                              await apiNicks.set(msg.user, editingValue.trim())
                              setNickOverrides(prev => ({ ...prev, [msg.user]: editingValue.trim() }))
                            }
                            setEditingNick(null)
                          }
                          if (e.key === 'Escape') setEditingNick(null)
                        }}
                        onBlur={async () => {
                          if (editingValue.trim()) {
                            await apiNicks.set(msg.user, editingValue.trim())
                            setNickOverrides(prev => ({ ...prev, [msg.user]: editingValue.trim() }))
                          } else {
                            // Si queda vacío, remover del override
                            await apiNicks.remove(msg.user)
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
                            if (highlightMode) {
                              // En modo remarcar: toggle highlight del usuario
                              setHighlightedUsers(prev => {
                                const next = { ...prev }
                                if (next[msg.user] === selectedColor) {
                                  delete next[msg.user]
                                } else {
                                  next[msg.user] = selectedColor
                                }
                                return next
                              })
                              return
                            }
                            if (!bannedUsers.has(msg.user)) {
                              setEditingNick(msg.id)
                              setEditingValue(nickOverrides[msg.user] || msg.nickname || msg.user)
                            }
                          }}
                          onContextMenu={async (e) => {
                            e.preventDefault()
                            const isBanned = bannedUsers.has(msg.user)

                            if (isBanned) {
                              // Desbanear
                              await apiBans.remove(msg.user)
                              setBannedUsers(prev => {
                                const next = new Set(prev)
                                next.delete(msg.user)
                                bannedRef.current = next
                                return next
                              })
                            } else {
                              // Banear
                              await apiBans.add(msg.user)
                              setBannedUsers(prev => {
                                const next = new Set(prev)
                                next.add(msg.user)
                                bannedRef.current = next
                                return next
                              })
                            }
                          }}
                          className={`font-semibold cursor-pointer select-none px-1 rounded transition-colors ${
                            bannedUsers.has(msg.user)
                              ? 'text-red-400 bg-red-500/15 line-through'
                              : msg.status === 'playing'
                                ? 'text-cyan-400 hover:underline'
                                : 'text-cyan-300 hover:underline'
                          }`}
                          title={highlightMode ? "Click para remarcar/desmarcar este usuario" : bannedUsers.has(msg.user) ? "Click derecho para desbloquear" : "Click para editar · Click derecho para silenciar"}
                        >
                          {hlColor && <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: hlColor }} />}
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
                )
              })
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePause}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                  isPaused
                    ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                    : darkMode
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
                title={isPaused ? 'Reanudar lectura' : 'Pausar lectura'}
              >
                {isPaused
                  ? <><Play className="w-3.5 h-3.5" /> Reanudar</>
                  : <><Pause className="w-3.5 h-3.5" /> Pausar</>
                }
              </button>
              <button
                onClick={handleRefresh}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                  darkMode
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                    : 'bg-cyan-500 text-white hover:bg-cyan-400'
                }`}
                title="Saltar cola y continuar desde el próximo mensaje"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refrescar
              </button>
              <button
                onClick={() => setShowHighlightPanel(!showHighlightPanel)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                  showHighlightPanel || highlightMode
                    ? 'bg-amber-400 text-gray-900 hover:bg-amber-300'
                    : darkMode
                      ? 'bg-amber-600 text-white hover:bg-amber-500'
                      : 'bg-amber-500 text-white hover:bg-amber-400'
                }`}
                title="Remarcar usuarios con color"
              >
                <Highlighter className="w-3.5 h-3.5" /> Remarcar
              </button>
            </div>
            <div className="flex items-center gap-1.5">
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
                type="range" min="0" max="1" step="0.01" value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 rounded-full appearance-none cursor-pointer accent-cyan-400"
                style={{
                  background: `linear-gradient(to right, #22d3ee ${volume * 100}%, ${darkMode ? '#1e293b' : '#d1d5db'} ${volume * 100}%)`
                }}
              />
            </div>
          </div>

          {/* Panel Remarcar */}
          {showHighlightPanel && (
            <div className={`rounded-lg border p-3 space-y-3 ${
              darkMode ? 'bg-gray-900/80 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
                  Remarcar por tipo
                </span>
                <button onClick={() => setShowHighlightPanel(false)} className="text-gray-400 hover:text-gray-200"><X className="w-3.5 h-3.5" /></button>
              </div>

              {/* Reglas por tipo */}
              {[
                { key: 'moderators', label: 'Moderadores' },
                { key: 'donors', label: 'Donadores' },
                { key: 'subscribers', label: 'Suscriptores' },
                { key: 'topFans', label: 'Top Fans / Gifters' },
                { key: 'banned', label: 'Baneados (silenciados)' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <button
                    onClick={() => setHighlightRules(prev => ({
                      ...prev,
                      [key]: { ...prev[key], enabled: !prev[key].enabled }
                    }))}
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      highlightRules[key].enabled ? 'border-amber-400 bg-amber-400/30' : darkMode ? 'border-gray-500' : 'border-gray-400'
                    }`}
                  >
                    {highlightRules[key].enabled && <span className="text-amber-300 text-[10px] font-bold">✓</span>}
                  </button>
                  <span className={`text-xs font-medium flex-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
                  <div className="flex gap-1">
                    {['#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ec4899'].map(c => (
                      <button
                        key={c}
                        onClick={() => setHighlightRules(prev => ({
                          ...prev,
                          [key]: { ...prev[key], color: c, enabled: true }
                        }))}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          highlightRules[key].color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Remarcar manual */}
              <div className={`pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-amber-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
                    Remarcar usuario manual
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHighlightMode(!highlightMode)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all ${
                      highlightMode
                        ? 'bg-amber-400 text-gray-900'
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <Highlighter className="w-3 h-3" />
                    {highlightMode ? 'Seleccionando...' : 'Click en nick'}
                  </button>
                  <div className="flex gap-1">
                    {['#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ec4899'].map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          selectedColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  {Object.keys(highlightedUsers).length > 0 && (
                    <button
                      onClick={() => setHighlightedUsers({})}
                      className="text-[10px] text-gray-400 hover:text-red-400 ml-auto"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
