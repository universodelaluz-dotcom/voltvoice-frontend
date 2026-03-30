import { useState, useRef, useEffect } from 'react'
import { Mic2, Send, X, Volume2 } from 'lucide-react'
import inworldRealtimeService from '../services/inworldRealtimeService'

export default function BotInvoker({ darkMode = true, onClose }) {
  const [characters, setCharacters] = useState([])
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [inputMode, setInputMode] = useState('microphone')
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [response, setResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasVoiceResponse, setHasVoiceResponse] = useState(false)
  const [isPlayingResponse, setIsPlayingResponse] = useState(false)

  const mediaStreamRef = useRef(null)
  const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

  useEffect(() => {
    loadCharacters()
  }, [])

  useEffect(() => {
    const handleTextResponse = (data) => {
      if (data?.text) {
        setResponse(data.text)
      }
    }

    const handleResponseComplete = () => {
      setIsLoading(false)
      setIsRecording(false)
    }

    const handleAudioStarted = () => {
      setHasVoiceResponse(true)
      setIsPlayingResponse(true)
    }

    const handleAudioComplete = () => {
      setIsPlayingResponse(false)
    }

    const handleError = (error) => {
      console.error('Session error:', error)
      setResponse(`Error: ${error?.message || 'Unknown error'}`)
      setIsLoading(false)
      setIsRecording(false)
    }

    inworldRealtimeService.on('text-response', handleTextResponse)
    inworldRealtimeService.on('response-complete', handleResponseComplete)
    inworldRealtimeService.on('audio-started', handleAudioStarted)
    inworldRealtimeService.on('audio-complete', handleAudioComplete)
    inworldRealtimeService.on('error', handleError)

    return () => {
      inworldRealtimeService.off('text-response', handleTextResponse)
      inworldRealtimeService.off('response-complete', handleResponseComplete)
      inworldRealtimeService.off('audio-started', handleAudioStarted)
      inworldRealtimeService.off('audio-complete', handleAudioComplete)
      inworldRealtimeService.off('error', handleError)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      inworldRealtimeService.closeSession()
    }
  }, [])

  useEffect(() => {
    setResponse(null)
    setHasVoiceResponse(false)
    setIsPlayingResponse(false)
    inworldRealtimeService.closeSession()
  }, [selectedCharacterId])

  const loadCharacters = async () => {
    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/bot/characters`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setCharacters(data.characters)
        if (data.characters.length > 0) {
          setSelectedCharacterId(data.characters[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading characters:', err)
    }
  }

  const ensureBotSession = async () => {
    if (!selectedCharacterId) {
      throw new Error('Selecciona un personaje')
    }

    const character = characters.find((item) => item.id === selectedCharacterId)

    await inworldRealtimeService.startSession(
      selectedCharacterId,
      character?.system_prompt || '',
      null,
      API_URL
    )

    await inworldRealtimeService.waitForDataChannel(5000)
  }

  const startRecording = async () => {
    try {
      setIsLoading(true)
      setResponse(null)
      setHasVoiceResponse(false)
      await ensureBotSession()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      inworldRealtimeService.addAudioTracks(stream)

      setIsRecording(true)
      setIsLoading(false)
      console.log('[Bot] Microphone activated')
    } catch (err) {
      console.error('Error starting push-to-talk:', err)
      setIsLoading(false)
      alert('No se pudo iniciar el bot de voz')
    }
  }

  const stopRecording = async () => {
    try {
      if (!mediaStreamRef.current) {
        return
      }

      mediaStreamRef.current.getAudioTracks().forEach(track => track.stop())
      mediaStreamRef.current = null

      await inworldRealtimeService.removeAudioTracks()
      setIsRecording(false)
      setIsLoading(true)
      await inworldRealtimeService.requestResponse()
      console.log('[Bot] Microphone deactivated, requesting response')
    } catch (err) {
      console.error('Error stopping recording:', err)
      setIsLoading(false)
    }
  }

  const invokeBot = async (text) => {
    if (!text.trim()) {
      return
    }

    setIsLoading(true)
    setResponse(null)
    setHasVoiceResponse(false)

    try {
      await ensureBotSession()
      await inworldRealtimeService.sendMessage(text.trim())
    } catch (err) {
      console.error('Error invoking bot:', err)
      setResponse(`Error: ${err.message}`)
      setIsLoading(false)
    }
  }

  const handleTextSubmit = async () => {
    const textToSend = inputText
    setInputText('')
    await invokeBot(textToSend)
  }

  const handleRetryAudio = async () => {
    try {
      await inworldRealtimeService.resumeOutputAudio()
    } catch (err) {
      console.error('Error resuming audio:', err)
    }
  }

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${
      darkMode
        ? 'bg-[#1a1a2e] border-cyan-400/30'
        : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>
          Llamar a Asistente
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-red-500/20 rounded transition-all"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      </div>

      <select
        value={selectedCharacterId || ''}
        onChange={(e) => setSelectedCharacterId(e.target.value)}
        className={`w-full p-2 rounded text-sm ${
          darkMode
            ? 'bg-[#0f0f23] border border-cyan-400/30 text-white'
            : 'bg-gray-50 border border-indigo-300 text-gray-900'
        }`}
      >
        <option value="">Selecciona personaje...</option>
        {characters.map(char => (
          <option key={char.id} value={char.id}>
            {char.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={() => setInputMode('microphone')}
          className={`flex-1 p-2 text-xs font-bold rounded transition-all ${
            inputMode === 'microphone'
              ? 'bg-cyan-500 text-white'
              : darkMode ? 'bg-[#0f0f23] text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Micrófono
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 p-2 text-xs font-bold rounded transition-all ${
            inputMode === 'text'
              ? 'bg-cyan-500 text-white'
              : darkMode ? 'bg-[#0f0f23] text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Texto
        </button>
      </div>

      {inputMode === 'microphone' && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`w-full p-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg text-white disabled:opacity-50'
          }`}
        >
          <Mic2 className="w-5 h-5" />
          {isRecording ? 'SOLTAR PARA ENVIAR' : 'PUSH TO TALK'}
        </button>
      )}

      {inputMode === 'text' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder="Escribe un mensaje..."
            className={`flex-1 p-2 rounded text-sm ${
              darkMode
                ? 'bg-[#0f0f23] border border-cyan-400/30 text-white placeholder-gray-600'
                : 'bg-gray-50 border border-indigo-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          <button
            onClick={handleTextSubmit}
            disabled={isLoading || !inputText.trim()}
            className="p-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {isLoading && (
        <div className={`text-center text-sm ${darkMode ? 'text-cyan-400' : 'text-indigo-600'}`}>
          Procesando...
        </div>
      )}

      {response && (
        <div className={`rounded p-3 text-sm ${
          darkMode
            ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300'
            : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
        }`}>
          <p className="font-bold mb-2">Respuesta del Bot:</p>
          <p>{response}</p>

          {hasVoiceResponse && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleRetryAudio}
                className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full hover:shadow-lg text-white transition-all"
                title="Reintentar audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400">
                {isPlayingResponse ? 'La respuesta de voz se está reproduciendo' : 'Si no se oyó, toca este botón para reactivar el audio'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
