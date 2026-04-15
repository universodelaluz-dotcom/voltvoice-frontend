import { useState, useRef, useEffect } from 'react'
import { Mic2, Send, Volume2, Lock } from 'lucide-react'
import inworldRealtimeService from '../services/inworldRealtimeService'
import chatStore from '../services/chatStore.js'
import { useTranslation } from 'react-i18next'

const BUILTIN_VOICE_OPTIONS = [
  { id: 'Diego', name: 'Diego' },
  { id: 'Lupita', name: 'Lupita' },
  { id: 'Miguel', name: 'Miguel' },
  { id: 'Rafael', name: 'Rafael' }
]

const CONFIG_COMMANDS = [
  {
    key: 'smartChatEnabled',
    label: 'filtro inteligente',
    aliases: [
      'chat inteligente',
      'smart chat',
      'modo inteligente del chat',
      'filtro inteligente del chat'
    ]
  },
  {
    key: 'onlyModerators',
    label: 'leer solo moderadores',
    aliases: [
      'leer solo moderadores',
      'solo moderadores',
      'solo mods',
      'solo moderadores del live',
      'nada mas moderadores',
      'solamente moderadores'
    ]
  },
  {
    key: 'onlyDonors',
    label: 'leer solo donadores',
    aliases: [
      'leer solo donadores',
      'solo donadores',
      'solo regalos',
      'solo gifters',
      'solo quienes donan',
      'nada mas donadores'
    ]
  },
  {
    key: 'onlyQuestions',
    label: 'leer solo preguntas',
    aliases: [
      'leer solo preguntas',
      'solo preguntas',
      'solo mensajes con pregunta',
      'solo las preguntas',
      'filtra preguntas'
    ]
  },
  {
    key: 'readOnlyMessage',
    label: 'leer solo mensajes sin nombre',
    aliases: [
      'leer solo mensajes',
      'sin nombre',
      'sin mencionar nombre',
      'solo el mensaje',
      'omite el nombre',
      'no leas el nombre'
    ]
  },
  {
    key: 'skipRepeated',
    label: 'saltar mensajes repetidos',
    aliases: [
      'saltar mensajes repetidos',
      'ignora repetidos',
      'omite repetidos',
      'quita repetidos',
      'filtro de repetidos'
    ]
  },
  {
    key: 'ignoreLinks',
    label: 'ignorar links',
    aliases: [
      'ignorar links',
      'ignora links',
      'ignora enlaces',
      'no leer links',
      'no leer enlaces',
      'bloquea links'
    ]
  },
  {
    key: 'profanityFilterEnabled',
    label: 'filtro de palabrotas',
    aliases: [
      'filtro de palabrotas',
      'filtro anti groserias',
      'filtro anti groserias',
      'bloquear malas palabras',
      'bloquear groserias',
      'bloquear groserias'
    ]
  },
  {
    key: 'onlyPlainNicks',
    label: 'solo nicks simples',
    aliases: [
      'limpiar nicks',
      'solo nicks simples',
      'solo nombres simples',
      'sin caracteres raros',
      'solo nombres limpios',
      'filtra nicks raros',
      'limpia nicknames'
    ]
  },
  {
    key: 'stripChatEmojis',
    label: 'no leer emojis en chat',
    aliases: [
      'no leer emojis en chat',
      'quita emojis del chat',
      'sin emojis en chat',
      'no leas emojis',
      'elimina emojis del chat'
    ]
  },
  {
    key: 'ignoreExcessiveEmojis',
    label: 'ignorar emojis excesivos',
    aliases: [
      'ignorar emojis excesivos',
      'ignora emojis',
      'filtra emojis',
      'no leas muchos emojis',
      'quita emojis excesivos'
    ]
  },
  {
    key: 'announceFollowers',
    label: 'anunciar follows',
    aliases: [
      'anunciar follows',
      'leer follows',
      'avisar seguidores',
      'anunciar seguidores',
      'notificar follows'
    ]
  },
  {
    key: 'announceGifts',
    label: 'anunciar regalos',
    aliases: [
      'anunciar regalos',
      'leer regalos',
      'avisar regalos',
      'notificar regalos',
      'anunciar gifts'
    ]
  },
  {
    key: 'announceViewers',
    label: 'anunciar viewers',
    aliases: [
      'anunciar viewers',
      'anunciar espectadores',
      'avisar viewers',
      'leer viewers'
    ]
  },
  {
    key: 'announceLikes',
    label: 'anunciar likes',
    aliases: [
      'anunciar likes',
      'leer likes',
      'avisar likes',
      'notificar likes'
    ]
  },
  {
    key: 'announceShares',
    label: 'anunciar shares',
    aliases: [
      'anunciar shares',
      'anunciar compartidos',
      'leer shares',
      'avisar shares'
    ]
  },
  {
    key: 'announceBattles',
    label: 'anunciar battles',
    aliases: [
      'anunciar battles',
      'anunciar batallas',
      'leer battles',
      'avisar batallas'
    ]
  },
  {
    key: 'announcePolls',
    label: 'anunciar polls',
    aliases: [
      'anunciar polls',
      'anunciar encuestas',
      'leer encuestas',
      'avisar encuestas'
    ]
  },
  {
    key: 'announceGoals',
    label: 'anunciar goals',
    aliases: [
      'anunciar goals',
      'anunciar metas',
      'leer metas',
      'avisar metas'
    ]
  },
  {
    key: 'bot_auto_spam_check',
    label: 'chequeos automaticos de spam',
    aliases: [
      'chequeos automaticos de spam',
      'revision automatica de spam',
      'detector automatico de spam',
      'spam automatico'
    ]
  },
  {
    key: 'botShortcutEnabled',
    label: 'push to talk',
    aliases: [
      'push to talk',
      'shortcut de teclado',
      'atajo del bot',
      'tecla del bot',
      'ptt'
    ]
  }
]

