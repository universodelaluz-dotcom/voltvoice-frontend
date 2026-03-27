import { ArrowLeft, Check } from 'lucide-react'

function CheckOption({ label, checked, onChange, darkMode }) {
  return (
    <div className={`p-4 ${darkMode ? "border-b border-gray-800" : "border-b border-gray-200"}`}>
      <button onClick={onChange} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? 'bg-cyan-500/20 border-cyan-400' : darkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          {checked && <Check className="w-4 h-4 text-cyan-400" />}
        </div>
        <span className="text-sm">{label}</span>
      </button>
    </div>
  )
}

function CheckWithInput({ label, checked, onToggle, value, onValueChange, placeholder, darkMode }) {
  return (
    <div className={`p-4 ${darkMode ? "border-b border-gray-800" : "border-b border-gray-200"}`}>
      <button onClick={onToggle} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? 'bg-cyan-500/20 border-cyan-400' : darkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          {checked && <Check className="w-4 h-4 text-cyan-400" />}
        </div>
        <span className="text-sm">{label}</span>
      </button>
      {checked && (
        <div className="mt-2 ml-8">
          <input
            type="number"
            value={value}
            onChange={(e) => onValueChange(parseInt(e.target.value) || 0)}
            placeholder={placeholder}
            className={`w-24 px-2 py-1 text-sm rounded border ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
      )}
    </div>
  )
}

export function ControlPanel({ onClose, darkMode, config, updateConfig }) {
  const speed = config.audioSpeed || 1.0

  const voiceOptions = [
    { id: 'Diego', name: 'Diego - Premium' },
    { id: 'Lupita', name: 'Lupita - Premium' },
    { id: 'Miguel', name: 'Miguel - Premium' },
    { id: 'Rafael', name: 'Rafael - Premium' },
    { id: 'default-cfjnp8x4nt-owd7yg-1xsw__garret', name: 'Garret - Clonada' },
    { id: 'default-cfjnp8x4nt-owd7yg-1xsw__connor', name: 'Connor - Clonada' },
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
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-1 max-w-md">

            {/* === VELOCIDAD === */}
            <div className={`p-4 ${darkMode ? "border-b border-gray-800" : "border-b border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Velocidad de Voz</span>
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
            <div className={`px-4 pt-6 pb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Lectura</span>
            </div>

            <CheckOption label="Leer solo mensajes (sin nombre)" checked={config.readOnlyMessage} onChange={() => updateConfig('readOnlyMessage', !config.readOnlyMessage)} darkMode={darkMode} />
            <CheckOption label="Saltar mensajes repetidos" checked={config.skipRepeated} onChange={() => updateConfig('skipRepeated', !config.skipRepeated)} darkMode={darkMode} />
            <CheckOption label="Leer solo preguntas" checked={config.onlyQuestions} onChange={() => updateConfig('onlyQuestions', !config.onlyQuestions)} darkMode={darkMode} />
            <CheckOption label="Leer solo donadores" checked={config.onlyDonors} onChange={() => updateConfig('onlyDonors', !config.onlyDonors)} darkMode={darkMode} />
            <CheckOption label="Leer solo moderadores" checked={config.onlyModerators} onChange={() => updateConfig('onlyModerators', !config.onlyModerators)} darkMode={darkMode} />

            {/* === SECCIÓN: VOZ DONADORES === */}
            <div className={`px-4 pt-6 pb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Voz para Donadores</span>
            </div>

            <div className={`p-4 ${darkMode ? "border-b border-gray-800" : "border-b border-gray-200"}`}>
              <button onClick={() => updateConfig('donorVoiceEnabled', !config.donorVoiceEnabled)} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  config.donorVoiceEnabled ? 'bg-cyan-500/20 border-cyan-400' : darkMode ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  {config.donorVoiceEnabled && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <span className="text-sm">Voz diferente para donadores</span>
              </button>
              {config.donorVoiceEnabled && (
                <div className="mt-2 ml-8">
                  <select
                    value={config.donorVoiceId}
                    onChange={(e) => updateConfig('donorVoiceId', e.target.value)}
                    className={`w-full px-2 py-1 text-sm rounded border ${
                      darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {voiceOptions.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* === SECCIÓN: FILTROS === */}
            <div className={`px-4 pt-6 pb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Filtros</span>
            </div>

            <CheckOption label="Ignorar enlaces/URLs" checked={config.ignoreLinks} onChange={() => updateConfig('ignoreLinks', !config.ignoreLinks)} darkMode={darkMode} />
            <CheckOption label="Ignorar emojis excesivos" checked={config.ignoreExcessiveEmojis} onChange={() => updateConfig('ignoreExcessiveEmojis', !config.ignoreExcessiveEmojis)} darkMode={darkMode} />

            <CheckWithInput
              label="Largo mínimo de mensaje"
              checked={config.minMessageLengthEnabled}
              onToggle={() => updateConfig('minMessageLengthEnabled', !config.minMessageLengthEnabled)}
              value={config.minMessageLength}
              onValueChange={(v) => updateConfig('minMessageLength', v)}
              placeholder="3"
              darkMode={darkMode}
            />

            <CheckWithInput
              label="Límite de caracteres (donadores)"
              checked={config.donorCharLimitEnabled}
              onToggle={() => updateConfig('donorCharLimitEnabled', !config.donorCharLimitEnabled)}
              value={config.donorCharLimit}
              onValueChange={(v) => updateConfig('donorCharLimit', v)}
              placeholder="200"
              darkMode={darkMode}
            />

            <CheckWithInput
              label="Cola máxima de mensajes"
              checked={config.maxQueueEnabled}
              onToggle={() => updateConfig('maxQueueEnabled', !config.maxQueueEnabled)}
              value={config.maxQueueSize}
              onValueChange={(v) => updateConfig('maxQueueSize', v)}
              placeholder="20"
              darkMode={darkMode}
            />

            {/* === SECCIÓN: NOTIFICACIONES === */}
            <div className={`px-4 pt-6 pb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Notificaciones en Vivo</span>
            </div>

            <CheckOption label="Anunciar nuevos seguidores" checked={config.announceFollowers} onChange={() => updateConfig('announceFollowers', !config.announceFollowers)} darkMode={darkMode} />
            <CheckOption label="Anunciar regalos" checked={config.announceGifts} onChange={() => updateConfig('announceGifts', !config.announceGifts)} darkMode={darkMode} />
            <CheckOption label="Anunciar conteo de viewers" checked={config.announceViewers} onChange={() => updateConfig('announceViewers', !config.announceViewers)} darkMode={darkMode} />
            <CheckOption label="Anunciar likes" checked={config.announceLikes} onChange={() => updateConfig('announceLikes', !config.announceLikes)} darkMode={darkMode} />
            <CheckOption label="Anunciar shares" checked={config.announceShares} onChange={() => updateConfig('announceShares', !config.announceShares)} darkMode={darkMode} />
            <CheckOption label="Anunciar batallas" checked={config.announceBattles} onChange={() => updateConfig('announceBattles', !config.announceBattles)} darkMode={darkMode} />
            <CheckOption label="Anunciar encuestas" checked={config.announcePolls} onChange={() => updateConfig('announcePolls', !config.announcePolls)} darkMode={darkMode} />
            <CheckOption label="Anunciar metas/goals" checked={config.announceGoals} onChange={() => updateConfig('announceGoals', !config.announceGoals)} darkMode={darkMode} />

          </div>
        </div>
      </div>
    </div>
  )
}
