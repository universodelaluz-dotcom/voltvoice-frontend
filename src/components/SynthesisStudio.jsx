import { useState, useEffect, useRef } from 'react'
import TikTokLivePanel from './TikTokLivePanel'
import AudioVisualizer from './AudioVisualizer'
import BotInvoker from './BotInvoker'
import { Mic2, Volume2, Zap, ChevronDown, Loader, AlertCircle, Users, Send, Clock, Sun, Moon, Settings, BarChart3 } from 'lucide-react'

export function SynthesisStudio({ onGoHome, onGoVoiceCloning, onGoControlPanel, onGoStatistics, darkMode, setDarkMode, config, updateConfig, user }) {
  const audioSpeed = config.audioSpeed || 1.0
  const [showBotInvoker, setShowBotInvoker] = useState(false)

  const toggleTheme = () => {
    const newMode = darkMode ? 'light' : 'dark'
    localStorage.setItem('voltvoice-theme', newMode)
    document.documentElement.classList.toggle('dark', newMode === 'dark')
    setDarkMode(newMode === 'dark')
  }

    const [userId, setUserId] = useState('1')
  const [streamChannel, setStreamChannel] = useState('mi_canal')
  const [isStreamActive, setIsStreamActive] = useState(false)

  // Voices
  const [voices, setVoices] = useState([])
  const [userVoices, setUserVoices] = useState([])
  const selectedVoice = config.generalVoiceId || 'es-ES'
  const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

  // Synthesis
  const [text, setText] = useState('Hola, este es StreamVoicer. Tu plataforma para síntesis de voz profesional.')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Tokens & Stats
  const [tokens, setTokens] = useState(1000)
  const [totalTokensUsed, setTotalTokensUsed] = useState(0)
  const [synthesisCount, setSynthesisCount] = useState(0)

  // Chat simulation
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'maria_streams', message: '¡Hola! ¿Cómo estás?', timestamp: new Date(Date.now() - 30000) },
    { id: 2, user: 'juan_gamer', message: 'Este stream es increíble 🔥', timestamp: new Date(Date.now() - 20000) },
    { id: 3, user: 'sofia_rocks', message: '¡Léeme este mensaje!', timestamp: new Date(Date.now() - 10000) },
  ])
  const [newChatMessage, setNewChatMessage] = useState('')
  const [currentChatUser, setCurrentChatUser] = useState('viewer123')

  // Reproducir automáticamente cuando haya audio
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      setTimeout(() => audioRef.current?.play(), 100)
    }
  }, [audioUrl])

  // Rastrear estado de reproducción para el visualizador
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
      const token = localStorage.getItem('sv-token')
      if (!token) return

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

  // Cargar voces disponibles de Inworld AI + Google TTS + Voces del usuario
  useEffect(() => {
    const allVoices = [
      // === GOOGLE TTS (Sin tokens) ===
      { id: "es-ES", name: "Voz Básica Español (ilimitada)", category: "google", engine: "google" },
      { id: "en-US", name: "Voz Básica Inglés (ilimitada)", category: "google", engine: "google" },

      // === Voces Premium - Naturales ===
      { id: "Diego", name: "🎙️ Voz natural de Luis - Premium", category: "premium", engine: "inworld" },
      { id: "Lupita", name: "🎙️ Voz natural de Sofia - Premium", category: "premium", engine: "inworld" },
      { id: "Miguel", name: "🎙️ Voz natural de Gustavo - Premium", category: "premium", engine: "inworld" },
      { id: "Rafael", name: "🎙️ Voz natural de Leonel - Premium", category: "premium", engine: "inworld" },

      // === Voces Clonadas/Generadas del usuario ===
      ...userVoices,
    ]
    setVoices(allVoices)
  }, [userVoices])

  // Cargar voces al montar y escuchar evento de voz nueva
  useEffect(() => {
    loadUserVoices()

    const handleVoiceAdded = () => {
      loadUserVoices()
    }

    window.addEventListener('voice-added', handleVoiceAdded)
    return () => window.removeEventListener('voice-added', handleVoiceAdded)
  }, [user?.email])

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError('Por favor escribe algo para sintetizar')
      return
    }

    if (!selectedVoice) {
      setError('Por favor selecciona una voz')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    setAudioUrl(null)

    try {
      const selectedVoiceObj = voices.find(v => v.id === selectedVoice)
      const isInworld = selectedVoiceObj && selectedVoiceObj.engine === "inworld"
      const isGoogle = selectedVoiceObj && selectedVoiceObj.engine === "google"
      const isWebSpeech = selectedVoiceObj && selectedVoiceObj.engine === "webspeech"

      if (isWebSpeech) {
        // Usar Web Speech API (voces locales del sistema operativo)
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = audioSpeed
        utterance.pitch = 1.0
        utterance.volume = 1.0

        // Seleccionar idioma según voiceId
        if (selectedVoice === "web-speech-es") {
          utterance.lang = "es-ES"
        } else if (selectedVoice === "web-speech-en") {
          utterance.lang = "en-US"
        }

        // Usar primera voz disponible del sistema
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          utterance.voice = voices[0]
        }

        // Feedback visual
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)

        // Reproducir
        window.speechSynthesis.cancel() // Cancelar cualquier reproducción anterior
        window.speechSynthesis.speak(utterance)

        // Simular tokens (Web Speech es gratis)
        setTokensUsed(0)
        setSynthesisCount(prev => prev + 1)
      } else {
        // Usar Inworld AI o Google TTS (requiere servidor)
        let url, body
        if (isInworld) {
          // Usar Inworld AI ($5 por millón de caracteres - 8x más barato que ElevenLabs)
          url = "https://voltvoice-backend.onrender.com/api/inworld/tts"
          body = JSON.stringify({ text, voiceId: selectedVoice })
        } else if (isGoogle) {
          // Usar Google TTS (gratis, alto rendimiento)
          url = "https://voltvoice-backend.onrender.com/api/synthesis/synthesize"
          body = JSON.stringify({ text, voiceId: selectedVoice })
        } else {
          throw new Error("Engine no soportado")
        }

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId
          },
          body: body
        })

        const data = await response.json()

        if (response.ok && (data.audio || data.success)) {
          setAudioUrl(data.audio || data.audioUrl)
          const estTokens = Math.ceil(text.length / 100)
          setTokensUsed(data.tokensUsed || estTokens)
          setTokens(prev => data.remainingTokens || prev - estTokens)
          setTotalTokensUsed(prev => prev + (data.tokensUsed || estTokens))
          setSynthesisCount(prev => prev + 1)
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        } else {
          setError(data.error || "Error al sintetizar la voz")
        }
      }
    } catch (err) {
      setError("Error de conexión. Verifica tu conexión a internet.")
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
  const estimatedTokens = Math.ceil(charCount / 100)

  return (
    <div className={`${darkMode ? "min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#111827] to-[#0f172a] text-white" : "min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 text-gray-900"}`}>
      {/* Header */}
      <div className={`${darkMode ? "border-b border-cyan-400/30 backdrop-blur-md sticky top-0 z-50 bg-[#0a0a1a]/90" : "border-b border-indigo-200 backdrop-blur-sm sticky top-0 z-50 bg-white/90 shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/images/Sin%20t%C3%ADtulo%20(200%20x%2060%20px)%20(250%20x%2060%20px).png" alt="StreamVoicer" className="h-12 w-auto" />
            <div>
              {user && <p className={`${darkMode ? "text-xs text-gray-400" : "text-xs text-gray-600"}`}>{user.email}</p>}
            </div>
          </button>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isStreamActive ? 'bg-red-500/20 border border-red-500/50' : 'bg-gray-700/50 border border-gray-600/50'}`}>
              <div className={`w-2 h-2 rounded-full ${isStreamActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-xs font-semibold">{isStreamActive ? 'EN VIVO' : 'INACTIVO'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-400/30 rounded-lg">
              <Zap className="w-4 h-4 text-cyan-300" />
              <span className="text-sm font-bold text-cyan-300">{tokens} tokens</span>
            </div>
            <button
              onClick={toggleTheme}
              className={darkMode ? "p-2 rounded-lg bg-gray-800 border border-cyan-500/30 hover:bg-gray-700 transition-colors" : "p-2 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TikTok Live Section */}
        <TikTokLivePanel config={config} updateConfig={updateConfig} />

        {/* Botones principales: Configuración, Taller de Voces, Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={onGoControlPanel}
            className={`flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
              darkMode
                ? 'bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-cyan-400/30 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20 text-cyan-300'
                : 'bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 text-indigo-600 shadow-sm'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </button>
          {onGoVoiceCloning && (
            <button
              onClick={onGoVoiceCloning}
              className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
            >
              <Mic2 className="w-5 h-5" />
              <span>Taller de Voces</span>
            </button>
          )}
          {onGoStatistics && (
            <button
              onClick={onGoStatistics}
              className={`flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                darkMode
                  ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/40 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/30 text-cyan-300'
                  : 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-300 hover:from-cyan-100 hover:to-blue-100 text-cyan-700 shadow-sm'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Estadísticas</span>
            </button>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Center Column - Synthesis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Voice Selection */}
            <div className={`${darkMode ? "space-y-2 bg-[#1a1a2e] border border-cyan-400/25 rounded-lg p-4" : "space-y-2 bg-white border border-indigo-200 rounded-lg p-4 shadow-sm"}`}>
              <label className="text-sm font-semibold text-cyan-300 uppercase tracking-wide">
                Selecciona una voz
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
                Texto a probar
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe el texto que deseas convertir en voz..."
                className={`${darkMode ? "w-full h-32 bg-[#0f0f23] border border-purple-400/30 rounded p-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 resize-none font-mono text-sm" : "w-full h-32 bg-gray-50 border border-indigo-300 rounded p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"}`}
              />
              <div className={`${darkMode ? "flex justify-between text-xs text-gray-400" : "flex justify-between text-xs text-gray-500"}`}>
                <span>{charCount} caracteres</span>
                <span>≈ {estimatedTokens} tokens</span>
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
                <p className="text-sm text-green-400">¡Síntesis completada!</p>
              </div>
            )}

            {/* Synthesize Button */}
            <div className="flex gap-3">
              <button
                onClick={handleSynthesize}
                disabled={loading || estimatedTokens > tokens}
                className={`flex-1 py-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                  loading || estimatedTokens > tokens
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/75'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <Mic2 className="w-5 h-5" />
                    Probar voz
                  </>
                )}
              </button>
              <audio ref={audioRef} src={audioUrl || ''} className="hidden" />
            </div>

            {estimatedTokens > tokens && (
              <p className="text-sm text-yellow-400 text-center bg-yellow-500/10 p-3 rounded border border-yellow-500/30">
                No tienes suficientes tokens. Necesitas {estimatedTokens} pero solo tienes {tokens}.
              </p>
            )}
          </div>

          {/* Right Column - Stats & Audio */}
          <div className="lg:col-span-1 space-y-6">
            {/* Audio Player - with Visualizer */}
            {audioUrl && (
              <div className="space-y-2">
                <AudioVisualizer audioUrl={audioUrl} isPlaying={isPlaying} darkMode={darkMode} />
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-400/30 rounded-lg">
                  <audio ref={(el) => el && audioUrl && (audioRef.current = el)} src={audioUrl} className="hidden" />
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
              </div>
            )}

            {/* Bot Invoker - Push to Talk */}
            <BotInvoker
              darkMode={darkMode}
              onClose={() => setShowBotInvoker(false)}
              tiktokUsername="test_stream"
              config={config}
            />

            {/* Tokens Dashboard */}
            <div className={`${darkMode ? "bg-[#1a1a2e] border border-cyan-400/20 rounded-xl p-5 backdrop-blur-sm" : "bg-white border border-indigo-200 rounded-xl p-5 shadow-sm"}`}>
              <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wide mb-4">Tokens</h3>
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-700" />
                    <circle cx="60" cy="60" r="50" stroke="url(#tokenGradient)" strokeWidth="8" fill="none" strokeLinecap="round"
                      strokeDasharray={`${Math.min(100, (tokens / (totalTokensUsed + tokens || 1)) * 100) * 3.14} 314`}
                      className="transition-all duration-1000 ease-out" />
                    <defs>
                      <linearGradient id="tokenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`${darkMode ? "text-2xl font-black text-white" : "text-2xl font-black text-gray-900"}`}>{tokens}</span>
                    <span className={`${darkMode ? "text-[10px] text-gray-400 uppercase" : "text-[10px] text-gray-500 uppercase"}`}>restantes</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`${darkMode ? "bg-gradient-to-br from-green-500/15 to-green-600/10 border border-green-400/25" : "bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20"} rounded-lg p-3 text-center`}>
                  <div className="text-lg font-black text-green-400">{tokens}</div>
                  <div className={`${darkMode ? "text-[10px] text-gray-300 uppercase" : "text-[10px] text-gray-500 uppercase"}`}>Disponibles</div>
                </div>
                <div className={`${darkMode ? "bg-gradient-to-br from-purple-500/15 to-purple-600/10 border border-purple-400/25" : "bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20"} rounded-lg p-3 text-center`}>
                  <div className="text-lg font-black text-purple-400">{totalTokensUsed}</div>
                  <div className={`${darkMode ? "text-[10px] text-gray-300 uppercase" : "text-[10px] text-gray-500 uppercase"}`}>Usados</div>
                </div>
                <div className={`${darkMode ? "bg-gradient-to-br from-cyan-500/15 to-cyan-600/10 border border-cyan-400/25" : "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20"} rounded-lg p-3 text-center`}>
                  <div className="text-lg font-black text-cyan-400">{synthesisCount}</div>
                  <div className={`${darkMode ? "text-[10px] text-gray-300 uppercase" : "text-[10px] text-gray-500 uppercase"}`}>Síntesis</div>
                </div>
                <div className={`${darkMode ? "bg-gradient-to-br from-yellow-500/15 to-yellow-600/10 border border-yellow-400/25" : "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20"} rounded-lg p-3 text-center`}>
                  <div className="text-lg font-black text-yellow-400">{synthesisCount > 0 ? (totalTokensUsed / synthesisCount).toFixed(0) : 0}</div>
                  <div className={`${darkMode ? "text-[10px] text-gray-300 uppercase" : "text-[10px] text-gray-500 uppercase"}`}>Promedio</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className={`${darkMode ? "flex justify-between text-xs text-gray-400" : "flex justify-between text-xs text-gray-500"}`}>
                  <span>Uso de tokens</span>
                  <span className="text-cyan-400 font-bold">{Math.min(100, Math.round((totalTokensUsed / (totalTokensUsed + tokens || 1)) * 100))}%</span>
                </div>
                <div className={`${darkMode ? "bg-gray-800 rounded-full h-3 overflow-hidden relative" : "bg-indigo-100 rounded-full h-3 overflow-hidden relative"}`}>
                  <div className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, (totalTokensUsed / (totalTokensUsed + tokens || 1)) * 100)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  {totalTokensUsed.toLocaleString()} de {(totalTokensUsed + tokens).toLocaleString()} tokens usados
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
