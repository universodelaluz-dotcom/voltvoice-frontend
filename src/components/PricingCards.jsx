import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

const BASE_PLAN = {
  name: 'PLAN BASE',
  price: 9.99,
  annualPrice: 99.9,
  tokenCount: 20000,
  subtitle: 'El plan perfecto para empezar a streamear con IA',
  tokens: '20,000 caracteres / mes incluidos',
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
}

const PACKS = [
  {
    planId: 'pack_lite',
    icon: '⚡',
    name: 'PACK LITE',
    bundleName: 'BASE + LITE',
    price: 9.99,
    annualPrice: 199.8,
    tokenCount: 50000,
    subtitle: 'Un personaje clonado para tu stream',
    voices: '+1 Voz clonada',
    estimate: '50 min - 1.5 h',
    tokensDesc: 'Impulsa voces premium y personajes IA. Optimiza con filtros y multiplica el rendimiento hasta 15x.',
    priceGradient: 'from-cyan-400 to-blue-500',
    buttonClass: 'bg-cyan-600 hover:bg-cyan-700',
    voicesClass: 'from-cyan-500 to-blue-500',
  },
  {
    planId: 'pack_pro',
    icon: '🔥',
    name: 'PACK PRO',
    bundleName: 'BASE + PRO',
    price: 24.99,
    annualPrice: 349.8,
    tokenCount: 250000,
    subtitle: 'Tres personajes clonados para tu elenco',
    voices: '+3 Voces clonadas',
    estimate: '4 - 7 h',
    tokensDesc: 'Impulsa voces premium y personajes IA. Optimiza con filtros y multiplica el rendimiento hasta 15x.',
    priceGradient: 'from-pink-400 to-rose-500',
    buttonClass: 'bg-pink-600 hover:bg-pink-700',
    voicesClass: 'from-pink-500 to-rose-500',
    popular: true,
  },
  {
    planId: 'pack_max',
    icon: '⭐',
    name: 'PACK MAX',
    bundleName: 'BASE + MAX',
    price: 49.99,
    annualPrice: 599.8,
    tokenCount: 500000,
    subtitle: 'Seis personajes clonados para tu universo',
    voices: '+6 Voces clonadas',
    estimate: '8 - 14 h',
    tokensDesc: 'Impulsa voces premium y personajes IA. Optimiza con filtros y multiplica el rendimiento hasta 15x.',
    priceGradient: 'from-orange-400 to-red-500',
    buttonClass: 'bg-orange-600 hover:bg-orange-700',
    voicesClass: 'from-orange-500 to-red-500',
  }
]

