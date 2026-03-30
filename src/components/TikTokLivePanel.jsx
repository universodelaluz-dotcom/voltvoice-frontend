import { useState, useEffect, useRef } from 'react'
import { Play, Square, AlertCircle, Loader, MessageCircle, Volume2, VolumeX, Ban, Pause, RotateCcw, Highlighter, X } from 'lucide-react'
import chatStore from '../services/chatStore.js'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const isQuestion = (text) => {
  const trimmed = text.trim().toLowerCase()
  if (trimmed.includes('?')) return true
  const questionWords = /^(qué|que|cómo|como|cuándo|cuando|dónde|donde|por\s?qué|por\s?que|cuál|cual|quién|quien|cuánto|cuanto|what|how|when|where|why|who|which|is|are|do|does|can|will|would)\b/i
  return questionWords.test(trimmed)
}

// Regex completa para detectar TODOS los emojis Unicode
const emojiFullRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}-\u{231B}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{2702}\u{2708}\u{2709}\u{270A}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}-\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}-\u{1F251}]/gu

const hasExcessiveEmojis = (text, maxAllowed = 3) => {
  const emojis = text.match(emojiFullRegex) || []
  const nonEmoji = text.replace(emojiFullRegex, '').trim()
  return emojis.length > maxAllowed || (emojis.length > 0 && nonEmoji.length === 0)
}

const hasLinks = (text) => /https?:\/\/|www\.|\.com|\.net|\.org|bit\.ly/i.test(text)

// Normalizar Unicode para evitar homóglifos y caracteres de evasión
const normalizeUnicode = (text) => {
  // Contar caracteres sospechosos antes de normalizar
  const suspiciousChars = text.match(/[\u0370-\u03FF\u0400-\u04FF\u3040-\u309F\u4E00-\u9FFF\u2000-\u206F\u2070-\u209F]/g) || []
  const suspiciousRatio = suspiciousChars.length / text.length

  // Si más del 30% son caracteres no-latinos sospechosos, marcar como riesgoso
  if (suspiciousRatio > 0.3) {
    return { text, suspicious: true, reason: 'Muchos caracteres especiales detectados' }
  }

  // Normalizar Unicode NFKD (descomponer caracteres)
  const normalized = text.normalize('NFKD')
    // Remover diacríticos y convertir a ASCII similar
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar caracteres cirilicos/griegos/CJK comunes con advertencia
    .replace(/[а-яЁё]/g, 'a') // Cirílico
    .replace(/[α-ω]/g, 'a')   // Griego
    .replace(/[ぁ-ん]/g, 'a')  // Hiragana
    .replace(/[ァ-ン]/g, 'a')  // Katakana
    .replace(/[一-龯]/g, 'a')  // Kanji

  // Detectar si hubo cambios importantes
  const changed = normalized.toLowerCase() !== text.toLowerCase()

  return { text: normalized, suspicious: changed && suspiciousRatio > 0, reason: changed ? 'Caracteres Unicode normalizados' : null }
}

const getPlainNick = (nickname) => {
  // Eliminar emojis del nickname
  let cleanNick = nickname.replace(emojiFullRegex, '')

  // Eliminar números, caracteres especiales - mantener SOLO letras (con acentos) y espacios
  cleanNick = cleanNick.replace(/[^a-zA-Z\u00C0-\u00FF ]/g, '')

  // Limpiar espacios múltiples y espacios al inicio/final
  return cleanNick.trim().replace(/\s+/g, ' ')
}

