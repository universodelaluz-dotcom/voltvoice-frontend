import { X, Settings } from 'lucide-react'

export function ControlPanel({ onClose, darkMode, audioSpeed, setAudioSpeed }) {
  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950 text-white" : "bg-gradient-to-b from-slate-100 via-blue-50 to-indigo-100 text-gray-900"}`}>
      {/* Header */}
      <div className={`${darkMode ? "border-b border-cyan-500/20 backdrop-blur-sm sticky top-0 z-50 bg-gray-950/80" : "border-b border-indigo-200 backdrop-blur-sm sticky top-0 z-50 bg-white/90 shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Settings className="w-6 h-6" />
            Panel de Control
          </h1>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${darkMode ? "bg-gray-800 border border-cyan-500/30 hover:bg-gray-700" : "bg-white border border-indigo-200 hover:bg-indigo-50"}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Velocidad de Audio */}
          <div className={`rounded-xl p-8 ${darkMode ? "bg-gray-900/50 border border-cyan-500/20" : "bg-white border border-indigo-200 shadow-md"}`}>
            <h2 className="text-2xl font-black mb-8 text-cyan-400">🎚️ Velocidad de Voz</h2>

            {/* Display */}
            <div className="flex items-center justify-center mb-8">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {audioSpeed.toFixed(1)}x
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={audioSpeed}
              onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-8"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((audioSpeed - 0.5) / 1.5) * 100}%, #374151 ${((audioSpeed - 0.5) / 1.5) * 100}%, #374151 100%)`
              }}
            />

            {/* Botones rápidos */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[0.5, 1.0, 1.5, 2.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setAudioSpeed(speed)}
                  className={`py-3 rounded-lg font-bold transition-all ${
                    audioSpeed === speed
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : darkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Indicador */}
            <div className="text-center">
              <p className={`text-lg font-bold ${
                audioSpeed < 1 ? 'text-yellow-400' : audioSpeed > 1 ? 'text-cyan-400' : 'text-green-400'
              }`}>
                {audioSpeed < 1 ? '🐢 Más lento' : audioSpeed > 1 ? '🐇 Más rápido' : '✅ Velocidad normal'}
              </p>
            </div>
          </div>

          {/* Información */}
          <div className={`rounded-xl p-8 ${darkMode ? "bg-gray-900/50 border border-cyan-500/20" : "bg-white border border-indigo-200 shadow-md"}`}>
            <h2 className="text-2xl font-black mb-6 text-cyan-400">ℹ️ Información</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">Velocidad Recomendada</h3>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  Usa 1.0x para velocidad normal. Aumenta para streamers rápidos, disminuye para contenido más lento.
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Compatibilidad</h3>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  La velocidad se aplica a todas las voces (Google TTS, Inworld Premium, Voces Clonadas).
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2">Rango de Velocidad</h3>
                <ul className={`list-disc list-inside space-y-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <li>0.5x - Ultra lento (análisis detallado)</li>
                  <li>1.0x - Velocidad normal (recomendado)</li>
                  <li>1.5x - Rápido (contenido ágil)</li>
                  <li>2.0x - Ultra rápido (extremo)</li>
                </ul>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  💡 Tip: Ajusta la velocidad mientras escuchas para encontrar tu ritmo perfecto.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Más opciones vendrán aquí */}
        <div className={`mt-12 rounded-xl p-8 border-2 border-dashed ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-300 bg-gray-50"}`}>
          <p className={`text-center font-bold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            ⚙️ Más opciones de configuración próximamente...
          </p>
        </div>
      </div>
    </div>
  )
}
