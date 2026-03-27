import { X, Settings } from 'lucide-react'

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
      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Panel */}
        <div className={`w-80 ${darkMode ? "bg-gray-900/30 border-r border-gray-800" : "bg-gray-50 border-r border-gray-200"} p-6 overflow-y-auto`}>
          {/* Velocidad */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold opacity-50 uppercase">Velocidad</span>
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
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
              className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400"
              style={{
                background: darkMode
                  ? `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #374151 ${((speed - 0.5) / 1.5) * 100}%, #374151 100%)`
                  : `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb ${((speed - 0.5) / 1.5) * 100}%, #e5e7eb 100%)`
              }}
            />

            <div className="grid grid-cols-2 gap-1 mt-3">
              {[0.5, 1.0, 1.5, 2.0].map((btn) => (
                <button
                  key={btn}
                  onClick={() => setAudioSpeed(btn)}
                  className={`py-1 text-xs font-semibold rounded transition-all ${
                    Math.abs(speed - btn) < 0.01
                      ? 'bg-cyan-500/20 text-cyan-400'
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

          {/* Divider */}
          <div className={`h-px ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

          {/* Placeholder para más opciones */}
          <div className="mt-8 text-xs opacity-30 text-center py-4">
            ⚙️ Más opciones próximamente
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-12 flex items-center justify-center">
          <div className="text-center opacity-30">
            <p className="text-sm">Selecciona una opción</p>
          </div>
        </div>
      </div>
    </div>
  )
}
