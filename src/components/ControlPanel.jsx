import { useState, useEffect } from 'react'
import { ArrowLeft, Check, HelpCircle } from 'lucide-react'

function Hint({ text, darkMode }) {
  return (
    <span className="relative group ml-1 inline-flex">
      <HelpCircle className={`w-3.5 h-3.5 cursor-help ${darkMode ? 'text-gray-500 hover:text-cyan-400' : 'text-gray-400 hover:text-cyan-600'} transition-colors`} />
      <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${
        darkMode ? 'bg-gray-800 text-gray-200 border border-cyan-500/30' : 'bg-gray-900 text-white'
      } shadow-lg`}>{text}</span>
    </span>
  )
}

function CheckOption({ label, checked, onChange, darkMode, hint }) {
  return (
    <div className={`px-4 py-2 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
      <button onClick={onChange} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked ? 'bg-cyan-500/30 border-cyan-400' : darkMode ? 'border-gray-500' : 'border-gray-400'
        }`}>
          {checked && <Check className="w-4 h-4 text-cyan-400" />}
        </div>
        <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${checked ? 'font-semibold' : 'font-medium'}`}>
          {label}
          {hint && <Hint text={hint} darkMode={darkMode} />}
        </span>
      </button>
    </div>
  )
}

function CheckWithInput({ label, checked, onToggle, value, onValueChange, placeholder, darkMode, hint }) {
  return (
    <div className={`px-4 py-2 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
      <button onClick={onToggle} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked ? 'bg-cyan-500/30 border-cyan-400' : darkMode ? 'border-gray-500' : 'border-gray-400'
        }`}>
          {checked && <Check className="w-4 h-4 text-cyan-400" />}
        </div>
        <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${checked ? 'font-semibold' : 'font-medium'}`}>
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
              darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
      )}
    </div>
  )
}

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export function ControlPanel({ onClose, darkMode, config, updateConfig, user }) {
  const speed = config.audioSpeed || 1.0
  const [userVoices, setUserVoices] = useState([])

  // Cargar voces del usuario desde la API - con polling automático
  useEffect(() => {
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

    // Cargar inmediatamente
    loadUserVoices()

    // Polling cada 2 segundos para detectar nuevas voces
    const interval = setInterval(loadUserVoices, 2000)
    return () => clearInterval(interval)
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

  return (
    <div className={darkMode ? "min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900"}>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* LEFT COLUMN */}
            <div className={`space-y-0 rounded-xl border p-4 ${darkMode ? 'bg-[#1a1a2e]/60 border-cyan-500/20' : 'bg-indigo-50/40 border-indigo-200/50'}`}>
              {/* === VELOCIDAD === */}
              <div className={`px-4 py-2 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[15px] font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Velocidad de Voz</span>
                  <span className="text-sm text-cyan-400 font-semibold">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2.0" step="0.1" value={speed}
                  onChange={(e) => updateConfig('audioSpeed', parseFloat(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400 mb-2"
                  style={{
                    background: darkMode
                      ? `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #374151 ${((speed - 0.5) / 1.5) * 100}%, #374151 100%)`
                      : `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex gap-2 text-xs">
                  {[0.5, 1.0, 1.5, 2.0].map((btn) => (
                    <button key={btn} onClick={() => updateConfig('audioSpeed', btn)}
                      className={`transition-colors ${Math.abs(speed - btn) < 0.01 ? 'text-cyan-400' : darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-500 hover:text-gray-600'}`}
                    >{btn}x</button>
                  ))}
                </div>
              </div>

              {/* === SECCIÓN: LECTURA === */}
              <div className={`px-4 pt-4 pb-2 mt-2 border-t ${darkMode ? 'border-cyan-500/20 text-cyan-400/70' : 'border-indigo-200 text-cyan-600'}`}>
                <span className="text-xs font-bold uppercase tracking-widest">📖 Lectura</span>
              </div>

              <CheckOption label="Leer solo mensajes (sin nombre)" checked={config.readOnlyMessage} onChange={() => updateConfig('readOnlyMessage', !config.readOnlyMessage)} darkMode={darkMode} hint="Lee el mensaje sin mencionar quién lo escribió" />
              <CheckOption label="Saltar mensajes repetidos" checked={config.skipRepeated} onChange={() => updateConfig('skipRepeated', !config.skipRepeated)} darkMode={darkMode} hint="Ignora mensajes idénticos consecutivos para evitar spam" />
              <CheckOption label="Leer solo preguntas" checked={config.onlyQuestions} onChange={() => updateConfig('onlyQuestions', !config.onlyQuestions)} darkMode={darkMode} hint="Solo lee mensajes que contengan signos de interrogación" />
              <CheckOption label="Leer solo donadores" checked={config.onlyDonors} onChange={() => updateConfig('onlyDonors', !config.onlyDonors)} darkMode={darkMode} hint="Solo lee mensajes de usuarios que enviaron regalos" />
              <CheckOption label="Leer solo moderadores" checked={config.onlyModerators} onChange={() => updateConfig('onlyModerators', !config.onlyModerators)} darkMode={darkMode} hint="Solo lee mensajes de moderadores del live" />

              {/* === SECCIÓN: VOCES === */}
              <div className={`px-4 pt-4 pb-2 mt-2 border-t ${darkMode ? 'border-cyan-500/20 text-cyan-400/70' : 'border-indigo-200 text-cyan-600'}`}>
                <span className="text-xs font-bold uppercase tracking-widest">🎤 Voces</span>
              </div>

              {/* Voz general */}
              <div className={`px-4 py-2 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[15px] font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Voz general</span>
                </div>
                <select
                  value={config.generalVoiceId || 'es-ES'}
                  onChange={(e) => updateConfig('generalVoiceId', e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                    darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {premiumVoiceOptions.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Voz donadores */}
              <div className={`px-4 py-3 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
                <button onClick={() => updateConfig('donorVoiceEnabled', !config.donorVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.donorVoiceEnabled ? 'bg-cyan-500/30 border-cyan-400' : darkMode ? 'border-gray-500' : 'border-gray-400'
                  }`}>
                    {config.donorVoiceEnabled && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${config.donorVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz donadores<Hint text="Usa una voz diferente para quienes envían regalos" darkMode={darkMode} /></span>
                </button>
                {config.donorVoiceEnabled && (
                  <div className="mt-2 ml-8">
                    <select
                      value={config.donorVoiceId}
                      onChange={(e) => updateConfig('donorVoiceId', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
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
              <div className={`px-4 py-3 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
                <button onClick={() => updateConfig('modVoiceEnabled', !config.modVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.modVoiceEnabled ? 'bg-cyan-500/30 border-cyan-400' : darkMode ? 'border-gray-500' : 'border-gray-400'
                  }`}>
                    {config.modVoiceEnabled && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${config.modVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz moderadores<Hint text="Usa una voz diferente para los moderadores" darkMode={darkMode} /></span>
                </button>
                {config.modVoiceEnabled && (
                  <div className="mt-2 ml-8">
                    <select
                      value={config.modVoiceId || 'Lupita'}
                      onChange={(e) => updateConfig('modVoiceId', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
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
              <div className={`px-4 py-3 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
                <button onClick={() => updateConfig('notifVoiceEnabled', !config.notifVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    config.notifVoiceEnabled ? 'bg-cyan-500/30 border-cyan-400' : darkMode ? 'border-gray-500' : 'border-gray-400'
                  }`}>
                    {config.notifVoiceEnabled && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${config.notifVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz notificaciones<Hint text="Usa una voz diferente para las notificaciones del live" darkMode={darkMode} /></span>
                </button>
                {config.notifVoiceEnabled && (
                  <div className="mt-2 ml-8">
                    <select
                      value={config.notifVoiceId || 'Lupita'}
                      onChange={(e) => updateConfig('notifVoiceId', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-800/80 border-cyan-500/30 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
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
            <div className={`space-y-0 rounded-xl border p-4 ${darkMode ? 'bg-[#1a1a2e]/60 border-purple-500/20' : 'bg-purple-50/40 border-purple-200/50'}`}>
              {/* === SECCIÓN: FILTROS === */}
              <div className={`px-4 pt-0 pb-3 border-t ${darkMode ? 'border-purple-500/20 text-purple-400/70' : 'border-purple-200 text-purple-600'}`}>
                <span className="text-xs font-bold uppercase tracking-widest">🔍 Filtros</span>
              </div>

              <CheckOption label="Ignorar enlaces/URLs" checked={config.ignoreLinks} onChange={() => updateConfig('ignoreLinks', !config.ignoreLinks)} darkMode={darkMode} hint="No lee links ni URLs en los mensajes" />
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
              <div className={`px-4 pt-8 pb-3 mt-4 border-t ${darkMode ? 'border-purple-500/20 text-purple-400/70' : 'border-purple-200 text-purple-600'}`}>
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
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
