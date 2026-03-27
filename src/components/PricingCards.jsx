import { useState } from 'react'
import { Check } from 'lucide-react'

export function PricingCards({ darkMode, showToggle = true }) {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Para probar StreamVoicer',
      cta: 'Adquirir Ahora',
      popular: false,
      features: [
        { text: '100 Créditos/mes', included: true },
        { text: '5 Voces', included: true },
        { text: 'Síntesis básica', included: true },
        { text: 'Integración TikTok', included: false },
        { text: 'Integración YouTube', included: false },
        { text: 'Soporte prioritario', included: false },
      ]
    },
    {
      name: 'Standard',
      monthlyPrice: 7.99,
      annualPrice: 59.88,
      oldMonthlyPrice: 14.99,
      oldAnnualPrice: 179.88,
      description: 'Para streamers ocasionales',
      cta: 'Suscribir',
      popular: false,
      badge: 'Ahorra 38%',
      features: [
        { text: '5,000 Créditos/mes', included: true },
        { text: '50+ Voces', included: true },
        { text: 'Síntesis HD', included: true },
        { text: 'Integración TikTok', included: true },
        { text: 'Integración YouTube', included: false },
        { text: 'API acceso', included: false },
      ]
    },
    {
      name: 'Pro',
      monthlyPrice: 24.99,
      annualPrice: 239.88,
      oldMonthlyPrice: 39.99,
      oldAnnualPrice: 479.88,
      description: 'Para streamers activos',
      cta: 'Suscribir',
      popular: true,
      badge: 'Ahorra 50%',
      features: [
        { text: '25,000 Créditos/mes', included: true },
        { text: '100+ Voces', included: true },
        { text: 'Síntesis premium', included: true },
        { text: 'Integración TikTok', included: true },
        { text: 'Integración YouTube', included: true },
        { text: 'Soporte prioritario', included: true },
        { text: 'API acceso completo', included: true },
      ]
    },
    {
      name: 'Pro+',
      monthlyPrice: 59.99,
      annualPrice: 599.88,
      oldMonthlyPrice: 99.99,
      oldAnnualPrice: 1199.88,
      description: 'Para profesionales',
      cta: 'Suscribir',
      popular: false,
      badge: 'Ahorra 17%',
      features: [
        { text: '100,000 Créditos/mes', included: true },
        { text: 'Voces ilimitadas', included: true },
        { text: 'Síntesis máxima calidad', included: true },
        { text: 'Integración TikTok', included: true },
        { text: 'Integración YouTube', included: true },
        { text: 'Soporte VIP 24/7', included: true },
        { text: 'API acceso ilimitado', included: true },
      ]
    }
  ]

  const getDisplayPrice = (plan) => {
    if (billingCycle === 'monthly') {
      return plan.monthlyPrice.toFixed(2)
    } else {
      return (plan.annualPrice / 12).toFixed(2)
    }
  }

  const getOldPrice = (plan) => {
    if (billingCycle === 'monthly') {
      return plan.oldMonthlyPrice?.toFixed(2)
    } else {
      return (plan.oldAnnualPrice / 12).toFixed(2)
    }
  }

  const getBillingText = (plan) => {
    if (billingCycle === 'monthly') {
      return `$${(plan.monthlyPrice * 12).toFixed(2)} facturado anualmente como $${(plan.monthlyPrice * 12).toFixed(2)}/año`
    } else {
      return `Facturado anualmente como $${plan.annualPrice.toFixed(2)}`
    }
  }

  return (
    <div>
      {/* Toggle */}
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
              Anual (Ahorra 17%)
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-lg transition-all duration-300 ${
              plan.popular
                ? darkMode
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-400 shadow-2xl shadow-cyan-400/30 scale-105'
                  : 'bg-white border-2 border-cyan-400 shadow-2xl scale-105'
                : darkMode
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-cyan-400/50'
                  : 'bg-white border border-gray-200 hover:border-cyan-400/50'
            } p-6`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-green-400 to-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  Más Popular
                </div>
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {plan.description}
            </p>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                  ${getDisplayPrice(plan)}
                </span>
                <span className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  /mes
                </span>
              </div>

              {/* Old Price */}
              {plan.oldMonthlyPrice && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="line-through text-sm text-gray-500">
                    ${getOldPrice(plan)}
                  </span>
                  {plan.badge && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                      {plan.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Billing Info */}
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {getBillingText(plan)}
              </p>
            </div>

            {/* CTA Button */}
            <button
              className={`w-full py-3 rounded-lg font-bold transition-all mb-6 ${
                plan.popular
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-400/50'
                  : darkMode
                    ? 'border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                    : 'border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
              }`}
            >
              {plan.name === 'Free' ? 'Adquirir Ahora' : billingCycle === 'monthly' ? 'Adquirir Ahora' : 'Suscribir'}
            </button>

            {/* Features */}
            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
              <p className={`text-xs font-bold mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                CARACTERÍSTICAS
              </p>
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-600 flex-shrink-0 mt-0.5"></div>
                    )}
                    <span className={`text-sm ${feature.included ? (darkMode ? 'text-gray-200' : 'text-gray-700') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
