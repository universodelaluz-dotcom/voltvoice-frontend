import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import TikTokLivePanel from './TikTokLivePanel'
import YouTubeLivePanel from './YouTubeLivePanel'
import AudioVisualizer from './AudioVisualizer'
import BotInvoker from './BotInvoker'
import { Mic2, Volume2, Zap, ChevronDown, ChevronUp, Loader, AlertCircle, Users, Send, Clock, Sun, Moon, Settings, BarChart3, Shield, Lock, Download, SlidersHorizontal, Gauge, Smile, Sparkles, Gem } from 'lucide-react'

const getEffectiveUserPlan = (userObj = null) => {
  const normalizePlan = (rawPlan = 'free') => {
    const normalized = String(rawPlan || 'free').trim().toLowerCase()
    if (!normalized) return 'free'
    if (
      normalized === 'free' ||
      normalized === 'plan free' ||
      normalized === 'free_plan' ||
      normalized === 'free_monthly' ||
      normalized === 'on_demand' ||
      normalized === 'ondemand'
    ) return 'free'
    if (normalized === 'base' || normalized === 'plan base' || normalized === 'start' || normalized === 'start_monthly') return 'base'
    if (normalized === 'pack_lite' || normalized === 'pack lite' || normalized === 'lite' || normalized === 'creator' || normalized === 'creator_monthly') return 'pack_lite'
    if (normalized === 'pack_pro' || normalized === 'pack pro' || normalized === 'pro' || normalized === 'pro_monthly') return 'pack_pro'
    if (normalized === 'pack_max' || normalized === 'pack max' || normalized === 'max') return 'pack_max'
    if (normalized === 'elite') return 'admin'
    if (normalized === 'admin') return 'admin'
    return normalized
  }

  const directPlan = String(userObj?.plan || '').trim().toLowerCase()
  const backendPlan = String(userObj?.subscription?.backendPlan || '').trim().toLowerCase()
  const subscriptionPlan = String(userObj?.subscription?.plan || '').trim().toLowerCase()
  const role = String(userObj?.role || '').trim().toLowerCase()
  if (role === 'admin') return 'admin'

  const basePlan = normalizePlan(backendPlan || directPlan || subscriptionPlan || 'free')
  if (['pack_lite', 'pack_pro', 'pack_max', 'admin'].includes(basePlan)) return basePlan

  const addonRaw = userObj?.subscription?.addonPack || null
  const addonPlan = normalizePlan(String(addonRaw?.planKey || '').trim().toLowerCase())
  const addonExpiresAtMs = addonRaw?.expiresAt ? Date.parse(addonRaw.expiresAt) : NaN
  const addonActive = Boolean(addonRaw?.active)
  const addonValid = addonActive && Number.isFinite(addonExpiresAtMs) && addonExpiresAtMs > Date.now()
  if (addonValid && ['pack_lite', 'pack_pro', 'pack_max'].includes(addonPlan)) return addonPlan

  return basePlan
}

const normalizePlanTier = (rawPlan = 'free') => {
  const normalized = String(rawPlan || 'free').trim().toLowerCase()
  if (!normalized) return 'free'
  if (
    normalized === 'free' ||
    normalized === 'plan free' ||
    normalized === 'free_plan' ||
    normalized === 'free_monthly' ||
    normalized === 'on_demand' ||
    normalized === 'ondemand'
  ) return 'free'
  if (normalized === 'base' || normalized === 'plan base' || normalized === 'start' || normalized === 'start_monthly') return 'base'
  if (
    normalized === 'pack_lite' ||
    normalized === 'pack lite' ||
    normalized === 'lite' ||
    normalized === 'creator' ||
    normalized === 'creator_monthly'
  ) return 'pack_lite'
  if (
    normalized === 'pack_pro' ||
    normalized === 'pack pro' ||
    normalized === 'pro' ||
    normalized === 'pro_monthly'
  ) return 'pack_pro'
  if (normalized === 'pack_max' || normalized === 'pack max' || normalized === 'max') return 'pack_max'
  if (normalized === 'admin') return 'admin'
  return normalized
}

