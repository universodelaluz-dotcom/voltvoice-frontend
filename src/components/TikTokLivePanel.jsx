import { useState, useEffect, useRef } from 'react'
import { Play, Square, AlertCircle, Loader, MessageCircle, Volume2, VolumeX, Ban, Pause, RotateCcw, Highlighter, X, Users, Clock3, TrendingUp, Filter, Trophy, Sparkles } from 'lucide-react'
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

const removeTikTokEmojiTags = (text = '') => String(text || '')
  // TikTok suele enviar algunos emotes como tokens: [heart] [thumb] [laughcry]
  // Incluye variaciones como :[laughcry] y nombres no estandar de emotes LIVE/subs.
  .replace(/:?\[[^\]\s]{1,32}\]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const expandTikTokEmojiTagsForSpeech = (text = '') => String(text || '')
  // En modo bruto, preservar emotes TikTok como palabras hablables.
  .replace(/:?\[([^\]\s]{1,32})\]/g, ' $1 ')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const expandUnicodeEmojiForSpeech = (text = '') => String(text || '')
  // Algunos motores TTS ignoran emoji Unicode; convertirlos a marcador hablable.
  .replace(emojiFullRegex, ' emoji ')
  .replace(/\s+/g, ' ')
  .trim()

const isPriorityUser = (meta = {}) => Boolean(
  meta.isDonor
  || meta.isModerator
  || meta.isSubscriber
  || meta.isCommunityMember
)

const trivialSmartChatPattern = /^(hola+|holi+|holis+|hello+|hi+|hey+|eh+|e+h+m*|ok+|oki+|xd+|x+d+x*d*|j+a+j+a+|jajaja+|haha+|jeje+|aaa+|aaah+|lol+|sip+|nop+|yes+|noo+|bro+|contexto+)\b[\s!?.,]*$/i
const hasTrivialSmartChatContent = (text = '') => {
  const normalized = normalizeMessageForMatching(text)
  if (!normalized) return true
  if (trivialSmartChatPattern.test(normalized)) return true
  if (normalized.split(' ').length <= 2 && /^(hola|holi|hello|hi|hey|eh|ok|xd|jajaja|haha|jeje|aaa|lol|bro|contexto)$/.test(normalized)) return true
  return false
}

const normalizeTikTokUsername = (value) => String(value || '').trim().replace(/^@+/, '')
const getBanCandidateKeys = (value) => {
  const raw = String(value || '').trim()
  const normalized = normalizeTikTokUsername(raw).toLowerCase()
  const rawLower = raw.toLowerCase()
  return [...new Set([raw, rawLower, normalized, normalized ? `@${normalized}` : ''].filter(Boolean))]
}
const isUserBannedBySet = (bannedSet, username) => getBanCandidateKeys(username).some((key) => bannedSet.has(key))
const getThemeChatNickColor = (config = {}, darkMode = true) => (
  darkMode
    ? (config.chatNickColorDark || config.chatNickColor || '#22d3ee')
    : (config.chatNickColorLight || '#0f766e')
)
const getThemeChatMsgColor = (config = {}, darkMode = true) => (
  darkMode
    ? (config.chatMsgColorDark || config.chatMsgColor || '#d1d5db')
    : (config.chatMsgColorLight || '#1f2937')
)

const pruneRecentTimestamps = (timestamps, windowMs = 60000) => {
  const cutoff = Date.now() - windowMs
  return timestamps.filter((ts) => ts >= cutoff)
}

