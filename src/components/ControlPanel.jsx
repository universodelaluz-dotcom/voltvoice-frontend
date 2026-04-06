import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Check, HelpCircle, Keyboard, ChevronRight } from 'lucide-react'

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

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

function BotShortcutCapture({ darkMode, onCapture }) {
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
          placeholder="Presiona una tecla..."
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
          Cambiar tecla
        </button>
      )}
    </>
  )
}

export function ControlPanel({ onClose, onGoAIRoleplay, onGoSynthesis, darkMode, config, updateConfig, user }) {
  const [userVoices, setUserVoices] = useState([])
  const [presetStatus, setPresetStatus] = useState('')
  const [showProfanityEditor, setShowProfanityEditor] = useState(false)

  // Cargar voces del usuario desde la API
  const loadUserVoices = async () => {
    try {
      const token = localStorage.getItem('sv-token')
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

    // Escuchar evento cuando se agrega una voz nueva
    const handleVoiceAdded = () => {
      loadUserVoices()
    }

    window.addEventListener('voice-added', handleVoiceAdded)
    return () => window.removeEventListener('voice-added', handleVoiceAdded)
  }, [user?.email])

  const premiumVoiceOptions = [
    { id: 'es-ES', name: 'Voz Básica Español (ilimitada)' },
    { id: 'en-US', name: 'Voz Básica Inglés (ilimitada)' },
    { id: 'Diego', name: 'Voz natural de Luis - Premium' },
    { id: 'Lupita', name: 'Voz natural de Sofia - Premium' },
    { id: 'Miguel', name: 'Voz natural de Gustavo - Premium' },
    { id: 'Rafael', name: 'Voz natural de Leonel - Premium' },
    ...userVoices,
  ]

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
    setPresetStatus(`Preset ${index + 1} guardado`)
  }

  const applyPreset = (index) => {
    const key = presetKeys[index]
    const preset = config?.[key]
    if (!preset?.data || typeof preset.data !== 'object') {
      setPresetStatus(`Preset ${index + 1} vacío`)
      return
    }
    Object.entries(preset.data).forEach(([k, v]) => updateConfig(k, v))
    setPresetStatus(`Preset ${index + 1} aplicado`)
  }

  useEffect(() => {
    if (!presetStatus) return
    const t = setTimeout(() => setPresetStatus(''), 2200)
    return () => clearTimeout(t)
  }, [presetStatus])

  return (
    <div className={darkMode ? "min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "min-h-screen bg-gradient-to-b from-[#eceff3] via-[#f7f8fa] to-[#e8ecf1] text-slate-800"}>
      {/* Header */}
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-colors duration-300 ${darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={onClose} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Configuración
          </h1>
          <div className="w-20"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`mb-4 rounded-2xl border p-4 ${
            darkMode ? 'border-cyan-500/20 bg-[#12122a]/70' : 'border-indigo-200 bg-white/80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-cyan-300' : 'text-indigo-700'}`}>
                Presets Rápidos
              </h3>
              <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Guarda y aplica tu configuración al instante
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
                        {hasPreset ? 'Guardado' : 'Vacío'}
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
                        Guardar
                      </button>
                      <button
                        onClick={() => applyPreset(idx)}
                        className={`rounded-lg py-2.5 text-xs font-bold transition ${
                          darkMode
                            ? 'bg-gradient-to-r from-purple-500/40 to-fuchsia-500/40 text-white hover:from-purple-500/60 hover:to-fuchsia-500/60 border border-fuchsia-400/40'
                            : 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:opacity-90 border border-fuchsia-500/40'
                        }`}
                      >
                        Aplicar
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* LEFT COLUMN */}
            <div className={`space-y-1 rounded-xl border p-4 ${darkMode ? 'bg-[#1a1a2e]/60 border-cyan-500/20' : 'bg-indigo-50/40 border-indigo-200/50'}`}>
              {/* === SECCIÓN: LECTURA === */}
              <div className={`mx-1 mt-4 mb-3 px-4 py-2 rounded-xl border ${
                darkMode
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 text-cyan-400'
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-600'
              }`}>
                <span className="text-xs font-bold uppercase tracking-widest">📖 Lectura</span>
              </div>

              <CheckOption label="Leer solo mensajes (sin nombre)" checked={config.readOnlyMessage} onChange={() => updateConfig('readOnlyMessage', !config.readOnlyMessage)} darkMode={darkMode} hint="Lee el mensaje sin mencionar quién lo escribió" />
              <CheckOption label="Saltar mensajes repetidos" checked={config.skipRepeated} onChange={() => updateConfig('skipRepeated', !config.skipRepeated)} darkMode={darkMode} hint="Ignora mensajes idénticos consecutivos para evitar spam" />
              <CheckOption label="Leer solo preguntas" checked={config.onlyQuestions} onChange={() => updateConfig('onlyQuestions', !config.onlyQuestions)} darkMode={darkMode} hint="Solo lee mensajes que contengan signos de interrogación" />
              <CheckOption label="Leer solo donadores" checked={config.onlyDonors} onChange={() => updateConfig('onlyDonors', !config.onlyDonors)} darkMode={darkMode} hint="Solo lee mensajes de usuarios que enviaron regalos" />
              <CheckOption label="Leer solo moderadores" checked={config.onlyModerators} onChange={() => updateConfig('onlyModerators', !config.onlyModerators)} darkMode={darkMode} hint="Solo lee mensajes de moderadores del live" />
              <CheckOption label="Leer solo suscriptores" checked={config.onlySubscribers} onChange={() => updateConfig('onlySubscribers', !config.onlySubscribers)} darkMode={darkMode} hint="Solo lee usuarios suscritos al creador del live" />
              <CheckOption label="Filtro de miembros de comunidad" checked={config.onlyCommunityMembers} onChange={() => updateConfig('onlyCommunityMembers', !config.onlyCommunityMembers)} darkMode={darkMode} hint="Solo lee usuarios Fan o SuperFan del LIVE bajo el mismo filtro de comunidad" />

              {/* === SECCIÓN: VOCES === */}
              <div className={`mx-1 mt-4 mb-3 px-4 py-2 rounded-xl border ${
                darkMode
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 text-cyan-400'
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-600'
              }`}>
                <span className="text-xs font-bold uppercase tracking-widest">🎤 Voces</span>
              </div>

              {/* Voz general */}
              <div className={`mb-2 rounded-xl px-4 py-3 border ${
                darkMode ? 'bg-white/5 border-gray-700/40' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[15px] font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>Voz general</span>
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

              {/* Voz donadores */}
              <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.donorVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.donorVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <button onClick={() => updateConfig('donorVoiceEnabled', !config.donorVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.donorVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.donorVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.donorVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz donadores<Hint text="Usa una voz diferente para quienes envían regalos" darkMode={darkMode} /></span>
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
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.modVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz moderadores<Hint text="Usa una voz diferente para los moderadores" darkMode={darkMode} /></span>
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

              {/* Voz notificaciones */}
              <div className={`mb-2 rounded-xl px-4 py-3 border transition-colors ${
                darkMode
                  ? config.notifVoiceEnabled
                    ? 'bg-cyan-500/10 border-cyan-400/40'
                    : 'bg-white/5 border-gray-700/40 hover:border-gray-600/60'
                  : config.notifVoiceEnabled
                    ? 'bg-slate-100 border-slate-400 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
              }`}>
                <button onClick={() => updateConfig('notifVoiceEnabled', !config.notifVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.notifVoiceEnabled ? (darkMode ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-800 border-slate-800') : darkMode ? 'border-gray-400' : 'border-slate-500 bg-white'
                  }`}>
                    {config.notifVoiceEnabled && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-slate-800'} ${config.notifVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz notificaciones<Hint text="Usa una voz diferente para las notificaciones del live" darkMode={darkMode} /></span>
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

            {/* RIGHT COLUMN */}
            <div className={`space-y-1 rounded-xl border p-4 ${darkMode ? 'bg-[#1a1a2e]/60 border-purple-500/20' : 'bg-purple-50/40 border-purple-200/50'}`}>
              {/* === SECCIÓN: FILTROS === */}
              <div className={`mx-1 mt-0 mb-3 px-4 py-2 rounded-xl border ${
                darkMode
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 text-cyan-400'
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-600'
              }`}>
                <span className="text-xs font-bold uppercase tracking-widest">🔍 Filtros</span>
              </div>

              <CheckOption label="Ignorar enlaces/URLs" checked={config.ignoreLinks} onChange={() => updateConfig('ignoreLinks', !config.ignoreLinks)} darkMode={darkMode} hint="No lee links ni URLs en los mensajes" />
              <CheckOption
                label="Filtro de palabrotas"
                checked={config.profanityFilterEnabled}
                onChange={() => {
                  const next = !config.profanityFilterEnabled
                  updateConfig('profanityFilterEnabled', next)
                  if (!next) setShowProfanityEditor(false)
                }}
                darkMode={darkMode}
                hint="Bloquea mensajes que contengan palabras prohibidas"
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
                    {showProfanityEditor ? 'Ocultar lista' : 'Mostrar lista de palabras'}
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
                        placeholder="Escribe tus palabras aquí"
                        className={`w-full px-3 py-2 text-sm rounded-lg border resize-y ${
                          darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-slate-800'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}
              <CheckOption label="Limpiar nicks (No leerá sus emojis ni números ni caracteres raros)" checked={config.onlyPlainNicks} onChange={() => updateConfig('onlyPlainNicks', !config.onlyPlainNicks)} darkMode={darkMode} hint="Limpia el nombre del usuario dejando solo letras" />
              <CheckOption label="No leer emojis en chat" checked={config.stripChatEmojis} onChange={() => updateConfig('stripChatEmojis', !config.stripChatEmojis)} darkMode={darkMode} hint="Elimina emojis del mensaje antes de leerlo en voz" />
              <CheckWithInput
                label="Ignorar emojis excesivos del chat — cantidad máxima permitida:"
                checked={config.ignoreExcessiveEmojis}
                onToggle={() => updateConfig('ignoreExcessiveEmojis', !config.ignoreExcessiveEmojis)}
                value={config.maxEmojisAllowed}
                onValueChange={(v) => updateConfig('maxEmojisAllowed', v)}
                placeholder="3"
                darkMode={darkMode}
                hint="Lee el mensaje pero quita emojis si pasan del límite"
              />

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

              <CheckWithInput
                label="Límite de caracteres en todos los mensajes (máximo)"
                checked={config.donorCharLimitEnabled}
                onToggle={() => updateConfig('donorCharLimitEnabled', !config.donorCharLimitEnabled)}
                value={config.donorCharLimit}
                onValueChange={(v) => updateConfig('donorCharLimit', v)}
                placeholder="200"
                darkMode={darkMode}
                hint="Corta mensajes largos al máximo de caracteres indicado"
              />

              <CheckWithInput
                label="Límite de mensajes en espera (descarta nuevos si se llena)"
                checked={config.maxQueueEnabled}
                onToggle={() => updateConfig('maxQueueEnabled', !config.maxQueueEnabled)}
                value={config.maxQueueSize}
                onValueChange={(v) => updateConfig('maxQueueSize', v)}
                placeholder="20"
                darkMode={darkMode}
                hint="Evita acumulación excesiva de mensajes por leer"
              />

              {/* === SECCIÓN: NOTIFICACIONES === */}
              <div className={`mx-1 mt-4 mb-3 px-4 py-2 rounded-xl border ${
                darkMode
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 text-cyan-400'
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-600'
              }`}>
                <span className="text-xs font-bold uppercase tracking-widest">🔔 Notificaciones en Vivo</span>
              </div>

              <CheckWithInput label="Anunciar nuevos seguidores — cada (seg)" checked={config.announceFollowers} onToggle={() => updateConfig('announceFollowers', !config.announceFollowers)} value={config.followCooldown} onValueChange={(v) => updateConfig('followCooldown', v)} placeholder="10" darkMode={darkMode} hint="Anuncia en voz cuando alguien te sigue" />
              <CheckWithInput label="Anunciar regalos — cada (seg)" checked={config.announceGifts} onToggle={() => updateConfig('announceGifts', !config.announceGifts)} value={config.giftCooldown} onValueChange={(v) => updateConfig('giftCooldown', v)} placeholder="5" darkMode={darkMode} hint="Anuncia en voz cuando recibes un regalo" />
              <CheckWithInput label="Anunciar conteo de viewers — cada (seg)" checked={config.announceViewers} onToggle={() => updateConfig('announceViewers', !config.announceViewers)} value={config.viewerCooldown} onValueChange={(v) => updateConfig('viewerCooldown', v)} placeholder="120" darkMode={darkMode} hint="Dice cuántos viewers hay en el live periódicamente" />
              <CheckWithInput label="Anunciar likes — cada (seg)" checked={config.announceLikes} onToggle={() => updateConfig('announceLikes', !config.announceLikes)} value={config.likeCooldown} onValueChange={(v) => updateConfig('likeCooldown', v)} placeholder="60" darkMode={darkMode} hint="Anuncia la cantidad de likes acumulados" />
              <CheckWithInput label="Anunciar shares — cada (seg)" checked={config.announceShares} onToggle={() => updateConfig('announceShares', !config.announceShares)} value={config.shareCooldown} onValueChange={(v) => updateConfig('shareCooldown', v)} placeholder="15" darkMode={darkMode} hint="Anuncia cuando alguien comparte tu live" />
              <CheckOption label="Anunciar batallas" checked={config.announceBattles} onChange={() => updateConfig('announceBattles', !config.announceBattles)} darkMode={darkMode} hint="Anuncia inicio y resultado de batallas en vivo" />
              <CheckOption label="Anunciar encuestas" checked={config.announcePolls} onChange={() => updateConfig('announcePolls', !config.announcePolls)} darkMode={darkMode} hint="Anuncia cuando se crea una encuesta en el live" />
              <CheckOption label="Anunciar metas/goals" checked={config.announceGoals} onChange={() => updateConfig('announceGoals', !config.announceGoals)} darkMode={darkMode} hint="Anuncia progreso de metas del live" />

              {/* === SECCIÓN: ASISTENTE DE IA === */}
              <div className={`mx-1 mt-4 mb-3 px-4 py-2 rounded-xl border ${
                darkMode
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 text-cyan-400'
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-600'
              }`}>
                <span className="text-xs font-bold uppercase tracking-widest">🤖 Asistente de IA</span>
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
                    <Hint text="Mantén presionada la tecla para hablar con el bot sin usar el mouse" darkMode={darkMode} />
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
                      💡 Sugerida: <code className="text-cyan-400">F9</code> — no interfiere con OBS ni TikTok, fácil de alcanzar
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
                      💡 Sugerida: <code className="text-cyan-400">F8</code> — rápida para invocar al interactuador manualmente
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}



