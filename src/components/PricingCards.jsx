import { useState } from 'react'
import { Check } from 'lucide-react'

export function PricingCards({ darkMode, showToggle = true }) {
  const [billingCycle, setBillingCycle] = useState('monthly')

  const monthlyPlans = [
    {
      icon: '🧪',
      name: 'FREE',
      price: 0,
      description: 'Para probar StreamVoicer',
      cta: 'Empezar Gratis',
      popular: false,
      features: [
        { text: '0 personajes', included: true },
        { text: 'Funciones básicas', included: true },
        { text: '20,000 tokens', included: true },
        { text: '≈ 0.5 – 1 hora / semana', included: true },
      ]
    },
    {
      icon: '⚡',
      name: 'CREATOR',
      price: 7.99,
      description: 'Para streamers que inician',
      cta: 'Adquirir Ahora',
      popular: false,
      features: [
        { text: '1 personaje', included: true },
        { text: 'Herramientas interactivas', included: true },
        { text: '120,000 tokens', included: true },
        { text: '≈ 2 – 4 horas / semana', included: true },
      ]
    },
    {
      icon: '🔥',
      name: 'PRO',
      price: 19.99,
      description: 'Para streamers activos',
      cta: 'Adquirir Ahora',
      popular: true,
      features: [
        { text: '3–5 personajes', included: true },
        { text: 'Herramientas avanzadas', included: true },
        { text: '500,000 tokens', included: true },
        { text: '≈ 8 – 12 horas / semana', included: true },
      ]
    },
    {
      icon: '👑',
      name: 'ELITE',
      price: 39.99,
      description: 'Para profesionales del streaming',
      cta: 'Adquirir Ahora',
      popular: false,
      features: [
        { text: 'Hasta 10 personajes', included: true },
        { text: 'Sistema completo', included: true },
        { text: '1,500,000 tokens', included: true },
        { text: '≈ 25 – 40 horas / semana', included: true },
      ]
    }
  ]

  const annualPlans = [
    {
      icon: '⚡',
      name: 'CREATOR',
      price: 79,
      pricePerMonth: (79 / 12).toFixed(2),
      description: 'Para streamers que inician',
      cta: 'Suscribir Anual',
      popular: false,
      badge: 'Ahorra 18%',
      features: [
        { text: '1 personaje', included: true },
        { text: 'Herramientas interactivas', included: true },
        { text: '120,000 tokens / mes', included: true },
        { text: '≈ 2 – 4 horas / semana', included: true },
      ]
    },
    {
      icon: '🔥',
      name: 'PRO',
      price: 199,
      pricePerMonth: (199 / 12).toFixed(2),
      description: 'Para streamers activos',
      cta: 'Suscribir Anual',
      popular: true,
      badge: 'Ahorra 17%',
      features: [
        { text: '3–5 personajes', included: true },
        { text: 'Herramientas avanzadas', included: true },
        { text: '500,000 tokens / mes', included: true },
        { text: '≈ 8 – 12 horas / semana', included: true },
      ]
    },
    {
      icon: '👑',
      name: 'ELITE',
      price: 399,
      pricePerMonth: (399 / 12).toFixed(2),
      description: 'Para profesionales del streaming',
      cta: 'Suscribir Anual',
      popular: false,
      badge: 'Ahorra 17%',
      features: [
        { text: 'Hasta 10 personajes', included: true },
        { text: 'Sistema completo', included: true },
        { text: '1,500,000 tokens / mes', included: true },
        { text: '≈ 25 – 40 horas / semana', included: true },
      ]
    }
  ]

  const plans = billingCycle === 'monthly' ? monthlyPlans : annualPlans

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
              Anual
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${plans.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
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
                <div className="bg-gradient-to-r from-green-400 to-green-500 text-black px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                  Recomendado
                </div>
              </div>
            )}

            {/* Icon + Plan Name */}
            <div className="text-3xl mb-2">{plan.icon}</div>
            <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {plan.description}
            </p>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                  ${billingCycle === 'monthly' ? plan.price.toFixed(2) : plan.price}
                </span>
                <span className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  /{billingCycle === 'monthly' ? 'mes' : 'año'}
                </span>
              </div>

              {/* Badge + per month for annual */}
              {billingCycle === 'annual' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ~${plan.pricePerMonth}/mes
                  </span>
                  {plan.badge && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      {plan.badge}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              className={`w-full py-3 rounded-lg font-bold transition-all mb-6 ${
                plan.popular
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-400/50'
                  : plan.price === 0
                    ? darkMode
                      ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                    : darkMode
                      ? 'border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                      : 'border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
              }`}
            >
              {plan.cta}
            </button>

            {/* Features */}
            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nota */}
      <div className="mt-8 text-center">
        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Estimado basado en chats promedio de 15–30 mensajes por minuto y mensajes de 40–60 caracteres.
          El uso real puede variar según la actividad del stream y configuración.
        </p>
      </div>
    </div>
  )
}
