'use client'

import { Zap, Radio, TrendingUp, Lock, Wifi, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'Voces Clonadas Premium',
    description: 'Clona voces de personajes con tecnología IA avanzada. Personalización ilimitada para tus streams.',
    gradient: 'from-voltvoice-cyan to-voltvoice-purple',
    shadow: 'shadow-glow-cyan',
  },
  {
    icon: Radio,
    title: 'Integración en Vivo',
    description: 'Sincronización automática con TikTok Live. Sin configuración complicada, solo conecta y transmite.',
    gradient: 'from-voltvoice-purple to-voltvoice-magenta',
    shadow: 'shadow-glow-magenta',
  },
  {
    icon: TrendingUp,
    title: 'Crece Sin Límites',
    description: 'Estrategia de crecimiento sustentable. Genera interés orgánico y auténtico con tu comunidad.',
    gradient: 'from-voltvoice-magenta to-voltvoice-yellow',
    shadow: 'shadow-glow-magenta',
  },
  {
    icon: Lock,
    title: 'Seguridad Enterprise',
    description: 'Encriptación de nivel militar. Protección de derechos de autor y cumplimiento GDPR garantizado.',
    gradient: 'from-voltvoice-cyan to-voltvoice-magenta',
    shadow: 'shadow-glow-cyan',
  },
  {
    icon: Wifi,
    title: 'Confiabilidad 99.9%',
    description: 'Servidores distribuidos globalmente. Streaming sin interrupciones, garantizado siempre.',
    gradient: 'from-voltvoice-purple to-voltvoice-yellow',
    shadow: 'shadow-glow-purple',
  },
  {
    icon: Zap,
    title: 'Rendimiento Real',
    description: 'Síntesis de voz instantánea. Sin lag, sin complicaciones, solo que funciona.',
    gradient: 'from-voltvoice-yellow to-voltvoice-cyan',
    shadow: 'shadow-glow-cyan',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="block text-white mb-2">Características</span>
            <span className="gradient-text">Profesionales para Streamers</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Todo lo que necesitas para llevar tus streams al siguiente nivel con voces de IA de última generación.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group glass-effect-strong p-8 rounded-xl hover:border-voltvoice-cyan/50 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer`}
              >
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.gradient} p-3 mb-4 group-hover:${feature.shadow} transition-all duration-300`}>
                  <Icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-voltvoice-cyan transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>

                {/* Bottom accent */}
                <div className="mt-4 h-1 w-0 group-hover:w-full bg-gradient-to-r from-voltvoice-cyan to-transparent transition-all duration-300" />
              </div>
            )
          })}
        </div>

        {/* Additional Benefits */}
        <div className="mt-20 pt-20 border-t border-voltvoice-cyan/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-voltvoice-cyan mb-2">+300%</div>
              <p className="text-gray-400">Más Engagement</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-voltvoice-magenta mb-2">+500%</div>
              <p className="text-gray-400">Más Comentarios</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-voltvoice-cyan mb-2">+150%</div>
              <p className="text-gray-400">Más Seguidores</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-voltvoice-yellow mb-2">🔥</div>
              <p className="text-gray-400">Trending Garantizado</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
