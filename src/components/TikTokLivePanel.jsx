import { useState, useEffect } from 'react'
import { Video, MessageCircle, Loader, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function TikTokLivePanel() {
  const [tiktokUsername, setTiktokUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({ count: 0, uptime: 0 })
  const [userId, setUserId] = useState('1')

  // Poll for stream status
  useEffect(() => {
    if (!isConnected || !tiktokUsername) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/tiktok/status/${tiktokUsername}`,
          {
            headers: { 'x-user-id': userId }
          }
        )
        const data = await response.json()
        if (data.success) {
          setStats({
            count: data.messageCount || 0,
            uptime: Math.floor((data.uptime || 0) / 1000)
          })
        }
      } catch (err) {
        console.error('Error fetching status:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isConnected, tiktokUsername, userId])

  const handleConnect = async () => {
    if (!tiktokUsername.trim()) {
      setError('Por favor ingresa un usuario de TikTok')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/tiktok/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ username: tiktokUsername })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsConnected(true)
        setMessages([])
        setError(null)
      } else {
        setError(data.error || 'Error al conectar con TikTok')
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
      console.error(err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_URL}/api/tiktok/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ username: tiktokUsername })
      })
      setIsConnected(false)
      setMessages([])
    } catch (err) {
      console.error('Error desconectando:', err)
    }
  }

  const handleProcessMessage = async (message) => {
    try {
      const response = await fetch(`${API_URL}/api/tiktok/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          username: tiktokUsername,
          messageUsername: message.username,
          messageText: message.text,
          voiceId: 'es-ES'
        })
      })

      const data = await response.json()
      if (response.ok && data.audio) {
        // Play the audio
        const audio = new Audio(data.audio)
        audio.play().catch(err => console.error('Error playing audio:', err))
      }
    } catch (err) {
      console.error('Error procesando mensaje:', err)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-cyan-500/20 rounded-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Video className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-cyan-400">TikTok LIVE</h2>
        {isConnected && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-400 font-semibold">EN VIVO</span>
          </div>
        )}
      </div>

      {/* Connection Panel */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={tiktokUsername}
            onChange={(e) => setTiktokUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
            placeholder="usuario_tiktok (sin @)"
            disabled={isConnected}
            className="flex-1 bg-gray-800 border border-cyan-500/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />
          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            className={`px-4 py-2 rounded font-semibold text-sm transition-all flex items-center gap-2 ${
              isConnecting
                ? 'bg-gray-600 cursor-not-allowed'
                : isConnected
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isConnecting && <Loader className="w-4 h-4 animate-spin" />}
            {isConnecting ? 'Conectando...' : isConnected ? 'Desconectar' : 'Conectar'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {isConnected && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded p-3">
              <p className="text-xs text-gray-400">Mensajes procesados</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.count}</p>
            </div>
            <div className="bg-gray-800/50 rounded p-3">
              <p className="text-xs text-gray-400">Tiempo conectado</p>
              <p className="text-2xl font-bold text-purple-400">{stats.uptime}s</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-cyan-400">Mensajes en vivo</h3>
            </div>

            <div className="bg-gray-950/50 border border-cyan-500/10 rounded p-3 h-48 overflow-y-auto space-y-2">
              {messages.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">
                  Esperando mensajes del chat de TikTok...
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-gray-800/50 rounded border border-cyan-500/20 group hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-cyan-400">{msg.username}</p>
                        <p className="text-xs text-gray-300 break-words">{msg.text}</p>
                      </div>
                      <button
                        onClick={() => handleProcessMessage(msg)}
                        className="flex-shrink-0 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        Leer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
