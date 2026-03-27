import { ArrowLeft } from 'lucide-react'

export function ControlPanel({ onClose, darkMode, audioSpeed, setAudioSpeed }) {
  const speed = audioSpeed || 1.0

  return (
    <div className={darkMode ? "min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900"}>
      {/* Header */}
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-colors duration-300 ${darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
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
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-1">
            {/* Velocidad de Voz */}
            <div className={`p-4 ${darkMode ? "border-b border-gray-800" : "border-b border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Velocidad de Voz</span>
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
                className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400 mb-3"
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
            <div className={`p-4 text-xs opacity-30`}>
              ⚙️ Más opciones próximamente
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
