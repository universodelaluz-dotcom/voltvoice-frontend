import { useState, useEffect } from 'react'
import { Mic2, Volume2, Zap, ChevronDown, Loader, AlertCircle } from 'lucide-react'

export function SynthesisStudio() {
  const [text, setText] = useState('Hola, este es VoltVoice. Tu plataforma para síntesis de voz profesional.')
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [tokens, setTokens] = useState(1000)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Cargar voces disponibles
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('https://voltvoice-backend-production.up.railway.app/api/synthesis/voices', {
          headers: {
            'x-user-id': '1'
          }
        })
        const data = await response.json()
        if (data.voices) {
          setVoices(data.voices)
          setSelectedVoice(data.voices[0]?.id || '')
        }
      } catch (err) {
        setError('No se pudieron cargar las voces disponibles')
        console.error(err)
      }
    }
    fetchVoices()
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

    setLoading(true)
    setError(null)
    setSuccess(false)
    setAudioUrl(null)

    try {
      const response = await fetch('https://voltvoice-backend-production.up.railway.app/api/synthesis/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify({
          text: text,
          voiceId: selectedVoice
        })
      })

      const data = await response.json()

      if (response.ok && data.audio) {
        setAudioUrl(data.audio)
        setTokensUsed(data.tokensUsed)
        setTokens(data.remainingTokens)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Error al sintetizar la voz')
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu conexión a internet.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const charCount = text.length
  const estimatedTokens = Math.ceil(charCount / 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-cyan-500/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg">
              <Mic2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              VoltVoice Studio
            </h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-400">{tokens} tokens</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                Texto a sintetizar
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe el texto que deseas convertir en voz..."
                className="w-full h-40 bg-gray-900/50 border border-cyan-500/30 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none font-mono text-sm"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{charCount} caracteres</span>
                <span>≈ {estimatedTokens} tokens</span>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                Selecciona una voz
              </label>
              <div className="relative">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-500/30 rounded-lg p-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer pr-10"
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
              <p className="text-sm text-yellow-400 text-center">
                No tienes suficientes tokens. Necesitas {estimatedTokens} pero solo tienes {tokens}.
              </p>
            )}
          </div>

          {/* Right Panel - Audio Player */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                  Reproducción
                </h2>
                <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-6 flex items-center justify-center min-h-40">
                  {audioUrl ? (
                    <div className="w-full space-y-4">
                      <audio
                        src={audioUrl}
                        controls
                        className="w-full accent-cyan-500"
                        autoPlay
                      />
                      <div className="text-center">
                        <p className="text-sm text-gray-400">
                          Tokens usados: <span className="text-cyan-400 font-bold">{tokensUsed}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aquí aparecerá el audio</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                  Estadísticas
                </h3>
                <div className="bg-gray-900/50 border border-cyan-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Caracteres</span>
                    <span className="font-bold text-cyan-400">{charCount}</span>
                  </div>
                  <div className="h-px bg-cyan-500/20"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Tokens estimados</span>
                    <span className="font-bold text-purple-400">{estimatedTokens}</span>
                  </div>
                  <div className="h-px bg-cyan-500/20"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Tokens disponibles</span>
                    <span className={`font-bold ${tokens > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tokens}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