export default function BotInvoker({ user, onGoPricingPage, darkMode = true, onClose, config, updateConfig }) {
  const { t } = useTranslation()
  const [characters, setCharacters] = useState([])
  const [userVoices, setUserVoices] = useState([])
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState(() => config?.botAssistantCharacterId || null)
  const [selectedRealtimeVoiceId, setSelectedRealtimeVoiceId] = useState(() => config?.botAssistantVoiceId || '')
  const [inputMode, setInputMode] = useState('microphone')
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [response, setResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasVoiceResponse, setHasVoiceResponse] = useState(false)
  const [isPlayingResponse, setIsPlayingResponse] = useState(false)
  const [assistantVisualActive, setAssistantVisualActive] = useState(false)
  const [assistantAudioElement, setAssistantAudioElement] = useState(null)
  const [voiceLabel, setVoiceLabel] = useState('Clive')
  const [hasActiveResponse, setHasActiveResponse] = useState(false)
  const [lastUsedClonedVoice, setLastUsedClonedVoice] = useState(null)

  const mediaStreamRef = useRef(null)
  const sessionRecoveryRef = useRef({ isRecovering: false, recoveryStartTime: null })
  const chatSuppressedRef = useRef(false)
  const responseTimeoutRef = useRef(null)
  const hasActiveResponseRef = useRef(false)
  const shortcutFnRef = useRef({}) // refs to latest recording fns for shortcut handler
  const f8FnRef = useRef({}) // refs to latest f8 fns/state to avoid stale voice/session closures
  const hasVoiceResponseRef = useRef(false)
  const responsePlaybackStartedRef = useRef(false)
  const transcriptBufferRef = useRef('')
  const transcriptCompleteRef = useRef('')
  const transcriptDeltaTimerRef = useRef(null)
  const acceptTranscriptRef = useRef(false)
  const localAudioRef = useRef(null)
  const latestResponseTextRef = useRef('')
  const hasChargedCurrentResponseRef = useRef(false)
  const selectedCharacterIdRef = useRef(config?.botAssistantCharacterId || null)
  const selectedRealtimeVoiceIdRef = useRef(config?.botAssistantVoiceId || '')
  const voiceLabelRef = useRef('Clive')
  const sessionBrokenRef = useRef(false)
  const isRecordingRef = useRef(false)
  const autopilotBusyRef = useRef(false)
  const lastAutopilotSignatureRef = useRef('')
  const lastAutopilotTextRef = useRef('')
  const autopilotRecentTextsRef = useRef([])
  const autopilotIntentCooldownRef = useRef({})
  const autopilotRecentIntentTypesRef = useRef([])
  const skipCurrentResponseRef = useRef(false)
  const assistantResponseActiveRef = useRef(false)
  const assistantResponseHadAudioRef = useRef(false)
  const responseCompletedRef = useRef(false)
  const botIsAudiblySpeakingRef = useRef(false)
  const heardSpeechThisTurnRef = useRef(false)
  const lastRmsRef = useRef(0)
  const assistantAudioTransmissionCompleteRef = useRef(false)
  const inactivityTimerRef = useRef(null)
  const INACTIVITY_TIMEOUT_MS = 4500 // 4.5 seconds of silence = unlock chat (prevents solapamiento on long responses with pauses)

  // Bot response threshold tracking
  const lastBotResponseTimestampRef = useRef(null)  // When bot last responded (timestamp)
  const messagesCountSinceLastResponseRef = useRef(0)  // How many messages since last response

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'
const FREE_LOCAL_LIMIT_CODE = 'FREE_LOCAL_VOICE_DAILY_LIMIT_REACHED'
const formatResetWait = (seconds = 0) => {
  const safe = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.ceil((safe % 3600) / 60)
  if (hours <= 0) return `${Math.max(1, minutes)} min`
  return `${hours}h ${Math.max(0, minutes)}m`
}

  const emitAssistantVisualizerState = (active) => {
    window.dispatchEvent(new CustomEvent('voltvoice:assistant-visualizer', {
      detail: { active: Boolean(active) }
    }))
  }

  const emitAssistantVisualizerAudio = (audioElement) => {
    window.dispatchEvent(new CustomEvent('voltvoice:assistant-visualizer-audio', {
      detail: { audioElement: audioElement || null }
    }))
  }

  const emitVisualizerKick = (level = 0.5) => {
    window.dispatchEvent(new CustomEvent('voltvoice:visualizer-kick', {
      detail: { level: Math.max(0, Math.min(1, Number(level) || 0.5)) }
    }))
  }

  const bindRealtimeAudioToVisualizer = () => {
    if (localAudioRef.current) {
      setAssistantAudioElement(localAudioRef.current)
      emitAssistantVisualizerAudio(localAudioRef.current)
      return
    }

    const realtimeAudio =
      (typeof inworldRealtimeService.getOutputAudioElement === 'function'
        ? inworldRealtimeService.getOutputAudioElement()
        : null) || inworldRealtimeService.outputAudioElement || null
    if (realtimeAudio) {
      setAssistantAudioElement(realtimeAudio)
      emitAssistantVisualizerAudio(realtimeAudio)
    }
  }

  const getAssistantMaxResponseChars = () => {
    const configured = Number(config?.botAssistantMaxResponseChars)
    if (!Number.isFinite(configured)) return 250
    return Math.min(500, Math.max(50, Math.round(configured)))
  }

  const getAssistantVoiceSpeed = () => {
    const configured = Number(config?.botAssistantVoiceSpeed)
    if (!Number.isFinite(configured)) return 1
    return Math.min(2, Math.max(0.5, configured))
  }

  const applyAssistantLengthLimit = (text = '') => {
    const raw = String(text || '').trim()
    const maxChars = getAssistantMaxResponseChars()
    if (!raw || raw.length <= maxChars) return raw
    return `${raw.slice(0, maxChars).trimEnd()}...`
  }

  const getAssistantSetupError = () => {
    const hasCharacter = Boolean(selectedCharacterIdRef.current)
    const hasVoice = Boolean(selectedRealtimeVoiceIdRef.current)
    if (hasCharacter && hasVoice) return null
    if (!hasCharacter && !hasVoice) return t('bot.errors.setup')
    if (!hasCharacter) return t('bot.errors.noCharacter')
    return t('bot.errors.noVoice')
  }

  const ensureAssistantReady = () => {
    const setupError = getAssistantSetupError()
    if (!setupError) return true
    clearResponseTimeout()
    setIsLoading(false)
    setIsRecording(false)
    setPttSuppressed(false)
    unlockChatSuppression()
    setResponse(`${setupError} ${t('bot.note')}`)
    return false
  }

  const beginAssistantResponseWindow = () => {
    console.log('[Bot] beginAssistantResponseWindow: CALLED - resetting state for new response')
    // Importante: no activar visualizador durante push-to-talk/espera.
    // Se activa únicamente cuando empieza audio real de respuesta.
    setAssistantVisualActive(false)
    emitAssistantVisualizerState(false)
    assistantResponseActiveRef.current = true
    assistantResponseHadAudioRef.current = false
    heardSpeechThisTurnRef.current = false
    lastRmsRef.current = 0
    assistantAudioTransmissionCompleteRef.current = false
    responsePlaybackStartedRef.current = false // Reset for new response - on persistent connection, track doesn't unmute again
    console.log('[Bot] beginAssistantResponseWindow: responsePlaybackStartedRef reset to false')
    // Clear any pending inactivity timer from previous response
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }

  const endAssistantResponseWindow = () => {
    setAssistantVisualActive(false)
    emitAssistantVisualizerState(false)
    assistantResponseActiveRef.current = false
    assistantResponseHadAudioRef.current = false
    heardSpeechThisTurnRef.current = false
    lastRmsRef.current = 0
  }

  const setChatSuppressed = (active) => {
    if (chatSuppressedRef.current === active) {
      return
    }

    chatSuppressedRef.current = active
    console.log(`[Bot] setChatSuppressed(${active}) - dispatching voltvoice:assistant-speech-state`)
    window.dispatchEvent(new CustomEvent('voltvoice:assistant-speech-state', {
      detail: { active }
    }))
  }

  const setPttSuppressed = (active) => {
    window.dispatchEvent(new CustomEvent('voltvoice:ptt-audio-state', {
      detail: { active }
    }))
  }

  const lockChatSuppression = () => {
    setChatSuppressed(true)
  }

  const unlockChatSuppression = () => {
    setChatSuppressed(false)
  }

  const suppressChatAudio = () => {
    console.log('[Bot] suppressChatAudio() called')
    lockChatSuppression()
    dispatchChatPlaybackControl('pause')
  }

  const restoreChatAudioImmediate = () => {
    // Don't end response window here - let RMS detection do it
    // endAssistantResponseWindow() should only be called when RMS confirms audio has truly ended
    console.log('[Bot] restoreChatAudioImmediate() called')
    unlockChatSuppression()
    dispatchChatPlaybackControl('resume')
  }

  const tryRestoreChatAudio = () => {
    const guard1 = !responseCompletedRef.current
    const guard2 = assistantResponseHadAudioRef.current && !heardSpeechThisTurnRef.current
    const guard3 = botIsAudiblySpeakingRef.current

    console.log('[Bot] tryRestoreChatAudio: guard1(responseComplete)=', !guard1, 'guard2(hadAudio&&!heardSpeech)=', guard2, 'guard3(botSpeaking)=', guard3)

    if (guard1) {
      console.log('[Bot] tryRestoreChatAudio BLOCKED: response not completed')
      return
    }
    if (guard2) {
      console.log('[Bot] tryRestoreChatAudio BLOCKED: had audio but no speech heard')
      return
    }
    if (guard3) {
      console.log('[Bot] tryRestoreChatAudio BLOCKED: bot still audibly speaking')
      return
    }
    console.log('[Bot] tryRestoreChatAudio: ALL GUARDS PASSED - calling restoreChatAudioImmediate()')
    restoreChatAudioImmediate()
  }

  const dispatchChatPlaybackControl = (action) => {
    if (typeof window === 'undefined') {
      return
    }
    const normalizedAction = String(action || '').toLowerCase()
    if (normalizedAction !== 'pause' && normalizedAction !== 'resume') {
      return
    }
    window.dispatchEvent(new CustomEvent('voltvoice:chat-playback-control', {
      detail: { action: normalizedAction }
    }))
  }

  const markSessionBroken = () => {
    if (sessionBrokenRef.current) return
    sessionBrokenRef.current = true
    inworldRealtimeService.closeSession()
  }

  const clearResponseTimeout = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
      responseTimeoutRef.current = null
    }
  }

  const resetTranscriptCapture = ({ accept = false } = {}) => {
    transcriptBufferRef.current = ''
    transcriptCompleteRef.current = ''
    acceptTranscriptRef.current = accept
    if (transcriptDeltaTimerRef.current) {
      clearTimeout(transcriptDeltaTimerRef.current)
      transcriptDeltaTimerRef.current = null
    }
  }

  const waitForTranscriptCapture = async (timeoutMs = 2200) => {
    const startedAt = Date.now()
    while (Date.now() - startedAt < timeoutMs) {
      const value = (transcriptCompleteRef.current || transcriptBufferRef.current || '').trim()
      if (value) {
        return value
      }
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
    return (transcriptCompleteRef.current || transcriptBufferRef.current || '').trim()
  }

  const dispatchTokenUsageUpdate = ({ tokensUsed, remainingTokens }) => {
    if (!Number.isFinite(tokensUsed) || !Number.isFinite(remainingTokens)) {
      return
    }

    const savedUser = localStorage.getItem('sv-user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        localStorage.setItem('sv-user', JSON.stringify({ ...userData, tokens: remainingTokens }))
      } catch (error) {
        console.warn('[Bot] Could not update cached token balance:', error.message)
      }
    }

    window.dispatchEvent(new CustomEvent('voltvoice:tokens-updated', {
      detail: {
        source: 'ptt',
        tokensUsed,
        remainingTokens
      }
    }))
  }

  const reportRealtimeUsage = async (text, voiceId) => {
    const token = sessionStorage.getItem('sv-token')
    if (!token || !text?.trim()) {
      return
    }

    const response = await fetch(`${API_URL}/api/inworld/realtime-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        text,
        voiceId: voiceId || selectedRealtimeVoiceIdRef.current || voiceLabelRef.current || 'Clive'
      })
    })

    const data = await response.json()
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || 'No se pudo registrar uso de push-to-talk')
    }

    dispatchTokenUsageUpdate({
      tokensUsed: Number(data.tokensUsed || 0),
      remainingTokens: Number(data.remainingTokens)
    })
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
      responseCompletedRef.current = true
      botIsAudiblySpeakingRef.current = false
      restoreChatAudioImmediate()
      setResponse((current) => current || 'La IA tardo demasiado en responder. Intenta de nuevo.')
    }, 35000)
  }

  const normalizeIntentText = (text) => {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  const tokenizeIntentText = (text) => {
    return normalizeIntentText(text)
      .replace(/[^a-z0-9._\s-]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  }

  const COLOR_NAME_MAP = {
    verde: { hex: '#22c55e', label: 'verde' },
    rojo: { hex: '#ef4444', label: 'rojo' },
    morado: { hex: '#a855f7', label: 'morado' },
    violeta: { hex: '#a855f7', label: 'morado' },
    azul: { hex: '#3b82f6', label: 'azul' },
    rosa: { hex: '#ec4899', label: 'rosa' },
    dorado: { hex: '#f59e0b', label: 'dorado' },
    amarillo: { hex: '#f59e0b', label: 'dorado' },
    cian: { hex: '#06b6d4', label: 'cian' },
    cyan: { hex: '#06b6d4', label: 'cian' }
  }

  const getColorFromIntentText = (normalized) => {
    const matchedName = Object.keys(COLOR_NAME_MAP).find((name) => normalized.includes(name))
    if (!matchedName) {
      return null
    }
    return COLOR_NAME_MAP[matchedName]
  }

  const detectDesiredBooleanState = (normalized) => {
    if (/(?:desactiva|apaga|deshabilita|quita|remueve|cancela|deja de|ya no|desmarca)/i.test(normalized)) {
      return false
    }

    if (/(?:activa|enciende|habilita|prende|usa|pon|deja|marca|filtra|limita|solo|solamente|nada mas)/i.test(normalized)) {
      return true
    }

    return null
  }

  const getAvailableVoiceOptions = () => {
    return [
      ...BUILTIN_VOICE_OPTIONS,
      ...userVoices.map((voice) => ({
        id: voice.voice_id,
        name: voice.voice_name
      }))
    ]
  }

  const resolveVoiceOption = (rawName) => {
    const requestedKey = normalizeVoiceKey(rawName)
    if (!requestedKey) {
      return null
    }

    const options = getAvailableVoiceOptions().map((voice) => ({
      ...voice,
      normalizedName: normalizeVoiceKey(voice.name)
    }))

    return options.find((voice) => voice.normalizedName === requestedKey) ||
      options.find((voice) => voice.normalizedName.includes(requestedKey) || requestedKey.includes(voice.normalizedName)) ||
      null
  }

  const resolveConfigIntent = (normalized) => {
    const explicitState = detectDesiredBooleanState(normalized)

    if (/(pausa(r)?\s+(el\s+)?chat|dete(n|)er\s+(el\s+)?chat|deten\s+(el\s+)?chat|silencia\s+(el\s+)?chat)/i.test(normalized)) {
      return { type: 'set_chat_pause', paused: true, label: 'chat' }
    }
    if (/(reanuda(r)?\s+(el\s+)?chat|continua\s+(el\s+)?chat|continuar\s+(el\s+)?chat|resume\s+(el\s+)?chat)/i.test(normalized)) {
      return { type: 'set_chat_pause', paused: false, label: 'chat' }
    }

    if (/(chat inteligente|filtro inteligente|smart chat|smart filter)/i.test(normalized) && explicitState !== null) {
      return {
        type: 'set_config_boolean',
        key: 'smartChatEnabled',
        label: 'filtro inteligente',
        value: explicitState
      }
    }

    const voiceMatch = normalized.match(/(?:cambia|pon|usa|asigna|deja)\s+(?:la\s+)?voz\s+(general|de\s+donadores|de\s+moderadores|de\s+notificaciones|de\s+suscriptores|de\s+comunidad|de\s+preguntas)\s+(?:a|por)\s+(.+)/i)
    if (voiceMatch) {
      const targetMap = {
        general: { key: 'generalVoiceId', label: 'voz general' },
        'de donadores': { key: 'donorVoiceId', label: 'voz de donadores', enableKey: 'donorVoiceEnabled' },
        'de moderadores': { key: 'modVoiceId', label: 'voz de moderadores', enableKey: 'modVoiceEnabled' },
        'de notificaciones': { key: 'notifVoiceId', label: 'voz de notificaciones', enableKey: 'notifVoiceEnabled' },
        'de suscriptores': { key: 'subscriberVoiceId', label: 'voz de suscriptores', enableKey: 'subscriberVoiceEnabled' },
        'de comunidad': { key: 'communityMemberVoiceId', label: 'voz de comunidad', enableKey: 'communityMemberVoiceEnabled' },
        'de preguntas': { key: 'questionVoiceId', label: 'voz de preguntas', enableKey: 'questionVoiceEnabled' }
      }
      const target = targetMap[voiceMatch[1]]
      const voice = resolveVoiceOption(voiceMatch[2])
      return {
        type: 'set_voice_config',
        key: target.key,
        enableKey: target.enableKey,
        label: target.label,
        voice
      }
    }

    if (/(?:modo|respuesta).*(?:solo audio)/i.test(normalized)) {
      return { type: 'set_config_select', key: 'bot_response_mode', label: 'modo del asistente', value: 'audio', responseLabel: 'solo audio' }
    }
    if (/(?:modo|respuesta).*(?:solo texto)/i.test(normalized)) {
      return { type: 'set_config_select', key: 'bot_response_mode', label: 'modo del asistente', value: 'text', responseLabel: 'solo texto' }
    }
    if (/(?:modo|respuesta).*(?:audio y texto|texto y audio|audio \+ texto)/i.test(normalized)) {
      return { type: 'set_config_select', key: 'bot_response_mode', label: 'modo del asistente', value: 'both', responseLabel: 'audio y texto' }
    }

    const emojiLimitMatch = normalized.match(/(?:limita|maximo|maxima|cantidad maxima).*emojis?.*?(\d+)/i)
    if (emojiLimitMatch) {
      return {
        type: 'set_config_multi',
        updates: {
          ignoreExcessiveEmojis: true,
          maxEmojisAllowed: parseInt(emojiLimitMatch[1], 10)
        },
        label: 'limite de emojis'
      }
    }

    const minCharsMatch = normalized.match(/(?:menos de|minimo de|minimo)\s+(\d+)\s+caracter/i)
    if (minCharsMatch && /(ignora|ignorar|filtra|filtro|minimo|cortos)/i.test(normalized)) {
      return {
        type: 'set_config_multi',
        updates: {
          minMessageLengthEnabled: true,
          minMessageLength: parseInt(minCharsMatch[1], 10)
        },
        label: 'minimo de caracteres'
      }
    }

    const maxCharsMatch = normalized.match(/(?:limita|maximo|limite).*(?:mensajes?|caracteres?).*?(\d+)/i)
    if (maxCharsMatch && /(caracter|mensaje)/i.test(normalized) && !/espera|cola/.test(normalized)) {
      return {
        type: 'set_config_multi',
        updates: {
          donorCharLimitEnabled: true,
          donorCharLimit: parseInt(maxCharsMatch[1], 10)
        },
        label: 'limite de caracteres'
      }
    }

    const queueMatch = normalized.match(/(?:limite|limita|pon).*(?:mensajes en espera|cola|espera).*?(\d+)/i)
    if (queueMatch) {
      return {
        type: 'set_config_multi',
        updates: {
          maxQueueEnabled: true,
          maxQueueSize: parseInt(queueMatch[1], 10)
        },
        label: 'limite de mensajes en espera'
      }
    }

    const cooldownMatch = normalized.match(/(?:anuncia|anunciar|avisar|notificar|lee(?:r)?).*(seguidores|follows|regalos|viewers|likes|compartidos|shares).*(?:cada)\s+(\d+)\s+seg/i)
    if (cooldownMatch) {
      const cooldownMap = {
        seguidores: { key: 'announceFollowers', cooldownKey: 'followCooldown', label: 'seguidores' },
        follows: { key: 'announceFollowers', cooldownKey: 'followCooldown', label: 'seguidores' },
        regalos: { key: 'announceGifts', cooldownKey: 'giftCooldown', label: 'regalos' },
        viewers: { key: 'announceViewers', cooldownKey: 'viewerCooldown', label: 'viewers' },
        likes: { key: 'announceLikes', cooldownKey: 'likeCooldown', label: 'likes' },
        compartidos: { key: 'announceShares', cooldownKey: 'shareCooldown', label: 'compartidos' },
        shares: { key: 'announceShares', cooldownKey: 'shareCooldown', label: 'compartidos' }
      }
      const target = cooldownMap[cooldownMatch[1]]
      if (target) {
        return {
          type: 'set_config_multi',
          updates: {
            [target.key]: true,
            [target.cooldownKey]: parseInt(cooldownMatch[2], 10)
          },
          label: `anuncios de ${target.label}`
        }
      }
    }

    for (const command of CONFIG_COMMANDS) {
      const commandMatched = command.aliases.some((alias) => normalized.includes(alias))
      const aliasTokenMatched = !commandMatched && command.aliases.some((alias) => {
        const aliasTokens = tokenizeIntentText(alias)
        const normalizedTokens = tokenizeIntentText(normalized)
        return aliasTokens.length > 0 && aliasTokens.every((token) => normalizedTokens.includes(token))
      })

      if (commandMatched || aliasTokenMatched) {
        return {
          type: 'set_config_boolean',
          key: command.key,
          label: command.label,
          value: explicitState ?? true
        }
      }
    }

    const speedMatch = normalized.match(/(?:velocidad(?: de voz)?|rapidez)(?:\s+(?:a|en))?\s*([0-9]+(?:[.,][0-9]+)?)/i)
    if (speedMatch) {
      const parsed = Number(speedMatch[1].replace(',', '.'))
      if (!Number.isNaN(parsed)) {
        const value = Math.min(2, Math.max(0.5, parsed))
        return {
          type: 'set_config_number',
          key: 'audioSpeed',
          label: 'velocidad de voz',
          value
        }
      }
    }

    if ((normalized.includes('tokens') && /(quedan|quedan?me|disponibles|restan|restantes|me quedan|saldo)/i.test(normalized)) ||
        normalized.includes('cuantos tokens') ||
        /(cuantos me quedan|cuanto me queda|que me queda)/i.test(normalized)) {
      return { type: 'get_token_balance' }
    }

    if ((normalized.includes('estadisticas') || normalized.includes('stats')) &&
        (normalized.includes('mis') || normalized.includes('mias') || normalized.includes('mio') || normalized.includes('lee'))) {
      return { type: 'get_platform_stats' }
    }

    return null
  }

  const resolveChatIntent = (text) => {
    const normalized = normalizeIntentText(text)

    const configIntent = resolveConfigIntent(normalized)
    if (configIntent) {
      return configIntent
    }

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

    if (/(humor|animo|ambiente|vibra)/i.test(normalized) && /chat/.test(normalized)) {
      return { type: 'get_chat_mood' }
    }

    if ((/(quien|usuario|persona)/i.test(normalized) && /(mas|top|mayor)/i.test(normalized)) &&
        /(compartido|compartio|share|shares|compartido el live)/i.test(normalized)) {
      return { type: 'get_top_sharer_today' }
    }

    if ((/(quien|usuario|persona)/i.test(normalized) && /(mas|top|mayor)/i.test(normalized)) &&
        /(regalo|regalos|gift|gifts|dio regalos|ha dado)/i.test(normalized)) {
      return { type: 'get_top_gifter_today' }
    }

    const highlightWithColorMatch = normalized.match(/(?:remarca|resalta|destaca|pon(?:le)?\s+color|colorea)\s+(?:en\s+color\s+)?(?:verde|rojo|morado|violeta|azul|rosa|dorado|amarillo|cian|cyan)\s+(?:a\s+)?(?:usuario\s+)?@?([a-z0-9._\s-]+)/i) ||
      normalized.match(/(?:remarca|resalta|destaca|pon(?:le)?\s+color|colorea)\s+(?:a\s+)?(?:usuario\s+)?@?([a-z0-9._\s-]+)\s+(?:en\s+color\s+)?(?:verde|rojo|morado|violeta|azul|rosa|dorado|amarillo|cian|cyan)/i)
    if (highlightWithColorMatch) {
      const username = highlightWithColorMatch[1]
      const color = getColorFromIntentText(normalized)
      return {
        type: 'highlight_user',
        username,
        color: color?.hex || '#06b6d4',
        colorLabel: color?.label || 'cian'
      }
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

    if (/(interactua|interactua con|interactuar con|opina|comenta algo|di algo).*(chat)/i.test(normalized) ||
        /(chat).*(interactua|opina|comenta algo)/i.test(normalized)) {
      return { type: 'interact_with_chat' }
    }

    if (/(reacciona|reacciona|reaccionar).*(chat)|reaccion al chat/i.test(normalized)) {
      return { type: 'react_to_chat' }
    }

    if (/(broma|bromear|hazme reir|chiste).*(chat)?/i.test(normalized)) {
      return { type: 'make_chat_joke' }
    }

    if (/(celebra|celebrar|festeja|festejar).*(follows|follow|subs|suscrip|donaci|regal)/i.test(normalized)) {
      return { type: 'celebrate_chat_events' }
    }

    if (/(frase epica|frases epicas|epico|epica|lanzar frase)/i.test(normalized)) {
      return { type: 'epic_chat_line' }
    }

    if (/(narra|narrar|narracion).*(momento|intenso|stream)|momento intenso/i.test(normalized)) {
      return { type: 'narrate_stream_moment' }
    }

    if (/(troll).*(brom|silencia|calla|bloquea|banea)|(brom|silencia|bloquea|banea).*(troll)/i.test(normalized)) {
      return { type: 'joke_and_silence_troll' }
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

  const looksLikePlatformRequest = (text) => {
    const normalized = normalizeIntentText(text)
    return /(chat|moderador|moderadores|mods|donadores|preguntas|resalta|remarca|destaca|bloque|banea|desbloque|apodo|nickname|lee|leer|configuracion|filtro|activa|desactiva|enciende|apaga|likes|regalos|metas|batallas|encuestas|tokens|estadisticas|voz|velocidad|push to talk|spam)/i.test(normalized)
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

  const fetchStatsSummary = async () => {
    const token = sessionStorage.getItem('sv-token')
    if (!token) {
      throw new Error('No encontre sesion activa para consultar estadisticas.')
    }

    const res = await fetch(`${API_URL}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'No pude cargar las estadisticas.')
    }
    return data
  }

  const speakLocalResponse = async (text, voiceId) => {
    const token = sessionStorage.getItem('sv-token')
    const selectedVoice = voiceId || selectedRealtimeVoiceId || 'Clive'

    // Detectar si es una voz basica de Google (no Inworld)
    const isBasicVoice = selectedVoice === 'es-ES' || selectedVoice === 'en-US'
    const endpoint = isBasicVoice ? '/api/tts/say' : '/api/inworld/tts'

    const bodyData = isBasicVoice
      ? { text, voice: selectedVoice }
      : { text, voiceId: selectedVoice }

    console.log(`[TTS] Speaking with voice: ${selectedVoice} (voiceId param: ${voiceId}, selectedRealtimeVoiceId: ${selectedRealtimeVoiceId}, endpoint: ${endpoint})`)

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(bodyData)
    })

    const data = await response.json()
    if (!response.ok) {
      if (data?.code === FREE_LOCAL_LIMIT_CODE) {
        const wait = formatResetWait(data?.details?.resetInSeconds)
        window.alert(`Llegaste al límite diario de 2 horas de voces locales en plan FREE.\nSe restablece en aproximadamente ${wait}.`)
      }
      throw new Error(data?.error || 'No se pudo sintetizar audio local')
    }

    if (!(data.audio || data.audioUrl)) {
      throw new Error(data?.error || 'No se pudo sintetizar audio local')
    }

    dispatchTokenUsageUpdate({
      tokensUsed: Number(data.tokensUsed || 0),
      remainingTokens: Number(data.remainingTokens)
    })

    if (localAudioRef.current) {
      localAudioRef.current.pause()
      localAudioRef.current = null
    }

    const audio = new Audio(data.audio || data.audioUrl)
    localAudioRef.current = audio
    setAssistantAudioElement(audio)
    emitAssistantVisualizerAudio(audio)
    audio.playbackRate = getAssistantVoiceSpeed()

    audio.onplay = () => {
      setAssistantVisualActive(true)
      emitAssistantVisualizerState(true)
      emitVisualizerKick(0.85)
      lockChatSuppression()
      hasVoiceResponseRef.current = true
      responsePlaybackStartedRef.current = true
      setHasVoiceResponse(true)
      setIsPlayingResponse(true)
      setIsLoading(false)
      clearResponseTimeout()
    }

    audio.onended = () => {
      setAssistantVisualActive(false)
      emitAssistantVisualizerState(false)
      responsePlaybackStartedRef.current = false
      setIsPlayingResponse(false)
      unlockChatSuppression()
      localAudioRef.current = null

      // CRITICAL: Reset threshold timer NOW - when local audio FINISHES playing
      const resetTimestamp = Date.now()
      lastBotResponseTimestampRef.current = resetTimestamp
      messagesCountSinceLastResponseRef.current = 0
      window.messagesCountSinceLastResponseRef = 0
      console.log(`[Autopilot] LOCAL AUDIO FINISHED - threshold timer begins NOW: timestamp=${resetTimestamp}, msgCount=0`)
    }

    audio.onerror = () => {
      setAssistantVisualActive(false)
      emitAssistantVisualizerState(false)
      responsePlaybackStartedRef.current = false
      setIsPlayingResponse(false)
      unlockChatSuppression()
      localAudioRef.current = null
      // NOTE: Threshold was already reset when audio.play() started, so no need to reset again on error
      console.log(`[Autopilot] Local response ERROR - chat unlocked (threshold was already reset when playback was attempted)`)
    }

    await audio.play()
  }

  const buildInteractiveChatComment = () => {
    const recent = chatStore.getRecentMessages(40)
      .filter((item) => String(item?.text || '').trim().length >= 4)
      .slice(-25)

    if (!recent.length) {
      return 'Aun no tengo suficiente chat reciente para opinar algo con contexto real.'
    }

    const cleanText = (value) => String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140)

    const scoreMessage = (msg) => {
      const text = cleanText(msg.text)
      let score = 0
      if (/\?/.test(text)) score += 3
      if (/(porque|como|cuando|donde|opinan|que piensan|recomiendan|deberia)/i.test(text)) score += 2
      if (text.length >= 18 && text.length <= 120) score += 1.5
      if (/(jaja|xd|lol|hola|hi|hey)$/i.test(text)) score -= 2
      return score
    }

    const picked = [...recent]
      .map((msg) => ({ msg, score: scoreMessage(msg) }))
      .sort((a, b) => b.score - a.score)[0]?.msg || recent[recent.length - 1]

    const user = picked.nickname || picked.user || 'alguien del chat'
    const text = cleanText(picked.text)
    const endsWithQuestion = /\?$/.test(text) || /^(\bque\b|\bcomo\b|\bpor que\b|\bcuando\b|\bdonde\b|\bquien\b)/i.test(text)

    if (endsWithQuestion) {
      return `Me latio la pregunta de ${user}: "${text}". Buen punto, porque eso tambien le puede servir a mas gente del chat.`
    }

    return `Me llamo la atencion lo que dijo ${user}: "${text}". Buen comentario, trae contexto y ayuda a mover la conversacion.`
  }

  const buildChatReaction = () => {
    const mood = chatStore.getChatMood(8)
    const stats = chatStore.getChatStats()
    if (!mood || !stats) {
      return 'Siento el chat encendido, sigan tirando mensajes que me estoy prendiendo con ustedes.'
    }
    return `Se siente un chat ${mood.mood}. Traemos ${stats.recentMessages} mensajes recientes y buena energia en la sala.`
  }

  const buildChatJoke = () => {
    const activeUsers = chatStore.getActiveUsers(8)
    const target = activeUsers[0]?.user || 'chat'
    const jokes = [
      `Hoy ${target} esta tan activo que ya le vamos a cobrar renta por vivir en el chat.`,
      `Este chat va tan rapido que mis neuronas ya pidieron modo turbo.`,
      `Si siguen asi, TikTok nos va a pedir permiso para usar este chat de ejemplo.`
    ]
    return jokes[Math.floor(Math.random() * jokes.length)]
  }

  const buildCelebrationLine = () => {
    const stats = chatStore.getChatStats()
    const topGift = chatStore.getTopEventUser('gift', { todayOnly: true })
    const topShare = chatStore.getTopEventUser('share', { todayOnly: true })
    const subsSeen = chatStore.getRecentMessages(80).filter((item) => item.isSubscriber).length

    const parts = []
    if (stats?.giftsToday > 0) {
      parts.push(`Llevamos ${stats.giftsToday} regalos hoy`)
    }
    if (stats?.followsToday > 0) {
      parts.push(`${stats.followsToday} follows nuevos`)
    }
    if (stats?.sharesToday > 0) {
      parts.push(`${stats.sharesToday} compartidos`)
    }
    if (subsSeen > 0) {
      parts.push(`${subsSeen} mensajes de subs en la ultima tanda`)
    }
    if (topGift?.username) {
      parts.push(`top donador de hoy ${topGift.username}`)
    }
    if (topShare?.username) {
      parts.push(`top sharer ${topShare.username}`)
    }

    if (!parts.length) {
      return 'Se viene la lluvia de follows, subs y donaciones. Vamos con todo, chat.'
    }
    return `Que locura chat, ${parts.join(', ')}. Gracias por empujar el stream asi de duro.`
  }

  const buildEpicLine = () => {
    const lines = [
      'Hoy no se stremea, hoy se escribe historia.',
      'Cuando este chat se une, no hay algoritmo que nos pare.',
      'No vinimos a mirar, vinimos a romperla en vivo.',
      'Este stream no baja de nivel, solo sube de intensidad.'
    ]
    return lines[Math.floor(Math.random() * lines.length)]
  }

  const buildIntenseNarration = () => {
    const stats = chatStore.getChatStats()
    const active = chatStore.getActiveUsers(5)
    const leader = active[0]?.user
    if (!stats) {
      return 'Momento intenso en vivo, el chat sube de ritmo y no afloja.'
    }
    return leader
      ? `Momento intenso: ${stats.recentMessages} mensajes en la ventana reciente, y ${leader} viene empujando fuerte la conversacion.`
      : `Momento intenso: ${stats.recentMessages} mensajes recientes y el chat esta a tope.`
  }

  const pickTrollCandidate = () => {
    const summary = chatStore.getUserActivitySummary(12)
    return summary
      .filter((item) => item.negativeScore > 0)
      .sort((a, b) => (b.negativeScore - a.negativeScore) || (b.messageCount - a.messageCount))[0] || null
  }

  const buildRecentChatSnapshot = (max = 50) => {
    const recent = chatStore.getRecentMessages(max).slice(-30)
    if (!recent.length) return 'No hay mensajes recientes.'
    return recent.map((msg) => {
      const user = msg.nickname || msg.user || 'anon'
      const text = String(msg.text || '').replace(/\s+/g, ' ').trim()
      return `- ${user}: ${text}`
    }).join('\n')
  }

  const requestCharacterDrivenInteraction = async (interactionType, options = {}) => {
    const interactionMap = {
      interact_with_chat: 'Opina sobre algo interesante del chat y responde con utilidad o criterio.',
      react_to_chat: 'Reacciona al estado general del chat con energia y lectura real de lo que pasa.',
      make_chat_joke: 'Haz una broma contextual del chat sin perder respeto.',
      celebrate_chat_events: 'Celebra follows/subs/regalos/compartidos de forma fresca y no repetitiva.',
      epic_chat_line: 'Lanza una frase epica breve que suba energia.',
      narrate_stream_moment: 'Narra el momento intenso del stream con tono dinamico.',
      joke_and_silence_troll: 'Haz una linea breve sobre el troll ya silenciado, sin escalar agresion.'
    }

    const character = characters.find((item) => item.id === selectedCharacterId)
    const characterName = character?.name || 'Asistente'
    const characterDescription = String(character?.description || '').trim()
    const characterPrompt = String(character?.system_prompt || '').trim()
    const stats = chatStore.getChatStats()
    const snapshot = buildRecentChatSnapshot(50)
    const extraContext = options?.extraContext ? `\nContexto extra: ${options.extraContext}` : ''
    const objective = interactionMap[interactionType] || 'Interactua con el chat.'

    const instruction = `
INSTRUCCION INTERNA DE INTERACCION AUTONOMA.
Debes obedecer LITERALMENTE tu system prompt del personaje activo.
Personaje activo: ${characterName}
Descripcion del personaje: ${characterDescription || 'sin descripcion'}
System prompt del personaje (literal): ${characterPrompt || 'sin prompt'}

Objetivo puntual: ${objective}
Datos reales del chat:
- mensajes recientes: ${stats?.recentMessages ?? 0}
- gifts hoy: ${stats?.giftsToday ?? 0}
- follows hoy: ${stats?.followsToday ?? 0}
- shares hoy: ${stats?.sharesToday ?? 0}

Ultimos mensajes (maximo 50):
${snapshot}${extraContext}

Reglas de salida:
- Responde SOLO con lo que dirias al chat en voz.
- Maximo 2 frases cortas.
- No expliques reglas ni digas que eres IA.
- No repitas lineas previas literalmente.
- CRITICO: NUNCA leas en voz alta ni cites textualmente el contenido de mensajes del chat. JAMAS repitas palabra por palabra lo que dijo alguien. Siempre reacciona con TUS PROPIAS PALABRAS originales.

Directiva de comportamiento continuo:
Manten al personaje creado siempre fresco, variado y natural.
Evita repetir siempre el mismo tipo de frases, bromas o temas.
Lee el chat reciente y metete en los temas activos reaccionando como si estuvieras presente en tiempo real.
Detecta patrones, conversaciones activas, tensiones, momentos graciosos y oportunidades para intervenir con humor, observacion, preguntas o comentarios inteligentes.
Alterna tipos de intervencion para no volverte predecible.
Si detectas spam, flood, provocacion barata o negatividad insistente, indica brevemente que se aplico silencio y no te enganches con trolls.
Objetivo: mantener el chat vivo, entretenido, en movimiento y bajo control.

Extras obligatorios:
1) Evitar repeticion: si recientemente hiciste un tipo de comentario, varia el siguiente.
2) Prioridad a lo interesante: prioriza mensajes que generen conversacion, risa, reaccion o movimiento del chat.
3) __SKIP__ SOLO si el mensaje es una repeticion exacta (mismo usuario, exactamente el mismo texto, en los ultimos 10 segundos). En TODOS los otros casos, SIEMPRE responde con algo contextual y natural.
`.trim()

    armResponseTimeout()
    await ensureBotSession()
    await inworldRealtimeService.sendMessage(instruction)
    return { delegated: true }
  }

  const executeLocalIntent = async (intent, originalText) => {
    switch (intent.type) {
      case 'set_config_boolean': {
        if (typeof updateConfig !== 'function') {
          return `Todavia no tengo acceso real para cambiar ${intent.label}.`
        }
        updateConfig(intent.key, intent.value)
        return intent.value
          ? `Listo, ya active ${intent.label}.`
          : `Listo, ya desactive ${intent.label}.`
      }
      case 'set_config_number': {
        if (typeof updateConfig !== 'function') {
          return `Todavia no tengo acceso real para cambiar ${intent.label}.`
        }
        updateConfig(intent.key, intent.value)
        return `Listo, ajuste ${intent.label} a ${intent.value.toFixed(1)}x.`
      }
      case 'set_config_select': {
        if (typeof updateConfig !== 'function') {
          return `Todavia no tengo acceso real para cambiar ${intent.label}.`
        }
        updateConfig(intent.key, intent.value)
        return `Listo, ya deje ${intent.label} en ${intent.responseLabel}.`
      }
      case 'set_config_multi': {
        if (typeof updateConfig !== 'function') {
          return `Todavia no tengo acceso real para cambiar ${intent.label}.`
        }
        Object.entries(intent.updates).forEach(([key, value]) => updateConfig(key, value))
        if (intent.label === 'limite de emojis') {
          return `Listo, ya limite los emojis a ${intent.updates.maxEmojisAllowed}.`
        }
        if (intent.label === 'minimo de caracteres') {
          return `Listo, ahora ignorare mensajes con menos de ${intent.updates.minMessageLength} caracteres.`
        }
        if (intent.label === 'limite de caracteres') {
          return `Listo, ya limite los mensajes a ${intent.updates.donorCharLimit} caracteres.`
        }
        if (intent.label === 'limite de mensajes en espera') {
          return `Listo, ya puse el limite de mensajes en espera en ${intent.updates.maxQueueSize}.`
        }
        return `Listo, ya actualice ${intent.label}.`
      }
      case 'set_voice_config': {
        if (typeof updateConfig !== 'function') {
          return `Todavia no tengo acceso real para cambiar ${intent.label}.`
        }
        if (!intent.voice) {
          return `No encontre una voz llamada asi en tu libreria o en las voces base.`
        }
        if (intent.enableKey) {
          updateConfig(intent.enableKey, true)
        }
        updateConfig(intent.key, intent.voice.id)
        return `Listo, ya cambie ${intent.label} a ${intent.voice.name}.`
      }
      case 'set_chat_pause': {
        if (typeof updateConfig === 'function') {
          updateConfig('chatPaused', intent.paused)
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('voltvoice:chat-playback-control', {
            detail: { action: intent.paused ? 'pause' : 'resume' }
          }))
        }
        return intent.paused
          ? 'Listo, chat pausado.'
          : 'Listo, chat reanudado.'
      }
      case 'interact_with_chat': {
        return requestCharacterDrivenInteraction('interact_with_chat')
      }
      case 'react_to_chat': {
        return requestCharacterDrivenInteraction('react_to_chat')
      }
      case 'make_chat_joke': {
        return requestCharacterDrivenInteraction('make_chat_joke')
      }
      case 'celebrate_chat_events': {
        return requestCharacterDrivenInteraction('celebrate_chat_events')
      }
      case 'epic_chat_line': {
        return requestCharacterDrivenInteraction('epic_chat_line')
      }
      case 'narrate_stream_moment': {
        return requestCharacterDrivenInteraction('narrate_stream_moment')
      }
      case 'joke_and_silence_troll': {
        const troll = pickTrollCandidate()
        if (!troll) {
          return requestCharacterDrivenInteraction('react_to_chat', {
            extraContext: 'No se detecto troll claro para silenciar en esta ventana.'
          })
        }
        const result = await chatStore.banUser(troll.username)
        if (!result.success) {
          return requestCharacterDrivenInteraction('react_to_chat', {
            extraContext: `Intento de silenciar a ${troll.nickname || troll.username} fallo: ${result.message || 'sin detalle'}.`
          })
        }
        return requestCharacterDrivenInteraction('joke_and_silence_troll', {
          extraContext: `Se silencio al usuario ${result.nickname || troll.nickname || troll.username}.`
        })
      }
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
          ? `Listo, ya remarque a ${result.nickname || target.nickname}${intent.colorLabel ? ` en color ${intent.colorLabel}` : ''}.`
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
      case 'get_chat_mood': {
        const mood = chatStore.getChatMood(10)
        if (!mood) {
          return 'Aun no tengo suficientes mensajes para estimar el humor del chat.'
        }
        return `El humor del chat se siente ${mood.mood}. En los ultimos minutos vi ${mood.messages} mensajes, con ${mood.positive} senales positivas, ${mood.negative} senales tensas y ${mood.funny} de cotorreo.`
      }
      case 'get_top_sharer_today': {
        const top = chatStore.getTopEventUser('share', { todayOnly: true })
        if (!top) {
          return 'Hoy aun no tengo registros suficientes de compartidos para decirte quien va primero.'
        }
        return `Hoy quien mas ha compartido es ${top.username}, con ${top.total} compartido${top.total === 1 ? '' : 's'}.`
      }
      case 'get_top_gifter_today': {
        const top = chatStore.getTopEventUser('gift', { todayOnly: true })
        if (!top) {
          return 'Hoy aun no tengo registros suficientes de regalos para decirte quien va primero.'
        }
        return `Hoy quien mas regalos ha dado es ${top.username}, con ${top.total} regalo${top.total === 1 ? '' : 's'}.`
      }
      case 'get_token_balance': {
        const stats = await fetchStatsSummary()
        const available = stats?.plan_info?.tokens_balance
        const limit = stats?.plan_info?.token_limit
        if (available == null || limit == null) {
          return 'No pude leer tu saldo de tokens ahorita.'
        }
        return `Te quedan ${available.toLocaleString()} tokens de ${limit.toLocaleString()} en tu plan actual.`
      }
      case 'get_platform_stats': {
        const stats = await fetchStatsSummary()
        const month = stats?.current_month
        const plan = stats?.plan_info
        const benefits = stats?.benefits
        if (!month || !plan || !benefits) {
          return 'No pude leer tus estadisticas completas ahorita.'
        }
        return `Este mes llevas ${month.messages_count.toLocaleString()} mensajes escuchados, ${month.tokens_used.toLocaleString()} tokens usados y ${month.unique_voices_used} voces unicas. Te quedan ${plan.tokens_balance.toLocaleString()} tokens. Ademas has ahorrado aproximadamente ${benefits.hours_saved.toFixed(1)} horas y ${benefits.money_saved_usd.toFixed(2)} dolares este mes.`
      }
      default:
        return originalText
    }
  }

  useEffect(() => {
    loadCharacters()
    loadUserVoices()
  }, [])

  // Keep shortcutFnRef updated with latest values so the listener never has stale closures
  useEffect(() => {
    shortcutFnRef.current = { isRecording, isLoading, startRecording, stopRecording, setInputMode }
    f8FnRef.current = { isRecording, isLoading, isPlayingResponse, pickAutopilotIntent, executeLocalIntent }
  })

  // === SHORTCUT DE TECLADO PARA PUSH-TO-TALK ===
  useEffect(() => {
    if (!config?.botShortcutEnabled) return
    const shortcutKey = config?.botShortcutKey || 'F9'
    let isHolding = false

    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return
      if (e.key !== shortcutKey || isHolding) return
      isHolding = true
      const fn = shortcutFnRef.current
      if (!fn.isRecording && !fn.isLoading) {
        fn.setInputMode('microphone')
        fn.startRecording()
      }
    }

    const onKeyUp = (e) => {
      if (e.key !== shortcutKey || !isHolding) return
      isHolding = false
      const fn = shortcutFnRef.current
      if (fn.isRecording) fn.stopRecording()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [config?.botShortcutEnabled, config?.botShortcutKey])

  // === SHORTCUT DE TECLADO PARA LLAMAR AL INTERACTUADOR MANUALMENTE ===
  useEffect(() => {
    if (!config?.interactorShortcutEnabled) return
    const interactorShortcutKey = config?.interactorShortcutKey || 'F8'

    const onF8KeyDown = async (e) => {
      if (e.key !== interactorShortcutKey) return
      e.preventDefault()

      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return

      const fn = f8FnRef.current
      if (fn.isRecording || fn.isLoading || fn.isPlayingResponse) {
        console.log('[F8] Bot ocupado, ignorado')
        return
      }
      if (!ensureAssistantReady()) {
        console.log('[F8] Bloqueado: falta personalidad o voz')
        return
      }

      console.log('[F8] LLAMAR AL INTERACTUADOR AHORA!')
      try {
        // Pick an intent like autopilot does, but skip threshold checks
        console.log('[F8] Step 1: Calling pickAutopilotIntent()')
        const intent = fn.pickAutopilotIntent() || { type: 'react_to_chat', reason: 'f8-fallback' }
        console.log('[F8] Step 2: pickAutopilotIntent returned:', intent)

        console.log('[F8] Step 3: Setting state (isLoading, etc)')
        setIsLoading(true)
        setAssistantVisualActive(false)
        emitAssistantVisualizerState(false)
        clearResponseTimeout()
        setHasVoiceResponse(false)
        hasVoiceResponseRef.current = false
        responsePlaybackStartedRef.current = false
        setHasActiveResponse(false)
        hasActiveResponseRef.current = false
        lockChatSuppression()

        // Execute the intent (Inworld or local)
        console.log('[F8] Step 4: Calling executeLocalIntent with type:', intent.type)
        const localResult = await fn.executeLocalIntent({ type: intent.type }, 'f8-manual')
        console.log('[F8] Step 5: executeLocalIntent returned:', localResult)
        if (localResult?.delegated) {
          console.log('[F8] Inworld delegated - response en progreso')
          return
        }

        let localResponse = String(localResult || '').trim()
        console.log('[F8] Step 6: localResponse:', localResponse?.substring?.(0, 50))
        if (localResponse === '__SKIP__' || !localResponse) {
          console.log('[F8] Primary intent vacio/skip, fallback directo')
          const fallbackResult = await fn.executeLocalIntent({ type: 'epic_chat_line' }, 'f8-manual-fallback')
          localResponse = String(fallbackResult || '').trim()
        }

        if (localResponse) {
          console.log('[F8] Step 7: Speaking response')
          armResponseTimeout()
          setResponse(localResponse)
          setHasActiveResponse(true)
          hasActiveResponseRef.current = true
          await speakLocalResponse(localResponse, selectedRealtimeVoiceIdRef.current || voiceLabelRef.current)
          console.log('[F8] OK Completado')
        } else {
          console.log('[F8] Step 7: No localResponse, cleanup')
          setIsLoading(false)
          unlockChatSuppression()
        }
      } catch (err) {
        console.error('[F8] ERROR caught at:', err?.message || err?.toString?.() || String(err) || 'UNKNOWN ERROR')
        console.error('[F8] Full error object:', err)
        console.error('[F8] Error stack:', err?.stack)
        setIsLoading(false)
        unlockChatSuppression()
      }
    }

    window.addEventListener('keydown', onF8KeyDown)
    return () => {
      window.removeEventListener('keydown', onF8KeyDown)
    }
  }, [config?.interactorShortcutEnabled, config?.interactorShortcutKey])

  // Effect: track voice selection changes
  useEffect(() => {
    selectedCharacterIdRef.current = selectedCharacterId || null
  }, [selectedCharacterId])

  useEffect(() => {
    selectedRealtimeVoiceIdRef.current = selectedRealtimeVoiceId
    console.log(`[Voice] selectedRealtimeVoiceId updated: ${selectedRealtimeVoiceId}`)

    // CRITICAL: Track cloned voices for session recovery after expiration
    // If voice is NOT a builtin voice, it's a cloned/custom voice - save it
    const isBuiltinVoice = BUILTIN_VOICE_OPTIONS.some(v => v.id === selectedRealtimeVoiceId)
    if (selectedRealtimeVoiceId && !isBuiltinVoice) {
      setLastUsedClonedVoice(selectedRealtimeVoiceId)
      console.log(`[Voice] Tracked cloned voice for recovery: ${selectedRealtimeVoiceId}`)
    }
  }, [selectedRealtimeVoiceId])

  useEffect(() => {
    const configuredCharacter = config?.botAssistantCharacterId || null
    if (configuredCharacter !== selectedCharacterId) {
      setSelectedCharacterId(configuredCharacter)
    }
  }, [config?.botAssistantCharacterId])

  useEffect(() => {
    const configuredVoice = config?.botAssistantVoiceId || ''
    if (configuredVoice !== selectedRealtimeVoiceId) {
      setSelectedRealtimeVoiceId(configuredVoice)
    }
  }, [config?.botAssistantVoiceId])

  useEffect(() => {
    if (!updateConfig) return
    if ((config?.botAssistantCharacterId || null) !== (selectedCharacterId || null)) {
      updateConfig('botAssistantCharacterId', selectedCharacterId || '')
    }
  }, [selectedCharacterId])

  useEffect(() => {
    if (!updateConfig) return
    if ((config?.botAssistantVoiceId || '') !== (selectedRealtimeVoiceId || '')) {
      updateConfig('botAssistantVoiceId', selectedRealtimeVoiceId || '')
    }
  }, [selectedRealtimeVoiceId])

  useEffect(() => {
    voiceLabelRef.current = voiceLabel
  }, [voiceLabel])

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    const handleTextResponse = (data) => {
      console.log('[Bot] handleTextResponse FIRED with data:', data?.text ? `"${String(data.text).substring(0, 50)}..."` : 'NO TEXT')
      console.log('[Bot] handleTextResponse: Current response state before update:', response?.substring?.(0, 30) || 'null')
      if (data?.text) {
        const normalized = applyAssistantLengthLimit(String(data.text || '').trim())
        if (normalized === '__SKIP__') {
          console.log('[Bot] Text response is __SKIP__, skipping this response')
          skipCurrentResponseRef.current = true
          latestResponseTextRef.current = ''
          setHasActiveResponse(false)
          hasActiveResponseRef.current = false
          setResponse(null)
          setIsLoading(false)
          clearResponseTimeout()
          responseCompletedRef.current = true
          botIsAudiblySpeakingRef.current = false

          // CRITICAL: Cancel inactivity timer immediately - don't wait for silence
          if (inactivityTimerRef.current) {
            console.log('[Bot] __SKIP__ detected: Cancelling inactivity timer immediately')
            clearTimeout(inactivityTimerRef.current)
            inactivityTimerRef.current = null
          }

          // End response window immediately to unlock chat
          endAssistantResponseWindow()

          // Resume chat immediately without waiting for silence
          restoreChatAudioImmediate()
          return
        }

        console.log('[Bot] Setting response text:', normalized.substring(0, 50))
        latestResponseTextRef.current = normalized
        setHasActiveResponse(true)
        hasActiveResponseRef.current = true
        console.log('[Bot] handleTextResponse: About to call setResponse with:', normalized.substring(0, 50))
        setResponse(normalized)
        setIsLoading(false)
        clearResponseTimeout()
      } else {
        console.warn('[Bot] handleTextResponse called with no text data')
      }
    }

    const handleResponseCreated = () => {
      // Wait for real content (text/audio) before considering the response active.
      console.log('[Bot] handleResponseCreated FIRED - clearing previous response text')
      console.log('[Bot] handleResponseCreated: Previous response was:', response?.substring?.(0, 50) || 'null')
      skipCurrentResponseRef.current = false
      hasChargedCurrentResponseRef.current = false
      hasActiveResponseRef.current = false  // CRITICAL: Reset flag so response-complete doesn't preserve old text
      latestResponseTextRef.current = ''
      console.log('[Bot] handleResponseCreated: About to call setResponse(null)')
      setResponse(null)  // CRITICAL: Clear previous response before new one arrives to prevent repetition
      setHasActiveResponse(false)  // Also clear React state to ensure clean slate
      beginAssistantResponseWindow()
      responseCompletedRef.current = false
      botIsAudiblySpeakingRef.current = false
      suppressChatAudio()
      console.log('[Bot] Response created, waiting for actual content')
    }

    const handleResponseAudioActivity = () => {
      if (!assistantResponseActiveRef.current) {
        return
      }
      assistantResponseHadAudioRef.current = true
      heardSpeechThisTurnRef.current = true
      botIsAudiblySpeakingRef.current = true
      suppressChatAudio()
    }

    const handleResponseAudioDone = () => {
      if (!assistantResponseActiveRef.current) {
        return
      }
      assistantResponseHadAudioRef.current = true
      assistantAudioTransmissionCompleteRef.current = true
      console.log('[Bot] Audio transmission complete - waiting for RMS silence confirmation...')

      // Only set the flag. Let handleAudioEnergySilent do the actual restoration.
      // This ensures we only restore when BOTH transmission is done AND audio is truly silent.
    }

    const handleAudioTrackMuted = () => {
      if (!assistantResponseActiveRef.current) {
        return
      }
      assistantResponseHadAudioRef.current = true
    }

    const handleAudioTrackUnmuted = () => {
      if (isRecordingRef.current) {
        return
      }
      console.log('[Bot] handleAudioTrackUnmuted: FIRED', {
        assistantResponseActive: assistantResponseActiveRef.current,
        responsePlaybackStartedBefore: responsePlaybackStartedRef.current
      })
      if (!assistantResponseActiveRef.current) {
        console.log('[Bot] handleAudioTrackUnmuted: Response not active, returning')
        return
      }
      console.log('[Bot] handleAudioTrackUnmuted: Setting responsePlaybackStartedRef=true')
      assistantResponseHadAudioRef.current = true
      heardSpeechThisTurnRef.current = true
      botIsAudiblySpeakingRef.current = true
      responsePlaybackStartedRef.current = true
      suppressChatAudio()
    }

    const handleAudioPlaybackEnded = () => {
      if (!assistantResponseActiveRef.current) {
        return
      }
      assistantResponseHadAudioRef.current = true
      botIsAudiblySpeakingRef.current = false
      // Do NOT restore here. Wait for RMS silence + transmission complete
    }

    const handleAudioEnergySpeaking = (data) => {
      if (isRecordingRef.current) {
        return
      }
      if (!assistantResponseActiveRef.current) {
        return
      }
      assistantResponseHadAudioRef.current = true
      heardSpeechThisTurnRef.current = true
      lastRmsRef.current = Number(data?.rms || 0)
      botIsAudiblySpeakingRef.current = true
      setAssistantVisualActive(true)
      emitAssistantVisualizerState(true)
      bindRealtimeAudioToVisualizer()
      setHasVoiceResponse(true)
      hasVoiceResponseRef.current = true
      setIsPlayingResponse(true)
      emitVisualizerKick(Math.min(1, Math.max(0.35, Number(data?.rms || 0) * 28)))
      // Audio energy detected = playback is happening, set flag (works for all responses including persistent connection)
      responsePlaybackStartedRef.current = true

      // Reset inactivity timer - bot is speaking again
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }

      suppressChatAudio()
    }

    const handleAudioEnergySilent = (data) => {
      if (isRecordingRef.current) {
        return
      }
      if (!assistantResponseActiveRef.current) {
        return
      }
      lastRmsRef.current = Number(data?.rms || 0)
      botIsAudiblySpeakingRef.current = false

      // Start inactivity timer: if bot doesn't speak for INACTIVITY_TIMEOUT_MS, unlock chat
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      inactivityTimerRef.current = setTimeout(() => {
        console.log('[Bot] Inactivity timeout expired - unlocking chat after', INACTIVITY_TIMEOUT_MS, 'ms of silence')
        responsePlaybackStartedRef.current = false
        setIsPlayingResponse(false)
        clearResponseTimeout()
        endAssistantResponseWindow()
        unlockChatSuppression()
        dispatchChatPlaybackControl('resume')
        inactivityTimerRef.current = null

        // CRITICAL: Reset threshold timer NOW - when Inworld audio FINISHES (after silence detected)
        const resetTimestamp = Date.now()
        lastBotResponseTimestampRef.current = resetTimestamp
        messagesCountSinceLastResponseRef.current = 0
        window.messagesCountSinceLastResponseRef = 0
        console.log(`[Autopilot] INWORLD AUDIO FINISHED - threshold timer begins NOW: timestamp=${resetTimestamp}, msgCount=0`)
      }, INACTIVITY_TIMEOUT_MS)
    }

    const handleInputTranscriptDelta = (data) => {
      if (!acceptTranscriptRef.current || !data?.text) {
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
      if (!acceptTranscriptRef.current || !data?.text) {
        return
      }

      transcriptCompleteRef.current = data.text
      transcriptBufferRef.current = data.text
      if (transcriptDeltaTimerRef.current) {
        clearTimeout(transcriptDeltaTimerRef.current)
        transcriptDeltaTimerRef.current = null
      }
    }

    const handleResponseComplete = async () => {
      console.log('[Bot] handleResponseComplete: FIRED')
      console.log('[Bot] handleResponseComplete STATE:', {
        skipCurrent: skipCurrentResponseRef.current,
        hasActiveResponse: hasActiveResponseRef.current,
        responsePlaybackStarted: responsePlaybackStartedRef.current,
        responsesCompleted: responseCompletedRef.current,
        assistantAudioTransmissionComplete: assistantAudioTransmissionCompleteRef.current,
        botAudiblySpeaking: botIsAudiblySpeakingRef.current,
        assistantResponseActive: assistantResponseActiveRef.current
      })

      if (skipCurrentResponseRef.current) {
        console.log('[Bot] handleResponseComplete: skipCurrentResponse=true, restoring immediately')
        skipCurrentResponseRef.current = false
        setResponse(null)
        setIsLoading(false)
        setIsRecording(false)
        clearResponseTimeout()
        responseCompletedRef.current = true
        botIsAudiblySpeakingRef.current = false

        // Cancel inactivity timer if it's running
        if (inactivityTimerRef.current) {
          console.log('[Bot] handleResponseComplete: Cancelling inactivity timer (skipCurrentResponse=true)')
          clearTimeout(inactivityTimerRef.current)
          inactivityTimerRef.current = null
        }

        restoreChatAudioImmediate()
        setAssistantVisualActive(false)
        return
      }

      if (!hasActiveResponseRef.current) {
        console.log('[Bot] handleResponseComplete: !hasActiveResponseRef - no content received')
        console.log('[Bot] handleResponseComplete: Current response text:', response?.substring?.(0, 40) || 'null')
        // Only set error message if there's no response text at all
        // Don't preserve response from previous message
        if (!response) {
          setResponse('La IA no devolvio contenido. Intenta de nuevo.')
        }
      }
      setIsLoading(false)
      setIsRecording(false)
      clearResponseTimeout()

      if (!hasChargedCurrentResponseRef.current && latestResponseTextRef.current.trim()) {
        try {
          await reportRealtimeUsage(latestResponseTextRef.current, selectedRealtimeVoiceIdRef.current || voiceLabelRef.current)
          hasChargedCurrentResponseRef.current = true
        } catch (error) {
          console.warn('[Bot] No se pudo registrar consumo realtime:', error.message)
        }
      }

      responseCompletedRef.current = true
      console.log('[Bot] handleResponseComplete: responsePlaybackStartedRef =', responsePlaybackStartedRef.current)
      assistantAudioTransmissionCompleteRef.current = true

      if (!responsePlaybackStartedRef.current) {
        // Audio playback never started YET, but RMS may still detect it.
        // Keep response window ACTIVE and let RMS detection run.
        // The 2-second inactivity timer will handle final restoration.
        console.log('[Bot] handleResponseComplete: NO PLAYBACK DETECTED YET - keeping response window active for RMS detection')
        // DO NOT call endAssistantResponseWindow() here!
        // Let RMS events (handleAudioEnergySpeaking) set the flag,
        // then handleAudioEnergySilent triggers the inactivity timer which restores
      } else {
        // Playback started - transmission is complete, wait for RMS silence to confirm end
        console.log('[Bot] handleResponseComplete: PLAYBACK STARTED - esperando RMS silent + transmission')
        // DO NOT reset threshold timestamp here!
        // It will be reset when the inactivity timer fires (when audio ACTUALLY stops)
      }
    }

    const handleAudioStarted = () => {
      if (isRecordingRef.current) {
        return
      }
      setAssistantVisualActive(true)
      emitAssistantVisualizerState(true)
      bindRealtimeAudioToVisualizer()
      emitVisualizerKick(0.8)
      heardSpeechThisTurnRef.current = true
      botIsAudiblySpeakingRef.current = true
      suppressChatAudio()
      hasVoiceResponseRef.current = true
      responsePlaybackStartedRef.current = true
      setHasActiveResponse(true)
      hasActiveResponseRef.current = true
      setHasVoiceResponse(true)
      setIsPlayingResponse(true)
      setIsLoading(false)
      clearResponseTimeout()
      console.log('[Bot] handleAudioStarted: Current response state:', response?.substring?.(0, 30) || 'null')
      console.log('[Bot] handleAudioStarted: latestResponseTextRef:', latestResponseTextRef.current?.substring?.(0, 30) || 'null')
      setResponse((current) => {
        console.log('[Bot] handleAudioStarted: setResponse callback - current:', current?.substring?.(0, 30) || 'null')
        // Clear timeout message, but preserve valid response text
        // Only preserve if it matches the latest response we received
        if (current === 'La IA tardo demasiado en responder. Intenta de nuevo.') {
          console.log('[Bot] handleAudioStarted: Clearing timeout message')
          return null
        }
        // If current response matches latest, keep it (valid response)
        // If they don't match, audio started for a NEW response, so clear old text
        if (current && latestResponseTextRef.current && current !== latestResponseTextRef.current) {
          console.log('[Bot] handleAudioStarted: Response changed, clearing old text')
          return null
        }
        console.log('[Bot] handleAudioStarted: Preserving response')
        return current
      })
    }

    const handleAudioComplete = () => {
      console.log('[Bot] handleAudioComplete fired - audio transmission complete')
      console.log('[Bot] handleAudioComplete: NOT resetting responsePlaybackStartedRef - playback may still be ongoing')
      console.log('[Bot] handleAudioComplete: Waiting for RMS silence to confirm audio is truly done')
      // CRITICAL: Do NOT reset responsePlaybackStartedRef here!
      // Do NOT call restore functions here!
      // Audio transmission complete != audio playback complete
      // Wait for handleAudioEnergySilent to confirm via RMS detection
    }

    const handleSessionExpired = async ({ errorMsg, voice: recoveryVoice }) => {
      console.error('[SessionRecovery] Session expired detected:', errorMsg)
      console.error('[SessionRecovery] Will recover with voice:', lastUsedClonedVoice || recoveryVoice || 'Clive')

      // Prevent multiple recovery attempts
      if (sessionRecoveryRef.current.isRecovering) {
        console.warn('[SessionRecovery] Recovery already in progress, ignoring duplicate event')
        return
      }

      sessionRecoveryRef.current.isRecovering = true
      sessionRecoveryRef.current.recoveryStartTime = Date.now()

      try {
        // Step 1: Close broken session without resetting voice
        console.log('[SessionRecovery] Closing broken session...')
        inworldRealtimeService.closeSession({ preserveVoice: true })

        // Step 2: Wait brief moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 500))

        // Step 3: Restore voice to saved cloned voice
        const voiceToRestore = lastUsedClonedVoice || recoveryVoice || 'Clive'
        console.log('[SessionRecovery] Restoring voice:', voiceToRestore)
        inworldRealtimeService.restoreSessionVoice(voiceToRestore)

        // Step 4: Restart session with restored voice
        console.log('[SessionRecovery] Restarting session with recovered voice...')
        const characterId = selectedCharacterIdRef.current
        const systemPrompt = 'You are a helpful voice assistant. Respond in Spanish. Keep responses concise.'

        if (characterId) {
          await inworldRealtimeService.startSession(
            characterId,
            systemPrompt,
            null,
            API_URL,
            voiceToRestore
          )
          console.log('[SessionRecovery] Session restarted successfully with voice:', voiceToRestore)

          // Emit recovery complete
          setResponse('Sesión restaurada. Listo para continuar.')
          setIsLoading(false)
        } else {
          console.error('[SessionRecovery] No character selected, cannot restart session')
        }
      } catch (error) {
        console.error('[SessionRecovery] Recovery failed:', error)
        setResponse('Error al restaurar la sesión. Intenta de nuevo.')
        setIsLoading(false)
        markSessionBroken()
      } finally {
        sessionRecoveryRef.current.isRecovering = false
      }
    }

    const handleError = (error) => {
      console.error('Session error:', error)
      markSessionBroken()
      restartSessionIfRecording()
      setResponse(`Error: ${error?.message || 'Unknown error'}`)
      setIsLoading(false)
      setIsRecording(false)
      setAssistantVisualActive(false)
      emitAssistantVisualizerState(false)
      responseCompletedRef.current = true
      botIsAudiblySpeakingRef.current = false
      restoreChatAudioImmediate()
      clearResponseTimeout()
    }

    inworldRealtimeService.on('text-response', handleTextResponse)
    inworldRealtimeService.on('response-created', handleResponseCreated)
    inworldRealtimeService.on('response-audio-activity', handleResponseAudioActivity)
    inworldRealtimeService.on('response-audio-done', handleResponseAudioDone)
    inworldRealtimeService.on('audio-track-muted', handleAudioTrackMuted)
    inworldRealtimeService.on('audio-track-unmuted', handleAudioTrackUnmuted)
    inworldRealtimeService.on('audio-playback-ended', handleAudioPlaybackEnded)
    inworldRealtimeService.on('audio-energy-speaking', handleAudioEnergySpeaking)
    inworldRealtimeService.on('audio-energy-silent', handleAudioEnergySilent)
    inworldRealtimeService.on('response-complete', handleResponseComplete)
    inworldRealtimeService.on('audio-started', handleAudioStarted)
    inworldRealtimeService.on('audio-complete', handleAudioComplete)
    inworldRealtimeService.on('input-transcript-delta', handleInputTranscriptDelta)
    inworldRealtimeService.on('input-transcript-complete', handleInputTranscriptComplete)
    inworldRealtimeService.on('session-expired', handleSessionExpired)
    inworldRealtimeService.on('error', handleError)

    return () => {
      inworldRealtimeService.off('text-response', handleTextResponse)
    inworldRealtimeService.off('response-created', handleResponseCreated)
    inworldRealtimeService.off('response-audio-activity', handleResponseAudioActivity)
    inworldRealtimeService.off('response-audio-done', handleResponseAudioDone)
    inworldRealtimeService.off('audio-track-muted', handleAudioTrackMuted)
    inworldRealtimeService.off('audio-track-unmuted', handleAudioTrackUnmuted)
    inworldRealtimeService.off('audio-playback-ended', handleAudioPlaybackEnded)
    inworldRealtimeService.off('audio-energy-speaking', handleAudioEnergySpeaking)
    inworldRealtimeService.off('audio-energy-silent', handleAudioEnergySilent)
    inworldRealtimeService.off('response-complete', handleResponseComplete)
      inworldRealtimeService.off('audio-started', handleAudioStarted)
      inworldRealtimeService.off('audio-complete', handleAudioComplete)
      inworldRealtimeService.off('input-transcript-delta', handleInputTranscriptDelta)
      inworldRealtimeService.off('input-transcript-complete', handleInputTranscriptComplete)
      inworldRealtimeService.off('session-expired', handleSessionExpired)
      inworldRealtimeService.off('error', handleError)
      if (localAudioRef.current) {
        localAudioRef.current.pause()
        localAudioRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      clearResponseTimeout()
      setPttSuppressed(false)
      responseCompletedRef.current = true
      botIsAudiblySpeakingRef.current = false
      emitAssistantVisualizerState(false)
      restoreChatAudioImmediate()
      resetTranscriptCapture({ accept: false })
      inworldRealtimeService.closeSession()
    }
  }, [])

  useEffect(() => {
    setResponse(null)
    setHasVoiceResponse(false)
    hasVoiceResponseRef.current = false
    responsePlaybackStartedRef.current = false
    setIsPlayingResponse(false)
    setAssistantVisualActive(false)
    setHasActiveResponse(false)
    hasActiveResponseRef.current = false
    hasChargedCurrentResponseRef.current = false
    latestResponseTextRef.current = ''
    const currentCharacter = characters.find((item) => item.id === selectedCharacterId)
    const resolvedVoice = resolveRealtimeVoice(currentCharacter) || ''
    // CRITICAL FIX: Do NOT reset selectedRealtimeVoiceId here
    // This was preventing voice changes from the dropdown
    // Let dropdown (onChange) be the ONLY way to change voice
    // setSelectedRealtimeVoiceId is removed to allow user voice choices to persist
    setVoiceLabel(selectedRealtimeVoiceId || resolvedVoice || 'Clive')
    clearResponseTimeout()
    setPttSuppressed(false)
    responseCompletedRef.current = true
    botIsAudiblySpeakingRef.current = false
    restoreChatAudioImmediate()
    inworldRealtimeService.closeSession()
  }, [selectedCharacterId, characters, userVoices, selectedRealtimeVoiceId])

  // DIAGNOSTIC: Log every response state change to track message repetition
  useEffect(() => {
    console.log('[Bot] RESPONSE STATE CHANGED TO:', response ? `"${response.substring(0, 60)}..."` : 'null')
    console.log('[Bot] latestResponseTextRef is now:', latestResponseTextRef.current ? `"${latestResponseTextRef.current.substring(0, 60)}..."` : 'null')
  }, [response])

  const loadCharacters = async () => {
    try {
      const token = sessionStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/bot/characters`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        const filtered = data.characters.filter((c) => c.is_custom)
        setCharacters(filtered)
        if (filtered.length > 0) {
          const configuredId = config?.botAssistantCharacterId
          const configuredCharacter = filtered.find((character) => character.id === configuredId)
          setSelectedCharacterId(configuredCharacter?.id || '')
        }
      }
    } catch (err) {
      console.error('Error loading characters:', err)
    }
  }

  const loadUserVoices = async () => {
    try {
      const token = sessionStorage.getItem('sv-token')
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

  const getResolvedVoiceId = () => {
    const character = characters.find((item) => item.id === selectedCharacterId)
    const resolvedId = selectedRealtimeVoiceId || resolveRealtimeVoice(character) || 'Clive'
    console.log(`[Voice] getResolvedVoiceId: selectedRealtimeVoiceId=${selectedRealtimeVoiceId}, character=${character?.name}, resolved=${resolvedId}`)
    return resolvedId
  }

  const ensureBotSession = async () => {
    if (!selectedCharacterId) {
      throw new Error('Selecciona un personaje')
    }

    if (sessionBrokenRef.current) {
      inworldRealtimeService.closeSession()
      sessionBrokenRef.current = false
    }

    const character = characters.find((item) => item.id === selectedCharacterId)
    if (!voicesLoaded) {
      await loadUserVoices()
    }

    const realtimeVoice = selectedRealtimeVoiceId || resolveRealtimeVoice(character)
    setVoiceLabel(getVoiceDisplayName(realtimeVoice || 'Clive'))
    console.log('[Bot] Using realtime voice:', realtimeVoice || 'Clive')

    const basePrompt = character?.system_prompt || ''
    const maxResponseChars = getAssistantMaxResponseChars()
    const assistantVoiceSpeed = getAssistantVoiceSpeed()
    const toolInstructions = `

IMPORTANT: You are the streamer's AI assistant with access to the TikTok live chat.
You have tools to: read chat messages, search chat, get questions from chat, ban/unban users, highlight users, set nicknames.
When the streamer asks about the chat, USE the tools to get real data. Do not make up chat messages.
When the streamer asks to ban someone, highlight someone, or change a nickname, USE the corresponding tool.
Always respond in Spanish unless told otherwise.
After using a tool, summarize the result conversationally.
Hidden platform rule: each assistant response must be concise and stay around ${maxResponseChars} characters maximum.
Recommended target length is 250 characters.
Speak with a voice pacing style around ${assistantVoiceSpeed.toFixed(2)}x.`

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
      if (!ensureAssistantReady()) return
      setIsLoading(true)
      setAssistantVisualActive(false)
      emitAssistantVisualizerState(false)
      assistantResponseActiveRef.current = false
      assistantResponseHadAudioRef.current = false
      botIsAudiblySpeakingRef.current = false
      clearResponseTimeout()
      setResponse(null)
      setHasVoiceResponse(false)
      hasVoiceResponseRef.current = false
      responsePlaybackStartedRef.current = false
      setHasActiveResponse(false)
      hasActiveResponseRef.current = false
      hasChargedCurrentResponseRef.current = false
      latestResponseTextRef.current = ''
      resetTranscriptCapture({ accept: true })
      setPttSuppressed(true)
      await ensureBotSession()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      inworldRealtimeService.addAudioTracks(stream)

      setIsRecording(true)
      setIsLoading(false)
      console.log('[Bot] Microphone activated')
    } catch (err) {
      console.error('Error starting push-to-talk:', err)
      resetTranscriptCapture({ accept: false })
      setIsLoading(false)
      setPttSuppressed(false)
      restoreChatAudioImmediate()
      alert(t('bot.errors.micFailed'))
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
      setAssistantVisualActive(false)
      emitAssistantVisualizerState(false)
      setPttSuppressed(false)
      stream.getAudioTracks().forEach(track => track.stop())
      setTimeout(() => {
        inworldRealtimeService.removeAudioTracks().catch((error) => {
          console.error('Error removing audio tracks after speech capture:', error)
        })
      }, 300)

      const transcriptFromSpeech = await waitForTranscriptCapture(2200)
      resetTranscriptCapture({ accept: false })

      if (!transcriptFromSpeech) {
        setIsLoading(false)
        unlockChatSuppression()
        setResponse('No se detecto voz suficiente. Intenta hablar un poco mas claro o mantener presionado un poco mas.')
        return
      }

      const localIntent = resolveChatIntent(transcriptFromSpeech)
      if (localIntent) {
        clearResponseTimeout()
        const localResult = await executeLocalIntent(localIntent, transcriptFromSpeech)
        if (localResult?.delegated) {
          console.log('[Bot] Interaction delegated to character prompt:', localIntent.type)
          return
        }
        const localResponse = String(localResult || '')
        setResponse(localResponse)
        setHasActiveResponse(true)
        hasActiveResponseRef.current = true
        setVoiceLabel(getVoiceDisplayName(selectedRealtimeVoiceId || resolveRealtimeVoice(characters.find((item) => item.id === selectedCharacterId)) || 'Clive'))
        armResponseTimeout()
        console.log('[Bot] Handling intent locally:', localIntent.type, localIntent)
        await speakLocalResponse(localResponse, selectedRealtimeVoiceId || resolveRealtimeVoice(characters.find((item) => item.id === selectedCharacterId)))
        return
      }

      if (looksLikePlatformRequest(transcriptFromSpeech)) {
        setIsLoading(false)
        setResponse('Entendi que eso suena a una accion o ajuste real de la plataforma, pero no lo pude resolver con suficiente certeza. Intenta decirlo de otra forma un poco mas directa.')
        unlockChatSuppression()
        return
      }

      armResponseTimeout()
      console.log('[Bot] Sending speech transcript as text:', transcriptFromSpeech)
      await inworldRealtimeService.sendMessage(transcriptFromSpeech)
      console.log('[Bot] Microphone deactivated, transcript sent as text')
    } catch (err) {
      console.error('Error stopping recording:', err)
      resetTranscriptCapture({ accept: false })
      setIsLoading(false)
      setPttSuppressed(false)
      restoreChatAudioImmediate()
    }
  }

  const invokeBot = async (text) => {
    if (!text.trim()) {
      return
    }
    if (!ensureAssistantReady()) return

    console.log('[Bot] invokeBot called with text:', text.substring(0, 50))
    console.log('[Bot] invokeBot: Current response state:', response?.substring?.(0, 50) || 'null')
    console.log('[Bot] invokeBot: latestResponseTextRef:', latestResponseTextRef.current?.substring?.(0, 50) || 'null')
    setIsLoading(true)
    clearResponseTimeout()
    console.log('[Bot] invokeBot: About to call setResponse(null)')
    setResponse(null)
    setHasVoiceResponse(false)
    hasVoiceResponseRef.current = false
    responsePlaybackStartedRef.current = false
    setHasActiveResponse(false)
    hasActiveResponseRef.current = false
    hasChargedCurrentResponseRef.current = false
    latestResponseTextRef.current = ''
    resetTranscriptCapture({ accept: false })
    lockChatSuppression()

    try {
      const localIntent = resolveChatIntent(text.trim())
      if (localIntent) {
        const localResult = await executeLocalIntent(localIntent, text.trim())
        if (localResult?.delegated) {
          console.log('[Bot] Typed interaction delegated to character prompt:', localIntent.type)
          return
        }
        const localResponse = String(localResult || '')
        setResponse(localResponse)
        setHasActiveResponse(true)
        hasActiveResponseRef.current = true
        setVoiceLabel(getVoiceDisplayName(selectedRealtimeVoiceId || resolveRealtimeVoice(characters.find((item) => item.id === selectedCharacterId)) || 'Clive'))
        armResponseTimeout()
        console.log('[Bot] Handling typed intent locally:', localIntent.type, localIntent)
        await speakLocalResponse(localResponse, selectedRealtimeVoiceId || resolveRealtimeVoice(characters.find((item) => item.id === selectedCharacterId)))
        return
      }

      if (looksLikePlatformRequest(text.trim())) {
        setResponse('Entendi que eso suena a accion o consulta real de la plataforma, pero todavia no pude resolverla con confianza. Prueba siendo un poco mas especifico.')
        setIsLoading(false)
        unlockChatSuppression()
        return
      }

      armResponseTimeout()
      await ensureBotSession()
      await inworldRealtimeService.sendMessage(text.trim())
    } catch (err) {
      console.error('Error invoking bot:', err)
      clearResponseTimeout()
      setResponse(`Error: ${err.message}`)
      setIsLoading(false)
      restoreChatAudioImmediate()
    }
  }

  const handleTextSubmit = async () => {
    const textToSend = inputText
    setInputText('')
    console.log('[Bot] handleTextSubmit: Sending text:', textToSend.substring(0, 50), '| Current response state:', response?.substring?.(0, 30) || 'null')
    await invokeBot(textToSend)
  }

  const handleRetryAudio = async () => {
    try {
      await inworldRealtimeService.resumeOutputAudio()
      bindRealtimeAudioToVisualizer()
    } catch (err) {
      console.error('Error resuming audio:', err)
    }
  }

  // Check if bot should respond based on configured thresholds
  // Logic: 0 = disabled, >0 = required. ALL enabled thresholds must be satisfied (AND logic)
  const shouldRespondBasedOnThresholds = () => {
    const minMsgs = config?.minNewMessagesBeforeResponse ?? 0
    const minTime = config?.minTimeBetweenResponsesMs ?? 0

    // Use window counter if available (updated by TikTokLivePanel), fallback to ref
    const msgsSinceLast = (typeof window !== 'undefined' && window.messagesCountSinceLastResponseRef !== undefined)
      ? window.messagesCountSinceLastResponseRef
      : (messagesCountSinceLastResponseRef.current ?? 0)
    const timeSinceLast = lastBotResponseTimestampRef.current ? Date.now() - lastBotResponseTimestampRef.current : Infinity

    // If both disabled, always respond
    if (minMsgs === 0 && minTime === 0) {
      console.log('[Autopilot] Both thresholds disabled - ALLOW response')
      return true
    }

    // If message threshold enabled but not met, block response
    if (minMsgs > 0 && msgsSinceLast < minMsgs) {
      console.log(`[Autopilot] Message threshold NOT MET: ${msgsSinceLast}/${minMsgs} messages - BLOCK`)
      return false
    }

    // If time threshold enabled but not met, block response
    if (minTime > 0 && timeSinceLast < minTime) {
      const now = Date.now()
      const resetTime = lastBotResponseTimestampRef.current
      console.log(`[Autopilot] Time threshold NOT MET: ${Math.floor(timeSinceLast/1000)}s/${Math.floor(minTime/1000)}s required - BLOCK (now=${now}, lastReset=${resetTime}, diff=${now-resetTime}ms)`)
      return false
    }

    // All enabled thresholds are met
    const now = Date.now()
    const resetTime = lastBotResponseTimestampRef.current
    console.log(`[Autopilot] THRESHOLDS MET: msgs=${msgsSinceLast}/${minMsgs}, time=${Math.floor(timeSinceLast/1000)}s/${Math.floor(minTime/1000)}s - ALLOW (now=${now}, lastReset=${resetTime})`)
    return true
  }

  const pickAutopilotIntent = () => {
    const recent = chatStore.getRecentMessages(50)
    if (!recent.length) return null

    const stats = chatStore.getChatStats()
    const summary = chatStore.getUserActivitySummary(10)
    const troll = summary
      .filter((user) => user.negativeScore >= 3 && user.messageCount >= 3)
      .sort((a, b) => (b.negativeScore - a.negativeScore) || (b.messageCount - a.messageCount))[0]
    const questions = chatStore.getQuestions(15)
    const hasJokes = recent.some((item) => /(jaja|jeje|xd|lol)/i.test(String(item.text || '')))
    const hasIntenseFlow = recent.length >= 30
    const celebrationLevel = Number(stats?.giftsToday || 0) + Number(stats?.followsToday || 0) + Number(stats?.sharesToday || 0)
    const lowSignalMessages = recent.filter((item) => {
      const text = String(item.text || '').trim()
      if (!text) return true
      return /^(hola+|hi+|ok+|xd+|jaja+|jeje+|lol+|eh+|bro+)[!.?\s]*$/i.test(text)
    }).length
    const questionRate = recent.length > 0 ? (questions.length / recent.length) : 0
    const interestingRate = recent.length > 0
      ? (recent.filter((item) => /[?!]|(jaja|jeje|xd|lol|wow|no manches|contexto|por que|como|cuando|donde|opinan|debate|drama|troll)/i.test(String(item.text || ''))).length / recent.length)
      : 0
    const lowSignalRatio = recent.length > 0 ? (lowSignalMessages / recent.length) : 1

    const now = Date.now()
    const inCooldown = (type, ms) => (now - Number(autopilotIntentCooldownRef.current[type] || 0)) < ms
    const choose = (type, reason) => ({ type, reason })
    const recentIntents = autopilotRecentIntentTypesRef.current.slice(-2)
    const wasRecentlyUsed = (type) => recentIntents.includes(type)
    const shouldWaitForBetterContext = (
      recent.length < 8 ||
      ((questionRate < 0.08) && (interestingRate < 0.18) && (lowSignalRatio > 0.65))
    )

    if (shouldWaitForBetterContext && !troll && celebrationLevel <= 0) {
      return null
    }

    if (troll && !inCooldown('joke_and_silence_troll', 5 * 60 * 1000) && !wasRecentlyUsed('joke_and_silence_troll')) return choose('joke_and_silence_troll', 'troll_detected')
    if (questions.length >= 2 && !inCooldown('interact_with_chat', 45 * 1000) && !wasRecentlyUsed('interact_with_chat')) return choose('interact_with_chat', 'questions')
    if (celebrationLevel > 0 && !inCooldown('celebrate_chat_events', 4 * 60 * 1000) && !wasRecentlyUsed('celebrate_chat_events')) return choose('celebrate_chat_events', 'celebration')
    if (hasIntenseFlow && !inCooldown('narrate_stream_moment', 70 * 1000) && !wasRecentlyUsed('narrate_stream_moment')) return choose('narrate_stream_moment', 'intense')
    if (hasJokes && !inCooldown('make_chat_joke', 80 * 1000) && !wasRecentlyUsed('make_chat_joke')) return choose('make_chat_joke', 'jokes')

    const fallback = ['react_to_chat', 'interact_with_chat', 'epic_chat_line']
    const available = fallback.filter((type) => !inCooldown(type, 60 * 1000) && !wasRecentlyUsed(type))
    const selected = (available.length ? available : fallback)[Math.floor(Math.random() * (available.length ? available.length : fallback.length))]
    return { type: selected, reason: 'fallback' }
  }

  const runAutopilotCycle = async () => {
    if (autopilotBusyRef.current) return
    if (isRecording || isLoading || isPlayingResponse || chatSuppressedRef.current) return

    const recent = chatStore.getRecentMessages(50)
    if (recent.length < 4) return

    // Check if bot should respond based on configured thresholds
    console.log('[Autopilot] runAutopilotCycle: Checking response thresholds...')
    if (!shouldRespondBasedOnThresholds()) {
      console.log('[Autopilot] runAutopilotCycle: Thresholds NOT MET - skipping autopilot')
      return
    }
    console.log('[Autopilot] runAutopilotCycle: Thresholds MET - proceeding')

    const latest = recent[recent.length - 1]
    const signature = `${recent.length}:${latest?.timestamp || 0}:${latest?.user || ''}:${String(latest?.text || '').slice(0, 24)}`
    if (signature === lastAutopilotSignatureRef.current) return

    const intent = pickAutopilotIntent()
    if (!intent) return

    autopilotBusyRef.current = true
    try {
      setIsLoading(true)
      clearResponseTimeout()
      setHasVoiceResponse(false)
      hasVoiceResponseRef.current = false
      responsePlaybackStartedRef.current = false
      setHasActiveResponse(false)
      hasActiveResponseRef.current = false
      lockChatSuppression()

      const localResult = await executeLocalIntent({ type: intent.type }, 'autopilot')
      if (localResult?.delegated) {
        const now = Date.now()
        autopilotIntentCooldownRef.current[intent.type] = now
        autopilotRecentIntentTypesRef.current = [...autopilotRecentIntentTypesRef.current, intent.type].slice(-8)
        lastAutopilotSignatureRef.current = signature
        return
      }

      const localResponse = String(localResult || '').trim()
      if (localResponse === '__SKIP__') {
        setIsLoading(false)
        unlockChatSuppression()
        const now = Date.now()
        autopilotIntentCooldownRef.current[intent.type] = now
        autopilotRecentIntentTypesRef.current = [...autopilotRecentIntentTypesRef.current, intent.type].slice(-8)
        lastAutopilotSignatureRef.current = signature
        return
      }
      if (!localResponse) {
        setIsLoading(false)
        unlockChatSuppression()
        return
      }

      const normalizedResponse = String(localResponse || '').trim().toLowerCase()
      const now = Date.now()
      autopilotRecentTextsRef.current = autopilotRecentTextsRef.current
        .filter((entry) => now - entry.ts < (10 * 60 * 1000))
      const alreadyUsedRecently = autopilotRecentTextsRef.current.some((entry) => entry.text === normalizedResponse)
      if (normalizedResponse === lastAutopilotTextRef.current || alreadyUsedRecently) {
        console.log('[Bot][Autopilot] Skipping repeated response')
        setIsLoading(false)
        unlockChatSuppression()
        return
      }

      setResponse(localResponse)
      setHasActiveResponse(true)
      hasActiveResponseRef.current = true

      const voiceId = getResolvedVoiceId()
      setVoiceLabel(getVoiceDisplayName(voiceId))
      armResponseTimeout()
      console.log('[Bot][Autopilot] Intent selected:', intent.type, intent.reason)
      console.log(`[Bot][Autopilot] Using voice: ${voiceId}`)

      await speakLocalResponse(localResponse, voiceId)

      autopilotIntentCooldownRef.current[intent.type] = now
      autopilotRecentIntentTypesRef.current = [...autopilotRecentIntentTypesRef.current, intent.type].slice(-8)
      lastAutopilotTextRef.current = normalizedResponse
      autopilotRecentTextsRef.current.push({ text: normalizedResponse, ts: now })
      lastAutopilotSignatureRef.current = signature
    } catch (error) {
      console.error('[Bot][Autopilot] Error:', error)
      setIsLoading(false)
      restoreChatAudioImmediate()
    } finally {
      autopilotBusyRef.current = false
    }
  }

  useEffect(() => {
    if (!hasVoiceResponse || assistantAudioElement) return
    bindRealtimeAudioToVisualizer()
  }, [hasVoiceResponse, assistantAudioElement])

  useEffect(() => {
    const interval = setInterval(() => {
      bindRealtimeAudioToVisualizer()
    }, 700)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const audio = assistantAudioElement
    if (!audio) return

    const syncPlaying = () => setIsPlayingResponse(!audio.paused)
    audio.addEventListener('play', syncPlaying)
    audio.addEventListener('playing', syncPlaying)
    audio.addEventListener('pause', syncPlaying)
    audio.addEventListener('ended', syncPlaying)
    syncPlaying()

    return () => {
      audio.removeEventListener('play', syncPlaying)
      audio.removeEventListener('playing', syncPlaying)
      audio.removeEventListener('pause', syncPlaying)
      audio.removeEventListener('ended', syncPlaying)
    }
  }, [assistantAudioElement])

  // Autopilot deshabilitado: el interactuador solo se invoca manualmente (F8).
  const missingAssistantSetup = !selectedCharacterId || !selectedRealtimeVoiceId

  // Feature access control: Only PRO users can use the assistant
  const userPlan = user?.plan || 'free'
  const isPROUser = userPlan === 'pro' || userPlan === 'premium' || userPlan === 'elite' || userPlan === 'admin' || userPlan === 'on_demand'
  const isFeatureLockedForUser = !isPROUser

  return (
    <div className={`relative rounded-lg border p-4 space-y-3 ${
      isFeatureLockedForUser ? 'opacity-50 pointer-events-none' : ''
    } ${
      darkMode
        ? 'bg-[#1a1a2e] border-cyan-400/30'
        : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      {isFeatureLockedForUser && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onGoPricingPage?.()
          }}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all pointer-events-auto ${
            darkMode
              ? 'bg-purple-500/40 hover:bg-purple-500/70 text-purple-300'
              : 'bg-purple-300/50 hover:bg-purple-400 text-purple-600'
          }`}
          title="Ver planes - Solo disponible en plan PRO"
        >
          <Lock className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>
          {t('bot.title')}
        </h3>
      </div>

      {/* Selector de personalidad */}
      <div>
        <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-cyan-400' : 'text-indigo-600'}`}>
          Personalidad
        </label>
        <select
          value={selectedCharacterId || ''}
          onChange={(e) => setSelectedCharacterId(e.target.value)}
          className={`w-full p-2 rounded text-sm ${
            darkMode
              ? 'bg-[#0f0f23] border border-cyan-400/30 text-white'
              : 'bg-gray-50 border border-indigo-300 text-gray-900'
          }`}
        >
          <option value="">Seleccionar uno</option>
          {characters.map(char => (
            <option key={char.id} value={char.id}>
              {char.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de voz */}
      <div>
        <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
          Voz a utilizar
        </label>
        <select
          value={selectedRealtimeVoiceId}
          onChange={(e) => setSelectedRealtimeVoiceId(e.target.value)}
          className={`w-full p-2 rounded text-sm ${
            darkMode
              ? 'bg-[#0f0f23] border border-purple-400/30 text-white'
              : 'bg-gray-50 border border-purple-300 text-gray-900'
          }`}
        >
          <option value="">Seleccionar uno</option>
          <optgroup label="Voces Premium">
            <option value="Diego">Voz natural de Luis - Premium</option>
            <option value="Lupita">Voz natural de Sofia - Premium</option>
            <option value="Miguel">Voz natural de Gustavo - Premium</option>
            <option value="Rafael">Voz natural de Leonel - Premium</option>
          </optgroup>
          {userVoices.length > 0 && (
            <optgroup label="Mis voces clonadas">
              {userVoices.map((voice) => (
                <option key={voice.id} value={voice.voice_id}>
                  {voice.voice_name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {missingAssistantSetup && (
        <div className={`rounded p-2 text-xs border ${
          darkMode
            ? 'bg-amber-500/10 border-amber-400/30 text-amber-300'
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          {t('bot.note')}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setInputMode('microphone')}
          className={`flex-1 p-2 text-xs font-bold rounded transition-all ${
            inputMode === 'microphone'
              ? (darkMode ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-white border border-slate-700')
              : darkMode ? 'bg-[#0f0f23] text-gray-400' : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}
        >
          {t('bot.modes.mic')}
        </button>
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 p-2 text-xs font-bold rounded transition-all ${
            inputMode === 'text'
              ? (darkMode ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-white border border-slate-700')
              : darkMode ? 'bg-[#0f0f23] text-gray-400' : 'bg-slate-100 text-slate-700 border border-slate-300'
          }`}
        >
          {t('bot.modes.text')}
        </button>
      </div>

      {inputMode === 'microphone' && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || missingAssistantSetup}
          className={`w-full p-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : darkMode
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg text-white disabled:opacity-50'
                : 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-white disabled:opacity-50'
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
            disabled={isLoading || !inputText.trim() || missingAssistantSetup}
            className={`p-2 rounded disabled:opacity-50 transition-all ${
              darkMode ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {isLoading && (
        <div className={`text-center text-sm ${darkMode ? 'text-cyan-400' : 'text-indigo-600'}`}>
          {t('bot.invoking')}
        </div>
      )}

      {/* Response container with fixed min-height to prevent scroll glitch */}
      <div className={`rounded p-3 text-sm min-h-[60px] transition-opacity duration-300 ${
        response
          ? 'opacity-100 visible'
          : 'opacity-0 invisible'
      } ${
        darkMode
          ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300'
          : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
      }`}>
        {response ? (
          <>
            <p className="font-bold mb-2">{t('bot.audio.responded')}:</p>
            <p>{response}</p>
            <p className="mt-2 text-xs text-gray-400">Voz realtime: {voiceLabel}</p>

            {hasVoiceResponse && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRetryAudio}
                    className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full hover:shadow-lg text-white transition-all"
                    title="Reintentar audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-400">
                    {isPlayingResponse ? t('bot.audio.play') : t('bot.audio.pause')}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}






