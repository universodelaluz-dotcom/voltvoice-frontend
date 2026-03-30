import { useState, useRef, useEffect } from 'react'
import { Mic2, Send, X, Volume2 } from 'lucide-react'
import inworldRealtimeService from '../services/inworldRealtimeService'
import chatStore from '../services/chatStore.js'

export default function BotInvoker({ darkMode = true, onClose, config }) {
  const [characters, setCharacters] = useState([])
  const [userVoices, setUserVoices] = useState([])
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [selectedRealtimeVoiceId, setSelectedRealtimeVoiceId] = useState('')
  const [inputMode, setInputMode] = useState('microphone')
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [response, setResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasVoiceResponse, setHasVoiceResponse] = useState(false)
  const [isPlayingResponse, setIsPlayingResponse] = useState(false)
  const [voiceLabel, setVoiceLabel] = useState('Clive')
  const [hasActiveResponse, setHasActiveResponse] = useState(false)

  const mediaStreamRef = useRef(null)
  const chatSuppressedRef = useRef(false)
  const responseTimeoutRef = useRef(null)
  const hasActiveResponseRef = useRef(false)
  const transcriptBufferRef = useRef('')
  const transcriptCompleteRef = useRef('')
  const transcriptDeltaTimerRef = useRef(null)
  const localAudioRef = useRef(null)
  const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

  const setChatSuppressed = (active) => {
    if (chatSuppressedRef.current === active) {
      return
    }

    chatSuppressedRef.current = active
    window.dispatchEvent(new CustomEvent('voltvoice:ptt-audio-state', {
      detail: { active }
    }))
  }

  const clearResponseTimeout = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }
  }

  const armResponseTimeout = () => {
    clearResponseTimeout()
    responseTimeoutRef.current = setTimeout(() => {
      if (hasActiveResponseRef.current) {
        return
      }
      console.warn('[Bot] Response timeout reached, restoring UI state')
      setIsLoading(false)
      setIsRecording(false)
      setChatSuppressed(false)
      setResponse((current) => current || 'La IA tardó demasiado en responder. Intenta de nuevo.')
    }, 35000)
  }

  const normalizeIntentText = (text) => {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  const resolveChatIntent = (text) => {
    const normalized = normalizeIntentText(text)

    const banMatch = normalized.match(/(?:bloque(?:a|ame|alo|ala|alos|alas|alo\s+a|en)|bane(?:a|ame|alo|ala|alos|alas|en)?|ban(?:ea|ear|eame)?|silencia|ignora|mutea|calla)\s+(?:a\s+)?@?([a-z0-9._\s-]+)/i)
    if (banMatch) {
      return { type: 'ban_user', username: banMatch[1] }
    }

    const unbanMatch = normalized.match(/(?:desbloque(?:a|ame|alo|ala)?|desban(?:ea|eame|ealo|eala)?|quita\s+ban|quita\s+el\s+ban|desmutea)\s+(?:a\s+)?@?([a-z0-9._\s-]+)/i)
    if (unbanMatch) {
      return { type: 'unban_user', username: unbanMatch[1] }
    }

    const nickMatch = normalized.match(/(?:ponle|cambia(?:le)?|asigna|dile\s+ahora)\s+(?:apodo|nickname)?\s*(?:a\s+)?@?([a-z0-9._\s-]+)\s+(?:por|a)\s+(.+)/i)
    if (nickMatch) {
      return { type: 'set_nickname', username: nickMatch[1], nickname: nickMatch[2].trim() }
    }

    const highlightMatch = normalized.match(/(?:remarca|remarcame|resalta|resaltame|destaca|destacame|marca|marcame|pon(?:lo|la)?\s+en\s+color|haz(?:lo|la)?\s+notar)\s+(?:a\s+)?@?([a-z0-9._\s-]+)/i)
    if (highlightMatch) {
      return { type: 'highlight_user', username: highlightMatch[1] }
    }

    const removeHighlightMatch = normalized.match(/(?:quita\s+resaltado|deja\s+de\s+resaltar|desmarca|quitale\s+el\s+color)\s+(?:a\s+)?@?([a-z0-9._\s-]+)/i)
    if (removeHighlightMatch) {
      return { type: 'remove_highlight', username: removeHighlightMatch[1] }
    }

    if ((normalized.includes('quien') || normalized.includes('quien es')) &&
        (normalized.includes('mas frecuente') || normalized.includes('comenta mas') || normalized.includes('mas activo'))) {
      return { type: 'get_active_users', minutes: 5 }
    }

    if (normalized.includes('usuarios activos') || normalized.includes('mas activos del chat')) {
      return { type: 'get_active_users', minutes: 5 }
    }

    if ((normalized.includes('comentador') || normalized.includes('comenta')) &&
        (normalized.includes('mas') || normalized.includes('frecuente') || normalized.includes('activo'))) {
      return { type: 'get_active_users', minutes: 5 }
    }

    if (normalized.includes('estadisticas del chat') || normalized.includes('stats del chat') || normalized.includes('resumen del chat')) {
      return { type: 'get_chat_stats' }
    }

    if (normalized.includes('preguntas del chat') || normalized.includes('que preguntas hay') || normalized.includes('quien esta preguntando')) {
      return { type: 'get_questions', count: 5 }
    }

    if (normalized.includes('lee el chat') || normalized.includes('que estan diciendo') || normalized.includes('leer chat')) {
      return { type: 'read_chat', count: 5 }
    }

    if ((normalized.includes('usuario') || normalized.includes('persona') || normalized.includes('quien')) &&
        (normalized.includes('simpatic') || normalized.includes('agradable') || normalized.includes('buena onda') || normalized.includes('lindo') || normalized.includes('linda'))) {
      return { type: 'nicest_user' }
    }

    if ((normalized.includes('usuario') || normalized.includes('persona') || normalized.includes('quien')) &&
        (normalized.includes('hater') || normalized.includes('mala vibra') || normalized.includes('toxico') || normalized.includes('grosero') || normalized.includes('pesado'))) {
      return { type: 'most_negative_user' }
    }

    if ((normalized.includes('usuario') || normalized.includes('persona') || normalized.includes('quien')) &&
        (normalized.includes('chistos') || normalized.includes('simpatico') || normalized.includes('gracioso') || normalized.includes('cotorreo'))) {
      return { type: 'funniest_user' }
    }

    return null
  }

  const resolveActionTarget = (rawReference) => {
    const resolution = chatStore.resolveUserReferenceDetailed(rawReference)
    if (!resolution.match) {
      return {
        ok: false,
        message: `No pude identificar con claridad a "${rawReference}" dentro del chat actual.`
      }
    }

    if (resolution.confidence === 'low' && resolution.candidates.length > 1) {
      const options = resolution.candidates.slice(0, 3).map((item) => item.nickname).join(', ')
      return {
        ok: false,
        message: `No estoy completamente seguro de quien es "${rawReference}". Mis mejores opciones son: ${options}.`
      }
    }

    return {
      ok: true,
      username: resolution.match.username,
      nickname: resolution.match.nickname,
      confidence: resolution.confidence
    }
  }

  const speakLocalResponse = async (text, voiceId) => {
    const response = await fetch(`${API_URL}/api/inworld/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voiceId: voiceId || selectedRealtimeVoiceId || 'Clive'
      })
    })

    const data = await response.json()
    if (!response.ok || !(data.audio || data.audioUrl)) {
      throw new Error(data?.error || 'No se pudo sintetizar audio local')
    }

    if (localAudioRef.current) {
      localAudioRef.current.pause()
      localAudioRef.current = null
    }

    const audio = new Audio(data.audio || data.audioUrl)
    localAudioRef.current = audio

    audio.onplay = () => {
      setHasVoiceResponse(true)
      setIsPlayingResponse(true)
      setIsLoading(false)
      clearResponseTimeout()
    }

    audio.onended = () => {
      setIsPlayingResponse(false)
      setChatSuppressed(false)
      localAudioRef.current = null
    }

    audio.onerror = () => {
      setIsPlayingResponse(false)
      setChatSuppressed(false)
      localAudioRef.current = null
    }

    await audio.play()
  }

  const executeLocalIntent = async (intent, originalText) => {
    switch (intent.type) {
      case 'ban_user': {
        const target = resolveActionTarget(intent.username)
        if (!target.ok) return target.message
        const result = await chatStore.banUser(target.username)
        return result.success
          ? `Listo, ya bloquee a ${result.nickname || target.nickname} del chat.`
          : result.message || `No pude bloquear a ${intent.username}.`
      }
      case 'unban_user': {
        const target = resolveActionTarget(intent.username)
        if (!target.ok) return target.message
        const result = await chatStore.unbanUser(target.username)
        return result.success
          ? `Listo, ya quite el bloqueo de ${result.nickname || target.nickname}.`
          : result.message || `No pude desbloquear a ${intent.username}.`
      }
      case 'set_nickname': {
        const target = resolveActionTarget(intent.username)
        if (!target.ok) return target.message
        const result = await chatStore.setNickname(target.username, intent.nickname)
        return result.success
          ? `Listo, ahora le dire ${intent.nickname} a ${result.nickname || target.nickname}.`
          : result.message || `No pude cambiar el apodo de ${intent.username}.`
      }
      case 'highlight_user': {
        const target = resolveActionTarget(intent.username)
        if (!target.ok) return target.message
        const result = chatStore.highlightUser(target.username, intent.color || '#06b6d4')
        return result.success
          ? `Listo, ya resalte a ${result.nickname || target.nickname}.`
          : result.message || `No pude resaltar a ${intent.username}.`
      }
      case 'remove_highlight': {
        const target = resolveActionTarget(intent.username)
        if (!target.ok) return target.message
        const result = chatStore.removeHighlight(target.username)
        return result.success
          ? `Listo, ya quite el resaltado de ${result.nickname || target.nickname}.`
          : result.message || `No pude quitar el resaltado de ${intent.username}.`
      }
      case 'get_active_users': {
        const users = chatStore.getActiveUsers(intent.minutes || 5)
        if (!users.length) {
          return 'No veo usuarios activos suficientes en el chat todavia.'
        }
        const topUser = users[0]
        return `La persona mas activa del chat en los ultimos ${intent.minutes || 5} minutos es ${topUser.user} con ${topUser.messageCount} mensajes.`
      }
      case 'get_chat_stats': {
        const stats = chatStore.getChatStats()
        return `Llevamos ${stats.totalMessages} mensajes totales, ${stats.recentMessages} recientes, ${stats.activeUsers} usuarios activos, ${stats.bannedCount} baneados y ${stats.highlightedCount} resaltados.`
      }
      case 'get_questions': {
        const questions = chatStore.getQuestions(intent.count || 5)
        if (!questions.length) {
          return 'No detecto preguntas recientes en el chat.'
        }
        const preview = questions.slice(0, 2).map((item) => `${item.user} pregunto: ${item.text}`).join(' ')
        return `Estas son las preguntas mas recientes. ${preview}`
      }
      case 'read_chat': {
        const msgs = chatStore.getRecentMessages(intent.count || 5)
        if (!msgs.length) {
          return 'Aun no tengo mensajes recientes del chat para leer.'
        }
        const preview = msgs.slice(-3).map((item) => `${item.user} dijo ${item.text}`).join('. ')
        return `En el chat reciente, ${preview}.`
      }
      case 'nicest_user': {
        const grounded = chatStore.findGroundedChatAnswer('nicest_user', { minutes: 10 })
        return grounded?.text || 'Todavia no tengo suficiente contexto real para decir quien se ve mas simpatico en el chat.'
      }
      case 'most_negative_user': {
        const grounded = chatStore.findGroundedChatAnswer('most_negative_user', { minutes: 10 })
        return grounded?.text || 'No veo suficiente mala vibra clara en el chat como para senalar a alguien con certeza.'
      }
      case 'funniest_user': {
        const grounded = chatStore.findGroundedChatAnswer('funniest_user', { minutes: 10 })
        return grounded?.text || 'Todavia no tengo suficiente contexto para decidir quien trae mas cotorreo en el chat.'
      }
      default:
        return originalText
    }
  }

  useEffect(() => {
    loadCharacters()
    loadUserVoices()
  }, [])

  useEffect(() => {
    const handleTextResponse = (data) => {
      if (data?.text) {
        setHasActiveResponse(true)
        hasActiveResponseRef.current = true
        setResponse(data.text)
        setIsLoading(false)
        clearResponseTimeout()
      }
    }

    const handleResponseCreated = () => {
      // Wait for real content (text/audio) before considering the response active.
      console.log('[Bot] Response created, waiting for actual content')
    }

    const handleInputTranscriptDelta = (data) => {
      if (!data?.text) {
        return
      }

      transcriptBufferRef.current += data.text
      if (transcriptDeltaTimerRef.current) {
        clearTimeout(transcriptDeltaTimerRef.current)
      }
      transcriptDeltaTimerRef.current = setTimeout(() => {
        transcriptCompleteRef.current = transcriptBufferRef.current.trim()
      }, 450)
    }

    const handleInputTranscriptComplete = (data) => {
      if (!data?.text) {
        return
      }

      transcriptCompleteRef.current = data.text
      transcriptBufferRef.current = data.text
      if (transcriptDeltaTimerRef.current) {
        clearTimeout(transcriptDeltaTimerRef.current)
        transcriptDeltaTimerRef.current = null
      }
    }

    const handleResponseComplete = () => {
      if (!hasActiveResponseRef.current) {
        setResponse((current) => current || 'La IA no devolvio contenido. Intenta de nuevo.')
      }
      setIsLoading(false)
      setIsRecording(false)
      setChatSuppressed(false)
      clearResponseTimeout()
    }

    const handleAudioStarted = () => {
      setHasActiveResponse(true)
      hasActiveResponseRef.current = true
      setHasVoiceResponse(true)
      setIsPlayingResponse(true)
      setIsLoading(false)
      clearResponseTimeout()
      setResponse((current) => current === 'La IA tardó demasiado en responder. Intenta de nuevo.' ? null : current)
    }

    const handleAudioComplete = () => {
      setIsPlayingResponse(false)
      setChatSuppressed(false)
      clearResponseTimeout()
    }

    const handleError = (error) => {
      console.error('Session error:', error)
      setResponse(`Error: ${error?.message || 'Unknown error'}`)
      setIsLoading(false)
      setIsRecording(false)
      setChatSuppressed(false)
      clearResponseTimeout()
    }

    inworldRealtimeService.on('text-response', handleTextResponse)
    inworldRealtimeService.on('response-created', handleResponseCreated)
    inworldRealtimeService.on('response-complete', handleResponseComplete)
    inworldRealtimeService.on('audio-started', handleAudioStarted)
    inworldRealtimeService.on('audio-complete', handleAudioComplete)
    inworldRealtimeService.on('input-transcript-delta', handleInputTranscriptDelta)
    inworldRealtimeService.on('input-transcript-complete', handleInputTranscriptComplete)
    inworldRealtimeService.on('error', handleError)

    return () => {
      inworldRealtimeService.off('text-response', handleTextResponse)
      inworldRealtimeService.off('response-created', handleResponseCreated)
      inworldRealtimeService.off('response-complete', handleResponseComplete)
      inworldRealtimeService.off('audio-started', handleAudioStarted)
      inworldRealtimeService.off('audio-complete', handleAudioComplete)
      inworldRealtimeService.off('input-transcript-delta', handleInputTranscriptDelta)
      inworldRealtimeService.off('input-transcript-complete', handleInputTranscriptComplete)
      inworldRealtimeService.off('error', handleError)
      if (localAudioRef.current) {
        localAudioRef.current.pause()
        localAudioRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      clearResponseTimeout()
      setChatSuppressed(false)
      if (transcriptDeltaTimerRef.current) {
        clearTimeout(transcriptDeltaTimerRef.current)
      }
      inworldRealtimeService.closeSession()
    }
  }, [])

  useEffect(() => {
    setResponse(null)
    setHasVoiceResponse(false)
    setIsPlayingResponse(false)
    setHasActiveResponse(false)
    hasActiveResponseRef.current = false
    const currentCharacter = characters.find((item) => item.id === selectedCharacterId)
    const resolvedVoice = resolveRealtimeVoice(currentCharacter) || ''
    setSelectedRealtimeVoiceId((current) => current || resolvedVoice)
    setVoiceLabel(resolvedVoice || 'Clive')
    clearResponseTimeout()
    setChatSuppressed(false)
    inworldRealtimeService.closeSession()
  }, [selectedCharacterId, characters, userVoices])

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
          const preferredCharacter = data.characters.find((character) => character.is_custom) || data.characters[0]
          setSelectedCharacterId(preferredCharacter.id)
        }
      }
    } catch (err) {
      console.error('Error loading characters:', err)
    }
  }

  const loadUserVoices = async () => {
    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/settings/voices`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUserVoices(data.voices || [])
        setVoicesLoaded(true)
      }
    } catch (err) {
      console.error('Error loading user voices:', err)
    } finally {
      setVoicesLoaded(true)
    }
  }

  const normalizeVoiceKey = (value) => {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toLowerCase()
  }

  const resolveRealtimeVoice = (character) => {
    if (character?.voice_id) {
      return character.voice_id
    }

    const characterKey = normalizeVoiceKey(character?.name)
    if (!characterKey) {
      return null
    }

    const normalizedVoices = userVoices.map((voice) => ({
      ...voice,
      normalizedName: normalizeVoiceKey(voice.voice_name)
    }))

    const matchedVoice = normalizedVoices.find((voice) => voice.normalizedName === characterKey) ||
      normalizedVoices.find((voice) => voice.normalizedName.includes(characterKey) || characterKey.includes(voice.normalizedName))

    if (matchedVoice) {
      console.log('[Bot] Resolved realtime voice from user library:', {
        character: character?.name,
        voiceName: matchedVoice.voice_name,
        voiceId: matchedVoice.voice_id
      })
    } else if (character?.id !== 'streamer_ai_example') {
      console.warn('[Bot] No realtime voice match found for character:', {
        character: character?.name,
        availableVoices: normalizedVoices.map((voice) => voice.voice_name)
      })
    }

    return matchedVoice?.voice_id || null
  }

  const getVoiceDisplayName = (voiceId) => {
    const matchedVoice = userVoices.find((voice) => voice.voice_id === voiceId)
    return matchedVoice?.voice_name || voiceId || 'Clive'
  }

  const ensureBotSession = async () => {
    if (!selectedCharacterId) {
      throw new Error('Selecciona un personaje')
    }

    const character = characters.find((item) => item.id === selectedCharacterId)
    if (!voicesLoaded) {
      await loadUserVoices()
    }

    const realtimeVoice = selectedRealtimeVoiceId || resolveRealtimeVoice(character)
    setVoiceLabel(getVoiceDisplayName(realtimeVoice || 'Clive'))
    console.log('[Bot] Using realtime voice:', realtimeVoice || 'Clive')

    const basePrompt = character?.system_prompt || ''
    const toolInstructions = `

IMPORTANT: You are the streamer's AI assistant with access to the TikTok live chat.
You have tools to: read chat messages, search chat, get questions from chat, ban/unban users, highlight users, set nicknames.
When the streamer asks about the chat, USE the tools to get real data. Do not make up chat messages.
When the streamer asks to ban someone, highlight someone, or change a nickname, USE the corresponding tool.
Always respond in Spanish unless told otherwise.
After using a tool, summarize the result conversationally.`

    await inworldRealtimeService.startSession(
      selectedCharacterId,
      basePrompt + toolInstructions,
      null,
      API_URL,
      realtimeVoice
    )

    await inworldRealtimeService.waitForDataChannel(5000)
  }

  const startRecording = async () => {
    try {
      setIsLoading(true)
      setResponse(null)
    setHasVoiceResponse(false)
    setHasActiveResponse(false)
    hasActiveResponseRef.current = false
    transcriptBufferRef.current = ''
    transcriptCompleteRef.current = ''
    if (transcriptDeltaTimerRef.current) {
      clearTimeout(transcriptDeltaTimerRef.current)
      transcriptDeltaTimerRef.current = null
    }
    setChatSuppressed(true)
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
      setChatSuppressed(false)
      alert('No se pudo iniciar el bot de voz')
    }
  }

  const stopRecording = async () => {
    try {
      if (!mediaStreamRef.current) {
        return
      }

      const stream = mediaStreamRef.current
      mediaStreamRef.current = null

      setIsRecording(false)
      setIsLoading(true)
      stream.getAudioTracks().forEach(track => track.stop())
      setTimeout(() => {
        inworldRealtimeService.removeAudioTracks().catch((error) => {
          console.error('Error removing audio tracks after speech capture:', error)
        })
      }, 300)

      await new Promise((resolve) => setTimeout(resolve, 650))
      const transcriptFromSpeech = (transcriptCompleteRef.current || transcriptBufferRef.current).trim()
      transcriptBufferRef.current = ''
      transcriptCompleteRef.current = ''
      if (transcriptDeltaTimerRef.current) {
        clearTimeout(transcriptDeltaTimerRef.current)
        transcriptDeltaTimerRef.current = null
      }

      if (!transcriptFromSpeech) {
        setIsLoading(false)
        setChatSuppressed(false)
        setResponse('No se detecto voz suficiente. Intenta hablar un poco mas claro o mantener presionado un poco mas.')
        return
      }

      const localIntent = resolveChatIntent(transcriptFromSpeech)
      if (localIntent) {
        clearResponseTimeout()
        const localResponse = await executeLocalIntent(localIntent, transcriptFromSpeech)
        setResponse(localResponse)
        setHasActiveResponse(true)
        hasActiveResponseRef.current = true
        setVoiceLabel(getVoiceDisplayName(selectedRealtimeVoiceId || resolveRealtimeVoice(characters.find((item) => item.id === selectedCharacterId)) || 'Clive'))
        armResponseTimeout()
        console.log('[Bot] Handling intent locally:', localIntent.type, localIntent)
        await speakLocalResponse(localResponse, selectedRealtimeVoiceId || resolveRealtimeVoice(characters.find((item) => item.id === selectedCharacterId)))
        return
      }

      armResponseTimeout()
      console.log('[Bot] Sending speech transcript as text:', transcriptFromSpeech)
      await inworldRealtimeService.sendMessage(transcriptFromSpeech)
      console.log('[Bot] Microphone deactivated, transcript sent as text')
    } catch (err) {
      console.error('Error stopping recording:', err)
      setIsLoading(false)
      setChatSuppressed(false)
    }
  }

  const invokeBot = async (text) => {
    if (!text.trim()) {
      return
    }

    setIsLoading(true)
    setResponse(null)
    setHasVoiceResponse(false)
    setHasActiveResponse(false)
    hasActiveResponseRef.current = false
    setChatSuppressed(true)
    armResponseTimeout()

    try {
      await ensureBotSession()
      await inworldRealtimeService.sendMessage(text.trim())
    } catch (err) {
      console.error('Error invoking bot:', err)
      clearResponseTimeout()
      setResponse(`Error: ${err.message}`)
      setIsLoading(false)
      setChatSuppressed(false)
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

      <select
        value={selectedRealtimeVoiceId}
        onChange={(e) => setSelectedRealtimeVoiceId(e.target.value)}
        className={`w-full p-2 rounded text-sm ${
          darkMode
            ? 'bg-[#0f0f23] border border-cyan-400/30 text-white'
            : 'bg-gray-50 border border-indigo-300 text-gray-900'
        }`}
      >
        <option value="">Usar voz resuelta automáticamente</option>
        {userVoices.map((voice) => (
          <option key={voice.id} value={voice.voice_id}>
            {voice.voice_name}
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
          <p className="mt-2 text-xs text-gray-400">Voz realtime: {voiceLabel}</p>

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
