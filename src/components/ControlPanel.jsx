import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Check, HelpCircle, Keyboard, ChevronRight, Ban, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Determina si una feature estA bloqueada segAon el plan del usuario
const isFeatureBlocked = (feature, userPlan) => {
  const plan = userPlan?.toLowerCase() || 'free'

  const blockedByPlan = {
    free: {
      // PRESETS Y BOTONES INICIO RAPIDO - BLOQUEADOS
      presets: true,
      quickStart: true,
      // TODA AREA DE VOCES - BLOQUEADA
      voicesGeneral: true,
      voicesDonor: true,
      voicesSubscriber: true,
      voicesCommunity: true,
      voicesQuestion: true,
      voicesCommand: true,
      voicesNotif: true,
      voicesModerator: true, // TAMBIAN BLOQUEADA (cambio importante)
      // FILTROS - BLOQUEADOS
      excessiveEmojis: true,
      minMessageLength: true,
      charLimit: true,
      maxQueue: true,
      // NOTIFICACIONES Y IA - BLOQUEADAS
      notifications: true,
      aiAssistant: true,
      advancedVoiceTools: true,
      // LECTURA - SOLO ALGUNOS LIBRES
      readOnlyMessage: false, // BLOQUEADO
      onlyQuestions: false, // BLOQUEADO
      onlyDonors: false, // BLOQUEADO
      onlyModerators: false, // BLOQUEADO
      onlySubscribers: false, // BLOQUEADO
      onlyCommunityMembers: false, // BLOQUEADO
      ignoreLinks: false, // BLOQUEADO
      profanityFilterEnabled: false, // BLOQUEADO
      // LIBRES EN FREE
      skipRepeated: false, // LIBRE
      onlyPlainNicks: false, // LIBRE
      stripChatEmojis: false, // LIBRE
    },
    start: {
      // PRESETS Y BOTONES INICIO RAPIDO - LIBRES
      presets: false,
      quickStart: false,
      // TODAS LAS VOCES - BLOQUEADAS
      voicesGeneral: true,
      voicesDonor: true,
      voicesSubscriber: true,
      voicesCommunity: true,
      voicesQuestion: true,
      voicesCommand: true,
      voicesNotif: true,
      voicesModerator: true, // BLOQUEADA
      // FILTROS AVANZADOS - BLOQUEADOS
      excessiveEmojis: true,
      minMessageLength: true,
      charLimit: true,
      maxQueue: true,
      // NOTIFICACIONES Y IA - BLOQUEADAS
      notifications: true,
      aiAssistant: true,
      advancedVoiceTools: true,
      // LECTURA Y FILTROS BASICOS - LIBRES
      readOnlyMessage: false, // LIBRE
      onlyQuestions: false, // LIBRE
      onlyDonors: false, // LIBRE
      onlyModerators: false, // LIBRE
      onlySubscribers: false, // LIBRE
      onlyCommunityMembers: false, // LIBRE
      ignoreLinks: false, // LIBRE
      profanityFilterEnabled: false, // LIBRE EN PLANES DE PAGA
      skipRepeated: false, // LIBRE
      onlyPlainNicks: false, // LIBRE
      stripChatEmojis: false, // LIBRE
    },
    creator: {
      presets: false,
      quickStart: false,
      voicesGeneral: false,
      voicesDonor: false,
      voicesSubscriber: false,
      voicesCommunity: false,
      voicesQuestion: false,
      voicesCommand: false,
      voicesNotif: false,
      voicesModerator: false,
      excessiveEmojis: false,
      minMessageLength: false,
      charLimit: false,
      maxQueue: false,
      notifications: false,
      aiAssistant: true, // SOLO ESTO BLOQUEADO
      advancedVoiceTools: false,
      readOnlyMessage: false,
      onlyQuestions: false,
      onlyDonors: false,
      onlyModerators: false,
      onlySubscribers: false,
      onlyCommunityMembers: false,
      ignoreLinks: false,
      profanityFilterEnabled: false,
      skipRepeated: false,
      onlyPlainNicks: false,
      stripChatEmojis: false,
    },
    pro: { all: false }, // TODO LIBRE
    premium: { all: false },
    elite: { all: false },
    admin: { all: false },
  }

  const planBlocks = blockedByPlan[plan] || blockedByPlan.free
  return planBlocks.all === false ? false : (planBlocks[feature] ?? false)
}

const normalizeUserPlan = (rawPlan = 'free') => {
  const normalized = String(rawPlan || 'free').trim().toLowerCase()
  const map = {
    premium: 'creator',
    elite: 'pro',
    on_demand: 'free',
  }
  return map[normalized] || normalized || 'free'
}