export function PricingCards({ darkMode, showToggle = true, onPlanAction, layout = 'landing' }) {
  const [usdMxn, setUsdMxn] = useState(18)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [bundleWithBaseByPlan, setBundleWithBaseByPlan] = useState({
    pack_lite: false,
    pack_pro: false,
    pack_max: false,
  })

  useEffect(() => {
    let active = true
    const loadRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const data = await res.json()
        const nextRate = Number(data?.rates?.MXN)
        if (active && Number.isFinite(nextRate) && nextRate > 0) setUsdMxn(nextRate)
      } catch {
        // fallback
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

  const formatCompactTokens = (value) => {
    const num = Number(value || 0)
    if (!Number.isFinite(num) || num <= 0) return '0 tokens'
    if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M tokens`
    if (num >= 1000) return `${Math.round(num / 1000)}K tokens`
    return `${num.toLocaleString('en-US')} tokens`
  }

  const isAnnual = billingCycle === 'annual'
  const basePrice = isAnnual ? BASE_PLAN.annualPrice : BASE_PLAN.price
  const baseLabel = isAnnual ? 'PLAN BASE ANUAL' : BASE_PLAN.name
  const isPricingLayout = layout === 'pricing'
  const packsSectionClass = isPricingLayout
    ? `mt-20 pt-12 border-t ${darkMode ? 'border-cyan-400/20' : 'border-cyan-200'}`
    : `mt-14 pt-7 border-t ${darkMode ? 'border-cyan-400/20' : 'border-cyan-200'}`
  const packsTitleClass = isPricingLayout
    ? `text-base md:text-lg font-black mb-4 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`
    : `text-lg md:text-xl font-black mb-3 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`
  const packsDescClass = isPricingLayout
    ? `text-sm mb-9 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
    : `text-sm md:text-base mb-7 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
  const toggleWrapClass = isPricingLayout ? 'mb-10 flex justify-center' : 'mb-8 flex justify-center'
  const packsGridClass = isPricingLayout ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'grid grid-cols-1 md:grid-cols-3 gap-5'

  return (
    <div className="py-8">
      <style>{`
        @keyframes svGlowCyan {
          0%, 100% { box-shadow: 0 0 0 rgba(34,211,238,0); }
          50% { box-shadow: 0 0 22px rgba(34,211,238,.35); }
        }
        @keyframes svGlowPink {
          0%, 100% { box-shadow: 0 0 0 rgba(236,72,153,0); }
          50% { box-shadow: 0 0 24px rgba(236,72,153,.4); }
        }
        @keyframes svBadgeBlink {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.22); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className={`text-base md:text-lg font-black mb-4 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
          Plan Base - incluido en tu suscripción
        </h2>

        <article className={`relative overflow-hidden rounded-2xl p-7 md:p-8 border ${darkMode ? 'bg-gradient-to-br from-[#141734] via-[#121633] to-[#10142f] border-cyan-400/40 shadow-[0_0_28px_rgba(34,211,238,0.14)]' : 'bg-white border-cyan-200 shadow-sm'}`}>
          <span className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl animate-pulse" />
          <div className="mb-5 inline-flex rounded-full px-3 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500">
            EL MAS POPULAR
          </div>

          <h3 className="text-[32px] leading-tight font-black mb-2">🎯 {baseLabel}</h3>
          <p className={`text-base mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{BASE_PLAN.subtitle}</p>

          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-[44px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              ${basePrice.toFixed(2)}
            </span>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>USD / {isAnnual ? 'ano' : 'mes'}</span>
          </div>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>~ {formatMxnApprox(basePrice)} MXN</p>

          <div className={`inline-block rounded-md px-3 py-2 mb-6 text-sm font-bold ${darkMode ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300' : 'bg-cyan-50 border border-cyan-200 text-cyan-700'}`}>
            {BASE_PLAN.tokens}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {BASE_PLAN.voices.map((voice) => (
              <div key={voice} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{voice}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 mb-6">
            {BASE_PLAN.features.map((feature) => (
              <div key={feature.label} className={`rounded-md px-2 py-2 text-center text-xs font-semibold ${darkMode ? 'bg-white/5 text-gray-200' : 'bg-cyan-50 text-gray-700'}`}>
                <div className="text-sm">{feature.icon}</div>
                {feature.label}
              </div>
            ))}
          </div>

          <button
            onClick={() => onPlanAction?.({ ...BASE_PLAN, name: baseLabel, price: basePrice, planId: 'base' }, { billingCycle, planId: 'base' })}
            className="w-full py-3.5 rounded-lg font-bold text-base text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 transition-all hover:shadow-[0_0_18px_rgba(34,211,238,0.28)]"
          >
            {isAnnual ? '🚀 Comprar Plan Base Anual' : '🚀 Comprar Plan Base'}
          </button>
        </article>

        <section className={packsSectionClass}>
          <h2 className={packsTitleClass}>
            Packs de voces clonadas - añade personajes a tu stream
          </h2>
          <p className={packsDescClass}>
            Los packs son compras independientes que se suman a tu Plan Base. Combínalos para crear tu elenco de personajes con voz propia.
          </p>

          {showToggle && (
            <div className={toggleWrapClass}>
              <div className={`inline-flex gap-2 rounded-xl p-1.5 border ${darkMode ? 'border-cyan-500/30 bg-[#0b1327]' : 'border-cyan-200 bg-cyan-50'}`}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2.5 min-h-10 rounded-md text-base font-black ${billingCycle === 'monthly' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-2.5 min-h-10 rounded-md text-base font-black ${billingCycle === 'annual' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Anual (2 meses gratis)
                </button>
              </div>
            </div>
          )}

          <div className={packsGridClass}>
            {PACKS.map((pack) => {
              const bundleWithBase = Boolean(bundleWithBaseByPlan[pack.planId])
              const comboPrice = BASE_PLAN.price + pack.price
              const activePrice = isAnnual ? pack.annualPrice : (bundleWithBase ? comboPrice : pack.price)
              const includesBaseTokens = isAnnual || bundleWithBase
              const shownTokenCount = includesBaseTokens
                ? Number(pack.tokenCount || 0) + Number(BASE_PLAN.tokenCount || 0)
                : Number(pack.tokenCount || 0)
              const checkoutPlanId = !isAnnual && bundleWithBase ? `${pack.planId}_combo` : pack.planId
              const checkoutName = isAnnual || bundleWithBase ? pack.bundleName : pack.name

              return (
                <article
                  key={pack.planId}
                  className={`rounded-2xl p-5 border flex flex-col relative overflow-visible ${darkMode ? 'bg-gradient-to-b from-[#181c3b] to-[#121735] border-white/15' : 'bg-white border-gray-200 shadow-sm'} ${pack.popular ? (darkMode ? 'ring-1 ring-pink-400/60 shadow-[0_0_24px_rgba(236,72,153,0.22)]' : 'ring-1 ring-pink-300') : ''}`}
                  style={{ animation: pack.popular ? 'svGlowPink 2.1s ease-in-out infinite' : 'svGlowCyan 2.6s ease-in-out infinite' }}
                >
                  <span className={`pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-60 animate-pulse ${pack.popular ? 'bg-pink-400/30' : 'bg-cyan-400/20'}`} />
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex rounded-full px-3 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500" style={{ animation: 'svBadgeBlink 1.4s ease-in-out infinite' }}>
                      ⭐ RECOMENDADO
                    </span>
                  )}

                  <div className="text-[38px] leading-none mb-2">{pack.icon}</div>
                  <h4 className="text-[28px] leading-[1] font-black mb-2">{isAnnual ? pack.bundleName : (bundleWithBase ? pack.bundleName : pack.name)}</h4>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{pack.subtitle}</p>

                  <div className="mb-3 flex items-baseline gap-2">
                    <span className={`text-[42px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r ${pack.priceGradient}`}>${activePrice.toFixed(2)}</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>USD</span>
                  </div>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>~ {formatMxnApprox(activePrice)} MXN</p>

                  {!isAnnual && (
                    <div className={`mb-3 rounded-lg p-1.5 border ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBundleWithBaseByPlan((prev) => ({ ...prev, [pack.planId]: false }))}
                          className={`rounded-md px-3 py-2.5 min-h-10 text-xs font-bold ${!bundleWithBase ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Solo pack
                        </button>
                        <button
                          type="button"
                          onClick={() => setBundleWithBaseByPlan((prev) => ({ ...prev, [pack.planId]: true }))}
                          className={`rounded-md px-3 py-2.5 min-h-10 text-xs font-bold ${bundleWithBase ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          Base + Pack
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-xl px-4 py-3 mb-3 text-white bg-gradient-to-r ${pack.voicesClass}`}>
                    <div className="text-xs font-semibold">{pack.voices}</div>
                    <div className="text-xs opacity-90">Para usar voces premium y tus personajes</div>
                  </div>

                  <div className={`rounded-xl px-4 py-3 mb-3 ${darkMode ? 'bg-gray-700/35 border border-gray-600/70' : 'bg-gray-100 border border-gray-300'}`}>
                    <strong className={`block text-2xl leading-none font-black text-transparent bg-clip-text bg-gradient-to-r ${pack.priceGradient}`}>
                      {formatCompactTokens(shownTokenCount)}
                    </strong>
                    <div className={`text-sm mt-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pack.estimate}</div>
                    <div className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{pack.tokensDesc}</div>
                  </div>

                  <button
                    onClick={() => onPlanAction?.(
                      { ...pack, name: checkoutName, price: activePrice, planId: checkoutPlanId },
                      { billingCycle, isAddOn: true, planId: checkoutPlanId }
                    )}
                    className={`w-full mt-auto py-3 rounded-lg font-bold text-sm text-white transition-all hover:shadow-[0_0_18px_rgba(56,189,248,0.28)] ${pack.buttonClass}`}
                    style={{ animation: 'svBadgeBlink 2s ease-in-out infinite' }}
                  >
                    {isAnnual ? 'Elegir anual' : (bundleWithBase ? `Comprar ${pack.bundleName}` : `Agregar ${pack.name}`)}
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <p className={`mt-4 text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Los tiempos mostrados son estimaciones bajo condiciones promedio de uso.
        </p>
      </div>
    </div>
  )
}


