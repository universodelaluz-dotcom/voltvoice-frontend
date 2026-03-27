import { useState, useEffect } from 'react'
import { StripePayment } from './components/StripePayment'
import { SynthesisStudio } from './components/SynthesisStudio'
import VoiceCloningPanel from './components/VoiceCloningPanel'
import { PricingPage } from './components/PricingPage'
import { PricingCards } from './components/PricingCards'
import { ControlPanel } from './components/ControlPanel'
import { ChevronRight, Zap, Mic2, Sliders, TrendingUp, Users, Shield, Sun, Moon, ArrowLeft } from 'lucide-react'

export function App() {
  const [currentPage, setCurrentPage] = useState('landing') // 'landing', 'studio', 'voice-cloning', 'pricing', or 'control-panel'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [tokens, setTokens] = useState(100)
  const [audioSpeed, setAudioSpeed] = useState(1.0)
  const [readOnlyMessage, setReadOnlyMessage] = useState(false)
  const [skipRepeated, setSkipRepeated] = useState(false)
  const [onlyDonors, setOnlyDonors] = useState(false)
  const [onlyQuestions, setOnlyQuestions] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('voltvoice-theme') !== 'light'
    }
    return true
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('voltvoice-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('voltvoice-theme', 'light')
    }
  }, [darkMode])

  // Pricing Page
  if (currentPage === 'pricing') {
    return <PricingPage onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} />
  }

  // Control Panel Page
  if (currentPage === 'control-panel') {
    return <ControlPanel onClose={() => setCurrentPage('studio')} darkMode={darkMode} audioSpeed={audioSpeed} setAudioSpeed={setAudioSpeed} readOnlyMessage={readOnlyMessage} setReadOnlyMessage={setReadOnlyMessage} skipRepeated={skipRepeated} setSkipRepeated={setSkipRepeated} onlyDonors={onlyDonors} setOnlyDonors={setOnlyDonors} onlyQuestions={onlyQuestions} setOnlyQuestions={setOnlyQuestions} />
  }

  // Voice Cloning Page
  if (currentPage === 'voice-cloning') {
    return (
      <div className={darkMode ? "min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900"}>
        {/* Header */}
        <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-colors duration-300 ${darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-gray-200 shadow-sm'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage('landing')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-xl font-black">⚡</span>
              </div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                StreamVoicer
              </h1>
            </button>
            <button
              onClick={() => setCurrentPage('studio')}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Studio
            </button>
          </div>
        </nav>

        {/* Voice Cloning Content */}
        <div className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-black mb-4">
              Preparativos <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">de Voces</span>
            </h2>
            <p className={`text-lg mb-12 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Aquí puedes clonar y preparar tus voces personalizadas antes de usarlas en el Studio.
            </p>
            <VoiceCloningPanel onCloneSuccess={() => window.location.reload()} />
          </div>
        </div>
      </div>
    )
  }

  // Studio Page
  if (currentPage === 'studio') {
    return (
      <div>
        <SynthesisStudio
          onGoHome={() => setCurrentPage('landing')}
          onGoVoiceCloning={() => setCurrentPage('voice-cloning')}
          onGoControlPanel={() => setCurrentPage('control-panel')}
          audioSpeed={audioSpeed}
          setAudioSpeed={setAudioSpeed}
          readOnlyMessage={readOnlyMessage}
          setReadOnlyMessage={setReadOnlyMessage}
          skipRepeated={skipRepeated}
          setSkipRepeated={setSkipRepeated}
          onlyDonors={onlyDonors}
          setOnlyDonors={setOnlyDonors}
          onlyQuestions={onlyQuestions}
          setOnlyQuestions={setOnlyQuestions}
        />
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
      title: 'Activa StreamVoicer',
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
      text: 'StreamVoicer cambió mi stream. Mis seguidores aman que sus mensajes se lean en voz. ¡Imprescindible!',
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
      text: 'Mis viewers interactúan más ahora. StreamVoicer es un game changer para creadores.',
      avatar: '👩‍🦱'
    }
  ]

  return (
    <div className={"min-h-screen overflow-hidden transition-colors duration-300 " + (darkMode ? "bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900") + ""}>
      {/* Botones Esquina Superior Izquierda */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={"p-2 rounded-lg transition-all " + (darkMode ? "bg-white/10 hover:bg-white/20 text-yellow-400" : "bg-white/90 hover:bg-white text-gray-700 shadow-md")}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setCurrentPage('studio')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/50 transition-all text-sm"
        >
          Studio
        </button>
      </div>

      {/* Hero Section */}
      <section className="pt-8 pb-16 px-4 relative">
        <div className="max-w-7xl mx-auto text-center">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          {/* Logo Grande - Ancho Completo */}
          <div className="mb-12 flex justify-center">
            <img
              src="/images/streamvoicer6.png"
              alt="StreamVoicer"
              className="w-full max-w-7xl h-auto object-contain"
            />
          </div>

          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Lee chats en vivo con
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
              Voces de IA
            </span>
          </h2>

          <p className={"text-xl md:text-2xl mb-8 max-w-2xl mx-auto " + (darkMode ? "text-gray-300" : "text-gray-600")}>
            Transforma los mensajes de chat en voz natural para tus streams de TikTok y YouTube. Aumenta la interacción con tus seguidores al instante.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('studio')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-lg text-white hover:shadow-xl hover:shadow-cyan-400/50 transition-all flex items-center justify-center gap-2"
            >
              Ir al Studio <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage('pricing')}
              className="px-8 py-4 border-2 border-cyan-400/50 rounded-lg font-bold text-lg text-cyan-400 hover:bg-cyan-400/10 transition-all"
            >
              Ver Planes
            </button>
          </div>

        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black text-center mb-16">
            ¿Por qué elegir <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">StreamVoicer</span>?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className={"group rounded-xl p-8 transition-all " + (darkMode ? "bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10" : "bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-cyan-400")}
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h4 className="text-xl font-bold mb-3">{benefit.title}</h4>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{benefit.description}</p>
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
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black mb-4">
              Planes <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Accesibles</span>
            </h3>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Elige el plan perfecto para tu stream</p>
          </div>
          <PricingCards darkMode={darkMode} showToggle={true} />
        </div>
      </section>

      {/* Additional Packages Section */}
      <section className={"py-24 px-4 relative overflow-hidden " + (darkMode ? "bg-[#0a0a1a]" : "bg-gray-50")}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <span className={"text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 inline-block " + (darkMode ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-cyan-50 text-cyan-600 border border-cyan-200")}>
              ⚡ Recarga cuando quieras
            </span>
            <h3 className="text-5xl font-black mt-4 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                Tokens Adicionales
              </span>
            </h3>
            <p className={"text-lg " + (darkMode ? "text-gray-400" : "text-gray-500")}>Sin suscripción. Paga solo lo que usas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                size: 'Pequeño',
                tokens: '100K', tokensNum: '100,000',
                price: '$3', priceSub: 'USD',
                icon: '🔋',
                gradient: 'from-cyan-500 to-blue-500',
                glowColor: 'cyan',
                badge: null,
                profit: '$2.00', margin: '3x',
                popular: false,
              },
              {
                size: 'Mediano',
                tokens: '250K', tokensNum: '250,000',
                price: '$7', priceSub: 'USD',
                icon: '⚡',
                gradient: 'from-blue-500 to-purple-500',
                glowColor: 'blue',
                badge: '🔥 MÁS POPULAR',
                profit: '$4.50', margin: '2.8x',
                popular: true,
              },
              {
                size: 'Grande',
                tokens: '500K', tokensNum: '500,000',
                price: '$12', priceSub: 'USD',
                icon: '🚀',
                gradient: 'from-purple-500 to-pink-500',
                glowColor: 'purple',
                badge: null,
                profit: '$7.00', margin: '2.4x',
                popular: false,
              },
              {
                size: 'Máximo',
                tokens: '1M', tokensNum: '1,000,000',
                price: '$20', priceSub: 'USD',
                icon: '💎',
                gradient: 'from-yellow-400 to-orange-500',
                glowColor: 'yellow',
                badge: '💰 MEJOR VALOR',
                profit: '$10.00', margin: '2x',
                popular: false,
              },
            ].map((pkg, idx) => (
              <div
                key={idx}
                className={"relative group rounded-2xl p-px transition-all duration-300 cursor-pointer " + (pkg.popular ? "scale-105 shadow-2xl shadow-blue-500/20" : "hover:scale-102 hover:shadow-xl")}
                style={{ background: pkg.popular ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)' : undefined }}
                onClick={() => setIsPaymentOpen(true)}
              >
                {/* Card inner */}
                <div className={"rounded-2xl p-6 h-full flex flex-col " + (darkMode ? "bg-[#0f0f23]" : "bg-white") + " " + (!pkg.popular ? ("border " + (darkMode ? "border-white/10 hover:border-" + pkg.glowColor + "-400/40" : "border-gray-200 hover:border-" + pkg.glowColor + "-300")) : "")}>

                  {/* Badge */}
                  {pkg.badge && (
                    <div className={"text-[10px] font-black tracking-wider mb-4 px-3 py-1 rounded-full text-center w-full bg-gradient-to-r " + pkg.gradient + " text-white"}>
                      {pkg.badge}
                    </div>
                  )}
                  {!pkg.badge && <div className="mb-4 h-6" />}

                  {/* Icon + Size */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{pkg.icon}</span>
                    <span className={"font-black text-lg " + (darkMode ? "text-white" : "text-gray-800")}>{pkg.size}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className={"text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r " + pkg.gradient}>
                      {pkg.price}
                    </div>
                    <div className={"text-sm font-semibold " + (darkMode ? "text-gray-400" : "text-gray-500")}>{pkg.priceSub}</div>
                  </div>

                  {/* Tokens count */}
                  <div className={"rounded-xl px-3 py-2 mb-5 " + (darkMode ? "bg-white/5" : "bg-gray-50")}>
                    <div className={"text-xs " + (darkMode ? "text-gray-500" : "text-gray-400")}>Tokens incluidos</div>
                    <div className={"font-black text-lg text-transparent bg-clip-text bg-gradient-to-r " + pkg.gradient}>{pkg.tokens}</div>
                    <div className={"text-[10px] " + (darkMode ? "text-gray-600" : "text-gray-400")}>{pkg.tokensNum} caracteres</div>
                  </div>

                  {/* CTA Button */}
                  <button className={"w-full py-3 rounded-xl font-black text-sm mb-5 text-white bg-gradient-to-r transition-all " + pkg.gradient + " hover:opacity-90 hover:shadow-lg"}>
                    Comprar ahora →
                  </button>

                  {/* Stats */}
                  <div className={"mt-auto space-y-1.5 pt-4 border-t " + (darkMode ? "border-white/5" : "border-gray-100")}>
                    <div className={"flex justify-between text-xs " + (darkMode ? "text-gray-500" : "text-gray-400")}>
                      <span>Tu ganancia:</span>
                      <span className={"font-bold text-transparent bg-clip-text bg-gradient-to-r " + pkg.gradient}>{pkg.profit}</span>
                    </div>
                    <div className={"flex justify-between text-xs " + (darkMode ? "text-gray-500" : "text-gray-400")}>
                      <span>Margen:</span>
                      <span className={"font-bold " + (darkMode ? "text-white" : "text-gray-700")}>{pkg.margin}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <p className={"text-center text-xs mt-10 " + (darkMode ? "text-gray-600" : "text-gray-400")}>
            🔒 Pagos seguros · Los tokens no expiran · Se acumulan con tu plan
          </p>
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
              Únete a miles de creadores que ya están usando StreamVoicer
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setCurrentPage('studio')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-lg text-white hover:shadow-xl hover:shadow-cyan-400/50 transition-all inline-flex items-center gap-2"
              >
                Ir al Studio <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage('pricing')}
                className="px-8 py-4 border-2 border-cyan-400 text-cyan-400 rounded-lg font-bold text-lg hover:bg-cyan-400/10 transition-all inline-flex items-center gap-2"
              >
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={"py-12 px-4 transition-colors " + (darkMode ? "border-t border-white/10 bg-[#0f0f23]/50" : "border-t border-gray-200 bg-gray-50")}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">StreamVoicer</h4>
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
            <p>&copy; 2026 StreamVoicer. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      <StripePayment isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
    </div>
  )
}
// Cache buster 1774553392
