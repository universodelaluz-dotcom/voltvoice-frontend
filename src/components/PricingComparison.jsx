import React from 'react'
import { Check, X } from 'lucide-react'

const comparisonData = {
  features: [
    {
      category: 'Voces Locales',
      items: [
        { name: 'Voces Locales limitadas', free: true, start: true, creator: true, pro: true }
      ]
    },
    {
      category: 'Voces Clonadas',
      items: [
        { name: 'Voces Clonadas', free: false, start: '1 voz clonada', creator: '2 voces clonadas', pro: '5 voces clonadas' },
        { name: 'Voces premium', free: false, start: '1 voz premium', creator: '2 voces premium', pro: '4 voces premium' }
      ]
    },
    {
      category: 'Herramientas & Características',
      items: [
        { name: 'Herramientas optimizadoras de mensajes', free: false, start: true, creator: true, pro: true },
        { name: 'Voces dinámicas por tipo de usuario', free: false, start: 'limitado', creator: true, pro: true },
        { name: 'Filtros Básicos para optimizar el chat', free: 'limitado', start: true, creator: true, pro: true },
        { name: 'Controles avanzados de mensajes', free: false, start: true, creator: true, pro: true },
        { name: 'Lectura inteligente del chat', free: false, start: false, creator: true, pro: true },
      ]
    },
    {
      category: 'IA & Automatización',
      items: [
        { name: 'Asistente por IA', free: false, start: false, creator: false, pro: true },
        { name: 'Comentarista en vivo por IA', free: false, start: false, creator: false, pro: true }
      ]
    },
    {
      category: 'Capacidad de Voces Premium/Clonadas',
      items: [
        { name: 'Tokens mensuales', free: null, start: '200,000', creator: '500,000', pro: '800,000' },
        { name: 'Duración aprox. de voces especiales*', free: null, start: '2-4 horas', creator: '5-8 horas', pro: '10-15 horas' }
      ]
    }
  ],
  plans: [
    { id: 'free', name: 'FREE', price: '$0', color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-900', icon: '🎁' },
    { id: 'start', name: 'START', price: '$6.99', color: 'from-green-400 to-emerald-600', bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50', borderColor: 'border-green-300', textColor: 'text-gray-900', icon: '🟢' },
    { id: 'creator', name: 'CREATOR', price: '$12.99', color: 'from-blue-400 to-indigo-600', bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50', borderColor: 'border-blue-300', textColor: 'text-gray-900', icon: '🔵', popular: true },
    { id: 'pro', name: 'PRO', price: '$17.99', color: 'from-orange-400 to-red-600', bgColor: 'bg-gradient-to-br from-orange-50 to-red-50', borderColor: 'border-orange-300', textColor: 'text-gray-900', icon: '🔥' }
  ]
}

const renderFeatureValue = (value, plan, darkMode) => {
  if (value === null) return '—'
  if (value === true) return <Check className="w-6 h-6 text-green-500 mx-auto" />
  if (value === false) return <X className="w-6 h-6 text-gray-400 mx-auto" />
  return <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{value}</span>
}

export function PricingComparison({ darkMode, onPlanAction }) {
  return (
    <div className={`min-h-screen py-16 px-4 ${darkMode ? 'bg-gradient-to-b from-[#0f0f23] to-[#1a0033] text-white' : 'bg-gradient-to-b from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4">
            Comparativa <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Completa</span>
          </h1>
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Encuentra el plan perfecto para tus necesidades
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto rounded-xl shadow-2xl">
          <table className={`w-full border-collapse ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Header */}
            <thead>
              <tr className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <th className={`text-left py-6 px-6 font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  Función
                </th>
                {comparisonData.plans.map((plan) => (
                  <th key={plan.id} className="py-6 px-4">
                    <div className={`rounded-2xl p-6 text-center shadow-lg transition-all hover:shadow-xl border-2 ${
                      plan.popular
                        ? `${darkMode ? 'bg-gray-800 border-cyan-500/50' : 'bg-white border-cyan-400'} scale-105`
                        : `${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`
                    }`}>
                      <div className="text-3xl mb-3">{plan.icon}</div>
                      <div className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </div>
                      <div className={`text-3xl font-black bg-clip-text bg-gradient-to-r ${plan.color} text-transparent my-3`}>
                        {plan.price}
                      </div>
                      {plan.popular && (
                        <div className={`text-xs font-bold tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white inline-block mt-3`}>
                          🔥 POPULAR
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {comparisonData.features.map((section, sectionIdx) => (
                <React.Fragment key={sectionIdx}>
                  {/* Category Header */}
                  <tr className={darkMode ? 'bg-gray-800/70' : 'bg-gray-100/50'}>
                    <td colSpan="5" className={`py-4 px-6 font-bold text-sm uppercase tracking-wider ${darkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                      {section.category}
                    </td>
                  </tr>

                  {/* Feature Rows */}
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

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-6">
          {comparisonData.plans.map((plan) => (
            <div key={plan.id} className={`rounded-xl border-2 ${plan.borderColor} overflow-hidden shadow-lg`}>
              {/* Plan Header */}
              <div className={`${plan.bgColor} p-6 text-center`}>
                <div className="text-3xl mb-2">{plan.icon}</div>
                <h3 className={`text-2xl font-black ${plan.textColor} mb-1`}>{plan.name}</h3>
                <div className={`text-3xl font-black bg-clip-text bg-gradient-to-r ${plan.color} text-transparent`}>
                  {plan.price}
                </div>
                {plan.popular && (
                  <div className="text-xs font-bold tracking-wider px-2 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white inline-block mt-2">
                    🔥 POPULAR
                  </div>
                )}
              </div>

              {/* Features List */}
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

        {/* Bottom Note */}
        <div className={`mt-16 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
          <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-cyan-300' : 'text-blue-900'}`}>
            📌 Nota importante:
          </p>
          <ul className={`text-sm space-y-2 ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
            <li>✅ <strong>Voces locales:</strong> Streamea sin límites con las voces del sistema.</li>
            <li>⭐ <strong>Voces clonadas/premium:</strong> Los tokens mensuales definen cuánto tiempo puedes usar tus voces especiales.</li>
            <li>🔄 <strong>Renovación mensual:</strong> Los tokens se resetean cada mes automáticamente.</li>
            <li>💰 <strong>Flexibilidad:</strong> Puedes combinar voces locales (ilimitadas) con voces premium para optimizar tu consumo.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
