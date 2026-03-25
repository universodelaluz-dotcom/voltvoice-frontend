import { useState, useEffect, useRef } from 'react'
import { Play, Square, AlertCircle, Loader, MessageCircle, Volume2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function TikTokLivePanel() {
  const [tiktokUser, setTiktokUser] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ count: 0, uptime: 0 })
  const wsRef = useRef(null)
  const statusIntervalRef = useRef(null)

  // Conectar a WebSocket cuando el usuario se conecte a TikTok
  useEffect(() => {
    if (!isConnected || !tiktokUser) return

    // Iniciar conexión WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsURL = `${protocol}//${API_URL.replace(/^https?:\/\//, '')}/api/tiktok/ws`

    console.log('[TikTok] Conectando WebSocket a:', wsURL)

    const ws = new WebSocket(wsURL)

    ws.onopen = () => {
      console.log('[TikTok] WebSocket conectado')
      ws.send(JSON.stringify({ type: 'subscribe', username: tiktokUser }))
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'subscribed') {
          console.log('[TikTok] Suscrito a:', data.username)
        } else if (data.type === 'message') {
          const msg = data.data
          console.log('[TikTok] Nuevo mensaje:', msg.username, msg.text)

          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              user: msg.username,
              text: msg.text,
              status: 'received',
              timestamp: new Date()
            }
          ])

          synthesizeAndPlay(msg.text, msg.username)
        } else if (data.type === 'status') {
          if (data.data) {
            setStats({
              count: data.data.messageCount || 0,
              uptime: Math.floor((data.data.uptime || 0) / 1000)
            })
          }
        }
      } catch (err) {
        console.error('[TikTok] Error procesando WebSocket:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('[TikTok] WebSocket error:', error)
      setError('Error en conexión WebSocket')
    }

    ws.onclose = () => {
      console.log('[TikTok] WebSocket cerrado')
      setIsConnected(false)
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe' }))
        wsRef.current.close()
      }
    }
  }, [isConnected, tiktokUser])

  // Polling para actualizar estadísticas
  useEffect(() => {
    if (!isConnected || !tiktokUser) return

    statusIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/tiktok/status/${tiktokUser}`)
        const data = await response.json()
        if (data.success) {
          setStats({
            count: data.messageCount || 0,
            uptime: data.uptime || 0
          })
        }
      } catch (err) {
        console.error('[TikTok] Error actualizando stats:', err)
      }
    }, 2000)

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
      }
    }
  }, [isConnected, tiktokUser])

  const synthesizeAndPlay = async (text, username) => {
    try {
      const response = await fetch(`${API_URL}/api/tiktok/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: tiktokUser,
          messageUsername: username,
          messageText: text,
          voiceId: 'es-ES'
        })
      })

      const data = await response.json()

      if (data.audio) {
        const audio = new Audio(data.audio)
        audio.play().catch((err) => console.error('[TikTok] Error reproduciendo:', err))

        setMessages((prev) =>
          prev.map((msg) =>
            msg.text === text ? { ...msg, status: 'playing' } : msg
          )
        )
      }
    } catch (err) {
      console.error('[TikTok] Error sintetizando:', err)
    }
  }

  const handleConnect = async (e) => {
    e.preventDefault()

    if (!tiktokUser.trim()) {
      setError('Ingresa un usuario de TikTok válido')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/tiktok/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tiktokUser.trim() })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsConnected(true)
        setMessages([])
      } else {
        setError(data.error || 'Error conectando a TikTok')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_URL}/api/tiktok/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tiktokUser })
      })

      if (wsRef.current) {
        wsRef.current.close()
      }

      setIsConnected(false)
      setMessages([])
      setStats({ count: 0, uptime: 0 })
    } catch (err) {
      console.error('[TikTok] Error desconectando:', err)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">TikTok LIVE en Tiempo Real</h2>
        <span
          className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
            isConnected
              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
              : 'bg-gray-700/50 border border-gray-600/50 text-gray-300'
          }`}
        >
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
              disabled={isConnecting}
            />
            <button
              type="submit"
              disabled={isConnecting || !tiktokUser}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isConnecting ? 'Conectando...' : 'Conectar'}
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
            <div className="grid grid-cols-2 gap-3 flex-1 mr-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
                <p className="text-xs text-gray-400">Comentarios</p>
                <p className="text-lg font-bold text-cyan-300">{stats.count}</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                <p className="text-xs text-gray-400">Tiempo</p>
                <p className="text-lg font-bold text-purple-300">{stats.uptime}s</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap"
            >
              <Square className="w-4 h-4" />
              Desconectar
            </button>
          </div>

          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-lg p-4 h-64 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                <p>Esperando comentarios en vivo...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="text-sm border-l border-cyan-500/30 pl-3 py-1">
                  <div className="flex items-center justify-between">
                    <p className="text-cyan-300 font-semibold">{msg.user}</p>
                    {msg.status === 'playing' && (
                      <Volume2 className="w-3 h-3 text-green-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-gray-300">{msg.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.status === 'received' && '⏳ Procesando...'}
                    {msg.status === 'playing' && '🔊 Reproduciendo'}
                  </p>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-400">
            💡 Los comentarios se sintetizan automáticamente y se reproducen en tiempo real
          </p>
        </div>
      )}
    </div>
  )
}