// Componente wrapper para mostrar secciones bloqueadas
function FeatureLockedOverlay({
  darkMode,
  message = 'Función no disponible en tu plan',
  showIcon = false,
  showMessage = false
}) {
  const glassClasses = darkMode
    ? 'bg-gradient-to-br from-slate-950/20 via-slate-900/14 to-slate-800/10 border border-cyan-300/14 backdrop-blur-[0.7px]'
    : 'bg-slate-900/8 border border-slate-500/20 backdrop-blur-[0.35px]'

  return (
    <div className={`absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none ${glassClasses}`}>
      <div className={`flex flex-col items-center pointer-events-auto ${showMessage || showIcon ? 'gap-2' : 'gap-0'}`}>
        {showIcon && <Lock className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`} />}
        {showMessage && (
          <span className={`text-xs font-semibold text-center ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  )
}

// Wrapper para contenido bloqueado
function BlockedSection({ blocked, children, darkMode, message = 'Disponible en otros planes' }) {
  if (!blocked) return children

  return (
    <div className="relative">
      <div className={`${blocked ? 'opacity-40 pointer-events-none' : ''}`}>
        {children}
      </div>
      {blocked && <FeatureLockedOverlay darkMode={darkMode} message={message} />}
    </div>
  )
}

function Hint({ text, darkMode }) {
  return (
    <span className="relative group ml-1 inline-flex">
      <HelpCircle className={`w-3.5 h-3.5 cursor-help ${darkMode ? 'text-gray-500 hover:text-cyan-400' : 'text-slate-500 hover:text-slate-700'} transition-colors`} />
      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${
        darkMode ? 'bg-gray-800 text-gray-200 border border-cyan-500/30' : 'bg-gray-900 text-white'
      } shadow-lg`}>{text}</span>
    </span>
  )
}

function CheckOption({ label, checked, onChange, darkMode, hint }) {
  return (
    <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
      darkMode
        ? checked
          ? 'bg-cyan-500/10 border-cyan-400/40'
          : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
        : checked
          ? 'bg-slate-100 border-slate-400 shadow-sm'
          : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
    }`}>
      <button onClick={onChange} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked
            ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800')
            : (darkMode ? 'border-gray-400' : 'border-slate-500 bg-white')
        }`}>
          {checked && <Check className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-white'}`} />}
        </div>
        <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${checked ? 'font-semibold' : 'font-medium'}`}>
          {label}
          {hint && <Hint text={hint} darkMode={darkMode} />}
        </span>
      </button>
    </div>
  )
}

function CheckWithInput({ label, checked, onToggle, value, onValueChange, placeholder, darkMode, hint }) {
  return (
    <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
      darkMode
        ? checked
          ? 'bg-cyan-500/10 border-cyan-400/40'
          : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
        : checked
          ? 'bg-slate-100 border-slate-400 shadow-sm'
          : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
    }`}>
      <button onClick={onToggle} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked
            ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800')
            : (darkMode ? 'border-gray-400' : 'border-slate-500 bg-white')
        }`}>
          {checked && <Check className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-white'}`} />}
        </div>
        <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${checked ? 'font-semibold' : 'font-medium'}`}>
          {label}
          {hint && <Hint text={hint} darkMode={darkMode} />}
        </span>
      </button>
      {checked && (
        <div className="mt-1 ml-8">
          <input
            type="number"
            value={value}
            onChange={(e) => onValueChange(parseInt(e.target.value) || 0)}
            placeholder={placeholder}
            className={`w-24 px-3 py-1.5 text-sm rounded-lg border ${
              darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
            }`}
          />
        </div>
      )}
    </div>
  )
}

function CheckWithTextInput({ label, checked, onToggle, value, onValueChange, placeholder, darkMode, hint }) {
  return (
    <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
      darkMode
        ? checked
          ? 'bg-cyan-500/10 border-cyan-400/40'
          : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
        : checked
          ? 'bg-slate-100 border-slate-400 shadow-sm'
          : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
    }`}>
      <button onClick={onToggle} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked
            ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800')
            : (darkMode ? 'border-gray-400' : 'border-slate-500 bg-white')
        }`}>
          {checked && <Check className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-white'}`} />}
        </div>
        <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${checked ? 'font-semibold' : 'font-medium'}`}>
          {label}
          {hint && <Hint text={hint} darkMode={darkMode} />}
        </span>
      </button>
      {checked && (
        <div className="mt-1 ml-8">
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
              darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
            }`}
          />
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, tone, darkMode }) {
  const tones = {
    lectura: {
      dark: { bg: '#052e26', border: '#10b981', text: '#d1fae5', left: '#34d399' },
      light: { bg: '#d1fae5', border: '#059669', text: '#065f46', left: '#059669' },
    },
    voces: {
      dark: { bg: '#082f3e', border: '#22d3ee', text: '#cffafe', left: '#06b6d4' },
      light: { bg: '#cffafe', border: '#0891b2', text: '#155e75', left: '#0891b2' },
    },
    filtros: {
      dark: { bg: '#422006', border: '#f59e0b', text: '#fef3c7', left: '#f59e0b' },
      light: { bg: '#fef3c7', border: '#d97706', text: '#78350f', left: '#d97706' },
    },
    notificaciones: {
      dark: { bg: '#4a0419', border: '#fb7185', text: '#ffe4e6', left: '#f43f5e' },
      light: { bg: '#ffe4e6', border: '#e11d48', text: '#9f1239', left: '#e11d48' },
    },
    asistente: {
      dark: { bg: '#2b0f5a', border: '#a78bfa', text: '#ede9fe', left: '#8b5cf6' },
      light: { bg: '#ede9fe', border: '#7c3aed', text: '#4c1d95', left: '#7c3aed' },
    },
  }

  const selected = tones[tone] || tones.lectura
  const palette = darkMode ? selected.dark : selected.light

  return (
    <div
      className="section-strip w-full mt-7 mb-4 px-5 py-3.5 border-2 shadow-sm"
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderLeftColor: palette.left,
        borderLeftWidth: '14px',
        color: palette.text,
        boxShadow: darkMode ? '0 8px 24px rgba(2, 6, 23, 0.35)' : '0 8px 18px rgba(15, 23, 42, 0.12)',
      }}
    >
      <span className="text-sm md:text-base font-extrabold uppercase tracking-[0.14em]">{title}</span>
    </div>
  )
}

const API_URL = import.meta.env.VITE_API_URL || ((typeof window !== 'undefined' && ['localhost','127.0.0.1'].includes(window.location.hostname)) ? 'http://localhost:3000' : 'https://voltvoice-backend.onrender.com')

const normalizeModerationList = (value) => {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const normalized = []
  for (const item of value) {
    const username = String(item?.username || '').trim().replace(/^@+/, '').toLowerCase()
    if (!username || seen.has(username)) continue
    seen.add(username)
    normalized.push({
      username,
      reason: String(item?.reason || ''),
      source: String(item?.source || 'unknown')
    })
  }
  return normalized.slice(0, 500)
}

const formatModerationReason = (reason, t) => {
  const raw = String(reason || '').trim()
  if (!raw) return t('control.moderation.banned')
  const normalized = raw.toLowerCase()
  if (normalized.includes('banned by ai assistant')) return t('control.moderation.silencedAI')
  if (normalized.includes('silenced by ai assistant')) return t('control.moderation.silencedAI')
  if (normalized.includes('banned from chat')) return t('control.moderation.silencedChat')
  if (normalized.includes('silenced from chat')) return t('control.moderation.silencedChat')
  if (normalized.includes('muted from chat')) return t('control.moderation.silencedChat')
  if (normalized.includes('banned')) return t('control.moderation.banned')
  if (normalized.includes('muted')) return t('control.moderation.banned')
  if (normalized.includes('silenced')) return t('control.moderation.banned')
  return raw
}

const formatModerationSource = (source, t) => {
  const normalized = String(source || '').trim().toLowerCase()
  if (!normalized) return t('control.moderation.sources.system')
  if (normalized === 'system') return t('control.moderation.sources.system')
  if (normalized === 'unknown') return t('control.moderation.sources.unknown')
  if (normalized === 'user') return t('control.moderation.sources.user')
  if (normalized === 'bot') return t('control.moderation.sources.bot')
  if (normalized === 'ai assistant') return t('control.moderation.sources.bot')
  if (normalized === 'assistant') return t('control.moderation.sources.bot')
  if (normalized === 'chat') return t('control.moderation.sources.chat')
  if (normalized === 'manual') return t('control.moderation.sources.manual')
  if (normalized === 'database') return t('control.moderation.sources.database')
  return t('control.moderation.sources.system')
}

function BotShortcutCapture({ darkMode, onCapture }) {
  const { t } = useTranslation()
  const [capturing, setCapturing] = useState(false)
  const captureRef = useRef(null)

  const startCapture = () => {
    setCapturing(true)
    setTimeout(() => captureRef.current?.focus(), 50)
  }

  const handleKeyDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Ignore modifier-only keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
    const displayKey = e.key === ' ' ? 'Space' : e.key
    onCapture(displayKey)
    setCapturing(false)
  }

  const handleBlur = () => {
    setCapturing(false)
  }

  return (
    <>
      {capturing ? (
        <input
          ref={captureRef}
          type="text"
          readOnly
          autoFocus
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={t('control.shortcut.press')}
          className={`w-40 px-3 py-1.5 text-sm rounded-lg border-2 outline-none animate-pulse ${
            darkMode
              ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 placeholder-cyan-500'
              : 'bg-cyan-50 border-cyan-400 text-cyan-700 placeholder-cyan-400'
          }`}
        />
      ) : (
        <button
          onClick={startCapture}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            darkMode
              ? 'border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10'
              : 'border-cyan-500/40 text-cyan-600 hover:bg-cyan-50'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          {t('control.shortcut.change')}
        </button>
      )}
    </>
  )
}

