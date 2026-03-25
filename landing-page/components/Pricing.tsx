'use client'

import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'Siempre',
    description: 'Perfecto para comenzar tu aventura con voces clonadas',
    features: [
      '5 voces clonadas',
      'Síntesis básica de voz',
      'Comunidad VoltVoice',
      'Soporte por email',
      'Máximo 100 sincronizaciones/mes',
      'Watermark VoltVoice',
    ],
    notIncluded: [
      'Integración TikTok Live',
      'Monetización',
      'Voces premium',
      'Soporte prioritario',
    ],
    cta: 'Comenzar Gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/mes',
    description: 'Para streamers serios que quieren monetizar',
    features: [
      '100 voces clonadas',
      'Síntesis IA avanzada',
      'Integración TikTok Live automática',
      'Monetización completa',
      'Sincronizaciones ilimitadas',
      'Soporte prioritario',
      'Sin watermark',
      'Análisis avanzados',
    ],
    notIncluded: [
      'API personalizada',
      'Gestor de cuenta dedicado',
    ],
    cta: 'Obtener Pro Ahora',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'Contacta ventas',
    description: 'Solución personalizada para grandes creators',
    features: [
      'Voces ilimitadas personalizadas',
      'Voces de marca corporativa',
      'Integración API completa',
      'White-label solution',
      'Gestor de cuenta dedicado',
      'SLA garantizado 99.99%',
      'Soporte 24/7 VIP',
      'Formación especializada',
      'Consultoría estratégica',
    ],
    notIncluded: [],
    cta: 'Contactar Ventas',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="block text-white mb-2">Planes Simples</span>
            <span className="gradient-text">Sin Sorpresas, Sin Contratos</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Elige el plan perfecto para tu estrategia de streaming. Cancela cuando quieras.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${
                plan.highlight ? 'md:scale-105 md:z-10' : ''
              } transition-transform duration-300`}
            >
              {/* Glow effect for highlighted plan */}
              {plan.highlight && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-voltvoice-cyan via-voltvoice-purple to-voltvoice-magenta rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300 -z-10" />
              )}

              <div className={`glass-effect-strong p-8 rounded-xl relative h-full flex flex-col ${
                plan.highlight ? 'border-voltvoice-cyan/50' : ''
              }`}>
                {/* Badge for popular plan */}
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-gradient-to-r from-voltvoice-cyan to-voltvoice-magenta rounded-full text-sm font-bold text-white">
                      Más Popular
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-5xl font-black gradient-text">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>

                {/* Description */}
                <p className="text-gray-400 mb-6 text-sm">
                  {plan.description}
                </p>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 px-6 rounded-lg font-bold mb-8 transition-all duration-300 transform hover:scale-105 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple text-white hover:shadow-glow-cyan-lg'
                      : 'border-2 border-voltvoice-cyan text-voltvoice-cyan hover:bg-voltvoice-cyan/10'
                  } btn-glow`}
                >
                  {plan.cta}
                </button>

                {/* Divider */}
                <div className="border-t border-voltvoice-cyan/20 mb-6" />

                {/* Features */}
                <div className="flex-1">
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-voltvoice-cyan flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Not Included */}
                  {plan.notIncluded.length > 0 && (
                    <div className="space-y-3 opacity-50">
                      {plan.notIncluded.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded border border-gray-600 flex items-center justify-center text-gray-600 mt-0.5">
                            ✕
                          </div>
                          <span className="text-gray-500 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 pt-20 border-t border-voltvoice-cyan/20">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Preguntas Frecuentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-effect p-6 rounded-lg">
              <h4 className="font-bold text-voltvoice-cyan mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h4>
              <p className="text-gray-400 text-sm">
                Sí, cambia de plan cuando quieras. Te cobraremos solo el equivalente del nuevo plan, o te devolveremos un equivalente si bajas de plan. Cero sorpresas.
              </p>
            </div>
            <div className="glass-effect p-6 rounded-lg">
              <h4 className="font-bold text-voltvoice-cyan mb-2">
                ¿Necesito tarjeta de crédito para el plan Free?
              </h4>
              <p className="text-gray-400 text-sm">
                No, el plan Free no requiere tarjeta de crédito. Comienza gratis sin limitaciones.
              </p>
            </div>
            <div className="glass-effect p-6 rounded-lg">
              <h4 className="font-bold text-voltvoice-cyan mb-2">
                ¿Hay descuentos anuales?
              </h4>
              <p className="text-gray-400 text-sm">
                Sí, compra anual ahorra 20% comparado con facturación mensual.
              </p>
            </div>
            <div className="glass-effect p-6 rounded-lg">
              <h4 className="font-bold text-voltvoice-cyan mb-2">
                ¿Qué sucede si cancelo?
              </h4>
              <p className="text-gray-400 text-sm">
                Acceso inmediato hasta fin del período pagado. Cero penalizaciones, cancelación en 2 clics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
