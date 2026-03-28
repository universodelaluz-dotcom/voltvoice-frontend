import { useState, useEffect } from 'react'
import { Upload, Zap, AlertCircle, CheckCircle, Loader, Trash2, Mic2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function VoiceCloningPanel({ onCloneSuccess }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  const [voiceName, setVoiceName] = useState('')
  const [transcription, setTranscription] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [userVoices, setUserVoices] = useState([])
  const [loadingVoices, setLoadingVoices] = useState(true)

  // Cargar voces del usuario al montar
  useEffect(() => {
    loadUserVoices()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sv-token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const loadUserVoices = async () => {
    try {
      const token = localStorage.getItem('sv-token')
      if (!token) { setLoadingVoices(false); return }

      // Migrar voces pre-existentes (solo la primera vez, ON CONFLICT ignora duplicados)
      await fetch(`${API_URL}/api/settings/voices/migrate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})

      const res = await fetch(`${API_URL}/api/settings/voices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUserVoices(data.voices || [])
      }
    } catch (err) {
      console.error('[Voices] Error cargando voces:', err)
    } finally {
      setLoadingVoices(false)
    }
  }

  const handleDeleteVoice = async (id, name) => {
    if (!confirm(`¿Eliminar la voz "${name}"?`)) return

    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/settings/voices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setUserVoices(prev => prev.filter(v => v.id !== id))
        setMessage(`Voz "${name}" eliminada`)
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      setError('Error eliminando voz')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['audio/mpeg', 'audio/wav'].includes(file.type)) {
        setError('Solo se aceptan archivos MP3 o WAV')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no debe exceder 10MB')
        return
      }
      setAudioFile(file)
      setError(null)
    }
  }

  const handleCloneVoice = async (e) => {
    e.preventDefault()

    if (!voiceName.trim()) {
      setError('Ingresa un nombre para la voz')
      return
    }

    if (!audioFile) {
      setError('Selecciona un archivo de audio')
      return
    }

    const token = localStorage.getItem('sv-token')
    if (!token) {
      setError('Debes iniciar sesión para clonar voces')
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const base64 = event.target.result.split(',')[1]

          const response = await fetch(`${API_URL}/api/settings/voices/clone`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              voiceName: voiceName.trim(),
              base64Audio: base64,
              transcription: transcription.trim() || undefined,
            })
          })

          const data = await response.json()

          if (response.ok && data.success) {
            setMessage(`Voz "${voiceName}" clonada exitosamente`)
            setVoiceName('')
            setTranscription('')
            setAudioFile(null)
            // Recargar lista de voces
            loadUserVoices()
            if (onCloneSuccess) {
              onCloneSuccess(data.voice.voice_id, voiceName)
            }
          } else {
            setError(data.error || data.details || 'Error al clonar la voz')
          }
        } catch (err) {
          setError(`Error: ${err.message}`)
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(audioFile)
    } catch (err) {
      setError(`Error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Mis Voces Clonadas */}
      <div className={darkMode ? "bg-gray-900 border border-cyan-500/30 rounded-lg p-6" : "bg-white border border-indigo-200 rounded-lg p-6 shadow-sm"}>
        <div className="flex items-center gap-3 mb-4">
          <Mic2 className="w-6 h-6 text-purple-400" />
          <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>Mis Voces Clonadas</h2>
          <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>
            {userVoices.length}/10
          </span>
        </div>

        {loadingVoices ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 animate-spin text-cyan-400" />
          </div>
        ) : userVoices.length === 0 ? (
          <p className={`text-sm py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Aún no tienes voces clonadas. ¡Crea tu primera voz abajo!
          </p>
        ) : (
          <div className="space-y-2">
            {userVoices.map((voice) => (
              <div
                key={voice.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                  darkMode ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{voice.voice_name}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {voice.provider} · {new Date(voice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                    {voice.voice_id.substring(0, 20)}...
                  </span>
                  <button
                    onClick={() => handleDeleteVoice(voice.id, voice.voice_name)}
                    className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                    title="Eliminar voz"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clonar Nueva Voz */}
      <div className={darkMode ? "bg-gray-900 border border-cyan-500/30 rounded-lg p-6" : "bg-white border border-indigo-200 rounded-lg p-6 shadow-sm"}>
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-cyan-400" />
          <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>Clonar Nueva Voz</h2>
        </div>

        <form onSubmit={handleCloneVoice} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              Nombre de la voz
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Ej: Mi voz, Voz profesional..."
              className={darkMode ? "w-full bg-gray-800 border border-cyan-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
              disabled={loading}
            />
          </div>

          {/* Transcripción (opcional) */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              Transcripción del audio <span className={darkMode ? "text-gray-500" : "text-gray-400"}>(opcional, mejora la calidad)</span>
            </label>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Escribe lo que dice el audio..."
              rows={2}
              className={darkMode ? "w-full bg-gray-800 border border-cyan-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 resize-none text-sm" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500 resize-none text-sm"}
              disabled={loading}
            />
          </div>

          {/* File upload */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              Archivo de audio (MP3 o WAV, 10-15 seg ideal)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="audio/mpeg,audio/wav"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="audio-input"
              />
              <label
                htmlFor="audio-input"
                className={darkMode ? "flex items-center justify-center gap-2 w-full bg-gray-800 border-2 border-dashed border-cyan-500/30 rounded-lg p-4 cursor-pointer hover:border-cyan-500 transition" : "flex items-center justify-center gap-2 w-full bg-gray-50 border-2 border-dashed border-indigo-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500 transition"}
              >
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  {audioFile ? audioFile.name : 'Clic para seleccionar archivo'}
                </span>
              </label>
            </div>
          </div>

          {/* Requerimientos */}
          <div className={darkMode ? "text-xs text-gray-400 space-y-1" : "text-xs text-gray-500 space-y-1"}>
            <p>✓ Duración ideal: 10-15 segundos (máx 15 seg)</p>
            <p>✓ Audio claro, sin ruido de fondo ni música</p>
            <p>✓ Formato: MP3 o WAV</p>
            <p>✓ Mejor calidad si incluyes la transcripción</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !voiceName || !audioFile}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Clonando voz con Inworld AI...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Clonar voz
              </>
            )}
          </button>

          {/* Messages */}
          {message && (
            <div className="p-4 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <p className="text-green-50 font-semibold">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-gradient-to-r from-red-500/30 to-rose-500/30 border-2 border-red-400 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-50 font-semibold">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