export function SynthesisStudio({ onGoHome, onGoVoiceCloning, onGoControlPanel, onGoStatistics, onGoAdmin, onGoPricingPage, darkMode, setDarkMode, config, updateConfig, configReady = true, user, platformMode = 'tiktok' }) {
  const { t, i18n } = useTranslation()
  const isEnglish = String(i18n?.resolvedLanguage || i18n?.language || '').toLowerCase().startsWith('en')
  const audioSpeed = config.audioSpeed || 1.0
  // Opciones avanzadas del menú de "TEXTO A PROBAR"
  const voiceTemperature = Number.isFinite(Number(config.voiceTemperature)) ? Number(config.voiceTemperature) : 0.98
  const expressiveMode = config.emotionMode === true
  const voiceEmotion = config.voiceEmotion || 'auto'
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const EMOTION_CHOICES = [
    { id: 'auto', es: 'Automático', en: 'Auto', emoji: '✨' },
    { id: 'none', es: 'Neutral', en: 'Neutral', emoji: '😐' },
    { id: 'excited', es: 'Emocionado', en: 'Excited', emoji: '🤩' },
    { id: 'laugh', es: 'Alegre', en: 'Cheerful', emoji: '😄' },
    { id: 'angry', es: 'Enojado', en: 'Angry', emoji: '😡' },
    { id: 'sad', es: 'Triste', en: 'Sad', emoji: '😢' },
    { id: 'surprise', es: 'Sorprendido', en: 'Surprised', emoji: '😮' },
    { id: 'love', es: 'Cariñoso', en: 'Warm', emoji: '🥰' },
  ]
  const PREMIUM_TEST_CHAR_LIMIT = 3500
  const FREE_LOCAL_LIMIT_CODE = 'FREE_LOCAL_VOICE_DAILY_LIMIT_REACHED'
  const effectivePlanRaw = getEffectiveUserPlan(user)
  const currentPlan = normalizePlanTier(effectivePlanRaw)
  const localVoiceLabelSuffix = currentPlan === 'free' ? '' : ` ${t('studio.voice.unlimited')}`
  const LivePanelComponent = platformMode === 'youtube' ? YouTubeLivePanel : TikTokLivePanel
  const [showBotInvoker, setShowBotInvoker] = useState(false)
  const isAdminRole = String(user?.role || '').trim().toLowerCase() === 'admin'

  const toggleTheme = () => {
    const newMode = darkMode ? 'light' : 'dark'
    localStorage.setItem('voltvoice-theme', newMode)
    document.documentElement.classList.toggle('dark', newMode === 'dark')
    setDarkMode(newMode === 'dark')
  }

  const [streamChannel, setStreamChannel] = useState('mi_canal')
  const [isStreamActive, setIsStreamActive] = useState(false)

  // Voices
  const [voices, setVoices] = useState([])
  const [userVoices, setUserVoices] = useState([])
  const selectedVoice = config.generalVoiceId || 'es-ES'
const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

  // Synthesis
  const [text, setText] = useState(t('studio.voice.defaultText'))
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioPlaybackNonce, setAudioPlaybackNonce] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [localSpeechActive, setLocalSpeechActive] = useState(false)
  const [assistantSpeechActive, setAssistantSpeechActive] = useState(false)
  const [assistantAudioElement, setAssistantAudioElement] = useState(null)
  const [pttRecordingActive, setPttRecordingActive] = useState(false)
  const audioRef = useRef(null)
  const synthesisCache = useRef({ text: null, voiceId: null, audioUrl: null })
  const [tokensUsed, setTokensUsed] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Tokens & Stats
  const [tokens, setTokens] = useState(() => {
    if (typeof user?.tokens === 'number') return user.tokens
    try {
      const cachedUser = JSON.parse(localStorage.getItem('sv-user') || 'null')
      if (typeof cachedUser?.tokens === 'number') return cachedUser.tokens
    } catch (_) {}
    return 0
  })
  const [totalTokensUsed, setTotalTokensUsed] = useState(0)
  const [synthesisCount, setSynthesisCount] = useState(0)
  const [announcements, setAnnouncements] = useState([])
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState([])
  const [maintenancePopupNotice, setMaintenancePopupNotice] = useState(null)
  const announcementTimersRef = useRef(new Map())

  const getAuthToken = () => sessionStorage.getItem('sv-token') || ''
  const formatResetWait = (seconds = 0) => {
    const safe = Math.max(0, Number(seconds) || 0)
    const hours = Math.floor(safe / 3600)
    const minutes = Math.ceil((safe % 3600) / 60)
    if (hours <= 0) return `${Math.max(1, minutes)} min`
    return `${hours}h ${Math.max(0, minutes)}m`
  }

  // Chat simulation
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'maria_streams', message: 'Hola! Como estas?', timestamp: new Date(Date.now() - 30000) },
    { id: 2, user: 'juan_gamer', message: 'Este stream es increible', timestamp: new Date(Date.now() - 20000) },
    { id: 3, user: 'sofia_rocks', message: 'Leeme este mensaje!', timestamp: new Date(Date.now() - 10000) },
  ])
  const [newChatMessage, setNewChatMessage] = useState('')
  const [currentChatUser, setCurrentChatUser] = useState('viewer123')

  const PLAN_TOKEN_LIMITS = {
    free: 100,
    base: 200000,
    pack_lite: 500000,
    pack_pro: 800000,
    pack_max: 800000,
    admin: 1000000,
  }
  const configuredTokenLimitCandidates = [
    user?.subscription?.token_limit,
    user?.subscription?.tokenLimit,
    user?.token_limit,
    user?.tokenLimit,
  ]
  const configuredTokenLimit = configuredTokenLimitCandidates
    .map((v) => Number(v))
    .find((v) => Number.isFinite(v) && v > 0)
  const planTokenLimit = configuredTokenLimit || PLAN_TOKEN_LIMITS[currentPlan] || 100
  const rawTokensRemainingPct = Math.max(0, Math.min(100, Math.round((Number(tokens || 0) / planTokenLimit) * 100)))
  const tokensRemainingPct = Number(tokens || 0) > 0 ? Math.max(1, rawTokensRemainingPct) : 0

  // Reproducir automaticamente cuando haya audio
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return

    const audio = audioRef.current
    let cancelled = false

    const startPlayback = async () => {
      try {
        audio.pause()
        audio.currentTime = 0
        audio.load()
        const maybePromise = audio.play()
        if (maybePromise && typeof maybePromise.catch === 'function') {
          await maybePromise
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Studio] Autoplay blocked or failed:', err?.message || err)
        }
      }
    }

    startPlayback()
    return () => { cancelled = true }
  }, [audioUrl, audioPlaybackNonce])

  // Rastrear estado de reproduccion para el visualizador
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  // Aplicar velocidad al audio cuando cambie
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = audioSpeed
    }
  }, [audioSpeed, audioUrl])

  // Cargar voces del usuario desde la API
  const loadUserVoices = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      await fetch(`${API_URL}/api/settings/voices/migrate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})

      const res = await fetch(`${API_URL}/api/settings/voices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success && data.voices) {
        const formatted = data.voices.map(v => ({
          id: v.voice_id,
          name: v.voice_name,
          category: v.provider === 'inworld-cloned' ? 'inworld-cloned' : 'inworld-generated',
          engine: 'inworld',
          volumeGain: v.volume_gain ?? 1.0
        }))
        setUserVoices(formatted)
      }
    } catch (err) {
      console.error('[Studio] Error loading voices:', err)
    }
  }

  // Voces premium permitidas por plan
  const PREMIUM_BY_PLAN = {
    free: [],
    base: ['Diego', 'Lupita'],
    pack_lite: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    pack_pro: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    pack_max: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    admin: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
  }
  const ALL_PREMIUM_VOICES = [
    { id: "Diego", name: t('voiceNames.diegoPremium'), category: "premium", engine: "inworld" },
    { id: "Lupita", name: t('voiceNames.lupitaPremium'), category: "premium", engine: "inworld" },
    { id: "Miguel", name: t('voiceNames.miguelPremium'), category: "premium", engine: "inworld" },
    { id: "Rafael", name: t('voiceNames.rafaelPremium'), category: "premium", engine: "inworld" },
  ]

  // Cargar voces disponibles de Inworld AI + Google TTS + Voces del usuario
  useEffect(() => {
    const allowedPremium = PREMIUM_BY_PLAN[currentPlan] ?? []
    const allVoices = [
      // === VOCES LOCALES — incluidas en todos los planes, sin tokens ===
      { id: "es-ES", name: `${t('studio.voiceLocal.spanish')}${localVoiceLabelSuffix}`, category: "webspeech", engine: "webspeech" },
      { id: "en-US", name: `${t('studio.voiceLocal.english')}${localVoiceLabelSuffix}`, category: "webspeech", engine: "webspeech" },

      // === Voces Premium — filtradas por plan ===
      ...ALL_PREMIUM_VOICES.filter(v => allowedPremium.includes(v.id)),

      // === Voces Clonadas/Generadas del usuario ===
      ...userVoices,
    ]
    setVoices(allVoices)
  }, [userVoices, currentPlan, localVoiceLabelSuffix])

  // Cargar voces al montar y escuchar evento de voz nueva
  useEffect(() => {
    loadUserVoices()

    const handleVoiceAdded = () => {
      loadUserVoices()
    }

    window.addEventListener('voice-added', handleVoiceAdded)
    return () => window.removeEventListener('voice-added', handleVoiceAdded)
  }, [user?.email])

  useEffect(() => {
    if (typeof user?.tokens === 'number') {
      setTokens(user.tokens)
    }
  }, [user?.tokens])

  useEffect(() => {
    const handleTokenUpdate = (event) => {
      const remaining = Number(event.detail?.remainingTokens)
      const consumed = Number(event.detail?.tokensUsed || 0)
      if (Number.isFinite(remaining)) {
        setTokens(remaining)
      }
      if (Number.isFinite(consumed) && consumed > 0) {
        setTotalTokensUsed((prev) => prev + consumed)
      }
    }

    window.addEventListener('voltvoice:tokens-updated', handleTokenUpdate)
    return () => window.removeEventListener('voltvoice:tokens-updated', handleTokenUpdate)
  }, [])

  useEffect(() => {
    const handleAssistantVisualizer = (event) => {
      const active = Boolean(event?.detail?.active)
      setAssistantSpeechActive(active)
      if (active) {
        // Ensure response visualization can start even if PTT flag lags.
        setPttRecordingActive(false)
      }
    }

    window.addEventListener('voltvoice:assistant-visualizer', handleAssistantVisualizer)
    return () => window.removeEventListener('voltvoice:assistant-visualizer', handleAssistantVisualizer)
  }, [])

  useEffect(() => {
    const handleAssistantVisualizerAudio = (event) => {
      const el = event?.detail?.audioElement || null
      setAssistantAudioElement(el)
    }

    window.addEventListener('voltvoice:assistant-visualizer-audio', handleAssistantVisualizerAudio)
    return () => window.removeEventListener('voltvoice:assistant-visualizer-audio', handleAssistantVisualizerAudio)
  }, [])

  const loadAnnouncements = useCallback(async () => {
    try {
      const token = getAuthToken()
      if (!token || !user?.id) return
      const r = await fetch(`${API_URL}/api/ops/announcements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.success) setAnnouncements(d.announcements || [])
    } catch {
      // silent
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    loadAnnouncements()
    const id = setInterval(() => {
      loadAnnouncements()
    }, 20000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadAnnouncements()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', loadAnnouncements)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', loadAnnouncements)
    }
  }, [user?.id, loadAnnouncements])

  useEffect(() => {
    if (!Array.isArray(announcements) || announcements.length === 0) return
    const nextMaintenance = announcements.find((notice) => {
      if (notice?.kind !== 'maintenance_alert') return false
      return !dismissedAnnouncementIds.includes(String(notice.id))
    })
    if (nextMaintenance) setMaintenancePopupNotice(nextMaintenance)
  }, [announcements, dismissedAnnouncementIds])

  useEffect(() => {
    if (!Array.isArray(announcements) || announcements.length === 0) return
    const activeTimers = announcementTimersRef.current
    for (const notice of announcements) {
      const id = String(notice?.id || '')
      if (!id) continue
      if (dismissedAnnouncementIds.includes(id)) continue
      if (activeTimers.has(id)) continue
      const timeoutId = setTimeout(() => {
        setDismissedAnnouncementIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
        activeTimers.delete(id)
      }, 15000)
      activeTimers.set(id, timeoutId)
    }
    return () => {
      // keep timers across renders; cleanup only happens on unmount below
    }
  }, [announcements, dismissedAnnouncementIds])

  useEffect(() => {
    return () => {
      const activeTimers = announcementTimersRef.current
      for (const timeoutId of activeTimers.values()) clearTimeout(timeoutId)
      activeTimers.clear()
    }
  }, [])

  useEffect(() => {
    if (!maintenancePopupNotice) return
    const id = setTimeout(() => {
      setDismissedAnnouncementIds((prev) => [...prev, String(maintenancePopupNotice.id)])
      setMaintenancePopupNotice(null)
    }, 15000)
    return () => clearTimeout(id)
  }, [maintenancePopupNotice])

  useEffect(() => {
    const handlePttAudioState = (event) => {
      setPttRecordingActive(Boolean(event?.detail?.active))
    }

    window.addEventListener('voltvoice:ptt-audio-state', handlePttAudioState)
    return () => window.removeEventListener('voltvoice:ptt-audio-state', handlePttAudioState)
  }, [])

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError('Por favor escribe algo para sintetizar')
      return
    }

    if (!selectedVoice) {
      setError(t('studio.errors.voiceRequired'))
      return
    }

    if (text.length > PREMIUM_TEST_CHAR_LIMIT) {
      setError(`El texto de prueba supera el limite de ${PREMIUM_TEST_CHAR_LIMIT} caracteres.`)
      return
    }

    // Firma de las opciones avanzadas: si cambian, hay que regenerar el audio.
    const optionsSignature = `${expressiveMode ? 1 : 0}|${voiceTemperature}|${voiceEmotion}`

    // Si ya existe audio para este mismo texto, voz y opciones, solo reproducir sin consumir tokens
    if (
      synthesisCache.current.audioUrl &&
      text.trim() === synthesisCache.current.text &&
      selectedVoice === synthesisCache.current.voiceId &&
      optionsSignature === synthesisCache.current.options
    ) {
      setError(null)
      setAudioUrl(synthesisCache.current.audioUrl)
      setAudioPlaybackNonce((prev) => prev + 1)
      setIsPlaying(true)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    setAudioUrl(null)
    setLocalSpeechActive(false)

    try {
      const selectedVoiceObj = voices.find(v => v.id === selectedVoice)
      const isWebSpeech = selectedVoiceObj && selectedVoiceObj.engine === "webspeech"

      if (isWebSpeech) {
        // Voces básicas por backend TTS para obtener audio real y espectro real.
        const token = getAuthToken()
        const response = await fetch(`${API_URL}/api/tts/say`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            text,
            voice: selectedVoice
          })
        })

        const data = await response.json()
        if (!response.ok || !data.audio) {
          if (data?.code === FREE_LOCAL_LIMIT_CODE) {
            const wait = formatResetWait(data?.details?.resetInSeconds)
            window.alert(`Llegaste al límite diario de 2 horas de voces locales en plan FREE.\nSe restablece en aproximadamente ${wait}.`)
          }
        setError(data.error || t('studio.errors.synthesis'))
        } else {
          synthesisCache.current = { text: text.trim(), voiceId: selectedVoice, audioUrl: data.audio, options: optionsSignature }
          setAudioUrl(data.audio)
          setAudioPlaybackNonce((prev) => prev + 1)
          setIsPlaying(true)
          setLocalSpeechActive(false)
          setTokensUsed(0)
          setSynthesisCount(prev => prev + 1)
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        }
      } else {
        const token = getAuthToken()
        let response = await fetch(`${API_URL}/api/inworld/tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            text,
            voiceId: selectedVoice,
            emotionMode: config.emotionMode === true,
            voiceTemperature: voiceTemperature,
            emotion: voiceEmotion
          })
        })

        if (!response.ok && response.status === 404) {
          response = await fetch(`${API_URL}/api/tiktok/message`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              username: (config?.lastTiktokUser || "preview_studio").trim(),
              messageUsername: "preview",
              messageText: text,
              voiceId: selectedVoice,
              emotionMode: config.emotionMode === true,
              voiceTemperature: voiceTemperature
            })
          })
        }

        const data = await response.json()

        if (response.ok && (data.audio || data.success)) {
          const generatedAudioUrl = data.audio || data.audioUrl
          synthesisCache.current = { text: text.trim(), voiceId: selectedVoice, audioUrl: generatedAudioUrl, options: optionsSignature }
          setAudioUrl(generatedAudioUrl)
          setAudioPlaybackNonce((prev) => prev + 1)
          const estTokens = text.length
          const usedTokens = Number(data.tokensUsed || estTokens)
          const remainingTokens = Number(data.remainingTokens)
          setTokensUsed(usedTokens)
          if (Number.isFinite(remainingTokens)) {
            setTokens(remainingTokens)
          } else if (token) {
            setTokens(prev => prev - usedTokens)
          }
          setTotalTokensUsed(prev => prev + (data.tokensUsed || estTokens))
          setSynthesisCount(prev => prev + 1)
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        } else {
      setError(data.error || t('studio.errors.synthesis'))
        }
      }
    } catch (err) {
      setError("Error de conexion. Verifica tu conexion a internet.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddChatMessage = () => {
    if (newChatMessage.trim()) {
      setChatMessages([
        ...chatMessages,
        {
          id: chatMessages.length + 1,
          user: currentChatUser,
          message: newChatMessage,
          timestamp: new Date()
        }
      ])
      setNewChatMessage('')
    }
  }

  const handleSynthesizeFromChat = (messageObj) => {
    if (typeof messageObj === 'string') {
      setText(messageObj)
    } else {
      const fullText = config.readOnlyMessage ? messageObj.message : `${messageObj.user}: ${messageObj.message}`
      setText(fullText)
    }
  }

  const downloadAudioAsWav = async () => {
    if (!audioUrl) return
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const base64 = audioUrl.split(',')[1]
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      let decoded = await audioCtx.decodeAudioData(bytes.buffer)

      // Aplicar la MISMA velocidad que escuchas en vivo (playbackRate) al WAV exportado.
      // Se renderiza con OfflineAudioContext para "hornear" el cambio de velocidad/tono.
      const exportSpeed = Number(audioSpeed) || 1.0
      if (Math.abs(exportSpeed - 1.0) > 0.001) {
        const offlineLength = Math.max(1, Math.ceil(decoded.length / exportSpeed))
        const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext
        const offlineCtx = new OfflineCtx(decoded.numberOfChannels, offlineLength, decoded.sampleRate)
        const source = offlineCtx.createBufferSource()
        source.buffer = decoded
        source.playbackRate.value = exportSpeed
        source.connect(offlineCtx.destination)
        source.start(0)
        decoded = await offlineCtx.startRendering()
      }

      const numChannels = decoded.numberOfChannels
      const sampleRate = decoded.sampleRate
      const numSamples = decoded.length
      const pcmData = []
      for (let ch = 0; ch < numChannels; ch++) pcmData.push(decoded.getChannelData(ch))

      const interleaved = new Float32Array(numSamples * numChannels)
      for (let i = 0; i < numSamples; i++) {
        for (let ch = 0; ch < numChannels; ch++) interleaved[i * numChannels + ch] = pcmData[ch][i]
      }

      const pcm16 = new Int16Array(interleaved.length)
      for (let i = 0; i < interleaved.length; i++) {
        const s = Math.max(-1, Math.min(1, interleaved[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }

      const dataLength = pcm16.buffer.byteLength
      const wavBuffer = new ArrayBuffer(44 + dataLength)
      const view = new DataView(wavBuffer)
      const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)) }
      writeStr(0, 'RIFF')
      view.setUint32(4, 36 + dataLength, true)
      writeStr(8, 'WAVE')
      writeStr(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, numChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * numChannels * 2, true)
      view.setUint16(32, numChannels * 2, true)
      view.setUint16(34, 16, true)
      writeStr(36, 'data')
      view.setUint32(40, dataLength, true)
      const pcmArray = new Uint8Array(pcm16.buffer)
      for (let i = 0; i < pcmArray.length; i++) view.setUint8(44 + i, pcmArray[i])

      const blob = new Blob([wavBuffer], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `streamvoicer-${Date.now()}.wav`
      a.click()
      URL.revokeObjectURL(url)
      audioCtx.close()
    } catch (err) {
      console.error('[Download WAV] Error:', err)
    }
  }

  const charCount = text.length
  const estimatedTokens = charCount
  const selectedVoiceObj = voices.find(v => v.id === selectedVoice)
  const requiresPaidTokens = selectedVoiceObj && selectedVoiceObj.engine !== "webspeech"
  const hasInsufficientTokens = requiresPaidTokens && estimatedTokens > tokens

  return (
    <div className={`${darkMode ? "min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#111827] to-[#0f172a] text-white" : "min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-gray-900"}`}>
      {maintenancePopupNotice && (
        <div className="fixed top-4 right-4 z-[120] pointer-events-none">
          <div className={`pointer-events-auto w-[360px] max-w-[92vw] rounded-2xl border p-4 shadow-2xl backdrop-blur-md ${
            darkMode
              ? 'bg-[#11162fcc] border-cyan-300/30'
              : 'bg-white/95 border-cyan-300/60'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-400">Aviso de Stream Voicer</p>
                <h3 className={`mt-0.5 text-sm font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {maintenancePopupNotice.title || 'Aviso importante'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setDismissedAnnouncementIds((prev) => [...prev, String(maintenancePopupNotice.id)])
                  setMaintenancePopupNotice(null)
                }}
                className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${
                  darkMode ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Cerrar"
              >
                Cerrar
              </button>
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {maintenancePopupNotice.message}
            </p>
            <div className={`mt-3 text-[11px] ${darkMode ? 'text-cyan-200/90' : 'text-cyan-700'}`}>
              Este aviso se cerrara automaticamente en 15 segundos.
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className={`${darkMode ? "border-b border-cyan-400/30 backdrop-blur-md sticky top-0 z-50 bg-[#0a0a1a]/90" : "border-b border-indigo-200 backdrop-blur-sm sticky top-0 z-50 bg-white/90 shadow-sm"}`}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
          >
            <img src="/images/streamvoicer6.png" alt="StreamVoicer" className="h-10 sm:h-14 w-auto" />
            <div>
              {user && <p className={`hidden sm:block ${darkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}`}>{user.email}</p>}
            </div>
          </button>
          <div className={`flex items-stretch rounded-xl border overflow-hidden h-10 sm:h-11 shrink-0 ${darkMode ? 'border-white/10' : 'border-slate-300'}`}>
            {/* Estado */}
            <div className={`flex items-center gap-1.5 px-3 sm:px-5 border-r text-xs sm:text-sm font-bold ${
              darkMode ? 'border-white/10 bg-slate-800 text-slate-300' : 'border-slate-300 bg-white text-slate-600'
            }`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${isStreamActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden xs:inline">{isStreamActive ? t('studio.status.live') : t('studio.status.inactive')}</span>
            </div>
            {/* Tokens */}
            <div className={`flex items-center gap-1.5 px-3 sm:px-5 border-r text-xs sm:text-sm font-bold ${
              darkMode ? 'border-white/10 bg-slate-800' : 'border-slate-300 bg-white'
            }`}>
              <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className={darkMode ? 'text-cyan-300' : 'text-cyan-700'}>{tokens}<span className="hidden sm:inline"> tokens</span></span>
            </div>
            {/* Tema */}
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center px-3 sm:px-4 border-r transition-all ${
                darkMode ? 'border-white/10 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 bg-white hover:bg-slate-100'
              }`}
              title={darkMode ? t('common.lightMode') : t('common.darkMode')}
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            {/* Admin */}
            {isAdminRole && onGoAdmin && (
              <button
                onClick={onGoAdmin}
                title="Panel Admin"
                className={`flex items-center justify-center px-3 sm:px-4 transition-all ${
                  darkMode ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'
                }`}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-10">
        {announcements.filter((notice) => !dismissedAnnouncementIds.includes(String(notice.id))).length > 0 && (
          <div className="mb-4 space-y-2">
            {announcements
              .filter((notice) => !dismissedAnnouncementIds.includes(String(notice.id)))
              .slice(0, 3)
              .map((notice) => {
              const isMaintenance = notice.kind === 'maintenance_alert'
              return (
                <div key={notice.id} className={`rounded-lg border px-4 py-3 ${
                  isMaintenance
                    ? (darkMode ? 'border-amber-400/40 bg-amber-500/10' : 'border-amber-300 bg-amber-50')
                    : (darkMode ? 'border-cyan-400/30 bg-cyan-500/10' : 'border-cyan-300 bg-cyan-50')
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-bold uppercase ${isMaintenance ? 'text-amber-400' : 'text-cyan-400'}`}>{notice.kind.replaceAll('_', ' ')}</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{notice.title}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{notice.message}</p>
                    </div>
                    <button
                      onClick={() => setDismissedAnnouncementIds((prev) => [...prev, String(notice.id)])}
                      className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold ${
                        darkMode ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="space-y-4">
        {/* Live Section */}
        <LivePanelComponent
          config={config}
          updateConfig={updateConfig}
          configReady={configReady}
          user={user}
          darkModeOverride={darkMode}
          platformMode={platformMode}
          tokens={tokens}
          setTokens={setTokens}
          voiceGainMap={Object.fromEntries(userVoices.filter(v => v.volumeGain && v.volumeGain !== 1.0).map(v => [v.id, v.volumeGain]))}
        />

        {/* Nav buttons - fila debajo del panel */}
        <div className={`flex items-stretch rounded-xl border overflow-hidden ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <button
            onClick={onGoControlPanel}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 font-bold text-xs sm:text-sm transition-all border-r ${
              darkMode ? 'border-white/10 bg-[#1a1a2e] text-cyan-300 hover:bg-[#1e1e38]' : 'border-slate-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate">{t('studio.nav.config')}</span>
          </button>
          {onGoVoiceCloning && (() => {
            const blocked = currentPlan === 'free' || currentPlan === 'base'
            return (
              <button
                onClick={onGoVoiceCloning}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 font-bold text-xs sm:text-sm transition-all border-r ${blocked ? 'opacity-70' : ''} ${
                  darkMode ? 'border-white/10 bg-gradient-to-r from-purple-700/60 to-pink-700/60 text-white hover:from-purple-600/80 hover:to-pink-600/80' : 'border-slate-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                }`}
              >
                <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="truncate hidden xs:inline">{t('studio.nav.voiceWorkshop')}</span>
                <span className="truncate xs:hidden">{t('studio.nav.voiceShort')}</span>
                {blocked && <Lock className="w-3.5 h-3.5 ml-1 opacity-70 shrink-0" />}
              </button>
            )
          })()}
          {onGoStatistics && (
            <button
              onClick={onGoStatistics}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 font-bold text-xs sm:text-sm transition-all ${
                darkMode ? 'bg-[#1a1a2e] text-cyan-300 hover:bg-[#1e1e38]' : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">{t('studio.nav.stats')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Center Column - Synthesis */}
          <div className="lg:col-span-2 space-y-3">
            {/* Voice Selection */}
            <div className={`${darkMode ? "space-y-2 bg-[#1a1a2e] border border-cyan-400/25 rounded-lg p-4" : "space-y-2 bg-white border border-indigo-200 rounded-lg p-4 shadow-sm"}`}>
              <label className="text-sm font-semibold text-cyan-300 uppercase tracking-wide">
                {t('studio.voice.select')}
              </label>
              <div className="relative">
                <select
                  value={selectedVoice}
                  onChange={(e) => updateConfig('generalVoiceId', e.target.value)}
                  className={`${darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer pr-10" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer pr-10"}`}
                >
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300 pointer-events-none" />
              </div>
            </div>

            {/* Text Input */}
            <div className={`${darkMode ? "space-y-2 bg-[#1a1a2e] border border-purple-400/25 rounded-lg p-4" : "space-y-2 bg-white border border-indigo-200 rounded-lg p-4 shadow-sm"}`}>
              <label className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
                {t('studio.voice.test')}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={PREMIUM_TEST_CHAR_LIMIT}
                placeholder={t('studio.voice.testPlaceholder')}
                className={`${darkMode ? "w-full h-24 sm:h-32 bg-[#0f0f23] border border-purple-400/30 rounded p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 resize-none font-mono text-sm" : "w-full h-24 sm:h-32 bg-gray-50 border border-indigo-300 rounded p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"}`}
              />
              <div className={`${darkMode ? "flex justify-between text-xs text-gray-400" : "flex justify-between text-xs text-gray-500"}`}>
                <span>{t('studio.chars', { count: charCount, max: PREMIUM_TEST_CHAR_LIMIT })}</span>
                <span>{t('studio.tokens.charInfo')}</span>
              </div>

              {/* Micro-menú: opciones avanzadas (velocidad / emociones / temperatura / modo) */}
              <div className={`pt-2 mt-1 border-t ${darkMode ? 'border-white/10' : 'border-indigo-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions((v) => !v)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    darkMode
                      ? 'bg-[#0f0f23] border border-purple-400/30 text-purple-200 hover:border-purple-400/60'
                      : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:border-indigo-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    {isEnglish ? 'Advanced options' : 'Opciones avanzadas'}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {audioSpeed.toFixed(1)}x · {expressiveMode ? (isEnglish ? 'Expressive' : 'Expresivo') : (isEnglish ? 'Realistic' : 'Realista')}
                    </span>
                    {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {showAdvancedOptions && (
                  <div className={`mt-2 space-y-4 rounded-lg p-3 ${darkMode ? 'bg-[#0f0f23] border border-purple-400/20' : 'bg-indigo-50/60 border border-indigo-100'}`}>
                    {/* Modo: Realista vs Expresivo */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Gem className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`} />
                        <label className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-cyan-200' : 'text-indigo-700'}`}>
                          {isEnglish ? 'Mode' : 'Modo'}
                        </label>
                      </div>
                      <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg ${darkMode ? 'bg-black/30' : 'bg-white'}`}>
                        <button
                          type="button"
                          onClick={() => updateConfig('emotionMode', false)}
                          className={`py-2 rounded-md text-xs font-bold transition-all ${
                            !expressiveMode
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                              : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {isEnglish ? '🎯 Realistic' : '🎯 Realista'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateConfig('emotionMode', true)}
                          className={`py-2 rounded-md text-xs font-bold transition-all ${
                            expressiveMode
                              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow'
                              : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {isEnglish ? '🎭 Expressive' : '🎭 Expresivo'}
                        </button>
                      </div>
                      <p className={`mt-1 text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {expressiveMode
                          ? (isEnglish ? 'Adds emotion to the voice (tts-2 model).' : 'Añade emoción a la voz (modelo tts-2).')
                          : (isEnglish ? 'Clean, natural voice without steering.' : 'Voz limpia y natural, sin dramatismo.')}
                      </p>
                    </div>

                    {/* Velocidad */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Zap className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`} />
                          <label className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-cyan-200' : 'text-indigo-700'}`}>
                            {isEnglish ? 'Speed' : 'Velocidad'}
                          </label>
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${darkMode ? 'text-cyan-300' : 'text-indigo-700'}`}>{audioSpeed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={audioSpeed}
                        onChange={(e) => updateConfig('audioSpeed', Number(e.target.value))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <div className={`relative h-3.5 text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className="absolute left-0">{isEnglish ? 'Slow' : 'Lenta'}</span>
                        {/* 1.0x cae al 33.3% del recorrido (rango 0.5–2), no en el centro */}
                        <span className="absolute -translate-x-1/2" style={{ left: '33.33%' }}>{isEnglish ? 'Normal' : 'Normal'}</span>
                        <span className="absolute right-0">{isEnglish ? 'Fast' : 'Rápida'}</span>
                      </div>
                    </div>

                    {/* Temperatura / medidor */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Gauge className={`w-3.5 h-3.5 ${darkMode ? 'text-pink-300' : 'text-pink-600'}`} />
                          <label className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-pink-200' : 'text-pink-600'}`}>
                            {isEnglish ? 'Expressiveness (temp.)' : 'Expresividad (temp.)'}
                          </label>
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${darkMode ? 'text-pink-300' : 'text-pink-600'}`}>{voiceTemperature.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={voiceTemperature}
                        onChange={(e) => updateConfig('voiceTemperature', Number(e.target.value))}
                        className="w-full accent-pink-500 cursor-pointer"
                      />
                      <div className={`flex justify-between text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>{isEnglish ? 'Flat' : 'Plana'}</span>
                        <span>{isEnglish ? 'Balanced' : 'Equilibrada'}</span>
                        <span>{isEnglish ? 'Variable' : 'Variable'}</span>
                      </div>
                    </div>

                    {/* Emociones (solo en modo expresivo) */}
                    <div className={expressiveMode ? '' : 'opacity-50'}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Smile className={`w-3.5 h-3.5 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                        <label className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-purple-200' : 'text-purple-600'}`}>
                          {isEnglish ? 'Emotion' : 'Emoción'}
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {EMOTION_CHOICES.map((emo) => {
                          const active = voiceEmotion === emo.id
                          return (
                            <button
                              key={emo.id}
                              type="button"
                              disabled={!expressiveMode}
                              onClick={() => updateConfig('voiceEmotion', emo.id)}
                              className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                active
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow'
                                  : darkMode
                                    ? 'bg-black/30 text-gray-300 hover:bg-black/50 border border-purple-400/20'
                                    : 'bg-white text-gray-600 hover:bg-purple-50 border border-purple-200'
                              } ${!expressiveMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className="mr-1">{emo.emoji}</span>{isEnglish ? emo.en : emo.es}
                            </button>
                          )
                        })}
                      </div>
                      {!expressiveMode && (
                        <p className={`mt-1.5 text-[11px] flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Sparkles className="w-3 h-3" />
                          {isEnglish ? 'Switch to Expressive mode to use emotions.' : 'Activa el modo Expresivo para usar emociones.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Volume2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-400">{t('studio.success.done')}</p>
              </div>
            )}

            {/* Synthesize Button */}
            <div className="flex gap-3">
              <button
                onClick={handleSynthesize}
                disabled={loading || hasInsufficientTokens}
                className={`flex-1 py-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                  loading || hasInsufficientTokens
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/75'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t('studio.voice.testing')}
                  </>
                ) : (
                  <>
                    <Mic2 className="w-5 h-5" />
                    {t('studio.voice.testBtn')}
                  </>
                )}
              </button>
              <button
                onClick={downloadAudioAsWav}
                disabled={!audioUrl}
                title={isEnglish ? 'Download WAV' : 'Descargar archivo WAV'}
                className={`py-4 px-4 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0 ${
                  audioUrl
                    ? darkMode
                      ? 'bg-white/10 text-cyan-300 hover:bg-white/20'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                <Download className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wide">{isEnglish ? 'WAV' : 'WAV'}</span>
              </button>
            </div>

            {hasInsufficientTokens && (
              <p
                className={`text-sm text-center p-3 rounded border ${
                  darkMode
                    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                    : 'text-amber-800 bg-amber-100 border-amber-300'
                }`}
              >
                {t('studio.tokens.insufficient', { needed: estimatedTokens, available: tokens })}
              </p>
            )}
          </div>

          {/* Right Column - Stats & Audio */}
          <div className="lg:col-span-1 space-y-3">
            {/* Audio Player - with Visualizer */}
            <div className="space-y-2">
              <AudioVisualizer
                audioElement={assistantAudioElement || audioRef.current}
                isPlaying={!pttRecordingActive && (isPlaying || localSpeechActive || assistantSpeechActive)}
                darkMode={darkMode}
              />
              {audioUrl && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-400/30 rounded-lg">
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        isPlaying ? audioRef.current.pause() : audioRef.current.play()
                      }
                    }}
                    className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex-shrink-0"
                  >
                    <Volume2 className="w-5 h-5 text-white" />
                  </button>
                  <div className={`flex-1 ${darkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}`}>
                    <span className="text-cyan-400 font-bold">{tokensUsed}</span> {isEnglish ? 'tokens used' : 'tokens usados'}
                  </div>
                </div>
              )}
            </div>

            {/* Bot Invoker - Push to Talk */}
            <BotInvoker
              user={user}
              onGoPricingPage={onGoPricingPage}
              darkMode={darkMode}
              onClose={() => setShowBotInvoker(false)}
              tiktokUsername="test_stream"
              config={config}
              updateConfig={updateConfig}
              platformMode={platformMode}
            />

            {/* Tokens - minimalista */}
            <div className={`${darkMode ? "bg-[#1a1a2e] border border-cyan-400/20 rounded-xl p-4" : "bg-white border border-indigo-200 rounded-xl p-4 shadow-sm"}`}>
              <div className="flex items-baseline justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-cyan-400/70' : 'text-indigo-400'}`}>Tokens</span>
                <span className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tokens.toLocaleString()}</span>
              </div>
              <div className={`rounded-full h-2 overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-indigo-100'}`}>
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${tokensRemainingPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{totalTokensUsed.toLocaleString()} {isEnglish ? 'used' : 'usados'}</span>
                <span className="text-[11px] font-semibold text-cyan-400">{tokensRemainingPct}% {isEnglish ? 'remaining' : 'restante'}</span>
              </div>
              <div className="mt-1 text-right">
                <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {isEnglish ? `100% according to plan (${planTokenLimit.toLocaleString()} tokens)` : `100% según plan (${planTokenLimit.toLocaleString()} tokens)`}
                </span>
              </div>
            </div>

          </div>
        </div>
        </div>{/* fin space-y-4 */}
      </div>
      <audio ref={audioRef} src={audioUrl || ''} className="hidden" />
    </div>
  )
}



