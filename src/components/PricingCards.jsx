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
    planId: 'pack_lite',
    icon: '⚡',
    name: 'PACK LITE',
    price: 9.99,
    annualPrice: 199.80,
    characters: '+1 Voz',
    tokens: '50K tokens',
    estimate: '50 min – 1.5 h',
    tokensDesc: 'Impulsa voces premium y personajes IA. Optimiza con filtros y multiplica el rendimiento hasta 15x.',
    description: 'Un personaje clonado para tu stream',
    gradient: 'from-cyan-500 to-blue-500',
    buttonColor: 'bg-cyan-600 hover:bg-cyan-700'
  },
  {
    planId: 'pack_pro',
    icon: '🔥',
    name: 'PACK PRO',
    price: 24.99,
    annualPrice: 349.80,
    characters: '+3 Voces',
    tokens: '250K tokens',
    estimate: '4 – 7 h',
    tokensDesc: 'Impulsa voces premium y personajes IA. Optimiza con filtros y multiplica el rendimiento hasta 15x.',
    description: 'Tres personajes clonados para tu elenco',
    gradient: 'from-pink-500 to-rose-500',
    buttonColor: 'bg-pink-600 hover:bg-pink-700',
    popular: true
  },
  {
    planId: 'pack_max',
    icon: '⭐',
    name: 'PACK MAX',
    price: 49.99,
    annualPrice: 599.80,
    characters: '+6 Voces',
    tokens: '500K tokens',
    estimate: '8 – 14 h',
    tokensDesc: 'Impulsa voces premium y personajes IA. Optimiza con filtros y multiplica el rendimiento hasta 15x.',
    description: 'Seis personajes clonados para tu universo',
    gradient: 'from-orange-500 to-red-500',
    buttonColor: 'bg-orange-600 hover:bg-orange-700'
  }
]

