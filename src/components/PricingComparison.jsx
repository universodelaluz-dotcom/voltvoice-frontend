import React from 'react'
import { Check, X } from 'lucide-react'

const comparisonData = {
  features: [
    {
      category: 'Voces para stream',
      items: [
        { name: 'Voz esencial', free: '2 horas diarias', start: 'ILIMITADO', creator: 'ILIMITADO', pro: 'ILIMITADO' },
        { name: 'Voces personalizadas', free: false, start: '1 voz personalizada', creator: '2 voces personalizadas', pro: '5 voces personalizadas' },
        { name: 'Voces premium', free: false, start: '1 voz premium', creator: '2 voces premium', pro: '4 voces premium' }
      ]
    },
    {
      category: 'Tiempo de uso real (voces premium y personalizadas)',
      items: [
        { name: 'Capacidad mensual', free: '-', start: '200,000 tokens (≈ 2-4 h)', creator: '500,000 tokens (≈ 5-8 h)', pro: '800,000 tokens (≈ 10-15 h)' }
      ]
    },
    {
      category: 'Herramientas y Características',
      items: [
        { name: 'Herramientas optimizadoras de mensajes', free: false, start: true, creator: true, pro: true },
        { name: 'Voces dinámicas por tipo de usuario', free: false, start: 'limitado', creator: true, pro: true },
        { name: 'Filtros básicos para optimizar el chat', free: 'limitado', start: true, creator: true, pro: true },
        { name: 'Controles avanzados de mensajes', free: false, start: true, creator: true, pro: true },
        { name: 'Lectura inteligente del chat', free: false, start: false, creator: true, pro: true },
      ]
    },
    {
      category: 'IA y Automatización',
      items: [
        { name: 'Asistente por IA', free: false, start: false, creator: false, pro: true },
        { name: 'Comentarista en vivo por IA', free: false, start: false, creator: false, pro: true }
      ]
    }
  ],
  plans: [
    { id: 'free', name: 'FREE', price: '$0', color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-900', angle: 'Para probar', usage: 'Voz esencial: 2 horas diarias', cta: 'Empieza gratis' },
    { id: 'start', name: 'START', price: '$6.99', color: 'from-green-400 to-emerald-600', bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50', borderColor: 'border-green-300', textColor: 'text-gray-900', angle: 'Para empezar', usage: '200,000 tokens (≈ 2-4 h)', cta: 'Elegir plan' },
    { id: 'creator', name: 'CREATOR', price: '$12.99', color: 'from-blue-400 to-indigo-600', bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50', borderColor: 'border-blue-300', textColor: 'text-gray-900', popular: true, angle: 'Para creadores serios', usage: '500,000 tokens (≈ 5-8 h)', cta: 'Elegir plan' },
    { id: 'pro', name: 'PRO', price: '$17.99', color: 'from-orange-400 to-red-600', bgColor: 'bg-gradient-to-br from-orange-50 to-red-50', borderColor: 'border-orange-300', textColor: 'text-gray-900', angle: 'Para automatizar y escalar', usage: '800,000 tokens (≈ 10-15 h)', cta: 'Probar ahora' }
  ]
}

const renderFeatureValue = (value, plan, darkMode) => {
  if (value === null) return '-'
  if (value === true) return <Check className="w-6 h-6 text-green-500 mx-auto" />
  if (value === false) return <X className="w-6 h-6 text-gray-400 mx-auto" />
  return <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{value}</span>
}

export function PricingComparison({ darkMode, onPlanAction }) {
  return (
    <div className={`min-h-screen py-16 px-4 ${darkMode ? 'bg-gradient-to-b from-[#0f0f23] to-[#1a0033] text-white' : 'bg-gradient-to-b from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4">
            Haz que tu audiencia escuche... se impacte! y genere interacción!
          </h1>
          <p className={`text-lg md:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Plataforma de voz avanzada para streamers, gamers y creadores.
          </p>
        </div>

        <div className="hidden lg:block overflow-x-auto rounded-xl shadow-2xl">
          <table className={`w-full border-collapse ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <thead>
              <tr className={darkMode ? 'bg-gray-800/30' : 'bg-gray-50'}>
                <th className={`text-left py-6 px-6 ${darkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  <span className="text-lg md:text-xl font-black tracking-wide">Capacidades</span>
                </th>
                {comparisonData.plans.map((plan) => (
                  <th key={plan.id} className="py-6 px-3 align-middle text-center">
                    <div className="flex flex-col items-center justify-center min-h-[96px]">
                      <div className={`text-[24px] font-bold leading-tight tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {plan.name}
                      </div>
                      <div className="mt-2 flex items-end justify-center gap-1.5">
                        <span className={`text-[36px] leading-none font-bold tracking-[-0.01em] ${
                          darkMode
                            ? (plan.id === 'free'
                              ? 'text-slate-300'
                              : plan.id === 'start'
                                ? 'text-emerald-300'
                                : plan.id === 'creator'
                                  ? 'text-blue-300'
                                  : 'text-orange-300')
                            : (plan.id === 'free'
                              ? 'text-slate-500'
                              : plan.id === 'start'
                                ? 'text-emerald-600'
                                : plan.id === 'creator'
                                  ? 'text-blue-600'
                                  : 'text-orange-600')
                        }`}>
                          {plan.price}
                        </span>
                        <span className={`text-[15px] leading-none font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          / mes
                        </span>
                      </div>
                      {plan.popular && (
                        <div className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                          más popular
                        </div>
                      )}
                      <button
                        onClick={() => onPlanAction?.(plan.id)}
                        className={`mt-3 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          darkMode
                            ? 'bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                            : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {comparisonData.features.map((section, sectionIdx) => (
                <React.Fragment key={sectionIdx}>
                  <tr className={darkMode ? 'bg-gray-800/70' : 'bg-gray-100/50'}>
                    <td colSpan="5" className={`py-4 px-6 font-bold text-sm uppercase tracking-wider ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                      {section.category}
                    </td>
                  </tr>

                  {section.items.map((item, itemIdx) => (
                    <tr key={itemIdx} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-800/40' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <td className={`py-4 px-6 font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {item.name}
                      </td>
                      {comparisonData.plans.map((plan) => (
                        <td key={plan.id} className="py-4 px-4 text-center">
                          {renderFeatureValue(item[plan.id], plan, darkMode)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-6">
          {comparisonData.plans.map((plan) => (
            <div key={plan.id} className={`rounded-xl border-2 ${plan.borderColor} overflow-hidden shadow-lg`}>
              <div className={`${plan.bgColor} p-6 text-center`}>
                <h3 className={`text-2xl font-black ${plan.textColor} mb-1`}>{plan.name}</h3>
                <div className={`text-3xl font-black bg-clip-text bg-gradient-to-r ${plan.color} text-transparent`}>
                  {plan.price}
                </div>
                {plan.popular && (
                  <div className="text-xs font-bold tracking-wider px-2 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white inline-block mt-2">
                    POPULAR
                  </div>
                )}
              </div>

              <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {comparisonData.features.map((section, sectionIdx) => (
                  <div key={sectionIdx} className="mb-6">
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                      {section.category}
                    </h4>
                    <div className="space-y-2">
                      {section.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-start justify-between">
                          <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          <span className="ml-2">
                            {renderFeatureValue(item[plan.id], plan, darkMode)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-12 p-6 rounded-xl border ${darkMode ? 'bg-gray-800/80 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
          <p className={`text-base font-bold mb-3 ${darkMode ? 'text-cyan-300' : 'text-cyan-900'}`}>
            Cómo funciona
          </p>
          <ul className={`text-sm space-y-2 ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
            <li>• FREE incluye voz esencial con 2 horas diarias.</li>
            <li>• En planes de pago, la voz esencial es ilimitada.</li>
            <li>• Voces premium y personalizadas consumen tokens según uso real de audio.</li>
            <li>• Los tokens se renuevan cada mes automáticamente.</li>
            <li>• Puedes combinar voz esencial y voces premium para optimizar costo y rendimiento.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
