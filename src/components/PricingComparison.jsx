import React from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const getComparisonData = (t, billingCycle = 'monthly') => ({
  features: [
    {
      category: 'Voces',
      items: [
        { name: '2 Voces esenciales', base: true, lite: true, pro: true, max: true },
        { name: '2 Voces premium', base: true, lite: true, pro: true, max: true }
      ]
    },
    {
      category: 'Filtros & Controles',
      items: [
        { name: 'Filtros avanzados', base: true, lite: true, pro: true, max: true },
        { name: 'Smart filter', base: true, lite: true, pro: true, max: true },
        { name: 'Cambiar nick', base: true, lite: true, pro: true, max: true },
        { name: 'Silenciado', base: true, lite: true, pro: true, max: true },
        { name: 'Anti-spam', base: true, lite: true, pro: true, max: true },
        { name: 'Analytics', base: true, lite: true, pro: true, max: true }
      ]
    },
    {
      category: 'Capacidad',
      items: [
        { name: billingCycle === 'annual' ? 'Caracteres por mes (durante suscripción anual)' : 'Caracteres incluidos', base: '20,000', lite: '70,000', pro: '270,000', max: '520,000' }
      ]
    }
  ],
  plans: [
    {
      id: 'base',
      checkoutPlanId: 'base',
      name: billingCycle === 'annual' ? 'PLAN BASE ANUAL' : 'PLAN BASE',
      price: billingCycle === 'annual' ? '$99.90' : '$9.99',
      numericPrice: billingCycle === 'annual' ? 99.90 : 9.99,
      color: 'from-cyan-400 to-purple-500',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-purple-50',
      borderColor: 'border-cyan-300',
      textColor: 'text-gray-900',
      popular: true,
      usage: '20,000 caracteres',
      cta: billingCycle === 'annual' ? 'Suscribirme anual' : t('pricing.comparison.choosePlan')
    },
    {
      id: 'lite',
      checkoutPlanId: 'pack_lite',
      name: billingCycle === 'annual' ? 'BASE + LITE' : 'PACK LITE',
      price: billingCycle === 'annual' ? '$199.80' : '$9.99',
      numericPrice: billingCycle === 'annual' ? 199.80 : 9.99,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50',
      borderColor: 'border-cyan-300',
      textColor: 'text-gray-900',
      usage: '70,000 caracteres totales',
      cta: billingCycle === 'annual' ? 'Suscribirme anual' : t('pricing.comparison.choosePlan')
    },
    {
      id: 'pro',
      checkoutPlanId: 'pack_pro',
      name: billingCycle === 'annual' ? 'BASE + PRO' : 'PACK PRO',
      price: billingCycle === 'annual' ? '$349.80' : '$24.99',
      numericPrice: billingCycle === 'annual' ? 349.80 : 24.99,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      borderColor: 'border-purple-300',
      textColor: 'text-gray-900',
      usage: '270,000 caracteres totales',
      cta: billingCycle === 'annual' ? 'Suscribirme anual' : t('pricing.comparison.choosePlan')
    },
    {
      id: 'max',
      checkoutPlanId: 'pack_max',
      name: billingCycle === 'annual' ? 'BASE + MAX' : 'PACK MAX',
      price: billingCycle === 'annual' ? '$599.80' : '$49.99',
      numericPrice: billingCycle === 'annual' ? 599.80 : 49.99,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
      borderColor: 'border-orange-300',
      textColor: 'text-gray-900',
      usage: '520,000 caracteres totales',
      cta: billingCycle === 'annual' ? 'Suscribirme anual' : t('pricing.comparison.choosePlan')
    }
  ]
})

const renderFeatureValue = (value, plan, darkMode) => {
  if (value === null) return '-'
  if (value === true) return <Check className="w-6 h-6 text-green-500 mx-auto" />
  if (value === false) return <X className="w-6 h-6 text-gray-400 mx-auto" />
  return <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{value}</span>
}

