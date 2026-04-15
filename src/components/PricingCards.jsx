import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

const monthlyPlans = [
  {
    icon: '⭐',
    name: 'FREE',
    price: 0,
    description: 'Excelente para probar plataforma',
    cta: 'Comenzar Gratis',
    popular: false,
    voices: [
      '1 voz esencial (2 horas diarias)',
    ],
    stream: 'Perfecto para experimentar con la plataforma',
    compatibility: [
      'Marcador de usuarios específicos',
      'Chat visible',
      'Filtros básicos',
    ],
    extension: 'Silencia usuarios en un click',
  },
  {
    icon: '🟢',
    name: 'START',
    price: 6.99,
    description: 'Ideal para streams ligeros',
    cta: 'Adquirir START',
    popular: false,
    voices: [
      '1 voz personalizada por IA (reutilizable)',
      '1 voz natural premium',
      '1 voz esencial (ilimitada)',
      '200,000 caracteres (~tokens)',
    ],
    stream: 'En uso de voz premium rinde aprox 2-4 horas de stream activo',
    compatibility: [
      'filtrado inteligente',
      'lectura selectiva (preguntas, donadores, etc.)',
      'control de mensajes',
    ],
    extension: 'Permite extender la duración optimizando tu chat',
  },
  {
    icon: '🔵',
    name: 'CREATOR',
    price: 12.99,
    description: 'Ideal para streams activos',
    cta: 'Adquirir CREATOR',
    popular: true,
    voices: [
      '2 voces personalizadas por IA (reutilizables)',
      '2 voces naturales premium',
      '1 voz esencial (ilimitada)',
      '500,000 caracteres (~tokens)',
    ],
    stream: 'Rinde aprox 5-8 horas de stream activo',
    compatibility: [
      'lectura inteligente del chat',
      'voces dinámicas por tipo de usuario',
      '🎬 Extractor de audio',
      'control avanzado de mensajes',
    ],
    extension: 'Mejor rendimiento y eficiencia en el uso de tokens',
  },
  {
    icon: '🔥',
    name: 'PRO',
    price: 17.99,
    description: 'Ideal para interacción constante',
    cta: 'Adquirir PRO',
    popular: false,
    voices: [
      '5 voces personalizadas por IA (reutilizables)',
      '4 voces naturales premium',
      '1 voz esencial (ilimitada)',
      '800,000 caracteres (~tokens)',
    ],
    stream: 'Rinde aprox 10-15 horas de stream activo',
    compatibility: [
      'sistema completo de filtrado',
      '🎬 Extractor de audio',
      'control total del chat',
      'optimización máxima del consumo',
    ],
    experience: 'Experiencia completa con IA',
  },
]

const annualPlans = [
  {
    icon: '🟢',
    name: 'START ANUAL',
    price: 59,
    saving: 'Ahorra ~$25 USD',
    planName: 'START',
    benefits: [
      '1 voz personalizada por IA (reutilizable)',
      '1 voz natural premium',
      '1 voz esencial (ilimitada)',
      '200,000 caracteres (~tokens)',
      'Rinde aprox 2-4 horas de stream activo',
      'filtrado inteligente',
      'lectura selectiva (preguntas, donadores, etc.)',
      'control de mensajes',
    ],
  },
  {
    icon: '🔵',
    name: 'CREATOR ANUAL',
    price: 109,
    saving: 'Ahorra ~$46 USD',
    hot: true,
    planName: 'CREATOR',
    benefits: [
      '2 voces personalizadas por IA (reutilizables)',
      '2 voces naturales premium',
      '1 voz esencial (ilimitada)',
      '500,000 caracteres (~tokens)',
      'Rinde aprox 5-8 horas de stream activo',
      'lectura inteligente del chat',
      'voces dinámicas por tipo de usuario',
      '🎬 Extractor de audio',
      'control avanzado de mensajes',
    ],
  },
  {
    icon: '🔥',
    name: 'PRO ANUAL',
    price: 149,
    saving: 'Ahorra ~$67 USD',
    fast: true,
    planName: 'PRO',
    benefits: [
      '5 voces personalizadas por IA (reutilizables)',
      '4 voces naturales premium',
      '1 voz esencial (ilimitada)',
      '800,000 caracteres (~tokens)',
      'Rinde aprox 10-15 horas de stream activo',
      'Experiencia completa con IA',
      'sistema completo de filtrado',
      '🎬 Extractor de audio',
      'control total del chat',
      'optimización máxima del consumo',
    ],
  },
]

