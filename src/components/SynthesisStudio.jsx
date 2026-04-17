import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TikTokLivePanel from './TikTokLivePanel'
import AudioVisualizer from './AudioVisualizer'
import BotInvoker from './BotInvoker'
import { Mic2, Volume2, Zap, ChevronDown, Loader, AlertCircle, Users, Send, Clock, Sun, Moon, Settings, BarChart3, Shield, Lock } from 'lucide-react'

export function SynthesisStudio({ onGoHome, onGoVoiceCloning, onGoControlPanel, onGoStatistics, onGoAdmin, onGoPricingPage, darkMode, setDarkMode, config, updateConfig, configReady = true, user }) {
  const { t } = useTranslation()
  const audioSpeed = config.audioSpeed || 1.0
  const PREMIUM_TEST_CHAR_LIMIT = 500
  const FREE_LOCAL_LIMIT_CODE = 'FREE_LOCAL_VOICE_DAILY_LIMIT_REACHED'
  const currentPlan = String(user?.plan || 'free').toLowerCase()
  const localVoiceLabelSuffix = currentPlan === 'free' ? '' : ` ${t('studio.voice.unlimited')}`
  const [showBotInvoker, setShowBotInvoker] = useState(false)

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
  const [tokensUsed, setTokensUsed] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Tokens & Stats
  const [tokens, setTokens] = useState(user?.tokens || 1000)
  const [totalTokensUsed, setTotalTokensUsed] = useState(0)
  const [synthesisCount, setSynthesisCount] = useState(0)
  const [announcements, setAnnouncements] = useState([])

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
          engine: 'inworld'
        }))
        setUserVoices(formatted)
      }
    } catch (err) {
      console.error('[Studio] Error loading voices:', err)
    }
  }

  // Voces premium permitidas por plan
  const PREMIUM_BY_PLAN = {
    free: [], start: ['Diego'],
    creator: ['Diego', 'Lupita'],
    pro: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    premium: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    elite: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    admin: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    on_demand: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
  }
  const ALL_PREMIUM_VOICES = [
    { id: "Diego", name: "Voz natural de Luis - Premium", category: "premium", engine: "inworld" },
    { id: "Lupita", name: "Voz natural de Sofia - Premium", category: "premium", engine: "inworld" },
    { id: "Miguel", name: "Voz natural de Gustavo - Premium", category: "premium", engine: "inworld" },
    { id: "Rafael", name: "Voz natural de Leonel - Premium", category: "premium", engine: "inworld" },
  ]

  // Cargar voces disponibles de Inworld AI + Google TTS + Voces del usuario
  useEffect(() => {
    const userPlan = user?.plan || 'free'
    const allowedPremium = PREMIUM_BY_PLAN[userPlan] ?? []
    const allVoices = [
      // === VOCES LOCALES — incluidas en todos los planes, sin tokens ===
      { id: "es-ES", name: `Voz Local Espanol${localVoiceLabelSuffix}`, category: "webspeech", engine: "webspeech" },
      { id: "en-US", name: `Voz Local Ingles${localVoiceLabelSuffix}`, category: "webspeech", engine: "webspeech" },

      // === Voces Premium — filtradas por plan ===
      ...ALL_PREMIUM_VOICES.filter(v => allowedPremium.includes(v.id)),

      // === Voces Clonadas/Generadas del usuario ===
      ...userVoices,
    ]
    setVoices(allVoices)
  }, [userVoices, user?.plan, localVoiceLabelSuffix])

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

  useEffect(() => {
    const loadAnnouncements = async () => {
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
    }
    loadAnnouncements()
  }, [user?.id])

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
      setError('Por favor selecciona una voz')
      return
    }

    if (text.length > PREMIUM_TEST_CHAR_LIMIT) {
      setError(`El texto de prueba supera el limite de ${PREMIUM_TEST_CHAR_LIMIT} caracteres.`)
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
          setError(data.error || "Error al sintetizar la voz básica")
        } else {
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
            voiceId: selectedVoice
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
              voiceId: selectedVoice
            })
          })
        }

        const data = await response.json()

        if (response.ok && (data.audio || data.success)) {
          setAudioUrl(data.audio || data.audioUrl)
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
          setError(data.error || "Error al sintetizar la voz")
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

  const charCount = text.length
  const estimatedTokens = charCount
  const selectedVoiceObj = voices.find(v => v.id === selectedVoice)
  const requiresPaidTokens = selectedVoiceObj && selectedVoiceObj.engine !== "webspeech"
  const hasInsufficientTokens = requiresPaidTokens && estimatedTokens > tokens

  return (
    <div className={`${darkMode ? "min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#111827] to-[#0f172a] text-white" : "min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-gray-900"}`}>
      {/* Header */}
      <div className={`${darkMode ? "border-b border-cyan-400/30 backdrop-blur-md sticky top-0 z-50 bg-[#0a0a1a]/90" : "border-b border-indigo-200 backdrop-blur-sm sticky top-0 z-50 bg-white/90 shadow-sm"}`}>
        <div className="max-w-[1100px] mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
          <img src="/images/streamvoicer6.png" alt="StreamVoicer" className="h-14 w-auto" />
            <div>
              {user && <p className={`${darkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}`}>{user.email}</p>}
            </div>
          </button>
          <div className={`flex items-stretch rounded-xl border overflow-hidden h-11 ${darkMode ? 'border-white/10' : 'border-slate-300'}`}>
            {/* Estado */}
            <div className={`flex items-center gap-2 px-5 border-r text-sm font-bold ${
              darkMode ? 'border-white/10 bg-slate-800 text-slate-300' : 'border-slate-300 bg-white text-slate-600'
            }`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${isStreamActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
              {isStreamActive ? t('studio.status.live') : t('studio.status.inactive')}
            </div>
            {/* Tokens */}
            <div className={`flex items-center gap-2 px-5 border-r text-sm font-bold ${
              darkMode ? 'border-white/10 bg-slate-800' : 'border-slate-300 bg-white'
            }`}>
              <Zap className={`w-4 h-4 shrink-0 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className={darkMode ? 'text-cyan-300' : 'text-cyan-700'}>{tokens} tokens</span>
            </div>
            {/* Tema */}
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-center px-4 border-r transition-all ${
                darkMode ? 'border-white/10 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 bg-white hover:bg-slate-100'
              }`}
              title={darkMode ? t('common.lightMode') : t('common.darkMode')}
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            {/* Admin */}
            {user?.role === 'admin' && onGoAdmin && (
              <button
                onClick={onGoAdmin}
                title="Panel Admin"
                className={`flex items-center justify-center px-4 transition-all ${
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
      <div className="max-w-[1100px] mx-auto px-8 pt-6 pb-10">
        {announcements.length > 0 && (
          <div className="mb-4 space-y-2">
            {announcements.slice(0, 3).map((notice) => {
              const isMaintenance = notice.kind === 'maintenance_alert'
              return (
                <div key={notice.id} className={`rounded-lg border px-4 py-3 ${
                  isMaintenance
                    ? (darkMode ? 'border-amber-400/40 bg-amber-500/10' : 'border-amber-300 bg-amber-50')
                    : (darkMode ? 'border-cyan-400/30 bg-cyan-500/10' : 'border-cyan-300 bg-cyan-50')
                }`}>
                  <p className={`text-xs font-bold uppercase ${isMaintenance ? 'text-amber-400' : 'text-cyan-400'}`}>{notice.kind.replaceAll('_', ' ')}</p>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{notice.title}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{notice.message}</p>
                </div>
              )
            })}
          </div>
        )}
        <div className="space-y-4">
        {/* TikTok Live Section */}
        <TikTokLivePanel config={config} updateConfig={updateConfig} configReady={configReady} user={user} darkModeOverride={darkMode} />

        {/* Nav buttons - fila debajo del panel */}
        <div className={`flex items-stretch rounded-xl border overflow-hidden ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <button
            onClick={onGoControlPanel}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all border-r ${
              darkMode ? 'border-white/10 bg-[#1a1a2e] text-cyan-300 hover:bg-[#1e1e38]' : 'border-slate-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Settings className="w-5 h-5" />{t('studio.nav.config')}
          </button>
          {onGoVoiceCloning && (() => {
            const blocked = String(user?.plan || 'free').toLowerCase() === 'free'
            return (
              <button
                onClick={onGoVoiceCloning}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all border-r ${blocked ? 'opacity-70' : ''} ${
                  darkMode ? 'border-white/10 bg-gradient-to-r from-purple-700/60 to-pink-700/60 text-white hover:from-purple-600/80 hover:to-pink-600/80' : 'border-slate-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                }`}
              >
                <Mic2 className="w-5 h-5" />{t('studio.nav.voiceWorkshop')}{blocked && <Lock className="w-4 h-4 ml-1 opacity-70" />}
              </button>
            )
          })()}
          {onGoStatistics && (
            <button
              onClick={onGoStatistics}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all ${
                darkMode ? 'bg-[#1a1a2e] text-cyan-300 hover:bg-[#1e1e38]' : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />{t('studio.nav.stats')}
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
                className={`${darkMode ? "w-full h-32 bg-[#0f0f23] border border-purple-400/30 rounded p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 resize-none font-mono text-sm" : "w-full h-32 bg-gray-50 border border-indigo-300 rounded p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"}`}
              />
              <div className={`${darkMode ? "flex justify-between text-xs text-gray-400" : "flex justify-between text-xs text-gray-500"}`}>
                <span>{t('studio.chars', { count: charCount, max: PREMIUM_TEST_CHAR_LIMIT })}</span>
                <span>{t('studio.tokens.charInfo')}</span>
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
                  <div className={`${darkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}`}>
                    <span className="text-cyan-400 font-bold">{tokensUsed}</span> tokens usados
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
                  style={{ width: `${Math.min(100, Math.round((tokens / (totalTokensUsed + tokens || 1)) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{totalTokensUsed.toLocaleString()} usados</span>
                <span className="text-[11px] font-semibold text-cyan-400">{Math.min(100, Math.round((tokens / (totalTokensUsed + tokens || 1)) * 100))}% restante</span>
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