export function PricingComparison({ darkMode, onPlanAction, billingCycle = 'monthly' }) {
  const { t } = useTranslation()
  const comparisonData = getComparisonData(t, billingCycle)
  return (
    <div className={`min-h-screen py-16 px-4 ${darkMode ? 'bg-gradient-to-b from-[#0f0f23] to-[#1a0033] text-white' : 'bg-gradient-to-b from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4">
            {t('pricing.comparison.title')}
          </h1>
          <p className={`text-lg md:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('pricing.comparison.subtitle')}
          </p>
        </div>

        <div className="hidden lg:block overflow-x-auto rounded-xl shadow-2xl">
          <table className={`w-full border-collapse ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <thead>
              <tr className={darkMode ? 'bg-gray-800/30' : 'bg-gray-50'}>
                <th className={`text-left py-6 px-6 ${darkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  <span className="text-lg md:text-xl font-black tracking-wide">{t('pricing.comparison.capabilities')}</span>
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
                            ? (plan.id === 'base'
                              ? 'text-cyan-300'
                              : plan.id === 'lite'
                                ? 'text-cyan-300'
                                : plan.id === 'pro'
                                  ? 'text-purple-300'
                                  : 'text-orange-300')
                            : (plan.id === 'base'
                              ? 'text-cyan-600'
                              : plan.id === 'lite'
                                ? 'text-cyan-600'
                                : plan.id === 'pro'
                                  ? 'text-purple-600'
                                  : 'text-orange-600')
                        }`}>
                          {plan.price}
                        </span>
                        <span className={`text-[15px] leading-none font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {billingCycle === 'annual' ? '/año' : t('pricing.comparison.perMonth')}
                        </span>
                      </div>
                      {plan.popular && (
                        <div className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                          {t('pricing.comparison.mostPopular')}
                        </div>
                      )}
                      <div className="relative mt-3">
                        {plan.popular ? (
                          <>
                            <span className="absolute -inset-1 rounded-xl pointer-events-none animate-ping opacity-50 bg-gradient-to-r from-cyan-400/40 to-blue-500/40" />
                            <button
                              onClick={() => onPlanAction?.(
                                { name: plan.name, price: plan.numericPrice, planId: plan.checkoutPlanId },
                                { planId: plan.checkoutPlanId, billingCycle }
                              )}
                              className="relative z-10 w-full px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all animate-pulse hover:scale-[1.03] shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-400 to-blue-500"
                            >
                              🚀 {plan.cta}
                            </button>
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400 animate-ping pointer-events-none z-20" />
                          </>
                        ) : (
                          <button
                            onClick={() => onPlanAction?.(
                              { name: plan.name, price: plan.numericPrice, planId: plan.checkoutPlanId },
                              { planId: plan.checkoutPlanId, billingCycle }
                            )}
                            className={`relative w-full px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.03] hover:opacity-90 shadow-md flex items-center justify-center gap-1.5 bg-gradient-to-r ${
                              plan.id === 'base'
                                ? 'from-cyan-400 to-purple-500 shadow-cyan-500/20'
                                : plan.id === 'lite'
                                ? 'from-cyan-500 to-blue-500 shadow-cyan-500/20'
                                : plan.id === 'pro'
                                ? 'from-purple-500 to-pink-500 shadow-purple-500/20'
                                : 'from-orange-500 to-red-500 shadow-orange-500/20'
                            }`}
                          >
                            {plan.id === 'base' ? '🎯' : plan.id === 'lite' ? '⚡' : plan.id === 'pro' ? '🔥' : '⭐'} {plan.cta}
                          </button>
                        )}
                      </div>
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
                    {t('pricing.comparison.mostPopular')}
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
            {t('pricing.comparison.howWorks')}
          </p>
          <ul className={`text-sm space-y-2 ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
            {t('pricing.comparison.howWorksList', { returnObjects: true }).map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
