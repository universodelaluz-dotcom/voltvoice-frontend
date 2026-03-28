import { ArrowLeft, Check } from 'lucide-react'

function CheckOption({ label, checked, onChange, darkMode }) {
  return (
    <div className={`px-4 py-3 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
      <button onClick={onChange} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked ? 'bg-cyan-500/30 border-cyan-400' : darkMode ? 'border-gray-500' : 'border-gray-400'
        }`}>
          {checked && <Check className="w-4 h-4 text-cyan-400" />}
        </div>
        <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${checked ? 'font-semibold' : 'font-medium'}`}>{label}</span>
      </button>
    </div>
  )
}

function CheckWithInput({ label, checked, onToggle, value, onValueChange, placeholder, darkMode }) {
  return (
    <div className={`px-4 py-3 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
      <button onClick={onToggle} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked ? 'bg-cyan-500/30 border-cyan-400' : darkMode ? 'border-gray-500' : 'border-gray-400'
        }`}>
          {checked && <Check className="w-4 h-4 text-cyan-400" />}
        </div>
        <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${checked ? 'font-semibold' : 'font-medium'}`}>{label}</span>
      </button>
      {checked && (
        <div className="mt-2 ml-8">
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

export function ControlPanel({ onClose, darkMode, config, updateConfig, user }) {
  const speed = config.audioSpeed || 1.0

  const personalVoices = [
    { id: 'default-cfjnp8x4nt-owd7yg-1xsw__garret', name: 'Garret - Clonada', owner: 'alainsh@gmail.com' },
    { id: 'default-cfjnp8x4nt-owd7yg-1xsw__connor', name: 'Connor - Clonada', owner: 'alainsh@gmail.com' },
  ]

  const premiumVoiceOptions = [
    { id: 'es-ES', name: 'Voz Básica Español (ilimitada)' },
    { id: 'en-US', name: 'Voz Básica Inglés (ilimitada)' },
    { id: 'Diego', name: 'Voz natural de Luis - Premium' },
    { id: 'Lupita', name: 'Voz natural de Sofia - Premium' },
    { id: 'Miguel', name: 'Voz natural de Gustavo - Premium' },
    { id: 'Rafael', name: 'Voz natural de Leonel - Premium' },
    ...personalVoices.filter(v => user?.email === v.owner),
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className={`space-y-1 rounded-xl border p-6 ${darkMode ? 'bg-[#1a1a2e]/60 border-cyan-500/20' : 'bg-indigo-50/40 border-indigo-200/50'}`}>
              {/* === VELOCIDAD === */}
              <div className={`px-4 py-3 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[15px] font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Velocidad de Voz</span>
                  <span className="text-sm text-cyan-400 font-semibold">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2.0" step="0.1" value={speed}
                  onChange={(e) => updateConfig('audioSpeed', parseFloat(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400 mb-3"
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
              <div className={`px-4 pt-8 pb-3 mt-4 border-t ${darkMode ? 'border-cyan-500/20 text-cyan-400/70' : 'border-indigo-200 text-cyan-600'}`}>
                <span className="text-xs font-bold uppercase tracking-widest">📖 Lectura</span>
              </div>

              <CheckOption label="Leer solo mensajes (sin nombre)" checked={config.readOnlyMessage} onChange={() => updateConfig('readOnlyMessage', !config.readOnlyMessage)} darkMode={darkMode} />
              <CheckOption label="Saltar mensajes repetidos" checked={config.skipRepeated} onChange={() => updateConfig('skipRepeated', !config.skipRepeated)} darkMode={darkMode} />
              <CheckOption label="Leer solo preguntas" checked={config.onlyQuestions} onChange={() => updateConfig('onlyQuestions', !config.onlyQuestions)} darkMode={darkMode} />
              <CheckOption label="Leer solo donadores" checked={config.onlyDonors} onChange={() => updateConfig('onlyDonors', !config.onlyDonors)} darkMode={darkMode} />
              <CheckOption label="Leer solo moderadores" checked={config.onlyModerators} onChange={() => updateConfig('onlyModerators', !config.onlyModerators)} darkMode={darkMode} />

              {/* === SECCIÓN: VOCES === */}
              <div className={`px-4 pt-8 pb-3 mt-4 border-t ${darkMode ? 'border-cyan-500/20 text-cyan-400/70' : 'border-indigo-200 text-cyan-600'}`}>
                <span className="text-xs font-bold uppercase tracking-widest">🎤 Voces</span>
              </div>

              {/* Voz general */}
              <div className={`px-4 py-3 ${darkMode ? "border-b border-gray-800/50" : "border-b border-gray-200"}`}>
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
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${config.donorVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz donadores</span>
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
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${config.modVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz moderadores</span>
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
                  <span className={`text-[15px] ${darkMode ? 'text-white' : 'text-gray-900'} ${config.notifVoiceEnabled ? 'font-semibold' : 'font-medium'}`}>Voz notificaciones</span>
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
            <div className={`space-y-1 rounded-xl border p-6 ${darkMode ? 'bg-[#1a1a2e]/60 border-purple-500/20' : 'bg-purple-50/40 border-purple-200/50'}`}>
              {/* === SECCIÓN: FILTROS === */}
              <div className={`px-4 pt-0 pb-3 border-t ${darkMode ? 'border-purple-500/20 text-purple-400/70' : 'border-purple-200 text-purple-600'}`}>
                <span className="text-xs font-bold uppercase tracking-widest">🔍 Filtros</span>
              </div>

              <CheckOption label="Ignorar enlaces/URLs" checked={config.ignoreLinks} onChange={() => updateConfig('ignoreLinks', !config.ignoreLinks)} darkMode={darkMode} />
              <CheckOption label="Solo nicks de texto simple (sin emojis)" checked={config.onlyPlainNicks} onChange={() => updateConfig('onlyPlainNicks', !config.onlyPlainNicks)} darkMode={darkMode} />
              <CheckWithInput
                label="Ignorar emojis excesivos — cantidad máxima permitida:"
                checked={config.ignoreExcessiveEmojis}
                onToggle={() => updateConfig('ignoreExcessiveEmojis', !config.ignoreExcessiveEmojis)}
                value={config.maxEmojisAllowed}
                onValueChange={(v) => updateConfig('maxEmojisAllowed', v)}
                placeholder="3"
                darkMode={darkMode}
              />

              <CheckWithInput
                label="Ignorar mensajes muy cortos (mínimo de caracteres)"
                checked={config.minMessageLengthEnabled}
                onToggle={() => updateConfig('minMessageLengthEnabled', !config.minMessageLengthEnabled)}
                value={config.minMessageLength}
                onValueChange={(v) => updateConfig('minMessageLength', v)}
                placeholder="3"
                darkMode={darkMode}
              />

              <CheckWithInput
                label="Límite de caracteres en todos los mensajes (máximo)"
                checked={config.donorCharLimitEnabled}
                onToggle={() => updateConfig('donorCharLimitEnabled', !config.donorCharLimitEnabled)}
                value={config.donorCharLimit}
                onValueChange={(v) => updateConfig('donorCharLimit', v)}
                placeholder="200"
                darkMode={darkMode}
              />

              <CheckWithInput
                label="Límite de mensajes en espera (descarta nuevos si se llena)"
                checked={config.maxQueueEnabled}
                onToggle={() => updateConfig('maxQueueEnabled', !config.maxQueueEnabled)}
                value={config.maxQueueSize}
                onValueChange={(v) => updateConfig('maxQueueSize', v)}
                placeholder="20"
                darkMode={darkMode}
              />

              {/* === SECCIÓN: NOTIFICACIONES === */}
              <div className={`px-4 pt-8 pb-3 mt-4 border-t ${darkMode ? 'border-purple-500/20 text-purple-400/70' : 'border-purple-200 text-purple-600'}`}>
                <span className="text-xs font-bold uppercase tracking-widest">🔔 Notificaciones en Vivo</span>
              </div>

              <CheckWithInput label="Anunciar nuevos seguidores — cada (seg)" checked={config.announceFollowers} onToggle={() => updateConfig('announceFollowers', !config.announceFollowers)} value={config.followCooldown} onValueChange={(v) => updateConfig('followCooldown', v)} placeholder="10" darkMode={darkMode} />
              <CheckWithInput label="Anunciar regalos — cada (seg)" checked={config.announceGifts} onToggle={() => updateConfig('announceGifts', !config.announceGifts)} value={config.giftCooldown} onValueChange={(v) => updateConfig('giftCooldown', v)} placeholder="5" darkMode={darkMode} />
              <CheckWithInput label="Anunciar conteo de viewers — cada (seg)" checked={config.announceViewers} onToggle={() => updateConfig('announceViewers', !config.announceViewers)} value={config.viewerCooldown} onValueChange={(v) => updateConfig('viewerCooldown', v)} placeholder="120" darkMode={darkMode} />
              <CheckWithInput label="Anunciar likes — cada (seg)" checked={config.announceLikes} onToggle={() => updateConfig('announceLikes', !config.announceLikes)} value={config.likeCooldown} onValueChange={(v) => updateConfig('likeCooldown', v)} placeholder="60" darkMode={darkMode} />
              <CheckWithInput label="Anunciar shares — cada (seg)" checked={config.announceShares} onToggle={() => updateConfig('announceShares', !config.announceShares)} value={config.shareCooldown} onValueChange={(v) => updateConfig('shareCooldown', v)} placeholder="15" darkMode={darkMode} />
              <CheckOption label="Anunciar batallas" checked={config.announceBattles} onChange={() => updateConfig('announceBattles', !config.announceBattles)} darkMode={darkMode} />
              <CheckOption label="Anunciar encuestas" checked={config.announcePolls} onChange={() => updateConfig('announcePolls', !config.announcePolls)} darkMode={darkMode} />
              <CheckOption label="Anunciar metas/goals" checked={config.announceGoals} onChange={() => updateConfig('announceGoals', !config.announceGoals)} darkMode={darkMode} />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