export function PricingCards({ darkMode, showToggle = true, onPlanAction }) {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [usdMxn, setUsdMxn] = useState(17)

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
        // fallback
      }
    }

    loadRate()
    return () => {
      active = false
    }
  }, [])

  const formatMxnApprox = (usdPrice) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(usdPrice * usdMxn)

  return (
    <div>
      {showToggle && (
        <div className="flex justify-center mb-12">
          <div className={`inline-flex rounded-full p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                  : darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                  : darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Anual
            </button>
          </div>
        </div>
      )}

      {billingCycle === 'monthly' && (
        <>
          <div className="text-center mb-8">
            <p className={`text-sm font-bold tracking-wider ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
              💰 PAQUETES COMPLETOS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {monthlyPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg p-8 transition-all duration-300 flex flex-col ${
                  plan.popular
                    ? darkMode
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-400 shadow-2xl shadow-cyan-400/30 scale-105'
                      : 'bg-white border-2 border-cyan-400 shadow-2xl scale-105'
                    : darkMode
                      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700'
                      : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="mb-3">
                    <span className="inline-block text-xs font-black tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                      🔥 MÁS POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-black mb-1">{plan.icon} {plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    ${plan.price.toFixed(2)}
                  </span>
                  <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>USD</span>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aprox. {formatMxnApprox(plan.price)} MXN
                  </p>
                </div>

                <p className={`text-sm mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>⚡ {plan.description}</p>

                <div className="space-y-2 mb-4">
                  {plan.voices.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span>🎙️</span>
                      <span className={darkMode ? 'text-gray-100' : 'text-gray-700'}>{line}</span>
                    </div>
                  ))}
                </div>

                <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>⏱️ {plan.stream}</p>
                {plan.experience && (
                  <p className={`text-sm mb-2 font-semibold ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>🧠 {plan.experience}</p>
                )}

                <p className={`text-sm font-bold mt-4 mb-2 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>🛠️ Compatible con:</p>
                <div className="space-y-2 mb-4">
                  {plan.compatibility.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{line}</span>
                    </div>
                  ))}
                </div>

                {plan.extension && (
                  <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>👉 {plan.extension}</p>
                )}

                {plan.popular ? (
                  <div className="relative mt-auto">
                    {/* Ping ring exterior */}
                    <span className="absolute -inset-1 rounded-xl pointer-events-none animate-ping opacity-50 bg-gradient-to-r from-cyan-400/40 to-purple-500/40" />
                    <button
                      onClick={() => onPlanAction?.(plan, { billingCycle: 'monthly' })}
                      className="relative z-10 w-full py-4 rounded-xl font-black text-base text-white bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse hover:from-cyan-300 hover:to-purple-400 transition-all shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      🚀 {plan.cta}
                    </button>
                    {/* Punto naranja esquina */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400 animate-ping pointer-events-none z-20" />
                  </div>
                ) : (
                  <div className="relative mt-auto">
                    <span className={`absolute -inset-0.5 rounded-xl blur-sm animate-pulse pointer-events-none opacity-40 ${
                      plan.name === 'FREE' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      plan.name === 'START' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                      'bg-gradient-to-r from-orange-400 to-red-500'
                    }`} />
                    <button
                      onClick={() => onPlanAction?.(plan, { billingCycle: 'monthly' })}
                      className={`relative w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] hover:opacity-90 flex items-center justify-center gap-2 shadow-lg ${
                        plan.name === 'FREE'
                          ? 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-gray-500/30'
                          : plan.name === 'START'
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-orange-400 to-red-500 shadow-orange-500/30'
                      }`}
                    >
                      {plan.name === 'FREE' ? '⭐' : plan.name === 'START' ? '🟢' : '⚡'} {plan.cta}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {billingCycle === 'annual' && (
        <>
          <div className="text-center mb-8">
            <p className={`text-sm font-bold tracking-wider ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
              💎 PLANES ANUALES
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {annualPlans.map((plan) => (
              <div key={plan.name} className={`rounded-lg p-8 flex flex-col ${darkMode ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                {plan.hot && (
                  <div className="mb-3">
                    <span className="inline-block text-xs font-black tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white">
                      🔥 MÁS POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-black mb-2">{plan.icon} {plan.name}{plan.hot ? ' 🔥' : ''}{plan.fast ? ' ⚡' : ''}</h3>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
                  ${plan.price}
                </p>
                <p className={darkMode ? 'text-gray-300 mb-1' : 'text-gray-700 mb-1'}>USD / año</p>
                <p className={darkMode ? 'text-[11px] font-bold text-cyan-300 mb-1' : 'text-[11px] font-bold text-cyan-700 mb-1'}>
                  (~${(plan.price / 12).toFixed(2)} USD/mes)
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400 mb-1' : 'text-gray-500 mb-1'}`}>
                  Aprox. {formatMxnApprox(plan.price)} MXN
                </p>
                <p className="text-sm text-green-400">({plan.saving})</p>
                <div className="space-y-2 mt-4 mb-4">
                  {plan.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      <span className={darkMode ? 'text-gray-200 text-sm' : 'text-gray-700 text-sm'}>{benefit}</span>
                    </div>
                  ))}
                </div>
                {plan.hot ? (
                  <div className="relative mt-6">
                    <span className="absolute -inset-1 rounded-xl pointer-events-none animate-ping opacity-50 bg-gradient-to-r from-cyan-400/40 to-purple-500/40" />
                    <button
                      onClick={() => onPlanAction?.({ name: plan.planName || plan.name.replace(' ANUAL', ''), price: plan.price }, { billingCycle: 'annual' })}
                      className="relative z-10 w-full py-4 rounded-xl font-black text-base text-white bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse hover:from-cyan-300 hover:to-purple-400 transition-all shadow-xl shadow-cyan-500/40 hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      🚀 Comprar {plan.name}
                    </button>
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400 animate-ping pointer-events-none z-20" />
                  </div>
                ) : (
                  <div className="relative mt-6">
                    <span className={`absolute -inset-0.5 rounded-xl blur-sm animate-pulse pointer-events-none opacity-40 ${
                      plan.planName === 'START' ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-orange-400 to-red-500'
                    }`} />
                    <button
                      onClick={() => onPlanAction?.({ name: plan.planName || plan.name.replace(' ANUAL', ''), price: plan.price }, { billingCycle: 'annual' })}
                      className={`relative w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] hover:opacity-90 flex items-center justify-center gap-2 shadow-lg ${
                        plan.planName === 'START'
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-orange-400 to-red-500 shadow-orange-500/30'
                      }`}
                    >
                      {plan.planName === 'START' ? '🟢' : '⚡'} Comprar {plan.name}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>🧠 NOTA</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              El consumo depende de la actividad del chat y la configuración.
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Puedes extender la duración usando filtros inteligentes y lectura selectiva.
            </p>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Referencia en MXN aproximada; se adapta al tipo de cambio USD/MXN del día.
            </p>
          </div>
        </>
      )}
    </div>
  )
}


