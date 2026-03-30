import { useState, useEffect, useRef } from 'react'
import { Loader, Mic2, Send, Volume2, AlertCircle } from 'lucide-react'
import AudioVisualizer from './AudioVisualizer'
import { inworldRealtimeService } from '../services/inworldRealtimeService'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function BotPanel({ tiktokUsername, darkMode = true }) {
  const [characters, setCharacters] = useState([])
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [inputMode, setInputMode] = useState('text') // 'text' or 'microphone'
  const [question, setQuestion] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isInvoking, setIsInvoking] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [responseMode, setResponseMode] = useState('audio') // 'audio', 'text', 'both'
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioPlayerRef = useRef(null)

  // Cargar personajes
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const token = localStorage.getItem('sv-token')
        if (!token) return

        const res = await fetch(`${API_URL}/api/bot/characters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (data.success) {
          setCharacters(data.characters)
          if (data.characters.length > 0) {
            setSelectedCharacter(data.characters[0])
          }
        }
      } catch (err) {
        console.error('[BotPanel] Error loading characters:', err)
      }
    }

    loadCharacters()
  }, [])

  // Leer configuración de response mode
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const token = localStorage.getItem('sv-token')
        if (!token) return

        const res = await fetch(`${API_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (data.config && data.config.bot_response_mode) {
          setResponseMode(data.config.bot_response_mode)
        }
      } catch (err) {
        console.error('[BotPanel] Error loading config:', err)
      }
    }

    loadConfig()
  }, [])

  // Iniciar/detener grabación
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const reader = new FileReader()
        reader.onload = (e) => {
          // El audio está en base64, lo enviamos
          const base64Audio = e.target.result.split(',')[1]
          setQuestion(base64Audio) // Guardar como base64
        }
        reader.readAsDataURL(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('[BotPanel] Error starting recording:', err)
      alert('No se pudo acceder al micrófono')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Invocar personaje con Inworld Realtime API
  const handleInvoke = async () => {
    if (!selectedCharacter || !question.trim()) {
      alert('Selecciona un personaje y escribe una pregunta')
      return
    }

    if (!tiktokUsername) {
      alert('No hay stream conectado')
      return
    }

    setIsInvoking(true)
    setError(null)
    setResponse(null)
    setAudioUrl(null)

    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/bot/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          tiktok_username: tiktokUsername,
          question: question.trim(),
          responseMode: responseMode
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Error en API de backend')
      }

      const invokeData = data.invoke

      // Iniciar sesión con Inworld
      console.log('[BotPanel] Starting Inworld session...')
      const sessionId = await inworldRealtimeService.startSession(
        invokeData.character_id,
        invokeData.system_prompt,
        null,
        API_URL
      )

      // Escuchar eventos de Inworld
      const handleInworldResponse = (e) => {
        setResponse({
          character: invokeData.character_name,
          question: invokeData.user_question,
          response: e.detail.text,
          type: e.detail.type
        })
      }

      const handleAudioComplete = () => {
        console.log('[BotPanel] Audio playback complete')
      }

      window.addEventListener('inworld-response', handleInworldResponse)
      window.addEventListener('inworld-audio-complete', handleAudioComplete)

      // Esperar a que Inworld esté listo
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Enviar mensaje a Inworld
      if (responseMode !== 'audio' && inputMode === 'microphone') {
        // Si es micrófono, enviar audio
        inworldRealtimeService.sendAudio(question)
      } else {
        // Si es texto, enviar como texto
        inworldRealtimeService.sendMessage(question.trim())
      }

      // Limpiar input
      setQuestion('')

      // Cleanup listeners después
      setTimeout(() => {
        window.removeEventListener('inworld-response', handleInworldResponse)
        window.removeEventListener('inworld-audio-complete', handleAudioComplete)
      }, 30000) // Limpiar después de 30s

    } catch (err) {
      console.error('[BotPanel] Error invoking character:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setIsInvoking(false)
    }
  }

  // Reproducir/pausar audio
  const handlePlayPause = () => {
    if (!audioPlayerRef.current || !audioUrl) return

    if (isPlaying) {
      audioPlayerRef.current.pause()
      setIsPlaying(false)
    } else {
      audioPlayerRef.current.play()
      setIsPlaying(true)
    }
  }

  // Listener para cuando termina el audio
  useEffect(() => {
    if (!audioPlayerRef.current) return

    const handleEnded = () => setIsPlaying(false)
    const audio = audioPlayerRef.current

    if (audioUrl) {
      audio.src = audioUrl
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [audioUrl])

  return (
    <div className={`rounded-lg p-6 space-y-4 ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        🤖 Invocar Personaje
      </h2>

      {/* Errores */}
      {error && (
        <div className={`p-4 rounded-lg flex gap-3 ${darkMode ? 'bg-red-500/30 border-2 border-red-400' : 'bg-red-100 border-2 border-red-300'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-300' : 'text-red-600'}`} />
          <p className={darkMode ? 'text-red-50' : 'text-red-700'}>{error}</p>
        </div>
      )}

      {/* Selector de personaje */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Selecciona personaje:
        </label>
        <select
          value={selectedCharacter?.id || ''}
          onChange={(e) => {
            const char = characters.find(c => c.id === e.target.value)
            setSelectedCharacter(char)
          }}
          className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
        >
          {characters.map(char => (
            <option key={char.id} value={char.id}>
              {char.name} {char.is_custom ? '✓' : '(ejemplo)'}
            </option>
          ))}
        </select>
      </div>

      {/* Modo de input */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="text"
            checked={inputMode === 'text'}
            onChange={(e) => setInputMode(e.target.value)}
            className="w-4 h-4"
          />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Texto</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="microphone"
            checked={inputMode === 'microphone'}
            onChange={(e) => setInputMode(e.target.value)}
            className="w-4 h-4"
          />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Micrófono</span>
        </label>
      </div>

      {/* Input de pregunta */}
      {inputMode === 'text' && (
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="¿Qué pregunta quieres hacer al personaje?"
          className={`w-full px-4 py-3 rounded-lg resize-none h-24 ${darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300'} border`}
        />
      )}

      {/* Grabación de micrófono */}
      {inputMode === 'microphone' && (
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Mic2 className="w-5 h-5" />
          {isRecording ? 'Detener grabación' : 'Iniciar grabación'}
        </button>
      )}

      {/* Botón invocar */}
      <button
        onClick={handleInvoke}
        disabled={isInvoking || !selectedCharacter || !question.trim()}
        className="w-full px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white flex items-center justify-center gap-2"
      >
        {isInvoking ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Invocando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Invocar {selectedCharacter?.name}
          </>
        )}
      </button>

      {/* Visualizador de audio */}
      {audioUrl && (
        <div className="space-y-3">
          <AudioVisualizer
            audioUrl={audioUrl}
            isPlaying={isPlaying}
            darkMode={darkMode}
          />
          <div className="flex gap-2 items-center justify-between">
            <button
              onClick={handlePlayPause}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </button>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedCharacter?.name} respondió
            </span>
          </div>
        </div>
      )}

      {/* Mostrar respuesta */}
      {response && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-100 border border-gray-300'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>{response.character}:</strong> {response.question}
          </p>
        </div>
      )}

      {/* Player de audio hidden */}
      <audio ref={audioPlayerRef} />
    </div>
  )
}