export function PricingCards({ darkMode, showToggle = true, onPlanAction }) {
  const { t } = useTranslation()
  const [usdMxn, setUsdMxn] = useState(18)
  const [billingCycle, setBillingCycle] = useState('monthly')

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
  const isAnnual = billingCycle === 'annual'
  const basePrice = isAnnual ? 99.90 : basePlan.price
  const baseLabel = isAnnual ? 'PLAN BASE ANUAL' : 'PLAN BASE'
  const [bundleWithBaseByPlan, setBundleWithBaseByPlan] = useState({
    pack_lite: true,
    pack_pro: true,
    pack_max: true,
  })

  return (
    <div className="py-4">
      <div className="max-w-6xl mx-auto px-4">
        {showToggle && (
          <div className="mb-5 flex justify-center">
            <div className={`inline-flex rounded-xl p-1 border ${darkMode ? 'border-cyan-500/30 bg-[#0b1327]' : 'border-cyan-200 bg-cyan-50'}`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-black ${billingCycle === 'monthly' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-lg text-sm font-black ${billingCycle === 'annual' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Anual (2 meses gratis)
              </button>
            </div>
          </div>
        )}

        {/* Una sola fila: base plan (2 cols) + 3 packs (1 col c/u) = 5 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">

          {/* BASE PLAN - 2 columnas */}
          <div className={`lg:col-span-2 rounded-2xl p-6 transition-all duration-300 flex flex-col relative group ${
            darkMode
              ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-cyan-400/50'
              : 'bg-white border-2 border-cyan-300 shadow-lg'
          } hover:shadow-2xl hover:shadow-cyan-400/30 animate-pulse-subtle`}>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-400/10 to-purple-500/10 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col h-full">

              <div className="mb-3">
                <span className="inline-block text-xs font-black tracking-wider px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white">
                  ✨ EL MÁS POPULAR
                </span>
              </div>

              <h3 className="text-2xl font-black mb-1">{basePlan.icon} {baseLabel}</h3>
              <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {basePlan.description}
              </p>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    ${basePrice.toFixed(2)}
                  </span>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>USD /{isAnnual ? 'año' : 'mes'}</span>
                </div>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  ≈ {formatMxnApprox(basePrice)} MXN
                </p>
              </div>

              <div className={`rounded-lg px-3 py-2 mb-4 ${darkMode ? 'bg-white/5' : 'bg-cyan-50'}`}>
                <div className={`text-xs font-bold ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>TOKENS MENSUALES</div>
                <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {basePlan.tokens}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className={`text-xs font-bold ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>🎙️ VOCES</div>
                {basePlan.voices.map((voice, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{voice}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className={`text-xs font-bold mb-2 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>✨ FUNCIONES</div>
                <div className="grid grid-cols-3 gap-2">
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

              <button
                onClick={() => onPlanAction?.({ ...basePlan, name: baseLabel, price: basePrice, planId: 'base' }, { billingCycle, planId: 'base' })}
                className="w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 transition-all shadow-lg mt-auto hover:shadow-xl hover:shadow-slate-700/50 animate-button-pulse"
              >
                🚀 ACTIVAR {isAnnual ? 'ANUAL' : 'PLAN'}
              </button>
            </div>
          </div>

          {/* 3 PACK ADD-ONS - 1 columna cada uno */}
          {addOns.map((addon) => (
            <div
              key={addon.name}
              className={`rounded-2xl p-6 transition-all duration-300 flex flex-col relative group ${
                addon.popular
                  ? darkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-400/50 shadow-2xl shadow-pink-400/30 scale-105 animate-shimmer'
                    : 'bg-gradient-to-br from-white to-pink-50 border-2 border-pink-400 shadow-2xl scale-105 animate-shimmer'
                  : darkMode
                    ? 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-2 border-gray-600/50 shadow-lg shadow-gray-900/50 hover:shadow-xl'
                    : 'bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl'
              }`}
            >
              {addon.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 text-white whitespace-nowrap shadow-lg">
                    ⭐ RECOMENDADO
                  </span>
                </div>
              )}

              <div className={`flex flex-col h-full ${addon.popular ? 'mt-3' : ''}`}>
                <div className="mb-1">
                  <div className={`text-5xl ${!addon.popular ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                    {addon.icon}
                  </div>
                </div>
                <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isAnnual
                    ? `BASE + ${addon.name.replace('PACK ', '')}`
                    : (bundleWithBaseByPlan[addon.planId]
                      ? `BASE + ${addon.name.replace('PACK ', '')}`
                      : addon.name)}
                </h3>
                <p className={`text-xs mb-4 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isAnnual
                    ? `${addon.description} en suscripción anual.`
                    : (bundleWithBaseByPlan[addon.planId]
                      ? `${addon.description}. Compra mensual en una sola transacción: Base + Pack.`
                      : addon.description)}
                </p>

                {!isAnnual && (
                  <div className={`mb-3 rounded-lg p-1 border ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="grid grid-cols-2 gap-1 text-[11px] font-black">
                      <button
                        type="button"
                        onClick={() => setBundleWithBaseByPlan((prev) => ({ ...prev, [addon.planId]: false }))}
                        className={`rounded-md px-2 py-1.5 ${!bundleWithBaseByPlan[addon.planId] ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Solo pack
                      </button>
                      <button
                        type="button"
                        onClick={() => setBundleWithBaseByPlan((prev) => ({ ...prev, [addon.planId]: true }))}
                        className={`rounded-md px-2 py-1.5 ${bundleWithBaseByPlan[addon.planId] ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Base + Pack
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  {(() => {
                    const monthlyCombo = addon.price + basePlan.price
                    const activePrice = isAnnual
                      ? addon.annualPrice
                      : (bundleWithBaseByPlan[addon.planId] ? monthlyCombo : addon.price)
                    return (
                      <>
                  <div className="flex items-baseline gap-1">
                    <div className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${addon.gradient}`}>
                          ${activePrice.toFixed(2)}
                    </div>
                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>USD</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          ≈ {formatMxnApprox(activePrice)} MXN
                  </p>
                        {!isAnnual && bundleWithBaseByPlan[addon.planId] && (
                          <p className={`text-[11px] mt-1 font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            1 transacción mensual: Base + Pack
                          </p>
                        )}
                      </>
                    )
                  })()}
                  {isAnnual && (
                    <p className={`text-[11px] mt-1 font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Incluye 2 meses gratis
                    </p>
                  )}
                </div>

                <div className={`rounded-xl px-4 py-3 mb-4 bg-gradient-to-r ${addon.gradient} text-white`}>
                  <div className="text-xs font-semibold opacity-90">VOCES PARA CLONAR</div>
                  <div className="text-2xl font-black mt-1">
                    {addon.characters}
                  </div>
                </div>

                <div className={`rounded-xl px-4 py-3 mb-5 ${darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-100 border border-gray-300'}`}>
                  <div className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>TOKENS INCLUIDOS</div>
                  <div className={`text-2xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r ${addon.gradient}`}>
                    {addon.tokens}
                  </div>
                  <div className={`text-xs mt-1 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {addon.estimate}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {addon.tokensDesc}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const isMonthlyBundle = !isAnnual && Boolean(bundleWithBaseByPlan[addon.planId])
                    const monthlyBundlePrice = addon.price + basePlan.price
                    const planIdForCheckout = isMonthlyBundle ? `${addon.planId}_combo` : addon.planId
                    const nameForCheckout = isAnnual || isMonthlyBundle
                      ? `BASE + ${addon.name.replace('PACK ', '')}`
                      : addon.name
                    const priceForCheckout = isAnnual
                      ? addon.annualPrice
                      : (isMonthlyBundle ? monthlyBundlePrice : addon.price)

                    onPlanAction?.(
                      { ...addon, name: nameForCheckout, price: priceForCheckout, planId: planIdForCheckout },
                      { billingCycle, isAddOn: true, planId: planIdForCheckout }
                    )
                  }}
                  className={`w-full py-3 rounded-xl font-black text-sm text-white transition-all ${addon.buttonColor} shadow-lg hover:shadow-xl mt-auto`}
                >
                  ✨ {isAnnual ? 'ELEGIR ANUAL' : (bundleWithBaseByPlan[addon.planId] ? 'COMPRAR BASE + PACK' : 'AGREGAR')}
                </button>
              </div>
            </div>
          ))}

        </div>

        <p className={`mt-5 text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Los tiempos mostrados son estimaciones bajo condiciones promedio de uso. Y mejorara si usas las herramientas que te damos.
        </p>
      </div>
    </div>
  )
}
