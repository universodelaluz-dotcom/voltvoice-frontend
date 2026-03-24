import { useState } from 'react'
import { StripePayment } from './components/StripePayment'

export function App() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [tokens, setTokens] = useState(100)

  const handlePaymentSuccess = (newTokens) => {
    setTokens(tokens + newTokens)
    setIsPaymentOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#16213e] to-[#0f3460] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-black">⚡</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                VoltVoice
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg px-6 py-3">
                <p className="text-sm text-gray-400">Tokens disponibles</p>
                <p className="text-2xl font-bold text-cyan-400">{tokens}</p>
              </div>
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
              >
                Comprar Más
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Features */}
          <div className="md:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-8">
              <h2 className="text-3xl font-bold mb-4">Lee chats en vivo</h2>
              <p className="text-gray-300 mb-6">
                VoltVoice convierte los mensajes de chat en voz sintética de alta calidad para tus streams en TikTok y YouTube.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-cyan-400/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Lectura en Tiempo Real</h3>
                    <p className="text-sm text-gray-400">Lee los mensajes del chat mientras transmites en vivo</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎤</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Voces Naturales</h3>
                    <p className="text-sm text-gray-400">Sintetiza de voz con IA para sonido natural y expresivo</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">⚙️</span>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Fácil de Configurar</h3>
                    <p className="text-sm text-gray-400">Conecta tu canal y comienza en minutos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Streams Section */}
            <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Mis Streams</h3>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">Mi Canal de TikTok</h4>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">ACTIVO</span>
                  </div>
                  <p className="text-sm text-gray-400">@mi_usuario_tiktok</p>
                  <p className="text-xs text-gray-500 mt-2">ID: stream_001</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">Mi Canal de YouTube</h4>
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold">INACTIVO</span>
                  </div>
                  <p className="text-sm text-gray-400">Mi Canal de Gaming</p>
                  <p className="text-xs text-gray-500 mt-2">ID: stream_002</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Token Info */}
            <div className="bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Información de Tokens</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Tokens disponibles:</span>
                  <span className="font-bold text-cyan-400">{tokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Caracteres disponibles:</span>
                  <span className="font-bold text-purple-300">{tokens * 100}</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-gray-400">1 Token = ~100 caracteres</p>
                  <p className="text-gray-400 mt-2">Cada token te permite sintetizar hasta 100 caracteres de texto</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Mensajes leídos hoy</p>
                  <p className="text-3xl font-black text-cyan-400">284</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Tiempo en vivo</p>
                  <p className="text-3xl font-black text-purple-400">4.5h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <StripePayment
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
