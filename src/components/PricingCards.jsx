import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

export function PricingCards({ darkMode, showToggle = true, onPlanAction }) {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [exchangeRates, setExchangeRates] = useState(null)
  const [userCurrency, setUserCurrency] = useState('USD')

  useEffect(() => {
    const detectLocationAndExchangeRates = async () => {
      try {
        setUserCurrency('USD')

        const ratesResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const ratesData = await ratesResponse.json()

        if (ratesData.rates) {
          setExchangeRates(ratesData.rates)
        }
      } catch (error) {
        console.error('Error detectando ubicación/tipos de cambio:', error)
        setExchangeRates({
          MXN: 20,
          ARS: 920,
          BRL: 5.2,
          COP: 4100,
          CLP: 900,
          PEN: 3.8,
          UYU: 42,
        })
      }
    }

    detectLocationAndExchangeRates()
  }, [])

  const convertPrice = (usdPrice) => {
    if (!exchangeRates || userCurrency === 'USD') {
      return { amount: usdPrice, currency: 'USD', display: `$${usdPrice.toFixed(2)} USD` }
    }

    const rate = exchangeRates[userCurrency] || 1
    const convertedAmount = parseFloat((usdPrice * rate).toFixed(2))
    const symbols = {
      MXN: '$',
      ARS: '$',
      BRL: 'R$',
      COP: '$',
      CLP: '$',
      PEN: 'S/',
      UYU: '$',
      EUR: 'EUR ',
      GBP: 'GBP ',
      JPY: 'JPY ',
      CNY: 'CNY ',
      INR: 'INR ',
      AUD: '$',
      CAD: '$',
    }

    const symbol = symbols[userCurrency] || '$'
    return {
      amount: convertedAmount,
      currency: userCurrency,
      display: `${symbol}${convertedAmount.toLocaleString()} ${userCurrency}`,
    }
  }

  const monthlyPlans = [
    {
      icon: '🟢',
      name: 'START',
      price: 6.99,
      description: 'Ideal para streams ligeros',
      cta: 'Adquirir START',
      popular: false,
      features: [
        { text: '1 voz clonada por IA (editable)', included: true },
        { text: '1 voz natural premium', included: true },
        { text: '1 voz básica (ilimitada)', included: true },
        { text: '200,000 caracteres (~tokens)', included: true },
        { text: 'Rinde aprox 2-4 horas de stream activo', included: true },
      ],
    },
    {
      icon: '🔵',
      name: 'CREATOR',
      price: 12.99,
      description: 'Ideal para streams activos',
      cta: 'Adquirir CREATOR',
      popular: true,
      features: [
        { text: '2 voces clonadas por IA (editables)', included: true },
        { text: '2 voces naturales premium', included: true },
        { text: '1 voz básica (ilimitada)', included: true },
        { text: '500,000 caracteres (~tokens)', included: true },
        { text: 'Rinde aprox 5-8 horas de stream activo', included: true },
      ],
    },
    {
      icon: '🔥',
      name: 'PRO',
      price: 17.99,
      description: 'Ideal para interacción constante',
      cta: 'Adquirir PRO',
      popular: false,
      features: [
        { text: '5 voces clonadas por IA (editables)', included: true },
        { text: '4 voces naturales premium', included: true },
        { text: '1 voz básica (ilimitada)', included: true },
        { text: '800,000 caracteres (~tokens)', included: true },
        { text: 'Rinde aprox 10-15 horas de stream activo', included: true },
      ],
    },
  ]

  const annualPlans = [
    {
      icon: '🟢',
      name: 'START',
      price: 59,
      pricePerMonth: (59 / 12).toFixed(2),
      description: 'Plan anual START',
      cta: 'Suscribir START Anual',
      popular: false,
      badge: 'Ahorra ~$25',
      features: [
        { text: '1 voz clonada por IA (editable)', included: true },
        { text: '1 voz natural premium', included: true },
        { text: '1 voz básica (ilimitada)', included: true },
        { text: '200,000 caracteres (~tokens)', included: true },
      ],
    },
    {
      icon: '🔵',
      name: 'CREATOR',
      price: 109,
      pricePerMonth: (109 / 12).toFixed(2),
      description: 'Plan anual CREATOR',
      cta: 'Suscribir CREATOR Anual',
      popular: true,
      badge: 'Ahorra ~$46',
      features: [
        { text: '2 voces clonadas por IA (editables)', included: true },
        { text: '2 voces naturales premium', included: true },
        { text: '1 voz básica (ilimitada)', included: true },
        { text: '500,000 caracteres (~tokens)', included: true },
      ],
    },
    {
      icon: '🔥',
      name: 'PRO',
      price: 149,
      pricePerMonth: (149 / 12).toFixed(2),
      description: 'Plan anual PRO',
      cta: 'Suscribir PRO Anual',
      popular: false,
      badge: 'Ahorra ~$67',
      features: [
        { text: '5 voces clonadas por IA (editables)', included: true },
        { text: '4 voces naturales premium', included: true },
        { text: '1 voz básica (ilimitada)', included: true },
        { text: '800,000 caracteres (~tokens)', included: true },
      ],
    },
  ]

  const plans = billingCycle === 'monthly' ? monthlyPlans : annualPlans

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            } p-8`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-green-400 to-green-500 text-black px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                  Recomendado
                </div>
              </div>
            )}

            <div className="text-sm font-bold tracking-wide mb-3 text-cyan-400">{plan.icon}</div>
            <h3 className="text-3xl font-black mb-1">{plan.name}</h3>
            <p className={`text-base mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {plan.description}
            </p>

            <div className="mb-5">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                  ${billingCycle === 'monthly' ? plan.price.toFixed(2) : plan.price}
                </span>
                <span className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  USD/{billingCycle === 'monthly' ? 'mes' : 'año'}
                </span>
              </div>

              {exchangeRates && userCurrency !== 'USD' && plan.price > 0 && (
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(() => {
                    const converted = convertPrice(plan.price)
                    return `~ ${converted.display} aprox./${billingCycle === 'monthly' ? 'mes' : 'año'}`
                  })()}
                </p>
              )}

              {billingCycle === 'annual' && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    ~${plan.pricePerMonth} USD/mes
                  </span>
                  {plan.badge && (
                    <span className="text-sm font-bold px-2.5 py-1 rounded bg-green-500/20 text-green-400">
                      {plan.badge}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => onPlanAction?.(plan, { billingCycle })}
              className={`w-full py-3.5 rounded-lg font-bold text-base transition-all mb-6 ${
                plan.popular
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-400/50'
                  : darkMode
                    ? 'border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                    : 'border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
              }`}
            >
              {plan.cta}
            </button>

            <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
              <div className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className={`text-base font-medium ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          El consumo depende de la actividad del chat y la configuración. Puedes extender la duración usando filtros inteligentes y lectura selectiva.
        </p>
      </div>
    </div>
  )
}

