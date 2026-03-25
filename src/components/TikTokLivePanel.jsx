import { useState, useEffect } from 'react'
import { Play, Square, AlertCircle, CheckCircle, Loader, MessageCircle } from 'lucide-react'

export default function TikTokLivePanel() {
  const [tiktokUser, setTiktokUser] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [messageCount, setMessageCount] = useState(0)

  const handleConnect = async (e) => {
    e.preventDefault()

    if (!tiktokUser.trim()) {
      setError('Ingresa un usuario de TikTok válido')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tiktok-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tiktokUser.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setIsConnected(true)
        setMessageCount(0)
        setMessages([])
        // Aquí se conectaría a WebSocket para recibir mensajes en tiempo real
      } else {
        setError(data.error || 'Error al conectar')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setMessages([])
    setMessageCount(0)
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">TikTok LIVE</h2>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${isConnected ? 'bg-green-500/20 border border-green-500/50 text-green-300' : 'bg-gray-700/50 border border-gray-600/50 text-gray-300'}`}>
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
              className="flex-1 bg-gray-800 border border-cyan-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !tiktokUser}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isLoading ? 'Conectando...' : 'Conectar'}
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
            <div>
              <p className="text-sm text-gray-300">
                Usuario: <span className="font-semibold text-cyan-300">@{tiktokUser}</span>
              </p>
              <p className="text-sm text-gray-400">
                Comentarios procesados: <span className="font-semibold text-green-300">{messageCount}</span>
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Desconectar
            </button>
          </div>

          {/* Live messages feed */}
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-lg p-4 h-48 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                <p>Esperando comentarios...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="text-sm border-l border-cyan-500/30 pl-3">
                  <p className="text-cyan-300 font-semibold">{msg.user}</p>
                  <p className="text-gray-300">{msg.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.status === 'synthesizing' && '⏳ Sintetizando...'}
                    {msg.status === 'ready' && '✅ Listo para reproducir'}
                    {msg.status === 'playing' && '🔊 Reproduciéndose...'}
                  </p>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-400">
            💡 Cada comentario se sintetiza automáticamente y se reproduce en tu aplicación
          </p>
        </div>
      )}
    </div>
  )
}
