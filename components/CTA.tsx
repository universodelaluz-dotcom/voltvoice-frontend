'use client'

import { ArrowRight, Zap } from 'lucide-react'

const STUDIO_URL = 'https://voltvoice-frontend.vercel.app'

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-voltvoice-cyan/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-voltvoice-magenta/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

        <div className="relative z-10 glass-effect-strong p-12 rounded-2xl border-2 border-voltvoice-cyan/30 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-voltvoice-cyan to-voltvoice-magenta rounded-lg flex items-center justify-center animate-pulse">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            <span className="block text-white mb-2">Listo para</span>
            <span className="gradient-text">Revolucionar tu Stream</span>
          </h2>

          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Unete a miles de streamers que ya estan monetizando con voces clonadas. Sin experiencia tecnica requerida. Comienza en segundos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-voltvoice-cyan rounded-full" />
              <span className="text-gray-300">Configuracion en 30 segundos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-voltvoice-cyan rounded-full" />
              <span className="text-gray-300">No se requiere tarjeta de credito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-voltvoice-cyan rounded-full" />
              <span className="text-gray-300">Cancela cuando quieras</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={STUDIO_URL} className="group px-8 py-4 bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple rounded-lg font-bold text-white text-lg hover:shadow-glow-cyan-lg transition-all duration-300 transform hover:scale-105 btn-glow flex items-center justify-center gap-2">
              Entrar al Studio
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="mt-10 pt-10 border-t border-voltvoice-cyan/20 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-400">
            <span>SSL 256-bit</span>
            <span>Cumplimiento GDPR</span>
            <span>Datos encriptados</span>
          </div>
        </div>
      </div>
    </section>
  )
}