const average = (values = [], fallback = 0) => {
  if (!values.length) return fallback
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const normalizeMessageForMatching = (text = '') => String(text || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const isEmojiOrSymbolOnly = (text = '') => {
  const withoutEmoji = String(text || '').replace(emojiFullRegex, '').replace(/[\s\W_]+/g, '')
  return withoutEmoji.length === 0
}

const hasLowLegibility = (text = '') => {
  const normalized = normalizeMessageForMatching(text)
  if (!normalized) return true
  if (/([a-z])\1{4,}/i.test(normalized)) return true
  if (/(ja){4,}|(ha){4,}|(xd){3,}/i.test(normalized)) return true
  const alphaCount = (normalized.match(/[a-z]/gi) || []).length
  const wordCount = normalized.split(' ').filter(Boolean).length
  return alphaCount < 2 || wordCount === 0
}

const hasExcessiveNumericNoise = (text = '') => {
  const raw = String(text || '')
  if (!raw.trim()) return false
  const digitMatches = raw.match(/\d/g) || []
  const nonSpaceLength = raw.replace(/\s+/g, '').length
  const digitRatio = nonSpaceLength > 0 ? digitMatches.length / nonSpaceLength : 0
  const hasLongNumericChunks = /\d{5,}/.test(raw)
  const hasManyNumericChunks = (raw.match(/\d{2,}/g) || []).length >= 3
  return digitMatches.length >= 6 && (digitRatio >= 0.4 || hasLongNumericChunks || hasManyNumericChunks)
}

const extractKeywords = (text = '') => {
  const stopwords = new Set(['que', 'como', 'para', 'pero', 'porque', 'por', 'con', 'sin', 'una', 'unos', 'unas', 'the', 'and', 'you', 'y', 'de', 'del', 'las', 'los', 'pero', 'esta', 'este', 'eso', 'esa', 'al', 'el', 'la', 'un', 'me', 'te', 'se', 'lo', 'le'])
  return normalizeMessageForMatching(text)
    .split(' ')
    .filter((word) => word.length >= 4 && !stopwords.has(word))
    .slice(0, 8)
}

// Obtener token del localStorage
const getAuthToken = () => localStorage.getItem('sv-token') || ''

const defaultHighlightRules = {
  moderators: { enabled: false, color: '#a855f7' },
  donors: { enabled: false, color: '#f59e0b' },
  banned: { enabled: false, color: '#ef4444' },
  subscribers: { enabled: false, color: '#ec4899' },
  communityMembers: { enabled: false, color: '#22c55e' },
  topFans: { enabled: false, color: '#06b6d4' },
}

function AnimatedCount({ value, duration = 900, decimals = 0, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let frameId
    const start = performance.now()
    const initial = displayValue
    const target = Number(value || 0)

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = initial + (target - initial) * eased
      setDisplayValue(next)
      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [value])

  return `${displayValue.toFixed(decimals)}${suffix}`
}

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
      const normalizedUsername = normalizeTikTokUsername(username)
      const res = await fetch(`${API_URL}/api/bans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: normalizedUsername, reason: 'Banned from chat' })
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
      const normalizedUsername = normalizeTikTokUsername(username)
      const res = await fetch(`${API_URL}/api/bans/${normalizedUsername}`, {
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
  const [connectedTikTokUser, setConnectedTikTokUser] = useState(() => normalizeTikTokUsername(config.lastTiktokUser || ''))
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isWaitingForLive, setIsWaitingForLive] = useState(false)
  const [waitingStatus, setWaitingStatus] = useState('')
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
  const [isPaused, setIsPaused] = useState(config.chatPaused ?? false)
  const [highlightedUsers, setHighlightedUsers] = useState({})
  const [highlightMode, setHighlightMode] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#06b6d4')
  const [showHighlightPanel, setShowHighlightPanel] = useState(false)
  const [chatFontSize, setChatFontSize] = useState(config.chatFontSize || 14)
  const [chatNickColor, setChatNickColor] = useState(() => getThemeChatNickColor(config, localStorage.getItem('voltvoice-theme') !== 'light'))
  const [chatMsgColor, setChatMsgColor] = useState(() => getThemeChatMsgColor(config, localStorage.getItem('voltvoice-theme') !== 'light'))
  const [showFontPanel, setShowFontPanel] = useState(false)
  const [smartChatEnabled, setSmartChatEnabled] = useState(config.smartChatEnabled || false)
  const [mobilePreviewEnabled, setMobilePreviewEnabled] = useState(config.mobilePreviewEnabled || false)
  const [mobilePreviewMuted, setMobilePreviewMuted] = useState(config.mobilePreviewMuted ?? true)
  const [showSessionSummary, setShowSessionSummary] = useState(false)
  const [sessionSummary, setSessionSummary] = useState(null)
  const [highlightRules, setHighlightRules] = useState({
    ...defaultHighlightRules,
    ...(config.highlightRules || {})
  })

  // Sincronizar cambios de estilo y remarcar al config del usuario (auto-save)
  useEffect(() => {
    if (updateConfig) {
      updateConfig('chatFontSize', chatFontSize)
    }
  }, [chatFontSize])
  useEffect(() => {
    if (updateConfig) {
      updateConfig(darkMode ? 'chatNickColorDark' : 'chatNickColorLight', chatNickColor)
    }
  }, [chatNickColor, darkMode])
  useEffect(() => {
    if (updateConfig) {
      updateConfig(darkMode ? 'chatMsgColorDark' : 'chatMsgColorLight', chatMsgColor)
    }
  }, [chatMsgColor, darkMode])
  useEffect(() => {
    if (updateConfig) {
      updateConfig('smartChatEnabled', smartChatEnabled)
    }
  }, [smartChatEnabled])
  useEffect(() => {
    if (updateConfig) {
      updateConfig('mobilePreviewEnabled', mobilePreviewEnabled)
    }
  }, [mobilePreviewEnabled])
  useEffect(() => {
    if (updateConfig) {
      updateConfig('mobilePreviewMuted', mobilePreviewMuted)
    }
  }, [mobilePreviewMuted])
  useEffect(() => {
    if (updateConfig) {
      updateConfig('highlightRules', highlightRules)
    }
  }, [highlightRules])
  useEffect(() => {
    setHighlightRules(prev => ({
      ...defaultHighlightRules,
      ...(config.highlightRules || {}),
      ...prev
    }))
  }, [config.highlightRules])
  useEffect(() => {
    setChatFontSize(config.chatFontSize || 14)
  }, [config.chatFontSize])
  useEffect(() => {
    setSmartChatEnabled(config.smartChatEnabled || false)
  }, [config.smartChatEnabled])
  useEffect(() => {
    setMobilePreviewEnabled(config.mobilePreviewEnabled || false)
  }, [config.mobilePreviewEnabled])
  useEffect(() => {
    setMobilePreviewMuted(config.mobilePreviewMuted ?? true)
  }, [config.mobilePreviewMuted])
  useEffect(() => {
    setIsPaused(config.chatPaused ?? false)
  }, [config.chatPaused])
  useEffect(() => {
    setChatNickColor(getThemeChatNickColor(config, darkMode))
  }, [config.chatNickColor, config.chatNickColorDark, config.chatNickColorLight, darkMode])
  useEffect(() => {
    setChatMsgColor(getThemeChatMsgColor(config, darkMode))
  }, [config.chatMsgColor, config.chatMsgColorDark, config.chatMsgColorLight, darkMode])
  useEffect(() => {
    const savedLastUser = config.lastTiktokUser || ''
    if (!isConnected && normalizeTikTokUsername(savedLastUser) !== normalizeTikTokUsername(tiktokUser)) {
      setTiktokUser(savedLastUser)
    }
  }, [config.lastTiktokUser, isConnected])
  const isPausedRef = useRef(false)
  const isPttSuppressedRef = useRef(false)
  const isInteractionSuppressedRef = useRef(false)
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
  const smartChatEnabledRef = useRef(config.smartChatEnabled || false)
  const volumeRef = useRef(0.8)
  const pttSnapshotRef = useRef({ wasPaused: false, hadCurrentAudio: false })
  const activePlaybackResolveRef = useRef(null)
  const resumeRequestedDuringSuppressionRef = useRef(false)
  const autoScrollPinnedRef = useRef(true) // Auto-scroll to keep new messages visible
  const pendingScrollRef = useRef(null) // Prevent multiple scrolls from stacking
  const liveRetryTimerRef = useRef(null)
  const recentIncomingTimestampsRef = useRef([])
  const recentPlaybackDurationsRef = useRef([])
  const recentGiftSendersRef = useRef({})
  const userLastSpokenAtRef = useRef({})
  const recentTopicKeywordsRef = useRef([])
  const recentNormalizedMessagesRef = useRef([])
  const sessionReceivedCountRef = useRef(0)
  const sessionReadCountRef = useRef(0)
  const sessionFilteredCountRef = useRef(0)
  const sessionUniqueUsersRef = useRef(new Set())
  const sessionUserCountsRef = useRef({})
  const sessionPeakMessagesPerMinuteRef = useRef(0)
  // Cooldown por tipo de notificación (timestamp del último anuncio)
  const lastNotifTime = useRef({ like: 0, viewer_count: 0, share: 0, follow: 0, gift: 0 })
  // Anti-spam por usuario: { username: [timestamps] }
  const userSpamTimestampsRef = useRef({})
  // Media de mensajes cada 20s para ajuste dinámico de presión
  const recentMessages20sRef = useRef([])

  const isAudioSuppressed = () => isPttSuppressedRef.current || isInteractionSuppressedRef.current

  // Auto-scroll suave: solo scroll al fondo si el usuario está cerca del fondo
  // FIX: Usar throttling para evitar scroll agresivo cuando llegan muchos mensajes rapidísimo
  useEffect(() => {
    if (!chatContainerRef.current) return
    const container = chatContainerRef.current

    // Solo auto-scroll si el usuario está cerca del bottom del chat
    // Pero NO si el usuario está scrolleando manualmente (autoScrollPinnedRef sería false)
    if (autoScrollPinnedRef.current) {
      // Cancelar scroll anterior si uno está pendiente
      if (pendingScrollRef.current) {
        cancelAnimationFrame(pendingScrollRef.current)
      }

      // Usar requestAnimationFrame para evitar múltiples scrolls en el mismo frame
      pendingScrollRef.current = requestAnimationFrame(() => {
        if (!autoScrollPinnedRef.current) return // User scrolled away, cancel
        preservePageScroll(() => {
          container.scrollTop = container.scrollHeight
        })
        pendingScrollRef.current = null
      })
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
  useEffect(() => {
    smartChatEnabledRef.current = smartChatEnabled
    configRef.current = { ...configRef.current, smartChatEnabled }
  }, [smartChatEnabled])
  useEffect(() => {
    isPausedRef.current = isPaused
    if (isPaused) {
      markPlayingMessagesAsDone()
      speakQueueRef.current = []
      isProcessingRef.current = false
      stopPlaybackNow()
      return
    }

    isProcessingRef.current = false
    processQueue()
  }, [isPaused])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { bannedRef.current = bannedUsers; chatStore.syncBannedUsers(bannedUsers) }, [bannedUsers])
  useEffect(() => { nickOverridesRef.current = nickOverrides; chatStore.syncNickOverrides(nickOverrides) }, [nickOverrides])
  useEffect(() => { chatStore.syncHighlightedUsers(highlightedUsers) }, [highlightedUsers])

  useEffect(() => {
    return () => {
      if (liveRetryTimerRef.current) {
        clearTimeout(liveRetryTimerRef.current)
      }
    }
  }, [])

  const cancelWaitingForLive = ({ clearError = false } = {}) => {
    if (liveRetryTimerRef.current) {
      clearTimeout(liveRetryTimerRef.current)
      liveRetryTimerRef.current = null
    }
    setIsWaitingForLive(false)
    setWaitingStatus('')
    if (clearError) {
      setError(null)
    }
  }

  const connectToTikTok = async (rawUsername, { fromAutoRetry = false } = {}) => {
    const normalizedUsername = normalizeTikTokUsername(rawUsername)
    const rawInputUsername = String(rawUsername || '').trim()

    if (!normalizedUsername) {
      setError('Ingresa un usuario de TikTok valido')
      return { success: false, cancelled: false }
    }

    disconnectedRef.current = false
    setIsConnecting(true)
    if (!fromAutoRetry) {
      setError(null)
    }

    try {
      const response = await fetch(`${API_URL}/api/tiktok/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        disconnectedRef.current = false
        connectedAtRef.current = Date.now()
        resetSessionTracking()
        setShowSessionSummary(false)
        setSessionSummary(null)
        setStats({ count: 0, uptime: 0 })
        setIsConnected(true)
        setConnectedTikTokUser(normalizedUsername)
        setMessages([])
        cancelWaitingForLive({ clearError: true })
        if (updateConfig) updateConfig('lastTiktokUser', rawInputUsername || normalizedUsername)
        return { success: true, cancelled: false }
      }

      if (data.notLive) {
        setError(null)
        setIsWaitingForLive(true)
        setWaitingStatus(fromAutoRetry ? 'Aun no esta en linea. Seguimos intentando cada 10 segundos.' : 'No esta en linea. Quedara a la espera y reintentara cada 10 segundos.')
        return { success: false, notLive: true, cancelled: false }
      }

      setError(data.error || 'Error conectando a TikTok')
      cancelWaitingForLive()
      return { success: false, cancelled: false }
    } catch (err) {
      setError(`Error: ${err.message}`)
      cancelWaitingForLive()
      return { success: false, cancelled: false }
    } finally {
      setIsConnecting(false)
    }
  }

  const scheduleLiveRetry = (username) => {
    if (liveRetryTimerRef.current) {
      clearTimeout(liveRetryTimerRef.current)
    }

    liveRetryTimerRef.current = setTimeout(async () => {
      liveRetryTimerRef.current = null
      if (disconnectedRef.current || !isWaitingForLive) return
      setWaitingStatus('Reintentando conexion al live...')
      const result = await connectToTikTok(username, { fromAutoRetry: true })
      if (result.notLive && !result.cancelled) {
        setWaitingStatus('Aun no esta en linea. Seguimos intentando...')
        scheduleLiveRetry(username)
      }
    }, 10000)
  }

  useEffect(() => {
    const handlePttAudioState = (event) => {
      const active = !!event.detail?.active

      if (active) {
        if (isPttSuppressedRef.current) return

        pttSnapshotRef.current = {
          wasPaused: isPausedRef.current,
          hadCurrentAudio: !!currentAudioRef.current
        }

        isPttSuppressedRef.current = true

        // Force-finish any in-flight playback promise to avoid stuck processing state.
        if (activePlaybackResolveRef.current) {
          try { activePlaybackResolveRef.current() } catch (error) { /* noop */ }
          activePlaybackResolveRef.current = null
        }

        if (currentAudioRef.current) {
          try {
            currentAudioRef.current.pause()
            currentAudioRef.current.src = ''
            currentAudioRef.current.load()
          } catch (error) {
            console.warn('[TikTok] Could not fully stop current audio during push-to-talk:', error?.message || error)
          }
          currentAudioRef.current = null
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
          try { window.speechSynthesis.cancel() } catch (error) { /* noop */ }
        }

        markPlayingMessagesAsDone()

        console.log('[TikTok] Chat audio suppressed for push-to-talk')
        return
      }

      if (!isPttSuppressedRef.current) return

      isPttSuppressedRef.current = false
      if (isInteractionSuppressedRef.current) {
        return
      }
      console.log('[TikTok] Restoring chat audio after push-to-talk')
      if (!pttSnapshotRef.current.wasPaused || resumeRequestedDuringSuppressionRef.current) {
        resumeRequestedDuringSuppressionRef.current = false
        processQueue()
      }
    }

    window.addEventListener('voltvoice:ptt-audio-state', handlePttAudioState)
    return () => {
      window.removeEventListener('voltvoice:ptt-audio-state', handlePttAudioState)
    }
  }, [])

  useEffect(() => {
    const handleInteractionSpeechState = (event) => {
      const active = !!event.detail?.active
      console.log('[TikTok] handleInteractionSpeechState: active=', active)

      if (active) {
        if (isInteractionSuppressedRef.current) {
          console.log('[TikTok] handleInteractionSpeechState: already suppressed, returning')
          return
        }
        isInteractionSuppressedRef.current = true

        if (activePlaybackResolveRef.current) {
          try { activePlaybackResolveRef.current() } catch (error) { /* noop */ }
          activePlaybackResolveRef.current = null
        }

        if (currentAudioRef.current) {
          try {
            currentAudioRef.current.pause()
            currentAudioRef.current.src = ''
            currentAudioRef.current.load()
          } catch (error) {
            console.warn('[TikTok] Could not fully stop current audio during interaction mode:', error?.message || error)
          }
          currentAudioRef.current = null
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
          try { window.speechSynthesis.cancel() } catch (error) { /* noop */ }
        }

        markPlayingMessagesAsDone()
        console.log('[TikTok] Chat audio suppressed for interaction mode')
        return
      }

      console.log('[TikTok] handleInteractionSpeechState: active=false, checking restore conditions')
      if (!isInteractionSuppressedRef.current) {
        console.log('[TikTok] handleInteractionSpeechState: NOT suppressed, returning')
        return
      }
      isInteractionSuppressedRef.current = false
      if (isPttSuppressedRef.current) {
        console.log('[TikTok] handleInteractionSpeechState: isPttSuppressed=true, returning')
        return
      }
      console.log('[TikTok] handleInteractionSpeechState: ALL CONDITIONS MET - Restoring chat audio after interaction mode')
      console.trace('[TikTok] handleInteractionSpeechState restoration stack')
      processQueue()
    }

    window.addEventListener('voltvoice:assistant-speech-state', handleInteractionSpeechState)
    return () => {
      window.removeEventListener('voltvoice:assistant-speech-state', handleInteractionSpeechState)
    }
  }, [])

  useEffect(() => {
    const handleChatPlaybackControl = (event) => {
      const action = String(event?.detail?.action || '').toLowerCase()

      if (action === 'pause') {
        setIsPaused(true)
        return
      }

      if (action === 'resume') {
        if (isAudioSuppressed()) {
          resumeRequestedDuringSuppressionRef.current = true
        }
        setIsPaused(false)
      }
    }

    window.addEventListener('voltvoice:chat-playback-control', handleChatPlaybackControl)
    return () => {
      window.removeEventListener('voltvoice:chat-playback-control', handleChatPlaybackControl)
    }
  }, [])

  // Conectar a WebSocket cuando el usuario se conecte a TikTok
  useEffect(() => {
    if (!isConnected || !connectedTikTokUser) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsURL = `${protocol}//${API_URL.replace(/^https?:\/\//, '')}/api/tiktok/ws`

    console.log('[TikTok] Conectando WebSocket a:', wsURL)

    const ws = new WebSocket(wsURL)

    ws.onopen = async () => {
      console.log('[TikTok] WebSocket conectado')
      ws.send(JSON.stringify({ type: 'subscribe', username: connectedTikTokUser }))

      // Cargar bans y nicks desde BD
      const bans = await apiBans.getAll()
      const nicks = await apiNicks.getAll()

      const bannedSet = new Set(
        bans.flatMap((b) => getBanCandidateKeys(b.banned_username))
      )
      setBannedUsers(bannedSet)
      setNickOverrides(nicks)

      // Sync to chatStore for bot access
      chatStore.syncBannedUsers(bannedSet)
      chatStore.syncNickOverrides(nicks)

      // Register action callbacks so bot tools can update UI state
      chatStore.registerAction('onBan', (username) => {
        setBannedUsers((prev) => {
          const next = new Set(prev)
          getBanCandidateKeys(username).forEach((key) => next.add(key))
          return next
        })
      })
      chatStore.registerAction('onUnban', (username) => {
        setBannedUsers((prev) => {
          const next = new Set(prev)
          getBanCandidateKeys(username).forEach((key) => next.delete(key))
          return next
        })
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
          const normalizedGiftUsername = normalizeTikTokUsername(giftData.username)
          setDonors(prev => new Set([
            ...prev,
            giftData.username,
            normalizedGiftUsername
          ].filter(Boolean)))
          recentGiftSendersRef.current[giftData.username] = Date.now()
          if (normalizedGiftUsername) {
            recentGiftSendersRef.current[normalizedGiftUsername] = Date.now()
          }
          chatStore.trackEvent({
            type: 'gift',
            username: giftData.username,
            count: Number(giftData.repeatCount) > 0 ? Number(giftData.repeatCount) : 1,
            timestamp: Date.now(),
            meta: { giftName: giftData.giftName }
          })
          if (c.announceGifts && canAnnounce('gift', c.giftCooldown || 5)) {
            const text = `${giftData.username} envió ${giftData.giftName}`
            queueMessage(text, giftData.username, { isNotification: true })
          }

        } else if (data.data && data.data.type === 'follow') {
          chatStore.trackEvent({
            type: 'follow',
            username: data.data.username,
            count: 1,
            timestamp: Date.now()
          })
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
          chatStore.trackEvent({
            type: 'share',
            username: data.data.username,
            count: 1,
            timestamp: Date.now()
          })
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
          const normalizedMsgUsername = normalizeTikTokUsername(msg.username)
          const isKnownDonor = Boolean(
            msg.isDonor
            || donors.has(msg.username)
            || donors.has(normalizedMsgUsername)
            || Number(msg.topGifterRank || 0) > 0
          )
          console.log(`[TikTok] Nuevo mensaje: ${msg.username} - ${msg.text}`)
          console.log(`  → isDonor: ${msg.isDonor}, isModerator: ${msg.isModerator}, isSubscriber: ${msg.isSubscriber}, topGifterRank: ${msg.topGifterRank}`)
          console.log(`  → Full msg object:`, JSON.stringify(msg, null, 2))

          recentIncomingTimestampsRef.current = pruneRecentTimestamps([
            ...recentIncomingTimestampsRef.current,
            Date.now()
          ])
          sessionReceivedCountRef.current += 1
          sessionUniqueUsersRef.current.add(msg.username)
          sessionUserCountsRef.current[msg.username] = (sessionUserCountsRef.current[msg.username] || 0) + 1
          sessionPeakMessagesPerMinuteRef.current = Math.max(
            sessionPeakMessagesPerMinuteRef.current,
            recentIncomingTimestampsRef.current.length
          )
          const normalizedIncoming = normalizeMessageForMatching(msg.text)
          if (normalizedIncoming) {
            recentNormalizedMessagesRef.current = [
              ...recentNormalizedMessagesRef.current,
              { text: normalizedIncoming, timestamp: Date.now() }
            ].filter((entry) => entry.timestamp >= Date.now() - 180000).slice(-120)
          }

          const isBanned = isUserBannedBySet(bannedRef.current, msg.username)

          // Siempre mostrar el mensaje en el chat visual
          setMessages((prev) => ([
            ...prev,
            {
              id: msg.id,
              user: msg.username,
              nickname: msg.nickname || msg.username,
              text: msg.text,
              status: 'received',
              timestamp: new Date(),
              isDonor: isKnownDonor,
              isModerator: msg.isModerator || false,
              isSubscriber: msg.isSubscriber || false,
              isCommunityMember: msg.isCommunityMember || false,
              isTopGifter: msg.topGifterRank > 0,
              isBanned
            }
          ]).slice(-220))

          // Feed message to chatStore for bot access
          chatStore.addMessage({
            user: msg.username,
            nickname: msg.nickname,
            text: msg.text,
            timestamp: Date.now(),
            isModerator: msg.isModerator || false,
            isSubscriber: msg.isSubscriber || false,
            isCommunityMember: msg.isCommunityMember || false,
            isTopGifter: msg.topGifterRank > 0,
            isDonor: isKnownDonor,
            isQuestion: isQuestion(msg.text)
          })

          // Increment message counter for autopilot thresholds - ONLY if chat is NOT suppressed
          // (Only count messages that arrive AFTER the bot's response ends)
          if (window.messagesCountSinceLastResponseRef !== undefined && !isInteractionSuppressedRef.current) {
            window.messagesCountSinceLastResponseRef++
            console.log(`[TikTok] ✓ Message counter incremented: ${window.messagesCountSinceLastResponseRef} (chat not suppressed)`)
          } else if (window.messagesCountSinceLastResponseRef !== undefined && isInteractionSuppressedRef.current) {
            console.log(`[TikTok] ✗ Message NOT counted (chat suppressed/bot speaking)`)
          }

          // Sumar al contador de comentarios
          setStats(prev => ({ ...prev, count: prev.count + 1 }))

          const smartChatActive = !!smartChatEnabledRef.current

          // Si está baneado, no leer en voz
          if (isBanned) { markFilteredMessage(); return }

          // PUNTO 4: Filtros de rol — trabajan como OR entre sí (pasa si cumple CUALQUIERA)
          // Ejemplo: donor + moderador = lee a cualquiera de los dos, no a ambos a la vez
          const roleFiltersActive = c.onlyDonors || c.onlyModerators || c.onlySubscribers || c.onlyCommunityMembers
          if (roleFiltersActive) {
            const passRoleFilter =
              (c.onlyDonors && isKnownDonor) ||
              (c.onlyModerators && msg.isModerator) ||
              (c.onlySubscribers && (msg.isSubscriber || false)) ||
              (c.onlyCommunityMembers && msg.isCommunityMember)
            if (!passRoleFilter) { markFilteredMessage(); return }
          }

          // Filtro: solo preguntas — AND independiente encima de los roles
          // Ejemplo: donor + preguntas = lee donadores QUE ADEMÁS hagan preguntas
          if (c.onlyQuestions && !isQuestion(msg.text)) { markFilteredMessage(); return }

          // Filtro: saltar repetidos (por usuario, no global)
          const normalizedText = msg.text.trim().toLowerCase()
          if (c.skipRepeated && normalizedText === lastMessageRef.current[msg.username]) { markFilteredMessage(); return }
          lastMessageRef.current[msg.username] = normalizedText

          // Filtro: ignorar enlaces
          if (c.ignoreLinks && hasLinks(msg.text)) { markFilteredMessage(); return }

          // PUNTO 4: Los checks de configuración se aplican de cajón, antes de todo filtro inteligente.
          // (onlyDonors, onlyModerators, onlySubscribers, onlyCommunityMembers, onlyQuestions, skipRepeated, ignoreLinks — ya ejecutados arriba)

          const priorityUser = isPriorityUser({
            isDonor: isKnownDonor,
            isModerator: msg.isModerator,
            isSubscriber: msg.isSubscriber || false,
            isCommunityMember: msg.isCommunityMember || false
          })

          // PUNTO 2: Registrar mensaje en media de 20s para ajuste dinámico de presión
          recordMessage20s()

          // PUNTO 1: Anti-spam por usuario — si envía >5 msgs en 10s, ignorarlo temporalmente
          // Los usuarios prioritarios (mod, donor, sub, community) están exentos
          if (!priorityUser) {
            recordUserMessage(msg.username)
            if (isUserSpamming(msg.username)) {
              console.log(`[TikTok] Anti-spam: ${msg.username} ignorado temporalmente (>5 msgs/10s)`)
              markFilteredMessage()
              return
            }
          }

          const smartMetrics = smartChatActive ? getSmartMetrics() : null

          // Modo bruto: solo limpiar tags de emojis TikTok cuando hay filtros activos o smart chat.
          let textToProcess = msg.text
          const shouldSanitizeTikTokTags = smartChatActive || c.stripChatEmojis || c.ignoreExcessiveEmojis
          if (shouldSanitizeTikTokTags) {
            textToProcess = removeTikTokEmojiTags(textToProcess)
            if (!textToProcess.trim()) { markFilteredMessage(); return }
          } else {
            textToProcess = expandTikTokEmojiTagsForSpeech(textToProcess)
            textToProcess = expandUnicodeEmojiForSpeech(textToProcess)
            if (!textToProcess.trim()) { markFilteredMessage(); return }
          }
          if (c.stripChatEmojis || smartChatActive) {
            textToProcess = removeEmojis(textToProcess)
            if (!textToProcess.trim()) { markFilteredMessage(); return }
          }

          // Filtro: limpiar emojis excesivos del texto (no ignorar el mensaje)
          if (c.ignoreExcessiveEmojis && hasExcessiveEmojis(textToProcess, parseInt(c.maxEmojisAllowed) || 3)) {
            textToProcess = removeEmojis(textToProcess)
            if (!textToProcess.trim()) { markFilteredMessage(); return }
          }

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
          if (!textToProcess.trim()) { markFilteredMessage(); return }
          if (smartChatActive && smartMetrics?.pressure > 1.25 && !priorityUser && textToProcess.trim().length < 5) { markFilteredMessage(); return }

          // Filtro: largo mínimo
          if (c.minMessageLengthEnabled && textToProcess.trim().length < c.minMessageLength) { markFilteredMessage(); return }

          // Limitar cola máxima
          if (c.maxQueueEnabled && speakQueueRef.current.length >= c.maxQueueSize) {
            console.log(`[TikTok] Cola llena (${c.maxQueueSize}), descartando mensaje`)
            markFilteredMessage()
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
          if ((c.onlyPlainNicks || smartChatActive) && !nickOverridesRef.current[msg.username]) {
            displayName = getPlainNick(displayName)
          }

          const finalText = c.readOnlyMessage ? textToSpeak : `${displayName}: ${textToSpeak}`

          queueMessage(finalText, msg.username, {
            id: msg.id,
            isDonor: isKnownDonor,
            isModerator: msg.isModerator,
            isSubscriber: msg.isSubscriber || false,
            isCommunityMember: msg.isCommunityMember || false,
            isTopGifter: msg.topGifterRank > 0,
            isQuestion: isQuestion(msg.text)
          })

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
      setConnectedTikTokUser('')
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe' }))
        wsRef.current.close()
      }
    }
  }, [isConnected, connectedTikTokUser])

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
  const estimateSpeakSeconds = (text = '', speed = 1) => {
    const normalizedSpeed = Math.max(0.7, Number(speed) || 1)
    const chars = String(text || '').trim().length
    const base = Math.max(1.8, chars / 18)
    return base / normalizedSpeed
  }

  const getSmartMetrics = () => {
    recentIncomingTimestampsRef.current = pruneRecentTimestamps(recentIncomingTimestampsRef.current)
    const incomingPerMinute = recentIncomingTimestampsRef.current.length
    const avgPlaybackSeconds = average(recentPlaybackDurationsRef.current, 4.8)
    const readCapacityPerMinute = Math.max(6, 60 / Math.max(1.8, avgPlaybackSeconds))
    const queueDepth = speakQueueRef.current.length
    const basePressure = incomingPerMinute / Math.max(1, readCapacityPerMinute)
    // PUNTO 2: Ajuste dinámico con media de 20s — más velocidad = más filtrado
    const pressureMultiplier = getDynamicPressureMultiplier()
    const pressure = basePressure * pressureMultiplier
    return { incomingPerMinute, avgPlaybackSeconds, readCapacityPerMinute, queueDepth, pressure, pressureMultiplier }
  }

  const getAdaptiveSkipCount = (metrics) => {
    if (metrics.pressure <= 1.05) return 0
    const overflow = Math.max(0, metrics.incomingPerMinute - metrics.readCapacityPerMinute)
    return Math.max(0, Math.round(overflow / Math.max(1, metrics.readCapacityPerMinute / 3)))
  }

  // PUNTO 1: Anti-spam por usuario — ignora temporalmente si envía >5 msgs en 10s
  const isUserSpamming = (username) => {
    const now = Date.now()
    const cutoff = now - 10000
    const timestamps = (userSpamTimestampsRef.current[username] || []).filter(ts => ts >= cutoff)
    userSpamTimestampsRef.current[username] = timestamps
    return timestamps.length >= 5
  }
  const recordUserMessage = (username) => {
    const now = Date.now()
    if (!userSpamTimestampsRef.current[username]) userSpamTimestampsRef.current[username] = []
    userSpamTimestampsRef.current[username].push(now)
  }

  // PUNTO 2: Media de mensajes en últimos 20s para ajustar filtrado dinámico
  const getMessageRate20s = () => {
    const now = Date.now()
    const cutoff = now - 20000
    recentMessages20sRef.current = recentMessages20sRef.current.filter(ts => ts >= cutoff)
    return recentMessages20sRef.current.length / 20 // msgs por segundo
  }
  const recordMessage20s = () => {
    recentMessages20sRef.current.push(Date.now())
  }
  // Retorna un multiplicador de presión basado en velocidad del chat en 20s
  // Alta velocidad = más filtrado (>1), baja velocidad = más permisivo (<1)
  const getDynamicPressureMultiplier = () => {
    const rate = getMessageRate20s()
    if (rate > 3) return 1.4      // >3 msgs/s = muy intenso, filtrar más
    if (rate > 1.5) return 1.15   // >1.5 msgs/s = flujo alto
    if (rate < 0.3) return 0.7   // <0.3 msgs/s = chat lento, ser más permisivo
    return 1.0
  }

  const getTopicRelevanceScore = (text = '') => {
    const keywords = extractKeywords(text)
    if (!keywords.length || !recentTopicKeywordsRef.current.length) return 0
    const overlap = keywords.filter((word) => recentTopicKeywordsRef.current.includes(word)).length
    return overlap > 0 ? Math.min(3.5, overlap * 1.2) : 0
  }

  const getEmotionalScore = (text = '') => {
    const lower = String(text || '').toLowerCase()
    let score = 0
    if (/[!?]{2,}/.test(lower)) score += 1.2
    if (/(😭|😢|🥹|❤️|💔|😱|😂|🤣|😍|🥰|😡|😳|🫶)/u.test(text)) score += 1.3
    if (/\b(ay|wow|no manches|que paso|qué pasó|contexto|urgente|help|ayuda|triste|miedo|amor|lloro|llorar|emocion|emoción)\b/i.test(lower)) score += 1.4
    return score
  }

  const getUniquenessPenalty = (normalizedText = '') => {
    const matches = recentNormalizedMessagesRef.current.filter((entry) => entry.text === normalizedText)
    return matches.length >= 3 ? 4 : matches.length === 2 ? 2.4 : matches.length === 1 ? 0.8 : 0
  }

  const hasRecentlySpokenDuplicate = (normalizedText = '', windowMs = 180000) => {
    if (!normalizedText) return false
    const cutoff = Date.now() - windowMs
    return recentNormalizedMessagesRef.current.some((entry) => (
      entry.text === normalizedText && entry.timestamp >= cutoff
    ))
  }

  const hasQueuedDuplicate = (normalizedText = '') => {
    if (!normalizedText) return false
    return speakQueueRef.current.some((candidate) => (
      normalizeMessageForMatching(candidate.rawText || candidate.text) === normalizedText
    ))
  }

  const scoreSmartMessage = (item, metrics) => {
    const rawText = String(item.rawText || item.text || '').trim()
    const normalizedText = normalizeMessageForMatching(rawText)
    const ageSeconds = (Date.now() - item.queuedAt) / 1000
    const lastGiftAt = recentGiftSendersRef.current[item.username] || 0
    const secondsSinceGift = lastGiftAt ? (Date.now() - lastGiftAt) / 1000 : Infinity
    const lastSpokenAt = userLastSpokenAtRef.current[item.username] || 0
    const secondsSinceUserSpoken = lastSpokenAt ? (Date.now() - lastSpokenAt) / 1000 : Infinity
    const mentionsStreamer = connectedTikTokUser && normalizedText.includes(normalizeTikTokUsername(connectedTikTokUser).toLowerCase())

    let score = 0
    if (item.isNotification) score += 11
    // PUNTO 3: Prioridad por rol — comunidad > mod > donor > suscriptor > pregunta
    if (item.isCommunityMember) score += 10  // Fan/SuperFan: más comprometidos
    if (item.isModerator) score += 9
    if (item.isDonor) score += 8.5
    if (secondsSinceGift <= 45) score += 7.5  // donación reciente = muy relevante
    if (item.isSubscriber) score += 7.5
    // PUNTO 1: Prioriza mensajes con mayor longitud y diversidad de palabras
    const words = rawText.split(/\s+/).filter(Boolean)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const wordDiversityBonus = Math.min(3, (uniqueWords.size / Math.max(1, words.length)) * 4)
    score += wordDiversityBonus
    if (rawText.length >= 30 && rawText.length <= 150) score += 2.5  // longitud óptima
    if (item.isQuestion || isQuestion(rawText)) score += 6.5
    if (mentionsStreamer || /(^|\s)@[\w._-]+/i.test(rawText)) score += 3.4
    score += getTopicRelevanceScore(rawText)
    score += getEmotionalScore(rawText)
    if (secondsSinceUserSpoken > 120) score += 2.8
    else if (secondsSinceUserSpoken > 45) score += 1.2
    if (rawText.length >= 8 && rawText.length <= 120) score += 2
    if (rawText.length > 180) score -= metrics.pressure > 1.2 ? 4 : 1.6
    if (rawText.length < 3) score -= 2.2
    score += Math.max(0, 3 - (ageSeconds / 12))
    score -= getUniquenessPenalty(normalizedText)
    if (hasLinks(rawText)) score -= 2.5
    if (hasExcessiveEmojis(rawText, 3)) score -= 2.4
    if (isEmojiOrSymbolOnly(rawText)) score -= 8
    if (hasLowLegibility(rawText)) score -= 5
    if (!item.isQuestion && !isQuestion(rawText) && hasExcessiveNumericNoise(rawText)) score -= 6
    if (/([a-z])\1{4,}/i.test(normalizedText)) score -= 3.5
    if (/(jaja){3,}|(haha){3,}|(xd){3,}/i.test(normalizedText)) score -= 2.5

    return score
  }

  const shouldHardDropSmartMessage = (item, metrics) => {
    const rawText = String(item.rawText || '').trim()
    const normalizedText = normalizeMessageForMatching(rawText)
    const ageSeconds = (Date.now() - item.queuedAt) / 1000
    if (!rawText) return true
    const lowPressureMode = metrics.pressure <= 1.2
      && metrics.incomingPerMinute <= Math.max(12, metrics.readCapacityPerMinute * 0.95)
    if (lowPressureMode) return false
    if (!item.isNotification && (metrics.pressure >= 1.2 || metrics.queueDepth >= 2) && hasRecentlySpokenDuplicate(normalizedText)) return true
    if (!isPriorityUser(item) && hasTrivialSmartChatContent(rawText)) return true
    if (metrics.pressure >= 1.2 && isEmojiOrSymbolOnly(rawText)) return true
    if (metrics.pressure >= 1.15 && hasLowLegibility(rawText)) return true
    if (metrics.pressure >= 1.25 && /(jaja){4,}|(haha){4,}|(xd){4,}/i.test(normalizedText)) return true
    if (!isPriorityUser(item) && !item.isQuestion && !isQuestion(rawText) && hasExcessiveNumericNoise(rawText)) return true
    if (metrics.pressure >= 1.3 && getUniquenessPenalty(normalizedText) >= 2.4) return true
    if (metrics.pressure >= 1.35 && rawText.length > 220) return true
    if (metrics.pressure >= 1.2 && ageSeconds > 30) return true
    return false
  }

  const queueMessage = (text, username, extra = {}) => {
    const item = {
      text: text.toLowerCase(),
      rawText: text,
      username,
      queuedAt: Date.now(),
      estimatedSpeakSeconds: estimateSpeakSeconds(text, configRef.current?.audioSpeed || 1.0),
      ...extra
    }

    if (smartChatEnabledRef.current) {
      const metrics = getSmartMetrics()
      const normalizedQueuedText = normalizeMessageForMatching(item.rawText || item.text)
      if (!item.isNotification && hasQueuedDuplicate(normalizedQueuedText)) {
        console.log('[TikTok] Smart chat descartó mensaje repetido ya en cola')
        markFilteredMessage()
        return
      }
      const lowPressureFastPath = metrics.pressure <= 1.2
        && metrics.incomingPerMinute <= Math.max(12, metrics.readCapacityPerMinute * 0.95)
        && metrics.queueDepth <= 3
      if (lowPressureFastPath) {
        speakQueueRef.current.push(item)
        console.log('[TikTok] Smart chat en baja carga: lectura directa para maximizar cobertura')
        console.log(`[TikTok] Agregado a cola (${speakQueueRef.current.length} pendientes)`)
        processQueue()
        return
      }
      if (shouldHardDropSmartMessage(item, metrics)) {
        console.log('[TikTok] Smart chat descartó mensaje por filtros duros adaptativos')
        markFilteredMessage()
        return
      }
      const adaptiveSkip = getAdaptiveSkipCount(metrics)
      const targetQueueSize = Math.max(2, Math.round(metrics.readCapacityPerMinute / (metrics.pressure > 1.25 ? 22 : 16)))
      const threshold = metrics.pressure > 2.4 ? 10 : metrics.pressure > 1.8 ? 6 : metrics.pressure > 1.35 ? 2 : -999

      item.smartScore = scoreSmartMessage(item, metrics)
      if (item.smartScore < threshold) {
        console.log(`[TikTok] Smart chat descartó mensaje (score ${item.smartScore.toFixed(2)} < ${threshold.toFixed(2)})`)
        markFilteredMessage()
        return
      }

      const existing = speakQueueRef.current.filter((candidate) => !shouldHardDropSmartMessage(candidate, metrics))
      const rescored = [...existing, item].map((candidate) => ({
        ...candidate,
        smartScore: scoreSmartMessage(candidate, metrics)
      }))

      speakQueueRef.current = rescored
        .sort((a, b) => (b.smartScore - a.smartScore) || (b.queuedAt - a.queuedAt))
        .slice(0, Math.max(2, targetQueueSize + (adaptiveSkip > 0 ? 1 : 0)))
        .sort((a, b) => a.queuedAt - b.queuedAt)

      console.log(
        `[TikTok] Smart chat -> ${metrics.incomingPerMinute.toFixed(0)} msg/min, ` +
        `${metrics.readCapacityPerMinute.toFixed(1)} lecturas/min, ` +
        `skip aprox ${adaptiveSkip}, cola objetivo ${targetQueueSize}, score ${item.smartScore.toFixed(2)}`
      )
    } else {
      // PUNTO 3: Incluso sin filtro inteligente, priorizar cola por rol
      // Orden: comunidad > moderadores > donadores > suscriptores > preguntas > general
      speakQueueRef.current.push(item)
      const getRoleWeight = (m) => {
        if (m.isNotification) return 11
        if (m.isCommunityMember) return 10
        if (m.isModerator) return 9
        if (m.isDonor) return 8.5
        if (m.isSubscriber) return 7.5
        if (m.isQuestion) return 6.5
        return 0
      }
      // Solo reordenar si hay mensajes de diferentes roles en la cola
      const hasRoledMessages = speakQueueRef.current.some(m => getRoleWeight(m) > 0)
      if (hasRoledMessages) {
        speakQueueRef.current = speakQueueRef.current
          .sort((a, b) => (getRoleWeight(b) - getRoleWeight(a)) || (a.queuedAt - b.queuedAt))
      }
    }

    console.log(`[TikTok] Agregado a cola (${speakQueueRef.current.length} pendientes)`)
    processQueue()
  }

  const processQueue = async () => {
    console.log('[TikTok] processQueue called, checking guards...')
    if (isProcessingRef.current) {
      console.log('[TikTok] processQueue: BLOCKED - already processing')
      return
    }
    if (speakQueueRef.current.length === 0) {
      console.log('[TikTok] processQueue: BLOCKED - queue empty')
      return
    }
    if (isPausedRef.current) {
      console.log('[TikTok] processQueue: BLOCKED - paused')
      return
    }
    const suppressed = isAudioSuppressed()
    if (suppressed) {
      console.log('[TikTok] processQueue: BLOCKED - audio suppressed')
      return
    }

    console.log('[TikTok] processQueue: ALL GUARDS PASSED - starting queue processing')
    isProcessingRef.current = true

    while (speakQueueRef.current.length > 0) {
      if (disconnectedRef.current) break
      if (isPausedRef.current || isAudioSuppressed()) break
      const item = speakQueueRef.current.shift()
      if (smartChatEnabledRef.current) {
        const metrics = getSmartMetrics()
        if (shouldHardDropSmartMessage(item, metrics)) {
          console.log('[TikTok] Smart chat saltó un pendiente viejo o ilegible para mantenerse fresco')
          markFilteredMessage()
          continue
        }
      }
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
        const isLocalVoice = voiceId === 'es-ES' || voiceId === 'en-US'

        if (isLocalVoice) {
          // Voz local — Web Speech API, sin backend, sin costo
          setMessages((prev) => prev.map((msg) => msg.id === item.id ? { ...msg, status: 'playing' } : msg))
          const lang = voiceId === 'en-US' ? 'en-US' : 'es-ES'
          await new Promise((resolve) => {
            if (disconnectedRef.current) { resolve(); return }
            activePlaybackResolveRef.current = resolve
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = lang
            utterance.rate = c.audioSpeed || 1.0
            utterance.pitch = 1.0
            utterance.volume = volumeRef.current

            const availableVoices = window.speechSynthesis.getVoices()
            const matchVoice =
              availableVoices.find(v => v.lang === lang) ||
              availableVoices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
              availableVoices[0]
            if (matchVoice) utterance.voice = matchVoice

            utterance.onend = () => {
              const estimatedDuration = estimateSpeakSeconds(item.rawText || item.text, c.audioSpeed || 1.0)
              recentPlaybackDurationsRef.current = [...recentPlaybackDurationsRef.current, estimatedDuration].slice(-20)
              sessionReadCountRef.current += 1
              userLastSpokenAtRef.current[item.username] = Date.now()
              const spokenKeywords = extractKeywords(item.rawText || item.text)
              if (spokenKeywords.length) recentTopicKeywordsRef.current = [...spokenKeywords, ...recentTopicKeywordsRef.current].slice(0, 24)
              const normalizedSpoken = normalizeMessageForMatching(item.rawText || item.text)
              if (normalizedSpoken) {
                recentNormalizedMessagesRef.current = [...recentNormalizedMessagesRef.current, { text: normalizedSpoken, timestamp: Date.now() }]
                  .filter(e => e.timestamp >= Date.now() - 180000).slice(-80)
              }
              setMessages((prev) => prev.map((msg) => msg.id === item.id ? { ...msg, status: 'done' } : msg))
              activePlaybackResolveRef.current = null
              resolve()
            }
            utterance.onerror = () => {
              activePlaybackResolveRef.current = null
              resolve()
            }

            if (isAudioSuppressed()) {
              activePlaybackResolveRef.current = null
              resolve()
              return
            }
            window.speechSynthesis.cancel()
            window.speechSynthesis.speak(utterance)
          })
        } else {
        // Voz Inworld/clonada — llamada al backend
        const response = await fetch(`${API_URL}/api/tiktok/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: connectedTikTokUser || normalizeTikTokUsername(tiktokUser),
            messageUsername: username,
            messageText: text,
            voiceId
          })
        })

        const data = await response.json()

        if (isPausedRef.current || disconnectedRef.current || isAudioSuppressed()) {
          continue
        }

        if (data.audio) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === item.id ? { ...msg, status: 'playing' } : msg
            )
          )

          await new Promise((resolve) => {
            if (disconnectedRef.current) { resolve(); return }
            activePlaybackResolveRef.current = resolve
            const audio = new Audio(data.audio)
            currentAudioRef.current = audio
            audio.playbackRate = c.audioSpeed || 1.0
            audio.volume = volumeRef.current
            audio.onended = () => {
              currentAudioRef.current = null
              activePlaybackResolveRef.current = null
              console.log(`[TikTok] Audio terminado`)
              const duration = Number(audio.duration)
              const effectiveDuration = Number.isFinite(duration) && duration > 0
                ? duration
                : (item.estimatedSpeakSeconds || estimateSpeakSeconds(item.rawText || item.text, c.audioSpeed || 1.0))
              recentPlaybackDurationsRef.current = [...recentPlaybackDurationsRef.current, effectiveDuration].slice(-20)
              sessionReadCountRef.current += 1
              userLastSpokenAtRef.current[item.username] = Date.now()
              const spokenKeywords = extractKeywords(item.rawText || item.text)
              if (spokenKeywords.length) {
                recentTopicKeywordsRef.current = [...spokenKeywords, ...recentTopicKeywordsRef.current]
                  .slice(0, 24)
              }
              const normalizedSpoken = normalizeMessageForMatching(item.rawText || item.text)
              if (normalizedSpoken) {
                recentNormalizedMessagesRef.current = [
                  ...recentNormalizedMessagesRef.current,
                  { text: normalizedSpoken, timestamp: Date.now() }
                ].filter((entry) => entry.timestamp >= Date.now() - 180000).slice(-80)
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === item.id ? { ...msg, status: 'done' } : msg
                )
              )
              resolve()
            }
            audio.onerror = () => {
              currentAudioRef.current = null
              activePlaybackResolveRef.current = null
              resolve()
            }
            if (isAudioSuppressed()) {
              audio.pause()
              currentAudioRef.current = null
              activePlaybackResolveRef.current = null
              resolve()
              return
            }
            audio.play().catch(() => {
              currentAudioRef.current = null
              activePlaybackResolveRef.current = null
              resolve()
            })
          })
        }
        } // fin else voz backend
      } catch (err) {
        console.error('[TikTok] Error sintetizando:', err)
        await new Promise((r) => setTimeout(r, 220))
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
  }

  const handleConnectSubmit = async (e) => {
    e.preventDefault()
    const normalizedUsername = normalizeTikTokUsername(tiktokUser)
    const result = await connectToTikTok(normalizedUsername)
    if (result.notLive) {
      scheduleLiveRetry(normalizedUsername)
    }
  }

  const preservePageScroll = (fn) => {
    if (typeof window === 'undefined') {
      fn()
      return
    }
    const scrollX = window.scrollX || window.pageXOffset || 0
    const scrollY = window.scrollY || window.pageYOffset || 0
    fn()
    window.scrollTo(scrollX, scrollY)
  }

  const keepReadMessageVisible = ({ force = false } = {}) => {
    // Cancelar scroll anterior si uno está pendiente
    if (pendingScrollRef.current) {
      cancelAnimationFrame(pendingScrollRef.current)
    }

    pendingScrollRef.current = requestAnimationFrame(() => {
      const container = chatContainerRef.current
      if (!container) return

      if (force) {
        autoScrollPinnedRef.current = true
      }

      if (force || autoScrollPinnedRef.current) {
        preservePageScroll(() => {
          container.scrollTop = container.scrollHeight
        })
      }
      pendingScrollRef.current = null
    })
  }

  const resetSessionTracking = () => {
    recentIncomingTimestampsRef.current = []
    recentPlaybackDurationsRef.current = []
    recentGiftSendersRef.current = {}
    userLastSpokenAtRef.current = {}
    recentTopicKeywordsRef.current = []
    recentNormalizedMessagesRef.current = []
    sessionReceivedCountRef.current = 0
    sessionReadCountRef.current = 0
    sessionFilteredCountRef.current = 0
    sessionUniqueUsersRef.current = new Set()
    sessionUserCountsRef.current = {}
    sessionPeakMessagesPerMinuteRef.current = 0
  }

  const buildSessionSummary = () => {
    const uniqueUsers = Array.from(sessionUniqueUsersRef.current)
    const mostActiveEntry = Object.entries(sessionUserCountsRef.current)
      .sort((a, b) => b[1] - a[1])[0]
    const receivedCount = sessionReceivedCountRef.current
    const readCount = sessionReadCountRef.current
    const filteredCount = sessionFilteredCountRef.current
    return {
      receivedCount,
      readCount,
      filteredCount,
      uptimeSeconds: stats.uptime,
      peakMessagesPerMinute: sessionPeakMessagesPerMinuteRef.current,
      uniqueUsers: uniqueUsers.length,
      readPercentage: receivedCount > 0 ? (readCount / receivedCount) * 100 : 0,
      filteredPercentage: receivedCount > 0 ? (filteredCount / receivedCount) * 100 : 0,
      mostActiveUser: mostActiveEntry ? { username: mostActiveEntry[0], count: mostActiveEntry[1] } : null
    }
  }

  const closeSessionSummary = () => {
    setShowSessionSummary(false)
    setSessionSummary(null)
    setMessages([])
    setStats({ count: 0, uptime: 0 })
    connectedAtRef.current = null
    resetSessionTracking()
  }

  const markFilteredMessage = () => {
    sessionFilteredCountRef.current += 1
  }

  const currentReadingMessage = messages.find((msg) => msg.status === 'playing') || null
  const showConnectedView = isConnected || showSessionSummary
  const mobilePreviewUsername = normalizeTikTokUsername(connectedTikTokUser || tiktokUser || config.lastTiktokUser || '')
  const mobilePreviewLiveUrl = mobilePreviewUsername ? `https://www.tiktok.com/@${mobilePreviewUsername}/live` : ''
  const mobilePreviewFrameUrl = ''
  const oneMinuteAgo = Date.now() - 60000
  const messagesPerMinute = messages.reduce((count, msg) => {
    const timestamp = Number(msg.timestamp || 0)
    return timestamp >= oneMinuteAgo ? count + 1 : count
  }, 0)
  const chatIntensity = messagesPerMinute >= 20
    ? { color: '#ef4444', label: 'Alto' }
    : messagesPerMinute >= 8
      ? { color: '#f59e0b', label: 'Medio' }
      : { color: '#22c55e', label: 'Leve' }
  const summaryTone = sessionSummary?.peakMessagesPerMinute >= 35
    ? 'Sesion explosiva'
    : sessionSummary?.peakMessagesPerMinute >= 15
      ? 'Sesion activa'
      : 'Sesion fluida'

  const stopPlaybackNow = () => {
    if (activePlaybackResolveRef.current) {
      try { activePlaybackResolveRef.current() } catch (error) { /* noop */ }
      activePlaybackResolveRef.current = null
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel() } catch (e) { /* noop */ }
    }
  }

  const handlePause = () => {
    const nextPaused = !isPaused
    setIsPaused(nextPaused)
    if (typeof updateConfig === 'function') {
      updateConfig('chatPaused', nextPaused)
    }
    keepReadMessageVisible({ force: true })
  }

  const handleRefresh = () => {
    markPlayingMessagesAsDone()
    speakQueueRef.current = []
    isProcessingRef.current = false
    stopPlaybackNow()
    // Si estaba pausado, reanudar también
    if (isPausedRef.current) {
      isPausedRef.current = false
      setIsPaused(false)
    }
    keepReadMessageVisible({ force: true })
  }

  const handleDisconnect = async () => {
    try {
      cancelWaitingForLive({ clearError: true })
      // Detener todo el audio inmediatamente
      disconnectedRef.current = true
      speakQueueRef.current = []
      isProcessingRef.current = false
      stopPlaybackNow()

      await fetch(`${API_URL}/api/tiktok/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: connectedTikTokUser || normalizeTikTokUsername(tiktokUser) })
      })

      if (wsRef.current) {
        wsRef.current.close()
      }

      setSessionSummary(buildSessionSummary())
      setShowSessionSummary(true)
      setIsConnected(false)
      setConnectedTikTokUser('')
    } catch (err) {
      console.error('[TikTok] Error desconectando:', err)
    }
  }

  return (
    <div className={`relative overflow-visible ${darkMode ? "bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6 mb-6" : "bg-white border border-indigo-200 rounded-lg p-6 mb-6 shadow-sm"}`}>
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-cyan-300" />
        <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>TikTok LIVE en Tiempo Real</h2>
        <span
          className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
            isConnected
              ? (darkMode
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                  : 'bg-slate-700 border border-slate-600 text-white')
              : isWaitingForLive
                ? 'bg-red-500/15 border border-red-500/60 text-red-300 animate-pulse'
                : (darkMode ? 'bg-gray-700/50 border border-gray-600/50 text-gray-300' : 'bg-slate-200 border border-slate-300 text-slate-700')
          }`}
        >
          {isConnected ? '🔴 EN VIVO' : isWaitingForLive ? 'ESPERANDO LIVE' : 'DESCONECTADO'}
        </span>
      </div>

      {!showConnectedView ? (
        <form onSubmit={handleConnectSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={tiktokUser}
              onChange={(e) => setTiktokUser(e.target.value)}
              placeholder="Usuario de TikTok (con @ o sin @)"
              className={darkMode ? "flex-1 bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400" : "flex-1 bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
              disabled={isConnecting || isWaitingForLive}
            />
            <button
              type="submit"
              disabled={isConnecting || isWaitingForLive || !tiktokUser}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isConnecting ? 'Conectando...' : 'Conectar'}
            </button>
            {isWaitingForLive && (
              <button
                type="button"
                onClick={() => cancelWaitingForLive({ clearError: true })}
                className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/50 text-red-300 font-semibold px-4 rounded-lg transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>

          {isWaitingForLive && waitingStatus && !error && (
            <div className={`p-3 border rounded flex gap-2 ${darkMode ? 'bg-amber-500/10 border-amber-400/40' : 'bg-amber-50 border-amber-300'}`}>
              <Loader className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin text-amber-400" />
              <div className={darkMode ? 'text-amber-100' : 'text-amber-800'}>
                <p>{waitingStatus}</p>
              </div>
            </div>
          )}

          {error && (
            <div className={`p-3 border rounded flex gap-2 ${isWaitingForLive ? 'bg-red-950/30 border-red-500/50 animate-pulse' : 'bg-red-900/20 border-red-500/30'}`}>
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-200">
                <p>{error}</p>
                {isWaitingForLive && waitingStatus && (
                  <p className="text-xs text-red-300/90 mt-1">{waitingStatus}</p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            ✓ Lee comentarios del chat de TikTok en vivo
            <br />
            ✓ Sintetiza automáticamente a voz
            <br />
            ✓ Reproduce mientras haces stream
          </p>
          <div className="flex items-center justify-end gap-2" />
          <div className="relative flex items-start gap-3">
            <div className="flex-1">
              <div
                style={{ overflowAnchor: 'auto', overscrollBehavior: 'contain' }}
                className={darkMode ? "bg-[#0f0f23]/80 border border-cyan-400/20 rounded-lg p-4 h-64 overflow-y-auto space-y-2" : "bg-gray-50 border border-indigo-200 rounded-lg p-4 h-64 overflow-y-auto space-y-2"}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageCircle className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                    <p>Panel del chat disponible. Conecta TikTok para ver mensajes en vivo.</p>
                  </div>
                ) : (
                  messages.slice(-12).map((msg, idx) => (
                    <div
                      key={msg.id || `${msg.user}-${idx}-${msg.text}`}
                      className={darkMode ? "border-l border-cyan-500/30 pl-3 py-2 rounded-r" : "border-l border-indigo-300 pl-3 py-2 rounded-r"}
                    >
                      <p className="font-semibold" style={{ color: chatNickColor, fontSize: `${chatFontSize}px` }}>
                        {nickOverrides[msg.user] || msg.nickname || msg.user}
                      </p>
                      <p style={{ color: chatMsgColor, fontSize: `${chatFontSize}px` }}>{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="grid grid-cols-3 gap-3 flex-1 mr-4">
                <div className={darkMode ? "bg-cyan-500/10 border border-cyan-500/30 rounded p-2" : "bg-slate-100 border border-slate-300 rounded p-2"}>
                  <p className="text-xs text-gray-400">Comentarios</p>
                  <p className={darkMode ? "text-lg font-bold text-cyan-300" : "text-lg font-bold text-slate-800"}>{stats.count}</p>
                </div>
                <div className={darkMode ? "bg-emerald-500/10 border border-emerald-500/30 rounded p-2" : "bg-slate-100 border border-slate-300 rounded p-2"}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">Msgs/min</p>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: chatIntensity.color }}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: chatIntensity.color }}
                      />
                      {chatIntensity.label}
                    </span>
                  </div>
                  <p className={darkMode ? "text-lg font-bold text-emerald-300" : "text-lg font-bold text-slate-800"}>{messagesPerMinute}</p>
                </div>
                <div className={darkMode ? "bg-purple-500/10 border border-purple-500/30 rounded p-2" : "bg-slate-100 border border-slate-300 rounded p-2"}>
                  <p className="text-xs text-gray-400">Tiempo</p>
                  <p className={darkMode ? "text-lg font-bold text-purple-300" : "text-lg font-bold text-slate-800"}>
                  {stats.uptime < 60
                    ? `${stats.uptime}s`
                    : `${Math.floor(stats.uptime / 60)}m ${stats.uptime % 60}s`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobilePreviewEnabled(prev => !prev)}
                style={{ display: 'none' }}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${
                  mobilePreviewEnabled
                    ? 'bg-cyan-500/25 border border-cyan-400/60 text-cyan-200'
                    : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                }`}
                title="Mostrar/Ocultar preview móvil"
              >
                <MessageCircle className="w-4 h-4" />
                {mobilePreviewEnabled ? 'Móvil ON' : 'Móvil OFF'}
              </button>
              {false && (
                <button
                  onClick={() => setMobilePreviewMuted(prev => !prev)}
                  className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${
                    mobilePreviewMuted
                      ? 'bg-amber-500/20 border border-amber-400/60 text-amber-200'
                      : 'bg-emerald-500/15 border border-emerald-400/60 text-emerald-200'
                  }`}
                  title="Silenciar/activar audio del preview móvil"
                >
                  {mobilePreviewMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {mobilePreviewMuted ? 'Mute' : 'Audio'}
                </button>
              )}
              <button
                onClick={handleDisconnect}
                className={darkMode
                  ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap"
                  : "bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap"}
              >
                <Square className="w-4 h-4" />
                Desconectar
              </button>
            </div>
          </div>

            <div className="space-y-3">
              <div className={darkMode ? "bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-4 h-[172px] overflow-hidden" : "bg-cyan-50 border border-cyan-200 rounded-lg p-4 h-[172px] overflow-hidden"}>
                {currentReadingMessage ? (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <span className={darkMode ? "text-[11px] uppercase tracking-[0.2em] text-cyan-300 font-semibold" : "text-[11px] uppercase tracking-[0.2em] text-cyan-700 font-semibold"}>
                      Mensaje en curso
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                      </span>
                      <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                    </span>
                  </div>
                    <p className="font-semibold leading-tight shrink-0" style={{ color: chatNickColor, fontSize: `${chatFontSize}px` }}>
                      {nickOverrides[currentReadingMessage.user] || currentReadingMessage.nickname || currentReadingMessage.user}
                    </p>
                    <p
                      className="font-medium overflow-y-auto pr-1 leading-snug"
                      style={{ color: chatMsgColor, fontSize: `${chatFontSize}px` }}
                    >
                      {currentReadingMessage.text}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center overflow-hidden">
                  <span className={darkMode ? "text-[11px] uppercase tracking-[0.2em] text-cyan-300 font-semibold mb-2" : "text-[11px] uppercase tracking-[0.2em] text-cyan-700 font-semibold mb-2"}>
                    Mensaje en curso
                  </span>
                    <p className="overflow-y-auto pr-1 leading-snug" style={{ color: chatMsgColor, fontSize: `${chatFontSize}px` }}>
                      Cuando se empiece a leer un comentario, aparecera aqui fijo.
                    </p>
                  </div>
                )}
            </div>

            <div className="relative flex items-start gap-3">
              <div className="flex-1">
                <div
                  ref={chatContainerRef}
                  style={{ overflowAnchor: 'auto', overscrollBehavior: 'contain', scrollBehavior: 'smooth' }}
                  className={darkMode ? "bg-[#0f0f23]/80 border border-cyan-400/20 rounded-lg p-4 h-96 overflow-y-auto space-y-2" : "bg-gray-50 border border-indigo-200 rounded-lg p-4 h-96 overflow-y-auto space-y-2"}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                      <p>Esperando comentarios en vivo...</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                const effectiveHighlightRules = {
                  ...defaultHighlightRules,
                  ...(highlightRules || {})
                }
                // Color: primero reglas por tipo, luego override manual
                const autoColor = (effectiveHighlightRules.moderators.enabled && msg.isModerator) ? effectiveHighlightRules.moderators.color
                  : (effectiveHighlightRules.topFans.enabled && msg.isTopGifter) ? effectiveHighlightRules.topFans.color
                  : (effectiveHighlightRules.donors.enabled && (msg.isDonor || donors.has(msg.user))) ? effectiveHighlightRules.donors.color
                  : (effectiveHighlightRules.subscribers.enabled && msg.isSubscriber) ? effectiveHighlightRules.subscribers.color
                  : (effectiveHighlightRules.communityMembers.enabled && msg.isCommunityMember) ? effectiveHighlightRules.communityMembers.color
                  : (effectiveHighlightRules.banned.enabled && isUserBannedBySet(bannedUsers, msg.user)) ? effectiveHighlightRules.banned.color
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
                      modEnabled: effectiveHighlightRules.moderators.enabled,
                      donorEnabled: effectiveHighlightRules.donors.enabled,
                      subEnabled: effectiveHighlightRules.subscribers.enabled,
                      communityEnabled: effectiveHighlightRules.communityMembers.enabled,
                      topEnabled: effectiveHighlightRules.topFans.enabled,
                    },
                    autoColor,
                    hlColor
                  })
                }
                // Tipo de badge para mostrar
                const badgeLabel = msg.isModerator ? '⚔️ MOD' : msg.isTopGifter ? '🏆 TOP' : msg.isDonor ? '🎁 DONOR' : msg.isSubscriber ? '⭐ SUB' : msg.isCommunityMember ? '💚 CLUB' : null
                return (
                <div
                  key={msg.id || `${msg.user}-${idx}-${msg.text}`}
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
                            if (!isUserBannedBySet(bannedUsers, msg.user)) {
                              setEditingNick(msg.id)
                              setEditingValue(nickOverrides[msg.user] || msg.nickname || msg.user)
                            }
                          }}
                          onContextMenu={async (e) => {
                            e.preventDefault()
                            const isBanned = isUserBannedBySet(bannedUsers, msg.user)

                            if (isBanned) {
                              // Desbanear
                              await apiBans.remove(msg.user)
                              setBannedUsers(prev => {
                                const next = new Set(prev)
                                getBanCandidateKeys(msg.user).forEach((key) => next.delete(key))
                                bannedRef.current = next
                                return next
                              })
                            } else {
                              // Banear
                              await apiBans.add(msg.user)
                              setBannedUsers(prev => {
                                const next = new Set(prev)
                                getBanCandidateKeys(msg.user).forEach((key) => next.add(key))
                                bannedRef.current = next
                                return next
                              })
                            }
                          }}
                          className={`font-semibold cursor-pointer select-none px-1 rounded transition-colors ${
                            isUserBannedBySet(bannedUsers, msg.user)
                              ? 'text-red-400 bg-red-500/15 line-through'
                              : 'hover:underline'
                          }`}
                          style={!isUserBannedBySet(bannedUsers, msg.user) ? { color: chatNickColor } : undefined}
                          title={highlightMode ? "Click para remarcar/desmarcar este usuario" : isUserBannedBySet(bannedUsers, msg.user) ? "Click derecho para desbloquear" : "Click para editar · Click derecho para silenciar"}
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
              </div>
              {false && (
                <div className="hidden xl:block absolute right-[-384px] top-[-140px] w-[360px]">
                  <div className={darkMode ? "bg-[#0f0f23]/90 border border-cyan-400/30 rounded-2xl p-2 shadow-lg" : "bg-white border border-indigo-200 rounded-2xl p-2 shadow-md"}>
                    <div className={darkMode ? "rounded-xl border border-cyan-500/20 bg-black/40 p-2 h-[620px] flex flex-col" : "rounded-xl border border-indigo-200 bg-gray-50 p-2 h-[620px] flex flex-col"}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={darkMode ? "text-[10px] text-cyan-300 font-semibold" : "text-[10px] text-cyan-700 font-semibold"}>LIVE Móvil</span>
                        <span className={`text-[10px] font-semibold ${mobilePreviewMuted ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {mobilePreviewMuted ? 'MUTE' : 'AUDIO'}
                        </span>
                      </div>
                      <div className={darkMode ? "flex-1 rounded-lg bg-[#070714] border border-cyan-500/15 p-3 overflow-hidden" : "flex-1 rounded-lg bg-white border border-indigo-200 p-3 overflow-hidden"}>
                        {mobilePreviewFrameUrl ? (<iframe title="Preview LIVE móvil" src={mobilePreviewFrameUrl} className="w-full h-full rounded-md" allow="autoplay; encrypted-media; picture-in-picture; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />) : (
                          <div className="h-full flex flex-col gap-2">
                            {currentReadingMessage ? (
                              <div className={darkMode ? "rounded-md border border-cyan-500/25 bg-cyan-500/10 p-2" : "rounded-md border border-cyan-200 bg-cyan-50 p-2"}>
                                <p className={darkMode ? "text-[9px] uppercase tracking-wide text-cyan-300/90" : "text-[9px] uppercase tracking-wide text-cyan-700/90"}>En lectura</p>
                                <p className="text-[11px] font-semibold truncate" style={{ color: chatNickColor }}>
                                  {nickOverrides[currentReadingMessage.user] || currentReadingMessage.nickname || currentReadingMessage.user}
                                </p>
                                <p className="text-[11px] leading-snug line-clamp-2" style={{ color: chatMsgColor }}>
                                  {currentReadingMessage.text}
                                </p>
                              </div>
                            ) : (
                              <p className={darkMode ? "text-[10px] text-slate-400 text-center py-1" : "text-[10px] text-slate-500 text-center py-1"}>
                                Esperando mensaje en curso...
                              </p>
                            )}
                            <div className={darkMode ? "flex-1 rounded-md bg-[#050512] border border-cyan-500/10 p-2 overflow-y-auto space-y-1.5" : "flex-1 rounded-md bg-slate-50 border border-indigo-100 p-2 overflow-y-auto space-y-1.5"}>
                              {messages.length === 0 ? (
                                <p className={darkMode ? "text-[10px] text-slate-400 text-center py-6" : "text-[10px] text-slate-500 text-center py-6"}>
                                  Esperando comentarios en vivo...
                                </p>
                              ) : (
                                messages.slice(-12).map((msg, idx) => (
                                  <div key={`mobile-feed-on-${msg.id || idx}`} className={darkMode ? "rounded-md border border-cyan-500/15 bg-cyan-500/5 p-1.5" : "rounded-md border border-cyan-100 bg-white p-1.5"}>
                                    <p className="text-[10px] font-semibold truncate" style={{ color: chatNickColor }}>
                                      {nickOverrides[msg.user] || msg.nickname || msg.user}
                                    </p>
                                    <p className="text-[10px] leading-snug line-clamp-2" style={{ color: chatMsgColor }}>
                                      {msg.text}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className={`flex flex-col gap-3 rounded-xl border px-3 py-3 md:flex-row md:items-center md:justify-between ${
            darkMode
              ? 'border-white/10 bg-white/[0.03] shadow-[0_10px_35px_rgba(0,0,0,0.18)]'
              : 'border-slate-200 bg-white/85 shadow-[0_10px_30px_rgba(148,163,184,0.18)]'
          }`}>
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 rounded-lg border ${
              darkMode ? 'bg-slate-900/40 border-white/10' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                onClick={handlePause}
                className={`h-10 w-full flex items-center justify-center gap-2 px-3 rounded-md text-xs font-semibold tracking-wide border transition-all ${
                  isPaused
                    ? 'border-slate-700 bg-slate-700 text-white hover:bg-slate-600 hover:border-slate-600 shadow-sm'
                    : darkMode
                      ? 'border-white/10 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-200'
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
                className={`h-10 w-full flex items-center justify-center gap-2 px-3 rounded-md text-xs font-semibold tracking-wide border transition-all ${
                  darkMode
                    ? 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-200'
                }`}
                title="Saltar cola y continuar desde el próximo mensaje"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refrescar
              </button>
              <button
                onClick={() => setSmartChatEnabled((prev) => !prev)}
                className={`group h-10 w-full flex items-center justify-center gap-2 px-3 rounded-md text-xs font-semibold tracking-wide border transition-all ${
                  smartChatEnabled
                    ? 'border-slate-700 bg-gradient-to-r from-slate-700 to-slate-900 text-white hover:from-slate-600 hover:to-slate-800 shadow-sm'
                    : darkMode
                      ? 'border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-100 hover:bg-fuchsia-500/18'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-200'
                }`}
                title="Activa el filtro inteligente para eliminar spam y basura"
              >
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${
                    smartChatEnabled ? 'animate-ping bg-emerald-400/70' : 'bg-transparent'
                  }`} />
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full border ${
                    smartChatEnabled
                      ? 'border-emerald-200 bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]'
                      : darkMode
                        ? 'border-fuchsia-200/30 bg-fuchsia-200/20'
                        : 'border-slate-400 bg-slate-300'
                  }`} />
                </span>
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Filtro inteligente</span>
                {smartChatEnabled && (
                  <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
                    On
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowHighlightPanel(!showHighlightPanel)}
                className={`h-10 w-full flex items-center justify-center gap-2 px-3 rounded-md text-xs font-semibold tracking-wide border transition-all ${
                  showHighlightPanel || highlightMode
                    ? 'border-slate-700 bg-slate-700 text-white hover:bg-slate-600 shadow-sm'
                    : darkMode
                      ? 'border-amber-400/25 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-200'
                }`}
                title="Remarcar usuarios con color"
              >
                <Highlighter className="w-3.5 h-3.5" /> Remarcar
              </button>
              {/* Botón para abrir panel de estilo del chat */}
              <button
                onClick={() => setShowFontPanel(!showFontPanel)}
                className={`h-10 w-full flex items-center justify-center gap-1 px-3 rounded-md text-xs font-semibold tracking-wide border transition-all ${
                  showFontPanel
                    ? 'border-slate-700 bg-slate-700 text-white hover:bg-slate-600 shadow-sm'
                    : darkMode
                      ? 'border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-200'
                }`}
                title="Tamaño y colores del chat"
              >
                <span style={{ fontSize: '13px' }}>Aa</span>
              </button>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl px-3 py-2 ${
              darkMode ? 'bg-black/20 border border-white/5' : 'bg-white border border-slate-300'
            }`}>
              <div className={`rounded-lg px-3 py-2 ${darkMode ? 'bg-slate-900/60 border border-slate-700/70' : 'bg-slate-50 border border-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Volumen
                  </span>
                  <span className={`text-xs font-bold min-w-[42px] text-right ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <div className={`text-[10px] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nivel de salida
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setVolume(v => v > 0 ? 0 : 0.8)}
                    className={`rounded-md p-1.5 transition-all ${
                      darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-200'
                    }`}
                    title={volume === 0 ? 'Activar audio' : 'Silenciar audio'}
                  >
                    {volume === 0
                      ? <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    }
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="pro-slider pro-slider-volume flex-1 cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 ${volume * 100}%, ${darkMode ? '#334155' : '#d1d5db'} ${volume * 100}%)`
                    }}
                  />
                </div>
              </div>
              <div className={`rounded-lg px-3 py-2 ${darkMode ? 'bg-slate-900/60 border border-slate-700/70' : 'bg-slate-50 border border-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Velocidad
                  </span>
                  <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {Number(config.audioSpeed || 1).toFixed(1)}x
                  </span>
                </div>
                <div className={`text-[10px] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ritmo de lectura
                </div>
                <input
                  type="range" min="0.5" max="2" step="0.1" value={Number(config.audioSpeed || 1)}
                  onChange={(e) => updateConfig && updateConfig('audioSpeed', parseFloat(e.target.value))}
                  className="pro-slider pro-slider-speed w-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2563eb ${((Number(config.audioSpeed || 1) - 0.5) / 1.5) * 100}%, ${darkMode ? '#334155' : '#d1d5db'} ${((Number(config.audioSpeed || 1) - 0.5) / 1.5) * 100}%)`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Panel Estilo del Chat */}
          {showFontPanel && (
            <div className={`rounded-lg border p-3 space-y-3 ${
              darkMode ? 'bg-gray-900/80 border-cyan-500/30' : 'bg-slate-50 border-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-cyan-400/80' : 'text-slate-700'}`}>
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
                <span className={`text-xs font-mono min-w-[28px] text-center font-bold ${darkMode ? 'text-cyan-400' : 'text-slate-700'}`}>{chatFontSize}px</span>
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
                { key: 'communityMembers', label: 'Miembros de comunidad' },
                { key: 'topFans', label: 'Top Fans / Gifters' },
                { key: 'banned', label: 'Baneados (silenciados)' },
              ].map(({ key, label }) => {
                const rule = highlightRules[key] || defaultHighlightRules[key]
                return (
                <div key={key} className="flex items-center gap-2">
                  <button
                    onClick={() => setHighlightRules(prev => ({
                      ...prev,
                      [key]: { ...(prev[key] || defaultHighlightRules[key]), enabled: !((prev[key] || defaultHighlightRules[key]).enabled) }
                    }))}
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      rule.enabled ? 'border-amber-400 bg-amber-400/30' : darkMode ? 'border-gray-500' : 'border-gray-400'
                    }`}
                  >
                    {rule.enabled && <span className="text-amber-300 text-[10px] font-bold">✓</span>}
                  </button>
                  <span className={`text-xs font-medium flex-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
                  <div className="flex gap-1">
                    {['#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ec4899'].map(c => (
                      <button
                        key={c}
                        onClick={() => setHighlightRules(prev => ({
                          ...prev,
                          [key]: { ...(prev[key] || defaultHighlightRules[key]), color: c, enabled: true }
                        }))}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          rule.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )})}

              {/* Botón de prueba para verificar resaltado */}
              <div className={`pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-amber-200'}`}>
                <button
                  onClick={() => {
                    const testMessages = [
                      { id: `test-mod-${Date.now()}`, user: 'test_moderador', nickname: 'Moderador Test', text: '🧪 Soy moderador de prueba', status: 'received', timestamp: new Date(), isDonor: false, isModerator: true, isSubscriber: false, isTopGifter: false, isBanned: false },
                      { id: `test-donor-${Date.now()}`, user: 'test_donador', nickname: 'Donador Test', text: '🧪 Soy donador de prueba', status: 'received', timestamp: new Date(), isDonor: true, isModerator: false, isSubscriber: false, isTopGifter: false, isBanned: false },
                      { id: `test-sub-${Date.now()}`, user: 'test_suscriptor', nickname: 'Suscriptor Test', text: '🧪 Soy suscriptor de prueba', status: 'received', timestamp: new Date(), isDonor: false, isModerator: false, isSubscriber: true, isTopGifter: false, isBanned: false },
                      { id: `test-community-${Date.now()}`, user: 'test_comunidad', nickname: 'Comunidad Test', text: '🧪 Soy fan o superfan de prueba', status: 'received', timestamp: new Date(), isDonor: false, isModerator: false, isSubscriber: false, isCommunityMember: true, isTopGifter: false, isBanned: false },
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

      {showSessionSummary && sessionSummary && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-md" />
          <div className={`relative w-full max-w-4xl rounded-[28px] border shadow-2xl overflow-hidden ${
            darkMode
              ? 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_rgba(15,23,42,0.96)_48%,_rgba(2,6,23,0.98)_100%)] border-cyan-400/25'
              : 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_rgba(255,255,255,0.96)_45%,_rgba(241,245,249,0.98)_100%)] border-cyan-200'
          }`}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 right-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl" />
            </div>
            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold uppercase tracking-[0.2em]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Resumen premium
                  </div>
                  <h3 className={`mt-3 text-3xl sm:text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Cierre del directo
                  </h3>
                  <p className={`mt-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {summaryTone}. Asi se movio tu chat en esta sesion.
                  </p>
                </div>
                <button
                  onClick={closeSessionSummary}
                  className={`rounded-full p-2 border transition-colors ${
                    darkMode ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Mensajes recibidos', value: sessionSummary.receivedCount, icon: MessageCircle, color: 'text-cyan-300' },
                    { label: 'Mensajes leidos', value: sessionSummary.readCount, icon: Volume2, color: 'text-emerald-300' },
                    { label: 'Tiempo de transmision', value: sessionSummary.uptimeSeconds, icon: Clock3, color: 'text-violet-300', format: (v) => v < 60 ? `${v}s` : `${Math.floor(v / 60)}m ${v % 60}s` },
                    { label: 'Pico mensajes/min', value: sessionSummary.peakMessagesPerMinute, icon: TrendingUp, color: 'text-amber-300' },
                  ].map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <div
                        key={stat.label}
                        className={`rounded-2xl border px-4 py-5 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}
                        >
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                          <span className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</span>
                        </div>
                        <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {stat.format ? stat.format(stat.value) : <AnimatedCount value={stat.value} />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-4">
                  <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Porcentaje leido', value: sessionSummary.readPercentage, accent: '#22c55e' },
                        { label: 'Mensajes filtrados', value: sessionSummary.filteredPercentage, accent: '#f59e0b' },
                      ].map((ring) => (
                        <div key={ring.label} className="flex flex-col items-center gap-3">
                          <div
                            className="relative h-24 w-24 rounded-full"
                            style={{ background: `conic-gradient(${ring.accent} ${Math.min(100, ring.value)}%, rgba(148,163,184,0.18) 0)` }}
                          >
                            <div className={`absolute inset-[10px] rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-950/90' : 'bg-white/95'}`}>
                              <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                <AnimatedCount value={ring.value} decimals={0} suffix="%" />
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs text-center uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{ring.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-5 space-y-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-300" />
                      <span className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Insights</span>
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Usuarios unicos que escribieron</p>
                        <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}><AnimatedCount value={sessionSummary.uniqueUsers} /></p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Usuario mas activo</p>
                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {sessionSummary.mostActiveUser ? `${sessionSummary.mostActiveUser.username} (${sessionSummary.mostActiveUser.count})` : 'Sin datos'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mensajes filtrados</p>
                        <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}><AnimatedCount value={sessionSummary.filteredCount} /></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeSessionSummary}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white font-bold hover:opacity-90 transition"
                >
                  Cerrar resumen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

