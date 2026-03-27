import { X } from 'lucide-react'

export function ControlPanel({ onClose, darkMode, audioSpeed, setAudioSpeed }) {
  const speed = audioSpeed || 1.0

  return (
    <div className={darkMode ? "min-h-screen bg-gray-950 text-white" : "min-h-screen bg-white text-gray-900"}>
      {/* Header */}
      <div className={`${darkMode ? "bg-gray-900/50 border-b border-cyan-500/10" : "bg-gray-50 border-b border-gray-200"} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Panel de Control</h1>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-3 max-w-sm">
          {/* Velocidad de Voz */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs">Velocidad de Voz</span>
              <span className="text-xs text-cyan-400 font-semibold">
                {speed.toFixed(1)}x
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400 mb-1"
              style={{
                background: darkMode
                  ? `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #374151 ${((speed - 0.5) / 1.5) * 100}%, #374151 100%)`
                  : `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`
              }}
            />

            <div className="flex gap-1 text-xs mt-1">
              {[0.5, 1.0, 1.5, 2.0].map((btn) => (
                <button
                  key={btn}
                  onClick={() => setAudioSpeed(btn)}
                  className={`text-xs transition-colors ${
                    Math.abs(speed - btn) < 0.01
                      ? 'text-cyan-400'
                      : darkMode
                        ? 'text-gray-500 hover:text-gray-400'
                        : 'text-gray-500 hover:text-gray-600'
                  }`}
                >
                  {btn}x
                </button>
              ))}
            </div>
          </div>

          {/* Más opciones próximamente */}
          <div className="text-xs opacity-30">
            ⚙️ Más opciones próximamente
          </div>
        </div>
      </div>
    </div>
  )
}
