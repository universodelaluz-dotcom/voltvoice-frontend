import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const getBasePlan = (t) => ({
  icon: '🎯',
  name: 'PLAN BASE',
  price: 9.99,
  description: 'El plan perfecto para empezar a streamear con IA',
  tokens: '20,000 caracteres',
  voices: [
    '2 voces esenciales ilimitadas',
    '2 voces premium',
    'Control de calidad de audio',
    'Soporte prioritario'
  ],
  features: [
    { icon: '🎨', label: 'Filtros avanzados' },
    { icon: '🤖', label: 'Smart filter' },
    { icon: '👤', label: 'Cambiar nick' },
    { icon: '🔇', label: 'Silenciado' },
    { icon: '🛡️', label: 'Anti-spam' },
    { icon: '📊', label: 'Analytics' }
  ]
})

const getAddOns = (t) => [
  {
    icon: '⚡',
    name: 'PACK LITE',
    price: 9.99,
    tokens: '+1 Personaje',
    tokensDesc: 'Clonado y reutilizable para tu stream',
    description: 'Dale vida a UN personaje en tu stream',
    gradient: 'from-cyan-500 to-blue-500',
    buttonColor: 'bg-slate-700 hover:bg-slate-800'
  },
  {
    icon: '🔥',
    name: 'PACK PRO',
    price: 24.99,
    tokens: '+2 Personajes',
    tokensDesc: 'Clonados y reutilizables para tu stream',
    description: 'Crea TODO un elenco de personajes para tu stream',
    gradient: 'from-pink-500 to-rose-500',
    buttonColor: 'bg-slate-600 hover:bg-slate-700',
    popular: true
  },
  {
    icon: '⭐',
    name: 'PACK MAX',
    price: 49.99,
    tokens: '+5 Personajes',
    tokensDesc: 'Clonados y reutilizables para tu stream',
    description: 'Un universo completo de personajes hablando en tu stream',
    gradient: 'from-orange-500 to-red-500',
    buttonColor: 'bg-orange-500 hover:bg-orange-600'
  }
]

export function PricingCards({ darkMode, showToggle = true, onPlanAction }) {
  const { t } = useTranslation()
  const [usdMxn, setUsdMxn] = useState(18)

  useEffect(() => {
    let active = true
    const loadRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const data = await res.json()
        const nextRate = Number(data?.rates?.MXN)
        if (active && Number.isFinite(nextRate) && nextRate > 0) {
          setUsdMxn(nextRate)
        }
      } catch {
        // fallback to 18
      }
    }
    loadRate()
    return () => { active = false }
  }, [])

  const formatMxnApprox = (usdPrice) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(usdPrice * usdMxn)

  const basePlan = getBasePlan(t)
  const addOns = getAddOns(t)

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        {/* Main Grid: Base Plan + Add-ons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* BASE PLAN - Left Column */}
          <div className={`rounded-2xl p-8 transition-all duration-300 flex flex-col ${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-cyan-400/50'
              : 'bg-white border-2 border-cyan-300 shadow-lg'
          }`}>

            {/* Badge */}
            <div className="mb-4">
              <span className="inline-block text-xs font-black tracking-wider px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white">
                ✨ EL MÁS POPULAR
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-black mb-1">{basePlan.icon} {basePlan.name}</h3>
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {basePlan.description}
            </p>

            {/* Price */}
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  ${basePlan.price.toFixed(2)}
                </span>
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>/mes</span>
              </div>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                ≈ {formatMxnApprox(basePlan.price)}
              </p>
            </div>

            {/* Tokens Badge */}
            <div className={`rounded-lg px-3 py-2 mb-4 ${darkMode ? 'bg-white/5' : 'bg-cyan-50'}`}>
              <div className={`text-xs font-bold ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                TOKENS MENSUALES
              </div>
              <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                {basePlan.tokens}
              </div>
            </div>

            {/* Voices */}
            <div className="space-y-2 mb-4">
              <div className={`text-xs font-bold ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>🎙️ VOCES</div>
              {basePlan.voices.map((voice, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{voice}</span>
                </div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="mb-5">
              <div className={`text-xs font-bold mb-2 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>✨ FUNCIONES</div>
              <div className="grid grid-cols-2 gap-2">
                {basePlan.features.map((feature, idx) => (
                  <div key={idx} className={`rounded p-2 text-center ${darkMode ? 'bg-white/5' : 'bg-cyan-50'}`}>
                    <span className="text-lg">{feature.icon}</span>
                    <div className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {feature.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => onPlanAction?.(basePlan, { billingCycle: 'monthly' })}
              className="w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 transition-all shadow-lg mt-auto"
            >
              🚀 ACTIVAR PLAN
            </button>
          </div>

          {/* ADD-ONS - Right Column (2 cols) */}
          <div className="lg:col-span-2">
            <div className="text-center mb-6">
              <p className={`text-sm font-bold tracking-wider ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                📦 AMPLÍA TUS LÍMITES
              </p>
              <h4 className={`text-xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Packs de Tokens Adicionales
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {addOns.map((addon, idx) => (
                <div
                  key={addon.name}
                  className={`rounded-xl p-5 transition-all duration-300 flex flex-col relative ${
                    addon.popular
                      ? darkMode
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-400/50 shadow-lg shadow-pink-400/20 scale-105'
                        : 'bg-white border-2 border-pink-400 shadow-xl scale-105'
                      : darkMode
                        ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700'
                        : 'bg-white border border-gray-200 shadow-md'
                  }`}
                >
                  {/* Badge */}
                  {addon.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-block text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 text-white">
                        ⭐ RECOMENDADO
                      </span>
                    </div>
                  )}

                  <div className={addon.popular ? 'mt-3' : ''}>
                    {/* Header */}
                    <h3 className="text-lg font-black">{addon.icon} {addon.name}</h3>
                    <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {addon.description}
                    </p>

                    {/* Price */}
                    <div className="mb-3">
                      <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${addon.gradient}`}>
                        ${addon.price.toFixed(2)}
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        ≈ {formatMxnApprox(addon.price)}
                      </p>
                    </div>

                    {/* Personajes */}
                    <div className={`rounded-lg px-3 py-2 mb-4 ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-r ${addon.gradient}`}>
                        {addon.tokens}
                      </div>
                      <div className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {addon.tokensDesc}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => onPlanAction?.(addon, { billingCycle: 'monthly', isAddOn: true })}
                      className={`w-full py-2.5 rounded-lg font-black text-sm text-white transition-all ${addon.buttonColor} shadow-md mt-auto`}
                    >
                      ✨ AGREGAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
