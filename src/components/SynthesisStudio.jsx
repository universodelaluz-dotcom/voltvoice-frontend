import { useState, useEffect } from 'react'
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
      // === GOOGLE TTS (Gratis, Alto rendimiento) ===
      { id: "es-ES", name: "🔊 Español - Google TTS", category: "google", engine: "google" },
      { id: "es-MX", name: "🔊 Mexicano - Google TTS", category: "google", engine: "google" },
      { id: "en-US", name: "🔊 English - Google TTS", category: "google", engine: "google" },

      // === INWORLD AI (Voces predefinidas) ===
      { id: "default-spanish", name: "🎙️ Spanish Default - Inworld AI", category: "inworld", engine: "inworld" },
      { id: "default-english", name: "🎙️ English Default - Inworld AI", category: "inworld", engine: "inworld" },

      // === INWORLD AI (Voces clonadas del usuario) ===
      { id: "default-cfjnp8x4nt-owd7yg-1xsw__garret", name: "👤 Garret - Voz Clonada (Inworld AI)", category: "inworld-cloned", engine: "inworld" },
      { id: "default-cfjnp8x4nt-owd7yg-1xsw__connor", name: "👤 Connor - Voz Clonada (Inworld AI)", category: "inworld-cloned", engine: "inworld" },

      // === VOCES LOCALES DEL SISTEMA (Gratis, Sin latencia) ===
      { id: "web-speech-es", name: "🖥️ Voz Sistema Local (PC) - Español", category: "system", engine: "webspeech" },
      { id: "web-speech-en", name: "🖥️ System Voice (PC) - English", category: "system", engine: "webspeech" },
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


        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Chat */}
          <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
            {/* User Configuration */}
            <div className="space-y-3 bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">Configuración</h3>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">ID de Usuario</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-gray-800 border border-cyan-500/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Canal/Streamer</label>
                <input
                  type="text"
                  value={streamChannel}
                  onChange={(e) => setStreamChannel(e.target.value)}
                  className="w-full bg-gray-800 border border-cyan-500/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={() => setIsStreamActive(!isStreamActive)}
                className={`w-full py-2 rounded font-bold text-sm transition-all ${
                  isStreamActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isStreamActive ? 'Detener Stream' : 'Iniciar Stream'}
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 space-y-3 flex flex-col bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4 min-h-96">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" /> Chat en Vivo
              </h3>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 text-xs border border-cyan-500/10 rounded p-3 bg-gray-950/50">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Sin mensajes en el chat</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="group">
                      <div className="flex items-start justify-between hover:bg-cyan-500/10 p-2 rounded transition-all">
                        <div className="flex-1 min-w-0">
                          <span className="text-cyan-400 font-bold">{msg.user}:</span>
                          <span className="text-gray-300 ml-1 break-words">{msg.message}</span>
                        </div>
                        <button
                          onClick={() => handleSynthesizeFromChat(msg.message)}
                          className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 hover:text-purple-300"
                          title="Leer este mensaje"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-gray-600 text-xs px-2">{msg.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Chat Message */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={currentChatUser}
                  onChange={(e) => setCurrentChatUser(e.target.value)}
                  placeholder="Tu nombre de usuario"
                  className="w-full bg-gray-800 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChatMessage()}
                    placeholder="Simular mensaje de chat..."
                    className="flex-1 bg-gray-800 border border-cyan-500/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleAddChatMessage}
                    className="p-1 bg-cyan-600 hover:bg-cyan-500 rounded transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                  Sintetizando...
                </>
              ) : (
                <>
                  <Mic2 className="w-5 h-5" />
                  Sintetizar voz
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
            {/* Audio Player */}
            <div className="space-y-2 bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">Reproducción</h3>
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4 flex items-center justify-center min-h-40">
                {audioUrl ? (
                  <div className="w-full space-y-3">
                    <audio
                      src={audioUrl}
                      controls
                      className="w-full accent-cyan-500"
                      autoPlay
                    />
                    <p className="text-xs text-gray-400 text-center">
                      Tokens usados: <span className="text-cyan-400 font-bold">{tokensUsed}</span>
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Volume2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Aquí aparecerá el audio</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">Estadísticas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tokens disponibles</span>
                  <span className={`font-bold ${tokens > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tokens}
                  </span>
                </div>
                <div className="h-px bg-cyan-500/20"></div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Total usado</span>
                  <span className="font-bold text-purple-400">{totalTokensUsed}</span>
                </div>
                <div className="h-px bg-cyan-500/20"></div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Síntesis realizadas</span>
                  <span className="font-bold text-cyan-400">{synthesisCount}</span>
                </div>
                <div className="h-px bg-cyan-500/20"></div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Est. para actual</span>
                  <span className="font-bold text-yellow-400">{estimatedTokens}</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full transition-all"
                      style={{ width: `${Math.min(100, (totalTokensUsed / (totalTokensUsed + tokens)) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalTokensUsed} de {totalTokensUsed + tokens} tokens usados
                  </p>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="space-y-2 bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4" /> Historial
              </h3>
              <div className="text-xs text-gray-400 space-y-2">
                <p>Síntesis completadas: <span className="text-cyan-400 font-bold">{synthesisCount}</span></p>
                <p>Tokens gastados: <span className="text-purple-400 font-bold">{totalTokensUsed}</span></p>
                <p>Promedio por síntesis: <span className="text-yellow-400 font-bold">{synthesisCount > 0 ? (totalTokensUsed / synthesisCount).toFixed(1) : 0}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