const removeEmojis = (text) => {
  return text.replace(emojiFullRegex, '').trim()
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

export default function TikTokLivePanel({ config = {}, updateConfig }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  const [tiktokUser, setTiktokUser] = useState(config.lastTiktokUser || '')
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
  const [chatFontSize, setChatFontSize] = useState(config.chatFontSize || 14)
  const [chatNickColor, setChatNickColor] = useState(config.chatNickColor || '#22d3ee')
  const [chatMsgColor, setChatMsgColor] = useState(config.chatMsgColor || '#d1d5db')
  const [showFontPanel, setShowFontPanel] = useState(false)
  const [highlightRules, setHighlightRules] = useState(config.highlightRules || {
    moderators: { enabled: false, color: '#a855f7' },
    donors: { enabled: false, color: '#f59e0b' },
    banned: { enabled: false, color: '#ef4444' },
    subscribers: { enabled: false, color: '#ec4899' },
    topFans: { enabled: false, color: '#06b6d4' },
  })

  // Sincronizar cambios de estilo y remarcar al config del usuario (auto-save)
  useEffect(() => {
    if (updateConfig) {
      updateConfig('chatFontSize', chatFontSize)
    }
  }, [chatFontSize])
  useEffect(() => {
    if (updateConfig) {
      updateConfig('chatNickColor', chatNickColor)
    }
  }, [chatNickColor])
  useEffect(() => {
    if (updateConfig) {
      updateConfig('chatMsgColor', chatMsgColor)
    }
  }, [chatMsgColor])
  useEffect(() => {
    if (updateConfig) {
      updateConfig('highlightRules', highlightRules)
    }
  }, [highlightRules])
  const isPausedRef = useRef(false)
  const isPttSuppressedRef = useRef(false)
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
  const pttSnapshotRef = useRef({ wasPaused: false, hadCurrentAudio: false })
  const pttRestoreTimerRef = useRef(null)
  const autoScrollPinnedRef = useRef(true)
  // Cooldown por tipo de notificación (timestamp del último anuncio)
  const lastNotifTime = useRef({ like: 0, viewer_count: 0, share: 0, follow: 0, gift: 0 })

  // Auto-scroll suave: solo scroll al fondo si el usuario está cerca del fondo
  const lastPlayingIdRef = useRef(null)
  useEffect(() => {
    if (!chatContainerRef.current) return
    const container = chatContainerRef.current
    const playing = container.querySelector('[data-playing="true"]')

    if (playing) {
      const playingId = playing.getAttribute('data-playing-id')
      // Solo scroll al mensaje playing si es uno NUEVO (evita rebotes)
      if (playingId !== lastPlayingIdRef.current) {
        lastPlayingIdRef.current = playingId
        playing.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    } else if (autoScrollPinnedRef.current) {
      lastPlayingIdRef.current = null
      container.scrollTop = container.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!chatContainerRef.current) return
    const container = chatContainerRef.current
    const onScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
      autoScrollPinnedRef.current = isNearBottom
    }
    onScroll()
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  // Mantener refs actualizados para acceso en callbacks del WebSocket
  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { bannedRef.current = bannedUsers; chatStore.syncBannedUsers(bannedUsers) }, [bannedUsers])
  useEffect(() => { nickOverridesRef.current = nickOverrides; chatStore.syncNickOverrides(nickOverrides) }, [nickOverrides])
  useEffect(() => { chatStore.syncHighlightedUsers(highlightedUsers) }, [highlightedUsers])

  useEffect(() => {
    const handlePttAudioState = (event) => {
      const active = !!event.detail?.active

      if (active) {
        if (isPttSuppressedRef.current) return

        if (pttRestoreTimerRef.current) {
          clearTimeout(pttRestoreTimerRef.current)
          pttRestoreTimerRef.current = null
        }

        pttSnapshotRef.current = {
          wasPaused: isPausedRef.current,
          hadCurrentAudio: !!currentAudioRef.current
        }

        isPttSuppressedRef.current = true

        if (currentAudioRef.current) {
          currentAudioRef.current.pause()
        }

        console.log('[TikTok] Chat audio suppressed for push-to-talk')
        return
      }

      if (!isPttSuppressedRef.current) return

      isPttSuppressedRef.current = false
      console.log('[TikTok] Restoring chat audio after push-to-talk')

      pttRestoreTimerRef.current = setTimeout(() => {
        pttRestoreTimerRef.current = null
        if (!pttSnapshotRef.current.wasPaused) {
          if (currentAudioRef.current) {
            currentAudioRef.current.play().catch(() => {})
          } else {
            processQueue()
          }
        }
      }, 1500)
    }

    window.addEventListener('voltvoice:ptt-audio-state', handlePttAudioState)
    return () => {
      window.removeEventListener('voltvoice:ptt-audio-state', handlePttAudioState)
      if (pttRestoreTimerRef.current) {
        clearTimeout(pttRestoreTimerRef.current)
      }
    }
  }, [])

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

      const bannedSet = new Set(bans.map(b => b.banned_username))
      setBannedUsers(bannedSet)
      setNickOverrides(nicks)

      // Sync to chatStore for bot access
      chatStore.syncBannedUsers(bannedSet)
      chatStore.syncNickOverrides(nicks)

      // Register action callbacks so bot tools can update UI state
      chatStore.registerAction('onBan', (username) => {
        setBannedUsers(prev => { const next = new Set(prev); next.add(username); return next })
      })
      chatStore.registerAction('onUnban', (username) => {
        setBannedUsers(prev => { const next = new Set(prev); next.delete(username); return next })
      })
      chatStore.registerAction('onHighlight', (username, color) => {
        setHighlightedUsers(prev => ({ ...prev, [username]: color }))
      })
      chatStore.registerAction('onRemoveHighlight', (username) => {
        setHighlightedUsers(prev => { const next = { ...prev }; delete next[username]; return next })
      })
      chatStore.registerAction('onSetNick', (username, nickname) => {
        setNickOverrides(prev => ({ ...prev, [username]: nickname }))
      })
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
          console.log(`[TikTok] Nuevo mensaje: ${msg.username} - ${msg.text}`)
          console.log(`  → isDonor: ${msg.isDonor}, isModerator: ${msg.isModerator}, isSubscriber: ${msg.isSubscriber}, topGifterRank: ${msg.topGifterRank}`)
          console.log(`  → Full msg object:`, JSON.stringify(msg, null, 2))

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

          // Feed message to chatStore for bot access
          chatStore.addMessage({
            user: msg.username,
            nickname: msg.nickname,
            text: msg.text,
            timestamp: Date.now(),
            isModerator: msg.isModerator || false,
            isSubscriber: msg.isSubscriber || false,
            isTopGifter: msg.topGifterRank > 0,
            isDonor: msg.isDonor || donors.has(msg.username),
            isQuestion: isQuestion(msg.text)
          })

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

          // Filtro: Normalizar Unicode y detectar intentos de evasión
          const unicodeCheck = normalizeUnicode(textToProcess)
          if (unicodeCheck.suspicious) {
            console.log(`[TikTok] ⚠️ Mensaje sospechoso detectado: ${unicodeCheck.reason}`)
            console.log(`[TikTok] Usuario: ${msg.username}, Texto original: ${textToProcess.substring(0, 50)}...`)
            // Silenciosamente usar el texto normalizado, pero alertar en logs
            textToProcess = unicodeCheck.text
          } else if (unicodeCheck.text !== textToProcess) {
            // Si hay normalización pero no es sospechoso, usar el texto normalizado
            textToProcess = unicodeCheck.text
          }
          if (!textToProcess.trim()) return

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

          queueMessage(finalText, msg.username, { id: msg.id, isDonor: msg.isDonor || donors.has(msg.username), isModerator: msg.isModerator })

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
    if (isPttSuppressedRef.current) return

    isProcessingRef.current = true

    while (speakQueueRef.current.length > 0) {
      if (disconnectedRef.current) break
      if (isPausedRef.current || isPttSuppressedRef.current) break
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
              msg.id === item.id ? { ...msg, status: 'playing' } : msg
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
                  msg.id === item.id ? { ...msg, status: 'done' } : msg
                )
              )
              resolve()
            }
            audio.onerror = () => { currentAudioRef.current = null; resolve() }
            if (isPttSuppressedRef.current) {
              audio.pause()
              resolve()
              return
            }
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
        // Guardar último usuario conectado
        if (updateConfig) updateConfig('lastTiktokUser', tiktokUser.trim())
      } else {
        setError(data.error || 'Error conectando a TikTok')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const markPlayingMessagesAsDone = () => {
    setMessages((prev) => prev.map((msg) => (
      msg.status === 'playing'
        ? { ...msg, status: 'done' }
        : msg
    )))
    lastPlayingIdRef.current = null
  }

  const keepReadMessageVisible = () => {
    requestAnimationFrame(() => {
      const container = chatContainerRef.current
      if (!container) return

      const currentPlaying = container.querySelector('[data-playing="true"]')
      if (currentPlaying) {
        currentPlaying.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        return
      }

      if (autoScrollPinnedRef.current) {
        container.scrollTop = container.scrollHeight
      }
    })
  }

  const handlePause = () => {
    if (!isPaused) {
      // Pausar: detener audio actual y vaciar cola
      isPausedRef.current = true
      setIsPaused(true)
      markPlayingMessagesAsDone()
      speakQueueRef.current = []
      isProcessingRef.current = false
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.src = ''
        currentAudioRef.current = null
      }
      keepReadMessageVisible()
    } else {
      // Reanudar: limpiar cola vieja y arrancar desde cero
      isPausedRef.current = false
      setIsPaused(false)
      speakQueueRef.current = []
      isProcessingRef.current = false
      keepReadMessageVisible()
    }
  }

  const handleRefresh = () => {
    markPlayingMessagesAsDone()
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
    keepReadMessageVisible()
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

          <div ref={chatContainerRef} className={darkMode ? "bg-[#0f0f23]/80 border border-cyan-400/20 rounded-lg p-4 h-96 overflow-y-auto space-y-2" : "bg-gray-50 border border-indigo-200 rounded-lg p-4 h-96 overflow-y-auto space-y-2"}>
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
                  : (highlightRules.donors.enabled && (msg.isDonor || donors.has(msg.user))) ? highlightRules.donors.color
                  : (highlightRules.subscribers.enabled && msg.isSubscriber) ? highlightRules.subscribers.color
                  : (highlightRules.banned.enabled && bannedUsers.has(msg.user)) ? highlightRules.banned.color
                  : null
                const hlColor = highlightedUsers[msg.user] || autoColor
                // DEBUG: Log para test messages
                if (msg.user?.startsWith('test_')) {
                  console.log(`[RENDER DEBUG] ${msg.user}:`, {
                    isModerator: msg.isModerator,
                    isDonor: msg.isDonor,
                    isSubscriber: msg.isSubscriber,
                    isTopGifter: msg.isTopGifter,
                    rules: {
                      modEnabled: highlightRules.moderators.enabled,
                      donorEnabled: highlightRules.donors.enabled,
                      subEnabled: highlightRules.subscribers.enabled,
                      topEnabled: highlightRules.topFans.enabled,
                    },
                    autoColor,
                    hlColor
                  })
                }
                // Tipo de badge para mostrar
                const badgeLabel = msg.isModerator ? '⚔️ MOD' : msg.isTopGifter ? '🏆 TOP' : msg.isDonor ? '🎁 DONOR' : msg.isSubscriber ? '⭐ SUB' : null
                return (
                <div
                  key={idx}
                  data-playing={msg.status === 'playing' ? 'true' : undefined}
                  data-playing-id={msg.status === 'playing' ? msg.id : undefined}
                  style={{ fontSize: `${chatFontSize}px`, ...(hlColor ? { backgroundColor: `${hlColor}40`, borderLeftColor: hlColor, borderLeftWidth: '4px' } : {}) }}
                  className={`pl-3 py-2 rounded-r transition-all duration-300 relative ${
                    msg.status === 'playing'
                      ? darkMode
                        ? 'border-l-2 border-cyan-400 bg-cyan-500/10'
                        : 'border-l-2 border-cyan-500 bg-cyan-50'
                      : msg.status === 'done'
                        ? 'border-l border-gray-600/30 pl-3'
                        : 'border-l border-cyan-500/30'
                  }`}
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
                              : 'hover:underline'
                          }`}
                          style={!bannedUsers.has(msg.user) ? { color: chatNickColor } : undefined}
                          title={highlightMode ? "Click para remarcar/desmarcar este usuario" : bannedUsers.has(msg.user) ? "Click derecho para desbloquear" : "Click para editar · Click derecho para silenciar"}
                        >
                          {hlColor && <span className="inline-block w-2.5 h-2.5 rounded-full mr-1 ring-1 ring-white/30" style={{ backgroundColor: hlColor }} />}
                          {nickOverrides[msg.user] || msg.nickname || msg.user}
                          {badgeLabel && <span className="ml-1 text-[9px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: hlColor || '#666', color: '#fff' }}>{badgeLabel}</span>}
                        </p>
                      </div>
                    )}
                    {msg.status === 'playing' && (
                      <span className="flex items-center gap-1">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                        </span>
                        <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                      </span>
                    )}
                  </div>
                  <p className={msg.status === 'playing' ? "font-medium" : ""}
                    style={{ color: chatMsgColor }}
                  >{msg.text}</p>
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
              {/* Botón para abrir panel de estilo del chat */}
              <button
                onClick={() => setShowFontPanel(!showFontPanel)}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                  showFontPanel
                    ? 'bg-cyan-400 text-gray-900 hover:bg-cyan-300'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300 border border-gray-300'
                }`}
                title="Tamaño y colores del chat"
              >
                <span style={{ fontSize: '13px' }}>Aa</span>
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
              <div className={`mx-1 h-4 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
              <span className={`text-[10px] font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Vel {Number(config.audioSpeed || 1).toFixed(1)}x
              </span>
              <input
                type="range" min="0.5" max="2" step="0.1" value={Number(config.audioSpeed || 1)}
                onChange={(e) => updateConfig && updateConfig('audioSpeed', parseFloat(e.target.value))}
                className="w-20 h-1 rounded-full appearance-none cursor-pointer accent-fuchsia-400"
                style={{
                  background: `linear-gradient(to right, #d946ef ${((Number(config.audioSpeed || 1) - 0.5) / 1.5) * 100}%, ${darkMode ? '#1e293b' : '#d1d5db'} ${((Number(config.audioSpeed || 1) - 0.5) / 1.5) * 100}%)`
                }}
              />
            </div>
          </div>

          {/* Panel Estilo del Chat */}
          {showFontPanel && (
            <div className={`rounded-lg border p-3 space-y-3 ${
              darkMode ? 'bg-gray-900/80 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-cyan-400/80' : 'text-cyan-600'}`}>
                  Estilo del Chat
                </span>
                <button onClick={() => setShowFontPanel(false)} className="text-gray-400 hover:text-gray-200"><X className="w-3.5 h-3.5" /></button>
              </div>

              {/* Tamaño de letra */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium w-20 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tamaño</span>
                <button
                  onClick={() => setChatFontSize(s => Math.max(10, s - 1))}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                >A-</button>
                <span className={`text-xs font-mono min-w-[28px] text-center font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{chatFontSize}px</span>
                <button
                  onClick={() => setChatFontSize(s => Math.min(24, s + 1))}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                >A+</button>
              </div>

              {/* Color de Nick */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium w-20 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nick</span>
                <div className="flex gap-1.5">
                  {['#000000', '#22d3ee', '#a855f7', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ec4899', '#f97316', '#ffffff'].map(c => (
                    <button
                      key={c}
                      onClick={() => setChatNickColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        chatNickColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c, border: (c === '#ffffff' || c === '#000000') ? '1px solid #666' : 'none' }}
                    />
                  ))}
                </div>
              </div>

              {/* Color de Mensaje */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium w-20 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Mensaje</span>
                <div className="flex gap-1.5">
                  {['#000000', '#d1d5db', '#ffffff', '#22d3ee', '#a855f7', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#94a3b8'].map(c => (
                    <button
                      key={c}
                      onClick={() => setChatMsgColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        chatMsgColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c, border: (c === '#ffffff' || c === '#000000') ? '1px solid #666' : 'none' }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className={`rounded p-2 text-xs ${darkMode ? 'bg-gray-800/80' : 'bg-white'}`} style={{ fontSize: `${chatFontSize}px` }}>
                <span style={{ color: chatNickColor }} className="font-semibold">NickDeEjemplo:</span>
                <span style={{ color: chatMsgColor }} className="ml-1">Este es un mensaje de prueba</span>
              </div>
            </div>
          )}

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

              {/* Botón de prueba para verificar resaltado */}
              <div className={`pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-amber-200'}`}>
                <button
                  onClick={() => {
                    const testMessages = [
                      { id: `test-mod-${Date.now()}`, user: 'test_moderador', nickname: 'Moderador Test', text: '🧪 Soy moderador de prueba', status: 'received', timestamp: new Date(), isDonor: false, isModerator: true, isSubscriber: false, isTopGifter: false, isBanned: false },
                      { id: `test-donor-${Date.now()}`, user: 'test_donador', nickname: 'Donador Test', text: '🧪 Soy donador de prueba', status: 'received', timestamp: new Date(), isDonor: true, isModerator: false, isSubscriber: false, isTopGifter: false, isBanned: false },
                      { id: `test-sub-${Date.now()}`, user: 'test_suscriptor', nickname: 'Suscriptor Test', text: '🧪 Soy suscriptor de prueba', status: 'received', timestamp: new Date(), isDonor: false, isModerator: false, isSubscriber: true, isTopGifter: false, isBanned: false },
                      { id: `test-topfan-${Date.now()}`, user: 'test_topfan', nickname: 'Top Fan Test', text: '🧪 Soy top fan de prueba', status: 'received', timestamp: new Date(), isDonor: false, isModerator: false, isSubscriber: false, isTopGifter: true, isBanned: false },
                    ]
                    setMessages(prev => [...prev, ...testMessages])
                  }}
                  className={`w-full text-xs py-1.5 rounded font-medium transition-colors ${
                    darkMode ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                  }`}
                >
                  🧪 Probar resaltado (mensajes de prueba)
                </button>
              </div>

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
                      Limpiar todo
                    </button>
                  )}
                </div>
                {/* Lista de usuarios remarcados con botón individual para quitar */}
                {Object.keys(highlightedUsers).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(highlightedUsers).map(([user, color]) => (
                      <span
                        key={user}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${color}30`, color: color, border: `1px solid ${color}50` }}
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        {user}
                        <button
                          onClick={() => setHighlightedUsers(prev => {
                            const next = { ...prev }
                            delete next[user]
                            return next
                          })}
                          className="hover:text-red-400 transition-colors ml-0.5"
                          title={`Quitar remarque de ${user}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
