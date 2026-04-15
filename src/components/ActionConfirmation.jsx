import { useState, useRef } from 'react'
import { Check, X, Mic2, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function ActionConfirmation({
  isOpen,
  action,
  targetUsername,
  reason,
  onConfirm,
  onCancel,
  darkMode = true
}) {
  const { i18n } = useTranslation()
  const isSpanish = String(i18n?.resolvedLanguage || i18n?.language || 'en').toLowerCase().startsWith('es')
  const [confirmMethod, setConfirmMethod] = useState('visual') // 'visual', 'voice', 'shortcut'
  const [isListeningForVoice, setIsListeningForVoice] = useState(false)
  const mediaRecorderRef = useRef(null)
  const [isExecuting, setIsExecuting] = useState(false)

  if (!isOpen) return null

  const actionLabel = {
    ban: isSpanish ? `Bloquear a ${targetUsername}` : `Ban ${targetUsername}`,
    mute: isSpanish ? `Silenciar a ${targetUsername}` : `Mute ${targetUsername}`,
    kick: isSpanish ? `Expulsar a ${targetUsername}` : `Kick ${targetUsername}`,
    timeout: isSpanish ? `Timeout a ${targetUsername}` : `Timeout ${targetUsername}`,
    clear: isSpanish ? `Limpiar mensajes de ${targetUsername}` : `Clear ${targetUsername} messages`
  }[action]

  const handleVisualConfirm = async () => {
    setIsExecuting(true)
    try {
      await onConfirm(action, targetUsername, reason)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleVoiceConfirm = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const audioChunks = []
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const reader = new FileReader()

        reader.onload = async () => {
          // Enviar audio para transcripción y análisis
          const audioBase64 = reader.result.split(',')[1]

          // Por ahora, ejecutar directamente
          // En el futuro, analizar la respuesta de voz
          setIsExecuting(true)
          try {
            await onConfirm(action, targetUsername, reason)
          } finally {
            setIsExecuting(false)
          }
        }

        reader.readAsDataURL(audioBlob)
      }

      setIsListeningForVoice(true)
      mediaRecorder.start()

      // Escuchar por 5 segundos
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
          setIsListeningForVoice(false)
        }
      }, 5000)
    } catch (err) {
      console.error('[ActionConfirm] Error recording voice:', err)
    }
  }

  // Listener para shortcuts (Ctrl+Y = sí, Ctrl+N = no)
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault()
      handleVisualConfirm()
    } else if (e.ctrlKey && e.key === 'n') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className={`p-6 rounded-lg max-w-md w-full mx-4 ${
          darkMode ? 'bg-gray-800 border-2 border-yellow-500' : 'bg-white border-2 border-yellow-400'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        autoFocus
      >
        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {isSpanish ? '⚠️ Confirmar acción' : '⚠️ Confirm action'}
        </h2>

        <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-100 border border-yellow-300'}`}>
          <p className={`font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
            {actionLabel}
          </p>
          {reason && (
            <p className={`text-sm mt-2 ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
              {isSpanish ? 'Razón' : 'Reason'}: {reason}
            </p>
          )}
        </div>

        {/* Método de confirmación */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="radio"
                value="visual"
                checked={confirmMethod === 'visual'}
                onChange={(e) => setConfirmMethod(e.target.value)}
                className="w-4 h-4"
              />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Visual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="radio"
                value="voice"
                checked={confirmMethod === 'voice'}
                onChange={(e) => setConfirmMethod(e.target.value)}
                className="w-4 h-4"
              />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{isSpanish ? 'Voz' : 'Voice'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="radio"
                value="shortcut"
                checked={confirmMethod === 'shortcut'}
                onChange={(e) => setConfirmMethod(e.target.value)}
                className="w-4 h-4"
              />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Shortcut</span>
            </label>
          </div>

          {confirmMethod === 'shortcut' && (
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isSpanish ? 'Ctrl+Y = Sí | Ctrl+N = No' : 'Ctrl+Y = Yes | Ctrl+N = No'}
            </p>
          )}

          {confirmMethod === 'voice' && (
            <button
              onClick={handleVoiceConfirm}
              disabled={isListeningForVoice || isExecuting}
              className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                isListeningForVoice
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Mic2 className="w-4 h-4" />
              {isListeningForVoice ? (isSpanish ? 'Escuchando...' : 'Listening...') : (isSpanish ? 'Grabar "sí"' : 'Record "yes"')}
            </button>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={handleVisualConfirm}
            disabled={isExecuting}
            className="flex-1 px-4 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {isSpanish ? 'Ejecutando...' : 'Running...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isSpanish ? 'Ejecutar' : 'Run'}
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isExecuting}
            className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            {isSpanish ? 'Cancelar' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
