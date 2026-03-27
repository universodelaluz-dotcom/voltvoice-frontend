import { X, Settings } from 'lucide-react'

export function ControlPanel({ onClose, darkMode, audioSpeed, setAudioSpeed }) {
  return (
    <div className={darkMode ? "min-h-screen bg-gray-950 text-white" : "min-h-screen bg-white text-gray-900"}>
      <div className={`${darkMode ? "bg-gray-900 border-b border-cyan-500/20" : "bg-white border-b border-gray-200"} p-6 sticky top-0`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className={`rounded-xl p-8 ${darkMode ? "bg-gray-900 border border-cyan-500/20" : "bg-gray-50 border border-gray-200"}`}>
          <h2 className="text-2xl font-bold mb-8">🎚️ Velocidad de Voz</h2>

          <div className="flex items-center justify-center mb-8">
            <div className="text-6xl font-black text-cyan-400">
              {(audioSpeed || 1).toFixed(1)}x
            </div>
          </div>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={audioSpeed || 1}
            onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer mb-8"
          />

          <div className="grid grid-cols-2 gap-3">
            {[0.5, 1.0, 1.5, 2.0].map((btn) => (
              <button
                key={btn}
                onClick={() => setAudioSpeed(btn)}
                className={`py-3 rounded-lg font-bold ${
                  (audioSpeed || 1) === btn
                    ? 'bg-cyan-500 text-white'
                    : darkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              >
                {btn}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
