import { useState } from 'react'
import { Check, ArrowLeft } from 'lucide-react'

export function PricingPage({ onGoHome, darkMode }) {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Para probar VoltVoice',
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
      badge: 'Save 38%',
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
      badge: 'Save 50%',
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
      badge: 'Save 17%',
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

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice / 12
  }

  const getOldPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.oldMonthlyPrice : plan.oldAnnualPrice / 12
  }

  const getDisplayPrice = (plan) => {
    if (billingCycle === 'monthly') {
      return plan.monthlyPrice.toFixed(2)
    } else {
      return (plan.annualPrice / 12).toFixed(2)
    }
  }

  const getBillingText = (plan) => {
    if (billingCycle === 'monthly') {
      return `$${(plan.monthlyPrice * 12).toFixed(2)} billed yearly as $${(plan.monthlyPrice * 12).toFixed(2)}/year`
    } else {
      return `Billed yearly as $${plan.annualPrice.toFixed(2)}`
    }
  }

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
            VoltVoice
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
              Planes <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Simples</span>
            </h2>
            <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Elige el plan perfecto para tu stream
            </p>

            {/* Billing Toggle */}
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

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
                      Most Popular
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
                      /month
                    </span>
                  </div>

                  {/* Old Price */}
                  {plan.oldMonthlyPrice && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="line-through text-sm text-gray-500">
                        ${getOldPrice(plan).toFixed(2)}
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
                    FEATURES
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

          {/* FAQ or Additional Info */}
          <div className="text-center">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Preguntas? <a href="#contact" className="text-cyan-400 hover:text-cyan-300 font-semibold">Contactanos</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
