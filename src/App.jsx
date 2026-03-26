import { useState } from 'react'
import { StripePayment } from './components/StripePayment'
import { SynthesisStudio } from './components/SynthesisStudio'
import { ChevronRight, Zap, Mic2, Sliders, TrendingUp, Users, Shield } from 'lucide-react'

export function App() {
  const [currentPage, setCurrentPage] = useState('landing') // 'landing' or 'studio'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [tokens, setTokens] = useState(100)

  // Si estamos en la página del studio, mostrar solo eso
  if (currentPage === 'studio') {
    return (
      <div>
        <SynthesisStudio />
      </div>
    )
  }

  const benefits = [
    {
      icon: '⚡',
      title: 'Ultra Rápido',
      description: 'Síntesis de voz en tiempo real sin latencia. Perfecta para streams en vivo.'
    },
    {
      icon: '🎤',
      title: 'Voces Naturales',
      description: 'IA de última generación que crea voces expresivas y realistas en español.'
    },
    {
      icon: '🎯',
      title: 'Fácil de Usar',
      description: 'Configura en 2 minutos. No necesitas conocimientos técnicos.'
    },
    {
      icon: '💰',
      title: 'Económico',
      description: 'Planes accesibles. Solo pagas por lo que usas con nuestro sistema de tokens.'
    },
    {
      icon: '📱',
      title: 'Multiplataforma',
      description: 'Funciona con TikTok, YouTube, Instagram y cualquier plataforma de streaming.'
    },
    {
      icon: '🔒',
      title: 'Seguro',
      description: 'Tus datos están protegidos. Cumplimos con estándares internacionales de seguridad.'
    }
  ]

  const pricing = [
    {
      name: 'Plan Básico',
      price: '$5',
      priceUsd: '$5 USD',
      priceMxn: '90 MXN',
      tokens: '168K',
      tokensPerMonth: '168,000 tokens/mes',
      hours: '~2 horas/semana',
      description: 'Perfecto para probar',
      features: ['~2 horas de voces naturales o clonadas', 'Voces básicas ilimitadas', 'Soporte por email']
    },
    {
      name: 'Professional',
      price: '$20',
      priceUsd: '$20 USD',
      priceMxn: '360 MXN',
      tokens: '840K',
      tokensPerMonth: '840,000 tokens/mes',
      hours: '~10 horas/semana',
      popular: true,
      description: 'Más popular',
      features: ['~10 horas de voces naturales o clonadas', 'Voces básicas ilimitadas', 'Soporte prioritario', 'Estadísticas']
    },
    {
      name: 'Premium',
      price: '$49',
      priceUsd: '$49 USD',
      priceMxn: '882 MXN',
      tokens: '2.5M',
      tokensPerMonth: '2,500,000 tokens/mes',
      hours: '~30 horas/semana',
      description: 'Para streamers profesionales',
      features: ['~30 horas de voces naturales o clonadas', 'Voces básicas ilimitadas', 'Soporte 24/7', 'Streams ilimitados', 'Estadísticas avanzadas']
    }
  ]

  const additionalPackages = [
    {
      size: 'Pequeño',
      tokens: '100K',
      price: '$3 USD',
      priceMxn: '54 MXN',
      cost: '$1.00',
      profit: '$2.00',
      margin: '3x'
    },
    {
      size: 'Mediano',
      tokens: '250K',
      price: '$7 USD',
      priceMxn: '126 MXN',
      cost: '$2.50',
      profit: '$4.50',
      margin: '2.8x'
    },
    {
      size: 'Grande',
      tokens: '500K',
      price: '$12 USD',
      priceMxn: '216 MXN',
      cost: '$5.00',
      profit: '$7.00',
      margin: '2.4x'
    },
    {
      size: 'Máximo',
      tokens: '1M',
      price: '$20 USD',
      priceMxn: '360 MXN',
      cost: '$10.00',
      profit: '$10.00',
      margin: '2x'
    }
  ]

  const howItWorks = [
    {
      step: '1',
      title: 'Conecta tu canal',
      description: 'Vincula tu cuenta de TikTok o YouTube en segundos'
    },
    {
      step: '2',
      title: 'Activa VoltVoice',
      description: 'Inicia la lectura de mensajes de chat en tiempo real'
    },
    {
      step: '3',
      title: 'Disfruta',
      description: 'Los mensajes se leen automáticamente durante tu stream'
    }
  ]

  const testimonials = [
    {
      name: 'María García',
      role: 'TikToker - 500K followers',
      text: 'VoltVoice cambió mi stream. Mis seguidores aman que sus mensajes se lean en voz. ¡Imprescindible!',
      avatar: '👩'
    },
    {
      name: 'Juan López',
      role: 'Streamer - Gaming',
      text: 'La calidad de las voces es increíble. No parece robótico. Muy recomendado.',
      avatar: '👨'
    },
    {
      name: 'Sofia Rodríguez',
      role: 'Youtuber - Lifestyle',
      text: 'Mis viewers interactúan más ahora. VoltVoice es un game changer para creadores.',
      avatar: '👩‍🦱'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0f0f23]/80 backdrop-blur-md border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-xl font-black">⚡</span>
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              VoltVoice
            </h1>
          </div>
          <button
            onClick={() => setCurrentPage('studio')}
            className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
          >
            Studio
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="max-w-7xl mx-auto text-center">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Lee chats en vivo con
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
              Voces de IA
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transforma los mensajes de chat en voz natural para tus streams de TikTok y YouTube. Aumenta la interacción con tus seguidores al instante.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setCurrentPage('studio')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-lg text-white hover:shadow-xl hover:shadow-cyan-400/50 transition-all flex items-center justify-center gap-2"
            >
              Ir al Studio <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-8 py-4 border-2 border-cyan-400/50 rounded-lg font-bold text-lg text-cyan-400 hover:bg-cyan-400/10 transition-all"
            >
              Comprar Tokens
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-3xl font-black text-cyan-400">10K+</div>
              <div className="text-sm text-gray-400">Usuarios activos</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-3xl font-black text-purple-400">1M+</div>
              <div className="text-sm text-gray-400">Mensajes leídos</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-3xl font-black text-cyan-400">99%</div>
              <div className="text-sm text-gray-400">Satisfacción</div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Packages Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black text-center mb-4">
            Compra <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Tokens Adicionales</span>
          </h3>
          <p className="text-center text-gray-400 mb-16">Carga más tokens cuando los necesites</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {additionalPackages.map((pkg, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/50 transition-all hover:bg-white/10"
              >
                <h4 className="text-xl font-black mb-4 text-cyan-400">{pkg.size}</h4>
                
                <div className="mb-4">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    {pkg.price}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{pkg.priceMxn}</div>
                  <div className="text-sm text-gray-500 mt-2">{pkg.tokens} tokens</div>
                </div>

                <button
                  onClick={() => setIsPaymentOpen(true)}
                  className="w-full py-2 border border-cyan-400/50 text-cyan-400 rounded-lg font-bold text-sm hover:bg-cyan-400/10 transition-all mb-4"
                >
                  Comprar
                </button>

                <div className="space-y-2 text-xs text-gray-400 border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span>Tu costo:</span>
                    <span className="text-gray-300">{pkg.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tu ganancia:</span>
                    <span className="text-cyan-400 font-bold">{pkg.profit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margen:</span>
                    <span className="text-purple-400">{pkg.margin}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black text-center mb-16">
            ¿Por qué elegir <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">VoltVoice</span>?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="group bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-8 hover:border-cyan-400/50 transition-all hover:bg-white/10"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h4 className="text-xl font-bold mb-3">{benefit.title}</h4>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black text-center mb-16">
            Así de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">fácil</span> es empezar
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-cyan-400/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black text-center mb-4">
            Planes <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Accesibles</span>
          </h3>
          <p className="text-center text-gray-400 mb-16">Elige el plan perfecto para ti. Horas aproximadas basadas en 10 msg/min y 35 caracteres promedio por mensaje.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-xl overflow-hidden transition-all ${
                  plan.popular
                    ? 'ring-2 ring-cyan-400 transform md:scale-105'
                    : 'border border-white/10'
                } ${plan.popular ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10' : 'bg-white/5'}`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-center py-2 font-bold text-sm">
                    MÁS POPULAR
                  </div>
                )}

                <div className="p-8">
                  <h4 className="text-2xl font-black mb-2">{plan.name}</h4>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                      {plan.priceUsd}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{plan.priceMxn}</div>
                    <div className="text-sm text-gray-500 mt-2">{plan.tokensPerMonth}</div>
                    <div className="text-sm text-cyan-400 mt-1 font-semibold">{plan.hours}</div>
                  </div>

                  <button
                    onClick={() => setIsPaymentOpen(true)}
                    className={`w-full py-3 rounded-lg font-bold transition-all mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-400/50'
                        : 'border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10'
                    }`}
                  >
                    Comprar
                  </button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-3 text-sm text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-500/5 to-cyan-500/5">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black text-center mb-16">
            Lo que dicen nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">creadores</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-gray-300 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 rounded-2xl p-12">
            <h3 className="text-4xl font-black mb-6">
              Listo para revolucionar tus streams?
            </h3>
            <p className="text-xl text-gray-300 mb-8">
              Únete a miles de creadores que ya están usando VoltVoice
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setCurrentPage('studio')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-lg text-white hover:shadow-xl hover:shadow-cyan-400/50 transition-all inline-flex items-center gap-2"
              >
                Ir al Studio <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-8 py-4 border-2 border-cyan-400 text-cyan-400 rounded-lg font-bold text-lg hover:bg-cyan-400/10 transition-all inline-flex items-center gap-2"
              >
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 bg-[#0f0f23]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">VoltVoice</h4>
              <p className="text-sm text-gray-400">La mejor solución para leer chats en vivo</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Características</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Términos</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Privacidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition">Contacto</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">FAQ</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 VoltVoice. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      <StripePayment isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
    </div>
  )
}
// Cache buster 1774553392
