import { X, Settings } from 'lucide-react'

export function ControlPanel({ onClose, darkMode, audioSpeed, setAudioSpeed }) {
  const speed = audioSpeed || 1.0

  return (
    <div className={darkMode ? "min-h-screen bg-gray-950 text-white" : "min-h-screen bg-white text-gray-900"}>
      {/* Header */}
      <div className={`${darkMode ? "bg-gray-900/50 border-b border-cyan-500/10" : "bg-gray-50 border-b border-gray-200"} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-md mx-auto">
          {/* Velocidad */}
          <div className="mb-12">
            <div className="flex items-baseline justify-between mb-8">
              <label className="text-sm font-semibold tracking-wide opacity-60">Velocidad de Voz</label>
              <span className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {speed.toFixed(1)}x
              </span>
            </div>

            {/* Slider minimalista */}
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

            {/* Botones rápidos en fila */}
            <div className="flex gap-2 mt-6">
              {[0.5, 1.0, 1.5, 2.0].map((btn) => (
                <button
                  key={btn}
                  onClick={() => setAudioSpeed(btn)}
                  className={`flex-1 py-2 text-xs font-semibold rounded transition-all ${
                    Math.abs(speed - btn) < 0.01
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400'
                      : darkMode
                        ? 'border border-gray-700 text-gray-400 hover:border-gray-600'
                        : 'border border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {btn}x
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px my-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

          {/* Info simple */}
          <div className="space-y-4 text-sm opacity-60">
            <p>
              <span className="font-semibold">0.5x</span> - Para contenido lento
            </p>
            <p>
              <span className="font-semibold">1.0x</span> - Velocidad normal (recomendado)
            </p>
            <p>
              <span className="font-semibold">1.5x</span> - Para contenido ágil
            </p>
            <p>
              <span className="font-semibold">2.0x</span> - Ultra rápido
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
