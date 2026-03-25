import { useState } from 'react'
import { Mic2, Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function VoiceCloningPanel({ onCloneSuccess }) {
  const [voiceName, setVoiceName] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [isCloning, setIsCloning] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [userId, setUserId] = useState('1')

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!['audio/mpeg', 'audio/wav', 'audio/mp3'].includes(file.type)) {
      setError('Solo se aceptan archivos MP3 o WAV')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 10MB')
      return
    }

    setAudioFile(file)
    setError(null)
  }

  const handleCloneVoice = async () => {
    if (!voiceName.trim()) {
      setError('Por favor ingresa un nombre para la voz')
      return
    }

    if (!audioFile) {
      setError('Por favor selecciona un archivo de audio')
      return
    }

    setIsCloning(true)
    setError(null)
    setSuccess(null)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Audio = e.target.result?.toString().split(',')[1]

        try {
          const response = await fetch(`${API_URL}/api/clone-voice`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId
            },
            body: JSON.stringify({
              voiceName: voiceName,
              base64Audio: base64Audio
            })
          })

          const data = await response.json()

          if (response.ok && data.success) {
            setSuccess(`¡Voz clonada exitosamente! ID: ${data.voiceId}`)
            setVoiceName('')
            setAudioFile(null)
            setTimeout(() => {
              onCloneSuccess?.()
            }, 2000)
          } else {
            setError(data.error || 'Error al clonar la voz')
          }
        } catch (err) {
          setError('Error de conexión. Intenta de nuevo.')
          console.error(err)
        } finally {
          setIsCloning(false)
        }
      }
      reader.readAsDataURL(audioFile)
    } catch (err) {
      setError('Error procesando el archivo')
      setIsCloning(false)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-cyan-500/20 rounded-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Mic2 className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-cyan-400">Clonar Voz</h2>
      </div>

      <div className="space-y-4">
        {/* Voice Name Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Nombre de la voz</label>
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="Mi voz personalizada"
            disabled={isCloning}
            className="w-full bg-gray-800 border border-cyan-500/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Archivo de audio</label>
          <div className="relative">
            <input
              type="file"
              accept="audio/mpeg,audio/wav,.mp3,.wav"
              onChange={handleFileSelect}
              disabled={isCloning}
              className="hidden"
              id="voice-upload"
            />
            <label
              htmlFor="voice-upload"
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-cyan-500/30 rounded cursor-pointer hover:border-cyan-500/60 transition-all disabled:opacity-50"
            >
              <Upload className="w-5 h-5 text-cyan-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">
                  {audioFile ? audioFile.name : 'Arrastra o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-gray-400">MP3 o WAV, máx 10MB</p>
              </div>
            </label>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3 text-xs text-cyan-300">
          <p className="font-semibold mb-2">Requisitos para mejor calidad:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Duración: 30 segundos a 2 minutos</li>
            <li>Audio claro sin ruido de fondo</li>
            <li>Mínimo 44.1 kHz de calidad</li>
            <li>Una sola persona hablando</li>
          </ul>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Clone Button */}
        <button
          onClick={handleCloneVoice}
          disabled={isCloning || !voiceName.trim() || !audioFile}
          className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
            isCloning || !voiceName.trim() || !audioFile
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500'
          }`}
        >
          {isCloning && <Loader className="w-5 h-5 animate-spin" />}
          {isCloning ? 'Clonando voz...' : 'Clonar voz'}
        </button>
      </div>
    </div>
  )
}
