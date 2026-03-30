import { useState, useRef, useEffect } from 'react'
import { Mic2, Send, X, Volume2 } from 'lucide-react'
import inworldRealtimeService from '../services/inworldRealtimeService'
import chatStore from '../services/chatStore.js'

const BUILTIN_VOICE_OPTIONS = [
  { id: 'es-ES', name: 'Voz Basica Espanol' },
  { id: 'en-US', name: 'Voz Basica Ingles' },
  { id: 'Diego', name: 'Diego' },
  { id: 'Lupita', name: 'Lupita' },
  { id: 'Miguel', name: 'Miguel' },
  { id: 'Rafael', name: 'Rafael' }
]

const CONFIG_COMMANDS = [
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

export default function BotInvoker({ darkMode = true, onClose, config, updateConfig }) {
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
  const shortcutFnRef = useRef({}) // refs to latest recording fns for shortcut handler
  const hasVoiceResponseRef = useRef(false)
  const responsePlaybackStartedRef = useRef(false)
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

  const tokenizeIntentText = (text) => {
    return normalizeIntentText(text)
      .replace(/[^a-z0-9._\s-]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
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

    const voiceMatch = normalized.match(/(?:cambia|pon|usa|asigna|deja)\s+(?:la\s+)?voz\s+(general|de\s+donadores|de\s+moderadores|de\s+notificaciones)\s+(?:a|por)\s+(.+)/i)
    if (voiceMatch) {
      const targetMap = {
        general: { key: 'generalVoiceId', label: 'voz general' },
        'de donadores': { key: 'donorVoiceId', label: 'voz de donadores', enableKey: 'donorVoiceEnabled' },
        'de moderadores': { key: 'modVoiceId', label: 'voz de moderadores', enableKey: 'modVoiceEnabled' },
        'de notificaciones': { key: 'notifVoiceId', label: 'voz de notificaciones', enableKey: 'notifVoiceEnabled' }
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
    const token = localStorage.getItem('sv-token')
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
      hasVoiceResponseRef.current = true
      responsePlaybackStartedRef.current = true
      setHasVoiceResponse(true)
      setIsPlayingResponse(true)
      setIsLoading(false)
      clearResponseTimeout()
    }

    audio.onended = () => {
      responsePlaybackStartedRef.current = false
      setIsPlayingResponse(false)
      setChatSuppressed(false)
      localAudioRef.current = null
    }

    audio.onerror = () => {
      responsePlaybackStartedRef.current = false
      setIsPlayingResponse(false)
      setChatSuppressed(false)
      localAudioRef.current = null
    }

    await audio.play()
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
      clearResponseTimeout()
      if (!responsePlaybackStartedRef.current && !hasVoiceResponseRef.current) {
        setChatSuppressed(false)
      }
    }

    const handleAudioStarted = () => {
      hasVoiceResponseRef.current = true
      responsePlaybackStartedRef.current = true
      setHasActiveResponse(true)
      hasActiveResponseRef.current = true
      setHasVoiceResponse(true)
      setIsPlayingResponse(true)
      setIsLoading(false)
      clearResponseTimeout()
      setResponse((current) => current === 'La IA tardó demasiado en responder. Intenta de nuevo.' ? null : current)
    }

    const handleAudioComplete = () => {
      responsePlaybackStartedRef.current = false
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
    hasVoiceResponseRef.current = false
    responsePlaybackStartedRef.current = false
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
      hasVoiceResponseRef.current = false
      responsePlaybackStartedRef.current = false
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

      if (looksLikePlatformRequest(transcriptFromSpeech)) {
        setIsLoading(false)
        setResponse('Entendi que eso suena a una accion o ajuste real de la plataforma, pero no lo pude resolver con suficiente certeza. Intenta decirlo de otra forma un poco mas directa.')
        setChatSuppressed(false)
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
    hasVoiceResponseRef.current = false
    responsePlaybackStartedRef.current = false
    setHasActiveResponse(false)
    hasActiveResponseRef.current = false
    setChatSuppressed(true)

    try {
      const localIntent = resolveChatIntent(text.trim())
      if (localIntent) {
        const localResponse = await executeLocalIntent(localIntent, text.trim())
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
        setChatSuppressed(false)
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

      {/* Selector de personalidad */}
      <div>
        <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-cyan-400' : 'text-indigo-600'}`}>
          🎭 Personalidad
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
          <option value="">— Elige una personalidad —</option>
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
          🔊 Voz a utilizar
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
          <option value="">— Automática según personalidad —</option>
          <optgroup label="Voces base">
            <option value="Clive">Clive (voz base)</option>
            <option value="Diego">Diego (voz base)</option>
            <option value="Lupita">Lupita (voz base)</option>
            <option value="Miguel">Miguel (voz base)</option>
            <option value="Rafael">Rafael (voz base)</option>
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
