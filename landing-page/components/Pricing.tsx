'use client'

import { Check } from 'lucide-react'

const plans = [
  {
    name: 'START',
    price: '$6.99',
    period: '/mes',
    description: 'Ideal para streams ligeros',
    features: [
      '1 voz clonada por IA (editable)',
      '1 voz natural premium',
      '1 voz básica (ilimitada)',
      '200,000 caracteres (~tokens)',
      'Rinde aprox 2-4 horas de stream activo',
    ],
    cta: 'Elegir START',
    highlight: false,
  },
  {
    name: 'CREATOR',
    price: '$12.99',
    period: '/mes',
    description: 'Ideal para streams activos',
    features: [
      '2 voces clonadas por IA (editables)',
      '2 voces naturales premium',
      '1 voz básica (ilimitada)',
      '500,000 caracteres (~tokens)',
      'Rinde aprox 5-8 horas de stream activo',
    ],
    cta: 'Elegir CREATOR',
    highlight: true,
  },
  {
    name: 'PRO',
    price: '$17.99',
    period: '/mes',
    description: 'Ideal para interacción constante',
    features: [
      '5 voces clonadas por IA (editables)',
      '4 voces naturales premium',
      '1 voz básica (ilimitada)',
      '800,000 caracteres (~tokens)',
      'Rinde aprox 10-15 horas de stream activo',
    ],
    cta: 'Elegir PRO',
    highlight: false,
  },
]

const annualPlans = [
  { name: 'START ANUAL', price: '$59 / año', saving: 'Ahorra ~$25 USD' },
  { name: 'CREATOR ANUAL', price: '$109 / año', saving: 'Ahorra ~$46 USD' },
  { name: 'PRO ANUAL', price: '$149 / año', saving: 'Ahorra ~$67 USD' },
]

const boosts = [
  { name: 'MINI BOOST', price: '$4.99', chars: '150,000 caracteres', hours: '1.5-3 horas' },
  { name: 'POWER BOOST', price: '$9.99', chars: '350,000 caracteres', hours: '4-7 horas' },
  { name: 'MAX BOOST', price: '$14.99', chars: '700,000 caracteres', hours: '8-12 horas' },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="block text-white mb-2">Planes Actualizados</span>
            <span className="gradient-text">Mensual, Anual y Boosts</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            El consumo depende de la actividad del chat y la configuración.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div key={index} className={`relative group ${plan.highlight ? 'md:scale-105 md:z-10' : ''} transition-transform duration-300`}>
              {plan.highlight && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-voltvoice-cyan via-voltvoice-purple to-voltvoice-magenta rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300 -z-10" />
              )}

              <div className={`glass-effect-strong p-8 rounded-xl relative h-full flex flex-col ${plan.highlight ? 'border-voltvoice-cyan/50' : ''}`}>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-black gradient-text">{plan.price}</span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-400 mb-6 text-sm">{plan.description}</p>

                <button className={`w-full py-3 px-6 rounded-lg font-bold mb-8 transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple text-white'
                    : 'border-2 border-voltvoice-cyan text-voltvoice-cyan hover:bg-voltvoice-cyan/10'
                }`}>
                  {plan.cta}
                </button>

                <div className="border-t border-voltvoice-cyan/20 mb-6" />
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-voltvoice-cyan flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-effect p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Planes Anuales</h3>
            <div className="space-y-3">
              {annualPlans.map((p) => (
                <div key={p.name} className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div>
                    <p className="text-white font-semibold">{p.name}</p>
                    <p className="text-xs text-green-400">{p.saving}</p>
                  </div>
                  <p className="text-cyan-300 font-bold">{p.price}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-effect p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Paquetes Extra (Recargas)</h3>
            <div className="space-y-3">
              {boosts.map((b) => (
                <div key={b.name} className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div>
                    <p className="text-white font-semibold">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.chars} • {b.hours}</p>
                  </div>
                  <p className="text-cyan-300 font-bold">{b.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

