'use client'

import { useState, useEffect } from 'react'
import { Zap, Settings, Mic, Radio, LogOut, Menu, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { StripePayment } from '@/components/StripePayment'

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tokens, setTokens] = useState(100)
  const [showStripePayment, setShowStripePayment] = useState(false)
  const [userText, setUserText] = useState('')
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [voices, setVoices] = useState<Array<{id: string; name: string}>>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const stats = [
    { label: 'Streams Hoy', value: 0, icon: '📺' },
    { label: 'Visualizaciones', value: 0, icon: '👁️' },
    { label: 'Comentarios Generados', value: 0, icon: '💬' },
    { label: 'Seguidores Nuevos', value: 0, icon: '👥' },
  ]

  // Cargar datos al iniciar
  useEffect(() => {
    fetchTokenBalance()
    fetchVoices()
  }, [])

  const fetchTokenBalance = async () => {
    try {
      // Mock: En producción, llamar a /api/tokens/balance
      setTokens(100)
    } catch (error) {
      console.error('Error fetching tokens:', error)
    }
  }

  const fetchVoices = async () => {
    try {
      // Mock: En producción, llamar a /api/synthesis/voices
      const mockVoices = [
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Morgan Freeman' },
        { id: 'EXAVITQu4vr4xnSDxMa2', name: 'Cristiano Ronaldo' },
        { id: 'EXAVITQu4vr4xnSDxMa3', name: 'Elon Musk' },
        { id: 'EXAVITQu4vr4xnSDxMa4', name: 'Shakira' },
        { id: 'EXAVITQu4vr4xnSDxMa5', name: 'Bad Bunny' },
      ]
      setVoices(mockVoices)
      setSelectedVoiceId(mockVoices[0].id)
    } catch (error) {
      console.error('Error fetching voices:', error)
    }
  }

  const handleSynthesize = async () => {
    if (!userText.trim()) {
      alert('Escribe algo primero')
      return
    }

    const tokensNeeded = Math.ceil(userText.length / 100)

    if (tokens < tokensNeeded) {
      alert(`Necesitas ${tokensNeeded} tokens, pero solo tienes ${tokens}`)
      return
    }

    setIsSynthesizing(true)

    try {
      // En producción, llamar a /api/synthesis/synthesize
      // const response = await fetch('/api/synthesis/synthesize', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'x-user-id': 'user-123'
      //   },
      //   body: JSON.stringify({
      //     text: userText,
      //     voiceId: selectedVoiceId
      //   })
      // })
      // const data = await response.json()
      // setAudioUrl(data.audio)

      // Mock: simular síntesis
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Crear un audio placeholder (beep)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()

      oscillator.connect(gain)
      gain.connect(audioContext.destination)
      oscillator.frequency.value = 440
      gain.gain.setValueAtTime(0.1, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      // Para el mock, usar un data URL simple (beep)
      const mockAudioUrl = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='

      setAudioUrl(mockAudioUrl)
      setTokens(prev => prev - tokensNeeded)
      setUserText('')
      alert('✅ Voz sintetizada exitosamente')
    } catch (error) {
      alert('❌ Error al sintetizar')
      console.error(error)
    } finally {
      setIsSynthesizing(false)
    }
  }

  const handlePaymentSuccess = (tokensAdded: number) => {
    setTokens(prev => prev + tokensAdded)
    setShowStripePayment(false)
    alert(`✅ ${tokensAdded} tokens agregados`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-voltvoice-dark via-[#0f0f23] to-[#1a0033] text-white">
      {/* Header */}
      <header className="border-b border-voltvoice-cyan/20 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-voltvoice-cyan" />
            <span className="text-xl font-bold gradient-text">VoltVoice</span>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <button className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-voltvoice-cyan transition-colors">
            <LogOut size={18} />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-voltvoice-cyan/20 bg-black/40 backdrop-blur-md min-h-screen p-6 space-y-6">
            <nav className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-voltvoice-cyan/10 border border-voltvoice-cyan/30 text-voltvoice-cyan font-semibold hover:bg-voltvoice-cyan/20 transition-colors flex items-center gap-2">
                <Radio size={18} />
                Panel de Control
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors flex items-center gap-2">
                <Mic size={18} />
                Mis Voces
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors flex items-center gap-2">
                <Settings size={18} />
                Configuración
              </button>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 sm:p-8">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-black mb-2">
              <span className="gradient-text">¡Bienvenido a VoltVoice!</span>
            </h1>
            <p className="text-gray-400">Aquí puedes gestionar tus voces clonadas y streams en vivo</p>
          </div>

          {/* Tokens Balance Card */}
          <div className="mb-8 p-6 bg-gradient-to-r from-voltvoice-yellow/10 to-voltvoice-cyan/10 border border-voltvoice-yellow/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">💎</div>
                <div>
                  <h2 className="text-xl font-bold mb-1">Tus Tokens</h2>
                  <p className="text-gray-400 text-sm">1 token = ~100 caracteres</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-voltvoice-yellow mb-2">{tokens}</p>
                <button
                  onClick={() => setShowStripePayment(true)}
                  className="px-4 py-2 bg-gradient-to-r from-voltvoice-yellow to-voltvoice-orange rounded-lg font-bold text-black hover:shadow-glow-yellow transition-all text-sm"
                >
                  Comprar Más
                </button>
              </div>
            </div>

            {/* Stripe Payment Modal */}
            <StripePayment
              isOpen={showStripePayment}
              onClose={() => setShowStripePayment(false)}
              onSuccess={handlePaymentSuccess}
            />
          </div>

          {/* Connection Status */}
          <div className="mb-8 p-6 bg-gradient-to-r from-voltvoice-cyan/10 to-voltvoice-purple/10 border border-voltvoice-cyan/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Conexión TikTok</h2>
                <p className={`text-sm ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
                  {isConnected ? '✅ Conectado' : '⭕ No conectado'}
                </p>
              </div>
              <button
                onClick={() => setIsConnected(!isConnected)}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  isConnected
                    ? 'bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30'
                    : 'bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple text-white hover:shadow-glow-cyan'
                }`}
              >
                {isConnected ? 'Desconectar' : 'Conectar TikTok'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {stats.map((stat, i) => (
              <div key={i} className="p-6 glass-effect rounded-lg border border-voltvoice-cyan/10">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-voltvoice-cyan">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Voice Selection */}
          <div className="bg-gradient-to-r from-voltvoice-cyan/5 to-voltvoice-purple/5 border border-voltvoice-cyan/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Selecciona una Voz</h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoiceId(voice.id)}
                  className={`p-4 rounded-lg font-semibold transition-all ${
                    selectedVoiceId === voice.id
                      ? 'bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple text-white shadow-glow-cyan'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {voice.name}
                </button>
              ))}
            </div>

            <div className="bg-black/30 rounded-lg p-6 border border-voltvoice-cyan/10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400">Voz seleccionada: <span className="text-voltvoice-cyan font-bold">{voices.find(v => v.id === selectedVoiceId)?.name || 'N/A'}</span></p>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Tokens necesarios:</p>
                  <p className="text-lg font-bold text-voltvoice-yellow">
                    {Math.ceil(userText.length / 100)} / {tokens} 💎
                  </p>
                </div>
              </div>

              {tokens < Math.ceil(userText.length / 100) && userText.length > 0 && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">No tienes suficientes tokens. Necesitas {Math.ceil(userText.length / 100) - tokens} más.</p>
                </div>
              )}

              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder={`Escribe lo que quieras que diga ${voices.find(v => v.id === selectedVoiceId)?.name || 'esta voz'}...`}
                className="w-full bg-black/50 border border-voltvoice-cyan/20 rounded-lg p-4 text-white placeholder-gray-500 focus:border-voltvoice-cyan outline-none transition-colors resize-none h-24"
              />
              <button
                onClick={handleSynthesize}
                disabled={isSynthesizing || tokens < Math.ceil(userText.length / 100) || !userText.trim()}
                className={`mt-4 w-full px-6 py-3 rounded-lg font-bold text-white transition-all ${
                  isSynthesizing || tokens < Math.ceil(userText.length / 100) || !userText.trim()
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-voltvoice-cyan via-voltvoice-purple to-voltvoice-magenta hover:shadow-glow-cyan'
                }`}
              >
                {isSynthesizing ? '🔄 Sintetizando...' : '🎤 Sintetizar Voz'}
              </button>

              {/* Audio Player */}
              {audioUrl && (
                <div className="mt-4 p-4 bg-voltvoice-cyan/10 rounded-lg border border-voltvoice-cyan/30">
                  <p className="text-sm text-gray-300 mb-3">Reproducir audio generado:</p>
                  <audio
                    controls
                    src={audioUrl}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
