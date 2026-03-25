'use client'

import { Zap, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-voltvoice-purple/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-voltvoice-cyan/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-voltvoice-magenta/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-voltvoice-cyan/10 border border-voltvoice-cyan/30 hover:border-voltvoice-cyan/60 transition-all">
          <Sparkles size={16} className="text-voltvoice-cyan" />
          <span className="text-sm font-semibold text-voltvoice-cyan">
            Impulsado por IA - TikTok Ready
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
          <span className="block text-white mb-2">Voces Clonadas de</span>
          <span className="block gradient-text">Tus Personajes Favoritos</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          La solución completa para streamers de TikTok. Clona voces de cualquier personaje, integración en vivo automática y monetiza mientras streameas.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button className="px-8 py-4 bg-gradient-to-r from-voltvoice-cyan via-voltvoice-purple to-voltvoice-magenta rounded-lg font-bold text-white text-lg hover:shadow-glow-cyan-lg transition-all duration-300 btn-glow transform hover:scale-105">
            Comenzar Gratis
          </button>
          <button className="px-8 py-4 bg-transparent border-2 border-voltvoice-cyan text-voltvoice-cyan rounded-lg font-bold hover:bg-voltvoice-cyan/10 transition-all duration-300 transform hover:scale-105">
            Ver Demo
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-effect p-4 rounded-lg">
            <div className="text-2xl font-bold text-voltvoice-cyan">+300%</div>
            <p className="text-sm text-gray-400">Más Engagement</p>
          </div>
          <div className="glass-effect p-4 rounded-lg">
            <div className="text-2xl font-bold text-voltvoice-magenta">+500%</div>
            <p className="text-sm text-gray-400">Más Comentarios</p>
          </div>
          <div className="glass-effect p-4 rounded-lg">
            <div className="text-2xl font-bold text-voltvoice-cyan">+150%</div>
            <p className="text-sm text-gray-400">Más Seguidores</p>
          </div>
          <div className="glass-effect p-4 rounded-lg">
            <div className="text-2xl font-bold text-voltvoice-yellow">🔥</div>
            <p className="text-sm text-gray-400">Trending</p>
          </div>
        </div>
      </div>

      {/* Floating Icons */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <Zap className="w-6 h-6 text-voltvoice-cyan" />
      </div>
    </section>
  )
}
