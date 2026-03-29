import { useState, useEffect, useRef } from 'react'
import { StripePayment } from './components/StripePayment'
import { SynthesisStudio } from './components/SynthesisStudio'
import VoiceCloningPanel from './components/VoiceCloningPanel'
import { PricingPage } from './components/PricingPage'
import { PricingCards } from './components/PricingCards'
import { ControlPanel } from './components/ControlPanel'
import { StatisticsDashboard } from './components/StatisticsDashboard'
import { AuthPage } from './components/AuthPage'
import { ChevronRight, Zap, Mic2, Sliders, TrendingUp, Users, Shield, Sun, Moon, ArrowLeft, LogOut } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export function App() {
  const [currentPage, setCurrentPage] = useState('landing') // 'landing', 'studio', 'voice-cloning', 'pricing', 'control-panel', 'statistics', 'auth'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  // Auth state
  const [user, setUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [tokens, setTokens] = useState(100)

  // Config centralizado para todas las opciones
  const [config, setConfig] = useState({
    audioSpeed: 1.0,
    readOnlyMessage: false,
    skipRepeated: false,
    onlyDonors: false,
    onlyQuestions: false,
    announceFollowers: false,
    announceGifts: false,
    ignoreLinks: false,
    ignoreExcessiveEmojis: false,
    maxEmojisAllowed: 3,
    onlyPlainNicks: false,
    onlyModerators: false,
    announceViewers: false,
    announceLikes: false,
    announceShares: false,
    announceBattles: false,
    announcePolls: false,
    announceGoals: false,
    donorCharLimitEnabled: false,
    donorCharLimit: 200,
    minMessageLengthEnabled: false,
    minMessageLength: 3,
    maxQueueEnabled: false,
    maxQueueSize: 20,
    donorVoiceEnabled: false,
    donorVoiceId: 'Diego',
    modVoiceEnabled: false,
    modVoiceId: 'Lupita',
    generalVoiceId: 'es-ES',
    notifVoiceEnabled: false,
    notifVoiceId: 'Lupita',
    likeCooldown: 60,
    viewerCooldown: 120,
    followCooldown: 10,
    shareCooldown: 15,
    giftCooldown: 5,
    chatFontSize: 14,
    chatNickColor: '#22d3ee',
    chatMsgColor: '#d1d5db',
    highlightRules: {
      moderators: { enabled: false, color: '#a855f7' },
      donors: { enabled: false, color: '#f59e0b' },
      banned: { enabled: false, color: '#ef4444' },
      subscribers: { enabled: false, color: '#ec4899' },
      topFans: { enabled: false, color: '#06b6d4' },
    },
  })

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))

  // Restaurar sesión al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('sv-token')
    const savedUser = localStorage.getItem('sv-user')
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setAuthToken(savedToken)
        setTokens(userData.tokens || 100)
        // Verificar token y cargar config del usuario
        fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        }).then(r => r.json()).then(data => {
          if (data.success) {
            setUser(data.user)
            setTokens(data.user.tokens || 100)
            localStorage.setItem('sv-user', JSON.stringify(data.user))
            // Cargar config guardada del usuario
            loadUserConfig(savedToken)
          } else {
            handleLogout()
          }
        }).catch(() => {})
      } catch {
        localStorage.removeItem('sv-token')
        localStorage.removeItem('sv-user')
      }
    }
  }, [])

  // Cargar config del usuario desde el backend
  const loadUserConfig = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.config && Object.keys(data.config).length > 0) {
        setConfig(prev => ({ ...prev, ...data.config }))
        console.log('[Config] Configuración del usuario cargada')
      }
    } catch (err) {
      console.error('[Config] Error cargando config:', err)
    }
  }

  // Auto-guardar config al backend cuando cambia (con debounce)
  const saveTimerRef = useRef(null)
  useEffect(() => {
    const token = localStorage.getItem('sv-token')
    if (!token || !user) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ config })
      }).then(() => {
        console.log('[Config] Guardado automático')
      }).catch(() => {})
    }, 2000) // Espera 2 segundos después del último cambio

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [config, user])

  const handleLogin = (userData, token) => {
    setUser(userData)
    setAuthToken(token)
    setTokens(userData.tokens || 100)
    loadUserConfig(token)
    setCurrentPage('studio')
  }

  const handleLogout = () => {
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('sv-token')
    localStorage.removeItem('sv-user')
    // Reset config a defaults
    setConfig({
      audioSpeed: 1.0, readOnlyMessage: false, skipRepeated: false,
      onlyDonors: false, onlyQuestions: false, announceFollowers: false,
      announceGifts: false, ignoreLinks: false, ignoreExcessiveEmojis: false, maxEmojisAllowed: 3, onlyPlainNicks: false,
      onlyModerators: false, announceViewers: false, announceLikes: false,
      announceShares: false, announceBattles: false, announcePolls: false,
      announceGoals: false, donorCharLimitEnabled: false, donorCharLimit: 200,
      minMessageLengthEnabled: false, minMessageLength: 3,
      maxQueueEnabled: false, maxQueueSize: 20,
      donorVoiceEnabled: false, donorVoiceId: 'Diego',
      modVoiceEnabled: false, modVoiceId: 'Lupita',
      generalVoiceId: 'es-ES', notifVoiceEnabled: false, notifVoiceId: 'Lupita',
      likeCooldown: 60, viewerCooldown: 120, followCooldown: 10, shareCooldown: 15, giftCooldown: 5,
    })
    setCurrentPage('landing')
  }

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

  // Auth Page
  if (currentPage === 'auth') {
    return <AuthPage onLogin={handleLogin} onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} />
  }

  // Pricing Page
  if (currentPage === 'pricing') {
    return <PricingPage onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} />
  }

  // Voice Cloning Page (se desmonta al salir, no tiene estado persistente crítico)
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
              <img src="/images/Sin%20t%C3%ADtulo%20(200%20x%2060%20px)%20(250%20x%2060%20px).png" alt="StreamVoicer" className="h-12 w-auto" />
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

  // Statistics Dashboard
  if (currentPage === 'statistics') {
    return (
      <StatisticsDashboard
        onGoHome={() => setCurrentPage('landing')}
        onGoStudio={() => setCurrentPage('studio')}
        darkMode={darkMode}
        user={user}
        authToken={authToken}
      />
    )
  }

  // Studio + ControlPanel: ambos montados, se ocultan con CSS para no perder el WebSocket
  if (currentPage === 'studio' || currentPage === 'control-panel') {
    return (
      <>
        <div style={{ display: currentPage === 'studio' ? 'block' : 'none' }}>
          <SynthesisStudio
            onGoHome={() => setCurrentPage('landing')}
            onGoVoiceCloning={() => setCurrentPage('voice-cloning')}
            onGoControlPanel={() => setCurrentPage('control-panel')}
            onGoStatistics={() => setCurrentPage('statistics')}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            config={config}
            updateConfig={updateConfig}
            user={user}
          />
        </div>
        <div style={{ display: currentPage === 'control-panel' ? 'block' : 'none' }}>
          <ControlPanel onClose={() => setCurrentPage('studio')} darkMode={darkMode} config={config} updateConfig={updateConfig} user={user} />
        </div>
      </>
    )
  }

  const benefits = [
    {
      icon: '🎭',
      title: 'Clonación y Sistema de Personajes',
      subtitle: 'Crea identidades únicas dentro de tu stream.',
      description: 'Clona voces y asigna personajes a cada tipo de usuario (chat, donadores, moderadores, etc).'
    },
    {
      icon: '⚙️',
      title: 'Más de 30 Herramientas de Control',
      subtitle: 'Tú decides cómo se comporta tu chat.',
      description: 'Filtros inteligentes, control de cola, bloqueo de spam, gestión de mensajes, límites, limpieza automática y más.'
    },
    {
      icon: '🔊',
      title: 'Interacción en Tiempo Real',
      subtitle: 'Tu stream reacciona automáticamente.',
      description: 'Lectura de chat, notificaciones, eventos y acciones sin retrasos.'
    },
    {
      icon: '🎨',
      title: 'Personalización Total',
      subtitle: 'Diseña la experiencia completa.',
      description: 'Colores, nicks, estilos, tipos de usuario, visual del chat y comportamiento.'
    },
    {
      icon: '💰',
      title: 'Optimizado para Engagement y Monetización',
      subtitle: 'Convierte interacción en resultados.',
      description: 'Diferencia donadores, destaca usuarios clave y aumenta participación en tu stream.'
    },
    {
      icon: '🎮',
      title: 'Preparado para Streaming en Vivo',
      subtitle: 'Funciona donde lo necesitas.',
      description: 'Optimizado para TikTok LIVE y flujos en tiempo real.'
    },
    {
      icon: '🔒',
      title: 'Seguro y Estable',
      subtitle: 'Sistema confiable para streams largos.',
      description: 'Protección de datos y rendimiento constante.'
    }
  ]

  const additionalPackages = [
    {
      size: 'S',
      tokens: '100,000',
      price: '$3.99',
      hours: '≈ 2 – 3 horas extra'
    },
    {
      size: 'M',
      tokens: '300,000',
      price: '$9.99',
      hours: '≈ 5 – 8 horas extra'
    },
    {
      size: 'L',
      tokens: '1,000,000',
      price: '$24.99',
      hours: '≈ 16 – 30 horas extra'
    },
    {
      size: 'XL',
      tokens: '2,500,000',
      price: '$49.99',
      hours: '≈ 40 – 75 horas extra'
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
      {/* Botones Esquina Superior */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={"p-2 rounded-lg transition-all " + (darkMode ? "bg-white/10 hover:bg-white/20 text-yellow-400" : "bg-white/90 hover:bg-white text-gray-700 shadow-md")}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => user ? setCurrentPage('studio') : setCurrentPage('auth')}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/50 transition-all text-sm"
        >
          Studio
        </button>
      </div>
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        {user ? (
          <>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</span>
            <button
              onClick={handleLogout}
              className={"p-2 rounded-lg transition-all " + (darkMode ? "bg-white/10 hover:bg-white/20 text-red-400" : "bg-white/90 hover:bg-white text-red-500 shadow-md")}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setCurrentPage('auth')}
            className={"px-4 py-2 rounded-lg font-semibold text-sm transition-all " + (darkMode ? "bg-white/10 hover:bg-white/20 text-white border border-white/20" : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm")}
          >
            Iniciar Sesión
          </button>
        )}
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
              onClick={() => user ? setCurrentPage('studio') : setCurrentPage('auth')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-lg text-white hover:shadow-xl hover:shadow-cyan-400/50 transition-all flex items-center justify-center gap-2"
            >
              {user ? 'Ir al Studio' : 'Comenzar Gratis'} <ChevronRight className="w-5 h-5" />
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
                <h4 className="text-xl font-bold mb-2">{benefit.title}</h4>
                {benefit.subtitle && (
                  <p className="text-sm font-medium mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{benefit.subtitle}</p>
                )}
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
              ⚡ ¿Se te acabaron los tokens?
            </span>
            <h3 className="text-5xl font-black mt-4 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                Recarga de Tokens
              </span>
            </h3>
            <p className={"text-xl font-medium " + (darkMode ? "text-gray-200" : "text-gray-700")}>Si tu plan mensual se queda corto, recarga al instante sin esperar al siguiente mes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {additionalPackages.map((pkg, idx) => {
              const gradients = ['from-cyan-500 to-blue-500', 'from-blue-500 to-purple-500', 'from-purple-500 to-pink-500', 'from-yellow-400 to-orange-500']
              const icons = ['🔋', '⚡', '🚀', '💎']
              const gradient = gradients[idx]
              const icon = icons[idx]
              const isPopular = idx === 2
              return (
              <div
                key={idx}
                className={"relative group rounded-2xl p-px transition-all duration-300 cursor-pointer " + (isPopular ? "scale-105 shadow-2xl shadow-purple-500/20" : "hover:scale-102 hover:shadow-xl")}
                style={{ background: isPopular ? 'linear-gradient(135deg, #a855f7, #ec4899)' : undefined }}
                onClick={() => setIsPaymentOpen(true)}
              >
                <div className={"rounded-2xl p-6 h-full flex flex-col " + (darkMode ? "bg-[#0f0f23]" : "bg-white") + " " + (!isPopular ? ("border " + (darkMode ? "border-white/10" : "border-gray-200")) : "")}>

                  {isPopular && (
                    <div className={"text-[10px] font-black tracking-wider mb-4 px-3 py-1 rounded-full text-center w-full bg-gradient-to-r " + gradient + " text-white"}>
                      🔥 MÁS POPULAR
                    </div>
                  )}
                  {!isPopular && <div className="mb-4 h-6" />}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{icon}</span>
                    <span className={"font-black text-2xl " + (darkMode ? "text-white" : "text-gray-800")}>{pkg.size}</span>
                  </div>

                  <div className="mb-4">
                    <div className={"text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r " + gradient}>
                      {pkg.price} <span className={"text-base font-bold " + (darkMode ? "text-gray-400" : "text-gray-500")}>USD</span>
                    </div>
                  </div>

                  <div className={"rounded-xl px-3 py-2 mb-4 " + (darkMode ? "bg-white/5" : "bg-gray-50")}>
                    <div className={"text-xs " + (darkMode ? "text-gray-500" : "text-gray-400")}>Tokens incluidos</div>
                    <div className={"font-black text-lg text-transparent bg-clip-text bg-gradient-to-r " + gradient}>{pkg.tokens}</div>
                  </div>

                  <p className={"text-sm mb-5 " + (darkMode ? "text-gray-400" : "text-gray-500")}>{pkg.hours}</p>

                  <button className={"w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r transition-all mt-auto " + gradient + " hover:opacity-90 hover:shadow-lg"}>
                    Comprar ahora →
                  </button>
                </div>
              </div>
              )
            })}
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
                onClick={() => user ? setCurrentPage('studio') : setCurrentPage('auth')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-lg text-white hover:shadow-xl hover:shadow-cyan-400/50 transition-all inline-flex items-center gap-2"
              >
                {user ? 'Ir al Studio' : 'Comenzar Gratis'} <ChevronRight className="w-5 h-5" />
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
