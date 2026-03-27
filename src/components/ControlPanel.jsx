export function ControlPanel({ onClose, darkMode, audioSpeed, setAudioSpeed }) {
  const speed = audioSpeed || 1.0

  return (
    <div
      className={`fixed inset-0 z-50 ${darkMode ? "bg-black/50" : "bg-white/50"} backdrop-blur-sm flex items-end justify-center`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md ${darkMode ? "bg-gray-900/95 border-t border-cyan-500/20" : "bg-white/95 border-t border-gray-200"} rounded-t-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-6 space-y-4">
          {/* Velocidad de Voz - Línea horizontal */}
          <div className={`pb-4 border-b ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Velocidad de Voz</span>
              <span className="text-sm text-cyan-400 font-semibold">
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
              className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400 mb-2"
              style={{
                background: darkMode
                  ? `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #374151 ${((speed - 0.5) / 1.5) * 100}%, #374151 100%)`
                  : `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`
              }}
            />

            <div className="flex gap-2 text-xs">
              {[0.5, 1.0, 1.5, 2.0].map((btn) => (
                <button
                  key={btn}
                  onClick={() => setAudioSpeed(btn)}
                  className={`transition-colors ${
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
          <div className="text-xs opacity-30 text-center pb-2">
            ⚙️ Más opciones próximamente
          </div>
        </div>
      </div>
    </div>
  )
}