export function ControlPanel({ onClose, onGoAIRoleplay, onGoSynthesis, darkMode, config, updateConfig, user }) {
  const { t } = useTranslation()
  const [userVoices, setUserVoices] = useState([])
  const [botCharacters, setBotCharacters] = useState([])
  const [presetStatus, setPresetStatus] = useState('')
  const [showProfanityEditor, setShowProfanityEditor] = useState(false)
  const [showModerationList, setShowModerationList] = useState(false)
  const [showUserVoiceAssignments, setShowUserVoiceAssignments] = useState(false)
  const [newAssignmentUsername, setNewAssignmentUsername] = useState('')
  const [newAssignmentVoiceId, setNewAssignmentVoiceId] = useState('')
  const moderationList = normalizeModerationList(config?.sessionModerationList)
  const quickBasicChecks = {
    skipRepeated: true,
    ignoreLinks: true,
    profanityFilterEnabled: true,
    onlyPlainNicks: true,
    stripChatEmojis: true,
  }

  // Cargar voces del usuario desde la API
  const loadUserVoices = async () => {
    try {
      const token = sessionStorage.getItem('sv-token')
      if (!token) return

      const res = await fetch(`${API_URL}/api/settings/voices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success && data.voices) {
        // Convertir voces del usuario al formato correcto
        const formattedVoices = data.voices.map(v => ({
          id: v.voice_id,
          name: v.voice_name,
          owner: user?.email
        }))
        setUserVoices(formattedVoices)
      }
    } catch (err) {
      console.error('[ControlPanel] Error cargando voces:', err)
    }
  }

  // Cargar voces al montar y escuchar evento de voz nueva
  useEffect(() => {
    loadUserVoices()
    loadBotCharacters()

    // Escuchar evento cuando se agrega una voz nueva
    const handleVoiceAdded = () => {
      loadUserVoices()
    }

    window.addEventListener('voice-added', handleVoiceAdded)
    return () => window.removeEventListener('voice-added', handleVoiceAdded)
  }, [user?.email])

  const userPlan = normalizeUserPlan(user?.plan || 'free')
  const rawPlan = String(user?.plan || '').toLowerCase()
  const isBasePlan = rawPlan === 'base' || rawPlan === 'plan base'
  useEffect(() => {
    if (userPlan !== 'free') return

    const forcedOffInFree = [
      'ignoreLinks',
      'profanityFilterEnabled',
      'ignoreExcessiveEmojis',
      'minMessageLengthEnabled',
      'donorCharLimitEnabled',
      'maxQueueEnabled',
    ]

    forcedOffInFree.forEach((key) => {
      if (config?.[key]) updateConfig(key, false)
    })
  }, [
    userPlan,
    config?.ignoreLinks,
    config?.profanityFilterEnabled,
    config?.ignoreExcessiveEmojis,
    config?.minMessageLengthEnabled,
    config?.donorCharLimitEnabled,
    config?.maxQueueEnabled,
  ])
  const PREMIUM_BY_PLAN = {
    free: [], start: ['Diego'],
    creator: ['Diego', 'Lupita'],
    pro: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    premium: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    elite: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    admin: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
    on_demand: ['Diego', 'Lupita', 'Miguel', 'Rafael'],
  }
  const allowedPremium = PREMIUM_BY_PLAN[userPlan] ?? []
  const localVoiceLabelSuffix = userPlan === 'free' ? '' : ` ${t('studio.voice.unlimited')}`
  const ALL_PREMIUM = [
    { id: 'Diego', name: t('voiceNames.diegoPremium') },
    { id: 'Lupita', name: t('voiceNames.lupitaPremium') },
    { id: 'Miguel', name: t('voiceNames.miguelPremium') },
    { id: 'Rafael', name: t('voiceNames.rafaelPremium') },
  ]
  const premiumVoiceOptions = [
    { id: 'es-ES', name: `${t('studio.voiceLocal.spanish')}${localVoiceLabelSuffix}` },
    { id: 'en-US', name: `${t('studio.voiceLocal.english')}${localVoiceLabelSuffix}` },
    ...ALL_PREMIUM.filter(v => allowedPremium.includes(v.id)),
    ...userVoices,
  ]

  const botAssistantVoiceSpeed = Number.isFinite(Number(config?.botAssistantVoiceSpeed))
    ? Math.min(2, Math.max(0.5, Number(config.botAssistantVoiceSpeed)))
    : 1

  const botAssistantMaxResponseChars = Number.isFinite(Number(config?.botAssistantMaxResponseChars))
    ? Math.min(500, Math.max(50, Math.round(Number(config.botAssistantMaxResponseChars))))
    : 250

  // Funciones para voces personalizadas por usuario
  const userVoiceAssignments = config?.userVoiceAssignments || []

  const addUserVoiceAssignment = () => {
    if (!newAssignmentUsername.trim() || !newAssignmentVoiceId) return

    // Normalizar usuario: aceptar con o sin @ y guardar sin @
    let username = newAssignmentUsername.trim().toLowerCase().replace(/^@+/, '')
    const existing = userVoiceAssignments.filter(a => a.username !== username)
    const updated = [...existing, { username, voiceId: newAssignmentVoiceId }].slice(0, 50)

    updateConfig('userVoiceAssignments', updated)
    setNewAssignmentUsername('')
    setNewAssignmentVoiceId('')
  }

  const removeUserVoiceAssignment = (username) => {
    const updated = userVoiceAssignments.filter(a => a.username !== username)
    updateConfig('userVoiceAssignments', updated)
  }

  const updateUserVoiceAssignment = (username, newVoiceId) => {
    const updated = userVoiceAssignments.map(a =>
      a.username === username ? { ...a, voiceId: newVoiceId } : a
    )
    updateConfig('userVoiceAssignments', updated)
  }

  const presetKeys = ['configPreset1', 'configPreset2', 'configPreset3']

  const buildPresetSnapshot = () => {
    const {
      configPreset1,
      configPreset2,
      configPreset3,
      lastTiktokUser,
      mobilePreviewEnabled,
      mobilePreviewMuted,
      ...rest
    } = config || {}
    return JSON.parse(JSON.stringify(rest))
  }

  const savePreset = (index) => {
    const key = presetKeys[index]
    const payload = {
      name: `Preset ${index + 1}`,
      updatedAt: Date.now(),
      data: buildPresetSnapshot(),
    }
    updateConfig(key, payload)
    setPresetStatus(t('control.preset.saved', { num: index + 1 }))
  }

  const applyPreset = (index) => {
    const key = presetKeys[index]
    const preset = config?.[key]
    if (!preset?.data || typeof preset.data !== 'object') {
      setPresetStatus(t('control.preset.empty', { num: index + 1 }))
      return
    }
    Object.entries(preset.data).forEach(([k, v]) => updateConfig(k, v))
    setPresetStatus(t('control.preset.applied', { num: index + 1 }))
  }

  useEffect(() => {
    if (!presetStatus) return
    const t = setTimeout(() => setPresetStatus(''), 2200)
    return () => clearTimeout(t)
  }, [presetStatus])

  const clearAllChecks = () => {
    Object.entries(config || {}).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        updateConfig(key, false)
      }
    })
    setShowProfanityEditor(false)
    setPresetStatus(t('control.quickStart.cleared'))
  }

  const loadBotCharacters = async () => {
    try {
      const token = sessionStorage.getItem('sv-token')
      if (!token) return

      const res = await fetch(`${API_URL}/api/bot/characters`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (res.ok && data?.success && Array.isArray(data.characters)) {
        const customCharacters = data.characters.filter((character) => character?.is_custom)
        setBotCharacters(customCharacters)
      }
    } catch (err) {
      console.error('[ControlPanel] Error cargando personalidades del asistente:', err)
    }
  }

  const applyQuickBasic = () => {
    clearAllChecks()
    Object.entries(quickBasicChecks).forEach(([key, value]) => updateConfig(key, value))
    setPresetStatus(t('control.quickStart.basicApplied'))
  }

  const removeFromModerationList = async (username) => {
    const target = String(username || '').trim().replace(/^@+/, '').toLowerCase()
    if (!target) return
    try {
      const token = sessionStorage.getItem('sv-token')
      if (token) {
        await fetch(`${API_URL}/api/bans/${target}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (err) {
      console.error('[ControlPanel] Error quitando ban:', err)
    } finally {
      updateConfig('sessionModerationList', moderationList.filter((item) => item.username !== target))
    }
  }

  return (
    <div className={`control-panel-remaster ${darkMode ? "min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white" : "min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-800"}`}>
      {/* Header */}
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-colors duration-300 ${darkMode ? 'bg-slate-950/80 border-b-2 border-cyan-500/30' : 'bg-white/85 border-b-2 border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <button onClick={onClose} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all hover:-translate-x-0.5 ${
            darkMode
              ? 'border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-white/20'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
          }`}>
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 pb-1">
            {t('control.title')}
          </h1>
          <div className="w-20"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* PRESETS - BLOQUEADO EN PLAN FREE */}
          <div className={`relative mb-4 rounded-2xl border p-4 ${
            darkMode ? 'border-cyan-500/20 bg-[#12122a]/70' : 'border-indigo-200 bg-white/80'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-cyan-300' : 'text-indigo-700'}`}>
                  {t('control.sections.presetsQuick')}
                </h3>
                <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {t('control.preset.subtitle')}
                </span>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[0, 1, 2].map((idx) => {
                const preset = config?.[presetKeys[idx]]
                const hasPreset = Boolean(preset?.data)
                return (
                  <div
                    key={`preset-card-${idx + 1}`}
                    className={`rounded-xl border p-3 ${
                      darkMode ? 'border-cyan-500/25 bg-cyan-500/5' : 'border-cyan-200 bg-cyan-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-800'}`}>Preset {idx + 1}</span>
                      <span className={`text-[11px] ${hasPreset ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                        {hasPreset ? t('control.preset.savedState') : t('control.preset.emptyState')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => savePreset(idx)}
                        className={`rounded-lg py-2.5 text-xs font-bold transition ${
                          darkMode
                            ? 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 text-white hover:from-cyan-500/60 hover:to-blue-500/60 border border-cyan-400/40'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 border border-cyan-500/40'
                        }`}
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={() => applyPreset(idx)}
                        className={`rounded-lg py-2.5 text-xs font-bold transition ${
                          darkMode
                            ? 'bg-gradient-to-r from-purple-500/40 to-fuchsia-500/40 text-white hover:from-purple-500/60 hover:to-fuchsia-500/60 border border-fuchsia-400/40'
                            : 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 border border-fuchsia-500/40'
                        }`}
                      >
                        {t('common.apply')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
              {presetStatus && (
                <p className={`mt-3 text-xs font-semibold ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{presetStatus}</p>
              )}
            </div>
          </div>

          {/* BOTONES INICIO RAPIDO - BLOQUEADO EN PLAN FREE */}
          <div className={`relative mb-4 rounded-2xl border p-4 ${
            darkMode ? 'border-fuchsia-500/20 bg-[#12122a]/70' : 'border-fuchsia-200 bg-white/80'
          }`}>
            <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>
                {t('control.quickStart.title')}
              </h3>
              <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('control.quickStart.subtitle')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={applyQuickBasic}
                className={`rounded-xl py-3 text-sm font-bold transition ${
                  darkMode
                    ? 'bg-gradient-to-r from-emerald-500/40 to-cyan-500/40 text-white hover:from-emerald-500/60 hover:to-cyan-500/60 border border-emerald-400/40'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 border border-emerald-500/40'
                }`}
              >
                {t('control.quickStart.basic')}
              </button>
              <button
                onClick={clearAllChecks}
                className={`rounded-xl py-3 text-sm font-bold transition ${
                  darkMode
                    ? 'bg-gradient-to-r from-rose-500/40 to-orange-500/40 text-white hover:from-rose-500/60 hover:to-orange-500/60 border border-rose-400/40'
                    : 'bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:opacity-90 border border-rose-500/40'
                }`}
              >
                {t('control.quickStart.clear')}
              </button>
            </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* LEFT SIDE: Lectura + Notificaciones */}
            <div className="space-y-4">
              {/* LEFT COLUMN */}
              <div className={`space-y-1 rounded-xl border p-4 ${darkMode ? 'bg-slate-900/70 border-cyan-500/20' : 'bg-white border-slate-200'}`}>
                <SectionHeader title={t('control.sections.reading')} tone="lectura" darkMode={darkMode} />

              {/* AREA LECTURA - BLOQUEADA EN FREE (solo 3 elementos libres) */}
              {userPlan === 'free' ? (
                <>
                  <div className="mb-2 opacity-50 pointer-events-none">
                    <CheckOption label={t('control.reading.onlyMessage')} checked={config.readOnlyMessage} onChange={() => {}} darkMode={darkMode} />
                  </div>
                </>
              ) : (
                <CheckOption label={t('control.reading.onlyMessage')} checked={config.readOnlyMessage} onChange={() => updateConfig('readOnlyMessage', !config.readOnlyMessage)} darkMode={darkMode} hint={t('control.reading.onlyMessageHint')} />
              )}

              <CheckWithTextInput
                label={t('control.reading.byCommand')}
                checked={config.readByCommandEnabled}
                onToggle={() => {
                  const next = !config.readByCommandEnabled
                  updateConfig('readByCommandEnabled', next)
                  if (next && !String(config.readByCommandPrefix || '').trim()) {
                    updateConfig('readByCommandPrefix', 'bot/')
                  }
                }}
                value={config.readByCommandPrefix || 'bot/'}
                onValueChange={(nextValue) => updateConfig('readByCommandPrefix', nextValue)}
                placeholder={t('control.reading.byCommandPlaceholder')}
                darkMode={darkMode}
                hint={t('control.reading.byCommandHint')}
              />

              {/* SIEMPRE LIBRE EN TODOS LOS PLANES */}
              <CheckOption label={t('control.reading.skipRepeated')} checked={config.skipRepeated} onChange={() => updateConfig('skipRepeated', !config.skipRepeated)} darkMode={darkMode} hint="Ignora mensajes idAnticos consecutivos para evitar spam" />

              {/* BLOQUEADO EN FREE */}
              {userPlan === 'free' ? (
                <div className={`relative mb-2 rounded-xl px-4 py-3 border opacity-50 pointer-events-none ${
                  darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                  <div>
                    <CheckOption label={t('control.reading.onlyQuestions')} checked={config.onlyQuestions} onChange={() => {}} darkMode={darkMode} />
                    <CheckOption label={t('control.reading.onlyDonors')} checked={config.onlyDonors} onChange={() => {}} darkMode={darkMode} />
                    <CheckOption label={t('control.reading.onlyMods')} checked={config.onlyModerators} onChange={() => {}} darkMode={darkMode} />
                    <CheckOption label={t('control.reading.onlySubs')} checked={config.onlySubscribers} onChange={() => {}} darkMode={darkMode} />
                    <CheckOption label={t('control.reading.onlyCommunity')} checked={config.onlyCommunityMembers} onChange={() => {}} darkMode={darkMode} />
                  </div>
                </div>
              ) : (
                <>
                  <CheckOption label={t('control.reading.onlyQuestions')} checked={config.onlyQuestions} onChange={() => updateConfig('onlyQuestions', !config.onlyQuestions)} darkMode={darkMode} hint={t('control.reading.onlyQuestionsHint')} />
                  <CheckOption label={t('control.reading.onlyDonors')} checked={config.onlyDonors} onChange={() => updateConfig('onlyDonors', !config.onlyDonors)} darkMode={darkMode} hint="Solo lee mensajes de usuarios que enviaron regalos" />
                  <CheckOption label={t('control.reading.onlyMods')} checked={config.onlyModerators} onChange={() => updateConfig('onlyModerators', !config.onlyModerators)} darkMode={darkMode} hint={t('control.reading.onlyModsHint')} />
                  <CheckOption label={t('control.reading.onlySubs')} checked={config.onlySubscribers} onChange={() => updateConfig('onlySubscribers', !config.onlySubscribers)} darkMode={darkMode} hint={t('control.reading.onlySubsHint')} />
                  <CheckOption label={t('control.reading.onlyCommunity')} checked={config.onlyCommunityMembers} onChange={() => updateConfig('onlyCommunityMembers', !config.onlyCommunityMembers)} darkMode={darkMode} hint={t('control.reading.onlyCommunityHint')} />
                </>
              )}

              {/* SECCIÓN VOCES */}
              <div className={`relative ${(userPlan === 'free' || isBasePlan) ? 'pointer-events-none [&_.lucide-circle-help]:opacity-0 [&_.lucide-help-circle]:opacity-0' : ''}`}>
                {isBasePlan && (
                  <FeatureLockedOverlay darkMode={darkMode} message="Voces disponibles en packs" showIcon showMessage />
                )}
                <SectionHeader title={t('control.sections.voice')} tone="voces" darkMode={darkMode} />
              {/* Voz general */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border ${
                darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[15px] font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>{t('control.voiceSection.general')}</span>
                </div>
                  <select
                    value={config.generalVoiceId || 'es-ES'}
                    onChange={(e) => updateConfig('generalVoiceId', e.target.value)}
                    className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                      darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                    }`}
                  >
                    {premiumVoiceOptions.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Voz donadores - BLOQUEADA */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.donorVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.donorVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                  <button onClick={() => updateConfig('donorVoiceEnabled', !config.donorVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      config.donorVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                    }`}>
                      {config.donorVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.donorVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.donors')}<Hint text={t('control.voiceSection.donorsHint')} darkMode={darkMode} /></span>
                  </button>
                  {config.donorVoiceEnabled && (
                    <div className="mt-2 ml-8">
                      <select
                        value={config.donorVoiceId}
                        onChange={(e) => updateConfig('donorVoiceId', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      >
                        {premiumVoiceOptions.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Voz moderadores */}
              <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.modVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.modVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <button onClick={() => updateConfig('modVoiceEnabled', !config.modVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.modVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.modVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.modVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.moderators')}<Hint text={t('control.voiceSection.moderatorsHint')} darkMode={darkMode} /></span>
                </button>
                {config.modVoiceEnabled && (
                  <div className="mt-2 ml-8">
                    <select
                      value={config.modVoiceId || 'Lupita'}
                      onChange={(e) => updateConfig('modVoiceId', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                      }`}
                    >
                      {premiumVoiceOptions.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Voz suscriptores - BLOQUEADA */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.subscriberVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.subscriberVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                  <button onClick={() => updateConfig('subscriberVoiceEnabled', !config.subscriberVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.subscriberVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.subscriberVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.subscriberVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.subscribers')}<Hint text={t('control.voiceSection.subscribersHint')} darkMode={darkMode} /></span>
                </button>
                  {config.subscriberVoiceEnabled && (
                    <div className="mt-2 ml-8">
                      <select
                        value={config.subscriberVoiceId || 'Lupita'}
                        onChange={(e) => updateConfig('subscriberVoiceId', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      >
                        {premiumVoiceOptions.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Voz miembros de comunidad - BLOQUEADA */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.communityMemberVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.communityMemberVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                  <button onClick={() => updateConfig('communityMemberVoiceEnabled', !config.communityMemberVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.communityMemberVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.communityMemberVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.communityMemberVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.communityMembers')}<Hint text={t('control.voiceSection.communityMembersHint')} darkMode={darkMode} /></span>
                </button>
                  {config.communityMemberVoiceEnabled && (
                    <div className="mt-2 ml-8">
                      <select
                        value={config.communityMemberVoiceId || 'Lupita'}
                        onChange={(e) => updateConfig('communityMemberVoiceId', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      >
                        {premiumVoiceOptions.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Voz preguntas - BLOQUEADA */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.questionVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.questionVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                  <button onClick={() => updateConfig('questionVoiceEnabled', !config.questionVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.questionVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.questionVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.questionVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.questions')}<Hint text={t('control.voiceSection.questionsHint')} darkMode={darkMode} /></span>
                </button>
                  {config.questionVoiceEnabled && (
                    <div className="mt-2 ml-8">
                      <select
                        value={config.questionVoiceId || 'Lupita'}
                        onChange={(e) => updateConfig('questionVoiceId', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      >
                        {premiumVoiceOptions.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Voz notificaciones - BLOQUEADA */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.commandVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.commandVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                  <button onClick={() => updateConfig('commandVoiceEnabled', !config.commandVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      config.commandVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                    }`}>
                      {config.commandVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.commandVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.commands')}<Hint text={t('control.voiceSection.commandsHint')} darkMode={darkMode} /></span>
                  </button>
                  {config.commandVoiceEnabled && (
                    <div className="mt-2 ml-8">
                      <select
                        value={config.commandVoiceId || 'Lupita'}
                        onChange={(e) => updateConfig('commandVoiceId', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      >
                        {premiumVoiceOptions.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Voz notificaciones - BLOQUEADA */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.notifVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.notifVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                  <button onClick={() => updateConfig('notifVoiceEnabled', !config.notifVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.notifVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.notifVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.notifVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.notifications')}<Hint text={t('control.voiceSection.notificationsHint')} darkMode={darkMode} /></span>
                </button>
                  {config.notifVoiceEnabled && (
                    <div className="mt-2 ml-8">
                      <select
                        value={config.notifVoiceId || 'Lupita'}
                        onChange={(e) => updateConfig('notifVoiceId', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      >
                        {premiumVoiceOptions.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              </div>
              </div>

              {/* Modo Voces Variadas - FUERA DE VOCES BLOQUEADAS */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.variedVoicesEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.variedVoicesEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                  : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                <button onClick={() => updateConfig('variedVoicesEnabled', !config.variedVoicesEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.variedVoicesEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.variedVoicesEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.variedVoicesEnabled ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.variedMode')}<Hint text={t('control.voiceSection.variedModeHint')} darkMode={darkMode} /></span>
                </button>
                {config.variedVoicesEnabled && (
                  <div className="mt-4 ml-0 space-y-2">
                    <p className={`text-xs font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('control.voiceSection.selectVoices')}</p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-opacity-50" style={{backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'}}>
                      {premiumVoiceOptions.map(voice => (
                        <label key={voice.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-opacity-50 transition-colors" style={{backgroundColor: config.variedVoicesSelected?.includes(voice.id) ? (darkMode ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.1)') : 'transparent'}}>
                          <input
                            type="checkbox"
                            checked={config.variedVoicesSelected?.includes(voice.id) || false}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...(config.variedVoicesSelected || []), voice.id]
                                : (config.variedVoicesSelected || []).filter(v => v !== voice.id)
                              updateConfig('variedVoicesSelected', newSelected)
                            }}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{voice.name}</span>
                        </label>
                      ))}
                    </div>
                    {(!config.variedVoicesSelected || config.variedVoicesSelected.length === 0) && (
                      <p className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('control.voiceSection.selectAtLeastOne')}</p>
                    )}
                    {config.variedVoicesSelected && config.variedVoicesSelected.length > 0 && (
                      <div className={`text-xs p-2 rounded mt-2 ${darkMode ? 'bg-cyan-900/20 text-cyan-300 border border-cyan-500/20' : 'bg-cyan-50/50 text-cyan-700 border border-cyan-200'}`}>
                        <p className="font-mono text-[11px] break-words">
                          {config.variedVoicesSelected.map((v, i) => `${i + 1}. ${v || '(vacío)'}`).join(' | ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>

              {/* Voces personalizadas por usuario */}
              <div className={`relative mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? showUserVoiceAssignments
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : showUserVoiceAssignments
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                  : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <div>
                <button onClick={() => setShowUserVoiceAssignments(!showUserVoiceAssignments)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    showUserVoiceAssignments ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {showUserVoiceAssignments && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${showUserVoiceAssignments ? 'font-semibold' : 'font-medium'}`}>{t('control.voiceSection.customByUser')}<Hint text={t('control.voiceSection.customByUserHint')} darkMode={darkMode} /></span>
                  {userVoiceAssignments.length > 0 && <span className={`ml-auto text-xs font-semibold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{userVoiceAssignments.length}</span>}
                </button>
                {showUserVoiceAssignments && (
                  <div className="mt-4 ml-0 space-y-3">
                    {/* Agregar nuevo usuario */}
                    <div className="space-y-2 p-3 rounded-lg bg-opacity-50" style={{backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'}}>
                      <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('control.voiceSection.addUser')}</p>
                      <div className="flex gap-2 flex-col">
                        <input
                          type="text"
                          placeholder={t('control.voiceSection.userPlaceholder')}
                          value={newAssignmentUsername}
                          onChange={(e) => setNewAssignmentUsername(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addUserVoiceAssignment()}
                          className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                            darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                          }`}
                        />
                        <select
                          value={newAssignmentVoiceId}
                          onChange={(e) => setNewAssignmentVoiceId(e.target.value)}
                          className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                            darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                          }`}
                        >
                          <option value="">{t('control.voiceSection.selectVoice')}</option>
                          {premiumVoiceOptions.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={addUserVoiceAssignment}
                          disabled={!newAssignmentUsername.trim() || !newAssignmentVoiceId}
                          className={`w-full px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            !newAssignmentUsername.trim() || !newAssignmentVoiceId
                              ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : darkMode ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                          }`}
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>

                    {/* Lista de usuarios asignados */}
                    {userVoiceAssignments.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {userVoiceAssignments.map((assignment) => (
                          <div key={assignment.username} className={`flex items-center justify-between p-2 rounded-lg border ${
                            darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{assignment.username}</p>
                              <select
                                value={assignment.voiceId}
                                onChange={(e) => updateUserVoiceAssignment(assignment.username, e.target.value)}
                                className={`w-full mt-1 px-2 py-1 text-xs rounded border ${
                                  darkMode ? 'bg-gray-700 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                                }`}
                              >
                                {premiumVoiceOptions.map(v => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => removeUserVoiceAssignment(assignment.username)}
                              className={`ml-2 px-2 py-1 text-xs rounded font-medium transition-colors ${
                                darkMode ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'
                              }`}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-xs italic text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Sin asignaciones personalizadas</p>
                    )}
                  </div>
                )}
                </div>
              </div>

              {/* LEFT COLUMN - BLOQUE INDEPENDIENTE DE NOTIFICACIONES */}
              <div className={`space-y-1 rounded-xl border p-4 ${darkMode ? 'bg-slate-900/70 border-rose-400/25' : 'bg-white border-slate-200'}`}>
                <div className={`relative`}>
                  <SectionHeader title="Notificaciones en Vivo" tone="notificaciones" darkMode={darkMode} />

                  <CheckWithInput label={t('control.announcements.followers')} checked={config.announceFollowers} onToggle={() => updateConfig('announceFollowers', !config.announceFollowers)} value={config.followCooldown} onValueChange={(v) => updateConfig('followCooldown', v)} placeholder="10" darkMode={darkMode} hint={t('control.announcements.followersHint')} />
                  <CheckWithInput label={t('control.announcements.gifts')} checked={config.announceGifts} onToggle={() => updateConfig('announceGifts', !config.announceGifts)} value={config.giftCooldown} onValueChange={(v) => updateConfig('giftCooldown', v)} placeholder="5" darkMode={darkMode} hint={t('control.announcements.giftsHint')} />
                  <CheckWithInput label={t('control.announcements.viewers')} checked={config.announceViewers} onToggle={() => updateConfig('announceViewers', !config.announceViewers)} value={config.viewerCooldown} onValueChange={(v) => updateConfig('viewerCooldown', v)} placeholder="120" darkMode={darkMode} hint={t('control.announcements.viewersHint')} />
                  <CheckWithInput label={t('control.announcements.likes')} checked={config.announceLikes} onToggle={() => updateConfig('announceLikes', !config.announceLikes)} value={config.likeCooldown} onValueChange={(v) => updateConfig('likeCooldown', v)} placeholder="60" darkMode={darkMode} hint={t('control.announcements.likesHint')} />
                  <CheckWithInput label={t('control.announcements.shares')} checked={config.announceShares} onToggle={() => updateConfig('announceShares', !config.announceShares)} value={config.shareCooldown} onValueChange={(v) => updateConfig('shareCooldown', v)} placeholder="15" darkMode={darkMode} hint={t('control.announcements.sharesHint')} />
                  <CheckOption label={t('control.announcements.battles')} checked={config.announceBattles} onChange={() => updateConfig('announceBattles', !config.announceBattles)} darkMode={darkMode} hint={t('control.announcements.battlesHint')} />
                  <CheckOption label={t('control.announcements.polls')} checked={config.announcePolls} onChange={() => updateConfig('announcePolls', !config.announcePolls)} darkMode={darkMode} hint={t('control.announcements.pollsHint')} />
                  <CheckOption label={t('control.announcements.goals')} checked={config.announceGoals} onChange={() => updateConfig('announceGoals', !config.announceGoals)} darkMode={darkMode} hint={t('control.announcements.goalsHint')} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className={`space-y-1 rounded-xl border p-4 ${darkMode ? 'bg-slate-900/60 border-violet-400/25' : 'bg-slate-50 border-slate-300'}`}>
              <SectionHeader title={t('control.sections.filters')} tone="filtros" darkMode={darkMode} />

              {userPlan === 'free' ? (
                <>
                  <CheckOption label={t('control.filterSection.cleanNicks')} checked={config.onlyPlainNicks} onChange={() => updateConfig('onlyPlainNicks', !config.onlyPlainNicks)} darkMode={darkMode} hint={t('control.filterSection.cleanNicksHint')} />
                  <CheckOption label={t('control.filterSection.noEmojis')} checked={config.stripChatEmojis} onChange={() => updateConfig('stripChatEmojis', !config.stripChatEmojis)} darkMode={darkMode} hint={t('control.filterSection.noEmojisHint')} />
                  <div className={`relative mb-2 rounded-xl px-4 py-3 border opacity-50 pointer-events-none ${
                    darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <div>
                      <CheckOption label="Ignorar enlaces/URLs" checked={false} onChange={() => {}} darkMode={darkMode} />
                      <CheckOption label={t('control.filterSection.profanity')} checked={false} onChange={() => {}} darkMode={darkMode} />
                      <CheckWithInput label="Ignorar emojis excesivos del chat a cantidad máxima permitida:" checked={false} onToggle={() => {}} value={config.maxEmojisAllowed} onValueChange={() => {}} placeholder="3" darkMode={darkMode} />
                      <CheckWithInput label="Ignorar mensajes muy cortos (mínimo de caracteres)" checked={false} onToggle={() => {}} value={config.minMessageLength} onValueChange={() => {}} placeholder="3" darkMode={darkMode} />
                      <CheckWithInput label="Límite de caracteres en todos los mensajes (máximo)" checked={false} onToggle={() => {}} value={config.donorCharLimit} onValueChange={() => {}} placeholder="200" darkMode={darkMode} />
                      <CheckWithInput label="Límite de mensajes en espera (descarta nuevos si se llena)" checked={false} onToggle={() => {}} value={config.maxQueueSize} onValueChange={() => {}} placeholder="20" darkMode={darkMode} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* FILTROS EN START+ */}
                  <CheckOption label="Ignorar enlaces/URLs" checked={config.ignoreLinks} onChange={() => updateConfig('ignoreLinks', !config.ignoreLinks)} darkMode={darkMode} hint="No lee links ni URLs en los mensajes" />
                  <div className={`relative`}>
                    
                    <CheckOption
                      label={t('control.filterSection.profanity')}
                      checked={config.profanityFilterEnabled}
                      onChange={() => {
                        const next = !config.profanityFilterEnabled
                        updateConfig('profanityFilterEnabled', next)
                        if (!next) setShowProfanityEditor(false)
                      }}
                      darkMode={darkMode}
                      hint={t('control.filterSection.profanityHint')}
                    />
                    {config.profanityFilterEnabled && (
                      <div className={`mb-2 rounded-xl px-4 py-3 border ${
                        darkMode ? 'bg-cyan-500/10 border-cyan-400/40' : 'bg-slate-100 border-slate-400 shadow-sm'
                      }`}>
                        <button
                          onClick={() => setShowProfanityEditor((prev) => !prev)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            darkMode
                              ? 'text-cyan-200 border-cyan-400/40 hover:bg-cyan-500/10'
                              : 'text-slate-700 border-slate-300 hover:bg-white'
                          }`}
                        >
                          {showProfanityEditor ? 'Ocultar lista' : 'Agregar otras propias'}
                        </button>
                        {showProfanityEditor && (
                          <div className="mt-2">
                            <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-cyan-200' : 'text-slate-700'}`}>
                              Palabras prohibidas (separadas por coma o salto de línea)
                            </label>
                            <textarea
                              value={config.profanityWords || ''}
                              onChange={(e) => updateConfig('profanityWords', e.target.value)}
                              rows={3}
                              placeholder={t('control.filterSection.wordListPlaceholder')}
                              className={`w-full px-3 py-2 text-sm rounded-lg border resize-y ${
                                darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* ESTOS TRES FILTROS SIEMPRE LIBRES */}
                  <CheckOption label={t('control.filterSection.cleanNicks')} checked={config.onlyPlainNicks} onChange={() => updateConfig('onlyPlainNicks', !config.onlyPlainNicks)} darkMode={darkMode} hint={t('control.filterSection.cleanNicksHint')} />
                  <CheckOption label={t('control.filterSection.noEmojis')} checked={config.stripChatEmojis} onChange={() => updateConfig('stripChatEmojis', !config.stripChatEmojis)} darkMode={darkMode} hint={t('control.filterSection.noEmojisHint')} />
                  {/* IGNORAR EMOJIS EXCESIVOS - BLOQUEADO EN FREE Y START */}
                  <div className={`relative`}>
                    
                    <CheckWithInput
                      label="Ignorar emojis excesivos del chat a cantidad máxima permitida:"
                      checked={config.ignoreExcessiveEmojis}
                      onToggle={() => updateConfig('ignoreExcessiveEmojis', !config.ignoreExcessiveEmojis)}
                      value={config.maxEmojisAllowed}
                      onValueChange={(v) => updateConfig('maxEmojisAllowed', v)}
                      placeholder="3"
                      darkMode={darkMode}
                      hint={t('control.filterSection.excessiveEmojisHint')}
                    />
                  </div>

                  {/* IGNORAR MENSAJES MUY CORTOS - BLOQUEADO EN FREE Y START */}
                  <div className={`relative`}>
                    
                    <CheckWithInput
                      label="Ignorar mensajes muy cortos (mínimo de caracteres)"
                      checked={config.minMessageLengthEnabled}
                      onToggle={() => updateConfig('minMessageLengthEnabled', !config.minMessageLengthEnabled)}
                      value={config.minMessageLength}
                      onValueChange={(v) => updateConfig('minMessageLength', v)}
                      placeholder="3"
                      darkMode={darkMode}
                      hint="Ignora mensajes con menos caracteres del mínimo"
                    />
                  </div>

                  {/* LÍMITE DE CARACTERES - BLOQUEADO EN FREE Y START */}
                  <div className={`relative`}>
                    
                    <CheckWithInput
                      label="Límite de caracteres en todos los mensajes (máximo)"
                      checked={config.donorCharLimitEnabled}
                      onToggle={() => updateConfig('donorCharLimitEnabled', !config.donorCharLimitEnabled)}
                      value={config.donorCharLimit}
                      onValueChange={(v) => updateConfig('donorCharLimit', v)}
                      placeholder="200"
                      darkMode={darkMode}
                      hint={t('control.filterSection.charLimitHint')}
                    />
                  </div>

                  {/* LÍMITE DE MENSAJES EN ESPERA - BLOQUEADO EN FREE Y START */}
                  <div className={`relative`}>
                    
                    <CheckWithInput
                      label="Límite de mensajes en espera (descarta nuevos si se llena)"
                      checked={config.maxQueueEnabled}
                      onToggle={() => updateConfig('maxQueueEnabled', !config.maxQueueEnabled)}
                      value={config.maxQueueSize}
                      onValueChange={(v) => updateConfig('maxQueueSize', v)}
                      placeholder="20"
                      darkMode={darkMode}
                      hint={t('control.filterSection.queueHint')}
                    />
                  </div>
                </>
              )}

              {/* LISTA DE BANEADOS - SIEMPRE VISIBLE */}
              <div className={`mb-2 rounded-xl px-4 py-3 border ${
                darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-slate-300 shadow-sm'
              }`}>
                <button
                  onClick={() => setShowModerationList((prev) => !prev)}
                  className={`w-full flex items-center justify-between text-left ${
                    darkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  <span className="text-[15px] font-semibold">
                    <Ban className="inline-block w-4 h-4 mr-1 align-[-2px]" />
                    Lista de baneados/silenciados
                  </span>
                  <span className={`inline-flex items-center gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    {moderationList.length}
                    <ChevronRight className={`w-4 h-4 transition-transform ${showModerationList ? 'rotate-90' : ''}`} />
                  </span>
                </button>

                {showModerationList && (
                  <>
                    <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-700/50' : 'border-slate-200'}`} />
                    {moderationList.length === 0 ? (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        Sin usuarios baneados/silenciados.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {moderationList.map((entry) => (
                          <div
                            key={entry.username}
                            className={`rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2 ${
                              darkMode ? 'border-red-500/25 bg-red-950/20' : 'border-red-200 bg-red-50/50'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
                                @{entry.username}
                              </p>
                              <p className={`text-[11px] truncate ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                                {formatModerationReason(entry.reason, t)} a {formatModerationSource(entry.source, t)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromModerationList(entry.username)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                                darkMode
                                  ? 'border-red-300/40 text-red-200 hover:bg-red-500/20'
                                  : 'border-red-300 text-red-700 hover:bg-red-100'
                              }`}
                              title={`Quitar bloqueo de @${entry.username}`}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ASISTENTE DE IA - BLOQUEADO EN FREE, START Y CREATOR */}
              <div className={`relative ${(isFeatureBlocked('aiAssistant', userPlan) && isBasePlan) ? 'pointer-events-none [&_.lucide-circle-help]:opacity-0 [&_.lucide-help-circle]:opacity-0' : ''}`}>
                {isFeatureBlocked('aiAssistant', userPlan) && isBasePlan && (
                  <FeatureLockedOverlay
                    darkMode={darkMode}
                    message="Asistente disponible en packs"
                    showIcon
                    showMessage
                  />
                )}
                <div>
                  <SectionHeader title="Asistente de IA" tone="asistente" darkMode={darkMode} />

                  <div className={`mb-2 rounded-xl px-4 py-3 border ${
                    darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-slate-300 shadow-sm'
                  }`}>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-cyan-300' : 'text-slate-700'}`}>
                      {t('control.assistant.personality')}
                    </label>
                    <select
                      value={config.botAssistantCharacterId || ''}
                      onChange={(e) => updateConfig('botAssistantCharacterId', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                      }`}
                    >
                      <option value="">{t('bot.selectOne')}</option>
                      {botCharacters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`mb-2 rounded-xl px-4 py-3 border ${
                    darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-slate-300 shadow-sm'
                  }`}>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-cyan-300' : 'text-slate-700'}`}>
                      {t('control.assistant.voiceToUse')}
                    </label>
                    <select
                      value={config.botAssistantVoiceId || ''}
                      onChange={(e) => updateConfig('botAssistantVoiceId', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                      }`}
                    >
                      <option value="">{t('bot.selectOne')}</option>
                      {premiumVoiceOptions.map((voice) => (
                        <option key={`bot-voice-${voice.id}`} value={voice.id}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`mb-2 rounded-xl px-4 py-3 border ${
                    darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-slate-300 shadow-sm'
                  }`}>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-cyan-300' : 'text-slate-700'}`}>
                      {t('control.assistant.voiceSpeed')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={botAssistantVoiceSpeed}
                        onChange={(e) => updateConfig('botAssistantVoiceSpeed', Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={botAssistantVoiceSpeed}
                        onChange={(e) => updateConfig('botAssistantVoiceSpeed', Math.min(2, Math.max(0.5, Number(e.target.value) || 1)))}
                        className={`w-20 px-2 py-1.5 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-2 ${
                    darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-slate-300 shadow-sm'
                  }`}>
                    <label className={`text-xs font-semibold whitespace-nowrap ${darkMode ? 'text-cyan-300' : 'text-slate-700'}`}>
                      Largo de respuesta
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="500"
                      step="10"
                      value={botAssistantMaxResponseChars}
                      onChange={(e) => updateConfig('botAssistantMaxResponseChars', Math.min(500, Math.max(50, Number(e.target.value) || 250)))}
                      className={`w-20 px-2 py-1 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                      }`}
                    />
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>50–500 chars</span>
                  </div>

                  {/* === SHORTCUT PUSH-TO-TALK === */}
                  <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
                    darkMode
                      ? config.botShortcutEnabled
                        ? 'bg-cyan-500/10 border-cyan-400/40'
                        : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                      : config.botShortcutEnabled
                        ? 'bg-slate-100 border-slate-400 shadow-sm'
                        : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
                  }`}>
                    <button
                      onClick={() => updateConfig('botShortcutEnabled', !config.botShortcutEnabled)}
                      className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        config.botShortcutEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                      }`}>
                        {config.botShortcutEnabled && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.botShortcutEnabled ? 'font-semibold' : 'font-medium'}`}>
                        Activar shortcut de teclado (Push-to-Talk)
                        <Hint text="MantAn presionada la tecla para hablar con el bot sin usar el mouse" darkMode={darkMode} />
                      </span>
                    </button>

                    {config.botShortcutEnabled && (
                      <div className="mt-3 ml-8 space-y-2">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Tecla actual:
                        </span>
                        <div className="flex items-center gap-3">
                          <kbd className={`px-3 py-1.5 text-sm font-bold rounded-lg border-2 ${
                            darkMode
                              ? 'bg-gray-900 border-cyan-400/50 text-cyan-300'
                              : 'bg-gray-100 border-gray-400 text-gray-800'
                          }`}>
                            {config.botShortcutKey || 'F9'}
                          </kbd>
                          <BotShortcutCapture
                            darkMode={darkMode}
                            onCapture={(key) => updateConfig('botShortcutKey', key)}
                          />
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Y Sugerida: <code className="text-cyan-400">F9</code> a no interfiere con OBS ni TikTok, fAcil de alcanzar
                        </p>
                      </div>
                    )}
                  </div>

                  {/* === SHORTCUT INTERACTUADOR (MANUAL) === */}
                  <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
                    darkMode
                      ? config.interactorShortcutEnabled
                        ? 'bg-cyan-500/10 border-cyan-400/40'
                        : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                      : config.interactorShortcutEnabled
                        ? 'bg-slate-100 border-slate-400 shadow-sm'
                        : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
                  }`}>
                    <button
                      onClick={() => updateConfig('interactorShortcutEnabled', !config.interactorShortcutEnabled)}
                      className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        config.interactorShortcutEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                      }`}>
                        {config.interactorShortcutEnabled && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.interactorShortcutEnabled ? 'font-semibold' : 'font-medium'}`}>
                        Activar shortcut de teclado (Interactuador)
                        <Hint text="Dispara una intervención del animador para opinar sobre el chat al instante" darkMode={darkMode} />
                      </span>
                    </button>

                    {config.interactorShortcutEnabled && (
                      <div className="mt-3 ml-8 space-y-2">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Tecla actual:
                        </span>
                        <div className="flex items-center gap-3">
                          <kbd className={`px-3 py-1.5 text-sm font-bold rounded-lg border-2 ${
                            darkMode
                              ? 'bg-gray-900 border-cyan-400/50 text-cyan-300'
                              : 'bg-gray-100 border-gray-400 text-gray-800'
                          }`}>
                            {config.interactorShortcutKey || 'F8'}
                          </kbd>
                          <BotShortcutCapture
                            darkMode={darkMode}
                            onCapture={(key) => updateConfig('interactorShortcutKey', key)}
                          />
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Sugerida: <code className="text-cyan-400">F8</code> o rápida para invocar al interactuador manualmente
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}







