import { ArrowLeft } from 'lucide-react'
import { PricingCards } from './PricingCards'
import { PricingComparison } from './PricingComparison'

export function PricingPage({ onGoHome, darkMode, onPlanAction }) {
  return (
    <div className={darkMode ? "min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900"}>
      {/* Header */}
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-colors duration-300 ${darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Stream Voicer
          </h1>
          <div className="w-20"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4">
              Planes <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Flexibles</span>
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Elige el plan perfecto para tu stream
            </p>
          </div>

          {/* Quick buy buttons - always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            <button
              onClick={() => onPlanAction?.({ name: 'PLAN BASE', price: 9.99 })}
              className="py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition-all shadow-lg"
            >
              🎯 Comprar Plan Base
            </button>
            <button
              onClick={() => onPlanAction?.({ name: 'PACK LITE', price: 9.99 })}
              className="py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-90 transition-all shadow-lg"
            >
              ⚡ Agregar Pack Lite
            </button>
            <button
              onClick={() => onPlanAction?.({ name: 'PACK PRO', price: 24.99 })}
              className="py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-90 transition-all shadow-lg"
            >
              🔥 Agregar Pack Pro
            </button>
            <button
              onClick={() => onPlanAction?.({ name: 'PACK MAX', price: 49.99 })}
              className="py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 transition-all shadow-lg"
            >
              ⭐ Agregar Pack Max
            </button>
          </div>

          {/* Pricing Cards */}
          <PricingCards darkMode={darkMode} showToggle={true} onPlanAction={onPlanAction} />

          {/* Divider */}
          <div className="my-20 flex items-center gap-4">
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              📋 Comparativa detallada
            </span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>

          {/* Pricing Comparison Table */}
          <PricingComparison darkMode={darkMode} onPlanAction={onPlanAction} />

          {/* FAQ */}
          <div className="text-center mt-16">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Preguntas? <a href="#contact" className="text-cyan-400 hover:text-cyan-300 font-semibold">Contáctanos</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

