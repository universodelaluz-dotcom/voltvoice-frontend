import { useState, useRef, useEffect } from 'react'
import { Mic2, Send, X, Volume2 } from 'lucide-react'
import inworldRealtimeService from '../services/inworldRealtimeService'
import AudioVisualizer from './AudioVisualizer'

export default function BotInvoker({ darkMode = true, onClose, tiktokUsername, config }) {
  const [characters, setCharacters] = useState([])
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [inputMode, setInputMode] = useState('microphone') // 'microphone' | 'text'
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [response, setResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [responseAudio, setResponseAudio] = useState(null)
  const [isPlayingResponse, setIsPlayingResponse] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const responseAudioRef = useRef(null)

  const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'
  const INWORLD_API_KEY = import.meta.env.VITE_INWORLD_API_KEY
  const INWORLD_WORKSPACE_ID = import.meta.env.VITE_INWORLD_WORKSPACE_ID

  // Load characters
  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/bot/characters`, {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        invokeBot(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('No se pudo acceder al micrófono')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const invokeBot = async (inputData) => {
    if (!selectedCharacterId) {
      alert('Selecciona un personaje')
      return
    }

    if (!INWORLD_API_KEY || !INWORLD_WORKSPACE_ID) {
      alert('Faltan credenciales de Inworld. Configura VITE_INWORLD_API_KEY y VITE_INWORLD_WORKSPACE_ID en .env')
      return
    }

    setIsLoading(true)
    setResponse(null)

    try {
      const character = characters.find(c => c.id === selectedCharacterId)

      // Start WebRTC session (API key fetched securely from backend)
      await inworldRealtimeService.startSession(
        selectedCharacterId,
        character?.system_prompt || '',
        INWORLD_WORKSPACE_ID,
        API_URL
      )

      // Wait for data channel to be ready
      await inworldRealtimeService.waitForDataChannel(5000)

      // Handle input based on type
      if (inputData instanceof Blob) {
        // Audio input - convert to base64 PCM
        const audioBase64 = await blobToBase64(inputData)
        await inworldRealtimeService.sendAudio(audioBase64)
        await inworldRealtimeService.commitAudio()
      } else if (typeof inputData === 'string') {
        // Text input
        await inworldRealtimeService.sendMessage(inputData)
      }

      // Listen for responses
      let responseText = ''

      inworldRealtimeService.on('text-response', (data) => {
        if (data.text) {
          responseText += data.text + ' '
          setResponse(responseText.trim())
        }
      })

      inworldRealtimeService.on('audio-complete', () => {
        console.log('Audio playback complete')
      })

      inworldRealtimeService.on('response-complete', () => {
        console.log('Response complete')
        setIsLoading(false)
      })

      inworldRealtimeService.on('error', (error) => {
        console.error('Session error:', error)
        setResponse('Error: ' + error?.message || 'Unknown error')
        setIsLoading(false)
      })

    } catch (err) {
      console.error('Error invoking bot:', err)
      setResponse('Error: ' + err.message)
      setIsLoading(false)
    }
  }

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return
    const textToSend = inputText
    setInputText('')
    await invokeBot(textToSend)
  }

  const playResponse = () => {
    if (responseAudioRef.current) {
      isPlayingResponse ? responseAudioRef.current.pause() : responseAudioRef.current.play()
    }
  }

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${
      darkMode
        ? 'bg-[#1a1a2e] border-cyan-400/30'
        : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>
          🎤 Llamar a Asistente
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-red-500/20 rounded transition-all"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Character Selector */}
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

      {/* Input Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setInputMode('microphone')}
          className={`flex-1 p-2 text-xs font-bold rounded transition-all ${
            inputMode === 'microphone'
              ? 'bg-cyan-500 text-white'
              : darkMode ? 'bg-[#0f0f23] text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          🎙️ Micrófono
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 p-2 text-xs font-bold rounded transition-all ${
            inputMode === 'text'
              ? 'bg-cyan-500 text-white'
              : darkMode ? 'bg-[#0f0f23] text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          💬 Texto
        </button>
      </div>

      {/* Microphone Input */}
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
          {isRecording ? 'GRABANDO...' : 'PUSH TO TALK'}
        </button>
      )}

      {/* Text Input */}
      {inputMode === 'text' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
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

      {/* Loading Indicator */}
      {isLoading && (
        <div className={`text-center text-sm ${darkMode ? 'text-cyan-400' : 'text-indigo-600'}`}>
          ⏳ Procesando...
        </div>
      )}

      {/* Response */}
      {response && (
        <div className={`rounded p-3 text-sm ${
          darkMode
            ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300'
            : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
        }`}>
          <p className="font-bold mb-2">Respuesta del Bot:</p>
          <p>{response}</p>

          {responseAudio && (
            <div className="mt-3 flex items-center gap-2">
              <audio
                ref={responseAudioRef}
                src={responseAudio}
                onPlay={() => setIsPlayingResponse(true)}
                onPause={() => setIsPlayingResponse(false)}
                className="hidden"
              />
              <button
                onClick={playResponse}
                className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full hover:shadow-lg text-white transition-all"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400">Escuchar respuesta</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
