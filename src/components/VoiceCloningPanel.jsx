import { useState, useEffect } from 'react'
import { Upload, Zap, AlertCircle, CheckCircle, Loader } from 'lucide-react'

export default function VoiceCloningPanel({ onCloneSuccess }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

    const [voiceName, setVoiceName] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['audio/mpeg', 'audio/wav'].includes(file.type)) {
        setError('Solo se aceptan archivos MP3 o WAV')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB max
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

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      // Convertir archivo a base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target.result.split(',')[1]

        const response = await fetch('/api/clone-voice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            voiceName: voiceName.trim(),
            base64Audio: base64,
            audioFormat: audioFile.type
          })
        })

        const data = await response.json()

        if (response.ok) {
          setMessage(`✅ Voz "${voiceName}" clonada exitosamente!`)
          setVoiceName('')
          setAudioFile(null)
          if (onCloneSuccess) {
            onCloneSuccess(data.voiceId, voiceName)
          }
        } else {
          setError(data.error || 'Error al clonar la voz')
        }
      }
      reader.readAsDataURL(audioFile)
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={darkMode ? "bg-gray-900 border border-cyan-500/30 rounded-lg p-6 mb-6" : "bg-white border border-indigo-200 rounded-lg p-6 mb-6 shadow-sm"}>
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-6 h-6 text-cyan-400" />
        <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>Clonar Voz</h2>
      </div>

      <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded flex gap-2">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <p className="font-semibold">Plan Starter ($5/mes) requerido</p>
          <p>Clona voces personalizadas con tu propia voz</p>
        </div>
      </div>

      <form onSubmit={handleCloneVoice} className="space-y-4">
        {/* Nombre de la voz */}
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

        {/* File upload */}
        <div>
          <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
            Archivo de audio (MP3 o WAV, máx 10MB)
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
          <p>✓ Duración: 30 segundos - 2 minutos</p>
          <p>✓ Claridad: Audio claro sin ruido de fondo</p>
          <p>✓ Formato: MP3 o WAV a 44.1kHz o superior</p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !voiceName || !audioFile}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Clonando voz...
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
          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded flex gap-2">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-200">{message}</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </form>
    </div>
  )
}
