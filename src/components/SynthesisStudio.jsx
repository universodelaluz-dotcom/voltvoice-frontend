import { useState, useEffect, useRef } from 'react'
import VoiceCloningPanel from './VoiceCloningPanel'
import TikTokLivePanel from './TikTokLivePanel'
import { Mic2, Volume2, Zap, ChevronDown, Loader, AlertCircle, Users, Send, Clock } from 'lucide-react'

export function SynthesisStudio() {
  // User Config
  const [userId, setUserId] = useState('1')
  const [streamChannel, setStreamChannel] = useState('mi_canal')
  const [isStreamActive, setIsStreamActive] = useState(false)

  // Voices
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')

  // Synthesis
  const [text, setText] = useState('Hola, este es VoltVoice. Tu plataforma para síntesis de voz profesional.')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
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

  // Cargar voces disponibles de Inworld AI + Google TTS + Voces locales
  useEffect(() => {
    const allVoices = [
      // === GOOGLE TTS (Rápido, económico) ===
      { id: "es-ES", name: "⚡ Español Rápido (Google)", category: "google", engine: "google" },
      { id: "en-US", name: "⚡ English Rápido (Google)", category: "google", engine: "google" },

      // === INWORLD AI (Voces Premium - Naturales) ===
      { id: "Diego", name: "🎙️ Diego - Premium (Inworld)", category: "inworld", engine: "inworld" },
      { id: "Lupita", name: "🎙️ Lupita - Premium (Inworld)", category: "inworld", engine: "inworld" },
      { id: "Miguel", name: "🎙️ Miguel - Premium (Inworld)", category: "inworld", engine: "inworld" },
      { id: "Rafael", name: "🎙️ Rafael - Premium (Inworld)", category: "inworld", engine: "inworld" },

      // === INWORLD AI (Tu Voz Clonada) ===
      { id: "default-cfjnp8x4nt-owd7yg-1xsw__garret", name: "👤 Garret (Tu Voz Clonada)", category: "inworld-cloned", engine: "inworld" },
      { id: "default-cfjnp8x4nt-owd7yg-1xsw__connor", name: "👤 Connor (Tu Voz Clonada)", category: "inworld-cloned", engine: "inworld" },

      // === SISTEMA LOCAL (Gratis, sin latencia) ===
      { id: "web-speech-es", name: "🖥️ Sistema - Español", category: "system", engine: "webspeech" },
      { id: "web-speech-en", name: "🖥️ Sistema - English", category: "system", engine: "webspeech" },
    ]
    setVoices(allVoices)
    setSelectedVoice(allVoices[0]?.id || "")
  }, [userId])

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
        utterance.rate = 1.0
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

  const handleSynthesizeFromChat = (message) => {
    setText(message)
  }

  const charCount = text.length
  const estimatedTokens = Math.ceil(charCount / 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-cyan-500/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg">
              <Mic2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                VoltVoice Studio
              </h1>
              <p className="text-xs text-gray-400">Canal: {streamChannel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isStreamActive ? 'bg-red-500/20 border border-red-500/50' : 'bg-gray-700/50 border border-gray-600/50'}`}>
              <div className={`w-2 h-2 rounded-full ${isStreamActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-xs font-semibold">{isStreamActive ? 'EN VIVO' : 'INACTIVO'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">{tokens} tokens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Voice Cloning Section */}
        <VoiceCloningPanel onCloneSuccess={() => window.location.reload()} />
        {/* TikTok Live Section */}
        <TikTokLivePanel />


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Center Column - Synthesis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Voice Selection */}
            <div className="space-y-2 bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4">
              <label className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                Selecciona una voz
              </label>
              <div className="relative">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer pr-10"
                >
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2 bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4">
              <label className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                Texto a sintetizar
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe el texto que deseas convertir en voz..."
                className="w-full h-32 bg-gray-800 border border-cyan-500/30 rounded p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none font-mono text-sm"
              />
              <div className="flex justify-between text-xs text-gray-400">
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
            <button
              onClick={handleSynthesize}
              disabled={loading || estimatedTokens > tokens}
              className={`w-full py-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
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

            {estimatedTokens > tokens && (
              <p className="text-sm text-yellow-400 text-center bg-yellow-500/10 p-3 rounded border border-yellow-500/30">
                No tienes suficientes tokens. Necesitas {estimatedTokens} pero solo tienes {tokens}.
              </p>
            )}
          </div>

          {/* Right Column - Stats & Audio */}
          <div className="lg:col-span-1 space-y-6">
            {/* Audio Player - Simple Button */}
            {audioUrl && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
                <audio ref={(el) => el && audioUrl && (audioRef.current = el)} src={audioUrl} className="hidden" />
                <button
                  onClick={() => audioRef.current && audioRef.current.play()}
                  className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex-shrink-0"
                >
                  <Volume2 className="w-5 h-5 text-white" />
                </button>
                <div className="text-xs text-gray-400">
                  <span className="text-cyan-400 font-bold">{tokensUsed}</span> tokens usados
                </div>
              </div>
            )}

            {/* Tokens Dashboard */}
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-4">Tokens</h3>
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
                    <span className="text-2xl font-black text-white">{tokens}</span>
                    <span className="text-[10px] text-gray-400 uppercase">restantes</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-green-400">{tokens}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Disponibles</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-purple-400">{totalTokensUsed}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Usados</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-cyan-400">{synthesisCount}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Síntesis</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-black text-yellow-400">{synthesisCount > 0 ? (totalTokensUsed / synthesisCount).toFixed(0) : 0}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Promedio</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Uso de tokens</span>
                  <span className="text-cyan-400 font-bold">{Math.min(100, Math.round((totalTokensUsed / (totalTokensUsed + tokens || 1)) * 100))}%</span>
                </div>
                <div className="bg-gray-800 rounded-full h-3 overflow-hidden relative">
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

            {/* Activity History */}
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" /> Actividad
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Mic2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Síntesis completadas</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, synthesisCount * 10)}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-cyan-400">{synthesisCount}</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Tokens gastados</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div className="bg-purple-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (totalTokensUsed / (totalTokensUsed + tokens || 1)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-purple-400">{totalTokensUsed}</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Promedio por síntesis</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div className="bg-yellow-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, synthesisCount > 0 ? (totalTokensUsed / synthesisCount) : 0)}%` }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-yellow-400">{synthesisCount > 0 ? (totalTokensUsed / synthesisCount).toFixed(0) : 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
