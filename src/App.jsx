import { useState, useEffect, useRef } from 'react'
import { StripePayment } from './components/StripePayment'
import { SynthesisStudio } from './components/SynthesisStudio'
import VoiceWorkshopPanel from './components/VoiceCloningPanel'
import { PricingPage } from './components/PricingPage'
import { PricingCards } from './components/PricingCards'
import { ControlPanel } from './components/ControlPanel'
import { StatisticsDashboard } from './components/StatisticsDashboard'
import { AuthPage } from './components/AuthPage'
import BotPanel from './components/BotPanel'
import AIRoleplayWorkshop from './components/AIRoleplayWorkshop'
import AdminPanel from './components/AdminPanel'
import { ChevronRight, Zap, Mic2, Sliders, TrendingUp, Users, Shield, Sun, Moon, ArrowLeft, LogOut } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const DEFAULT_CONFIG = {
  audioSpeed: 1.0,
  freeModeNoChecks: false,
  readOnlyMessage: false,
  skipRepeated: false,
  onlyDonors: false,
  onlySubscribers: false,
  onlyCommunityMembers: false,
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
  chatNickColorDark: '#22d3ee',
  chatNickColorLight: '#0f766e',
  chatMsgColorDark: '#d1d5db',
  chatMsgColorLight: '#1f2937',
  themeMode: 'dark',
  lastTiktokUser: '',
  highlightRules: {
    moderators: { enabled: false, color: '#a855f7' },
    donors: { enabled: false, color: '#f59e0b' },
    banned: { enabled: false, color: '#ef4444' },
    subscribers: { enabled: false, color: '#ec4899' },
    communityMembers: { enabled: false, color: '#22c55e' },
    topFans: { enabled: false, color: '#06b6d4' },
  },
}

const normalizeUserConfig = (rawConfig = {}) => {
  const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}

  return {
    ...DEFAULT_CONFIG,
    ...config,
    chatNickColorDark: config.chatNickColorDark || config.chatNickColor || DEFAULT_CONFIG.chatNickColorDark,
    chatNickColorLight: config.chatNickColorLight || DEFAULT_CONFIG.chatNickColorLight,
    chatMsgColorDark: config.chatMsgColorDark || config.chatMsgColor || DEFAULT_CONFIG.chatMsgColorDark,
    chatMsgColorLight: config.chatMsgColorLight || DEFAULT_CONFIG.chatMsgColorLight,
    themeMode: config.themeMode || DEFAULT_CONFIG.themeMode,
    highlightRules: {
      ...DEFAULT_CONFIG.highlightRules,
      ...(config.highlightRules || {}),
    },
  }
}

export function App() {
  const [currentPage, setCurrentPage] = useState('landing') // 'landing', 'studio', 'voice-workshop', 'pricing', 'control-panel', 'statistics', 'auth', 'admin'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showCookies, setShowCookies] = useState(false)
  const [cookieConsent, setCookieConsent] = useState(() => {
    return localStorage.getItem('cookieConsent') === 'true'
  })
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState(250000)
  const [selectedCheckoutItem, setSelectedCheckoutItem] = useState(null)

  // Auth state
  const [user, setUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [tokens, setTokens] = useState(100)

  // Currency detection state
  const [exchangeRates, setExchangeRates] = useState(null)
  const [userCurrency, setUserCurrency] = useState('USD')
  const [userCountry, setUserCountry] = useState(null)

  // Config centralizado para todas las opciones
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [configReady, setConfigReady] = useState(false)

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
            loadAndApplyUserConfig(savedToken)
          } else {
            handleLogout()
          }
        }).catch(() => {
          setConfigReady(true)
        })
      } catch {
        localStorage.removeItem('sv-token')
        localStorage.removeItem('sv-user')
        setConfigReady(true)
      }
    } else {
      setConfigReady(true)
    }
  }, [])

  // Detectar ubicación y tipos de cambio
  useEffect(() => {
    const detectLocationAndExchangeRates = async () => {
      try {
        // Detectar país por IP
        setUserCountry('US')
        setUserCurrency('USD')

        // Obtener tipos de cambio desde USD a todas las monedas principales
        const ratesResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const ratesData = await ratesResponse.json()

        if (ratesData.rates) {
          setExchangeRates(ratesData.rates)
        }
      } catch (error) {
        console.error('Error detectando ubicación/tipos de cambio:', error)
        // Fallback si hay error
        setExchangeRates({
          MXN: 20,
          ARS: 920,
          BRL: 5.2,
          COP: 4100,
          CLP: 900,
          PEN: 3.8,
          UYU: 42
        })
      }
    }

    detectLocationAndExchangeRates()
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

  const loadAndApplyUserConfig = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        const normalizedConfig = normalizeUserConfig(data.config)
        setConfig(normalizedConfig)
        setDarkMode(normalizedConfig.themeMode !== 'light')
        console.log('[Config] Configuracion del usuario cargada')
      }
    } catch (err) {
      console.error('[Config] Error cargando config:', err)
    } finally {
      setConfigReady(true)
    }
  }

  // Convertir precio USD a moneda local
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
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      AUD: '$',
      CAD: '$'
    }

    const symbol = symbols[userCurrency] || '$'
    return {
      amount: convertedAmount,
      currency: userCurrency,
      display: `${symbol}${convertedAmount.toLocaleString()} ${userCurrency}`
    }
  }

  // Auto-guardar config al backend cuando cambia (con debounce)
  const saveTimerRef = useRef(null)
  useEffect(() => {
    const token = localStorage.getItem('sv-token')
    if (!token || !user || !configReady) return

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
  }, [config, user, configReady])

  const handleLogin = (userData, token) => {
    setUser(userData)
    setAuthToken(token)
    setTokens(userData.tokens || 100)
    setConfigReady(false)
    loadAndApplyUserConfig(token)
    setCurrentPage('studio')
  }

  const handleLogout = () => {
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('sv-token')
    localStorage.removeItem('sv-user')
    setConfigReady(true)
    // Reset config a defaults
    setConfig(DEFAULT_CONFIG)
    setDarkMode(DEFAULT_CONFIG.themeMode !== 'light')
    setCurrentPage('landing')
  }

  const handlePlanAction = (plan, meta = {}) => {
    if (!plan) return

    if (plan.price === 0) {
      setCurrentPage(user ? 'studio' : 'auth')
      return
    }

    if (!user) {
      setCurrentPage('auth')
      return
    }

    const planMapping = {
      CREATOR: 'creator',
      PRO: 'pro',
      ELITE: 'elite',
    }

    const billingCycle = meta.billingCycle || 'monthly'
    const recommendedPackages = {
      CREATOR: 250000,
      PRO: 500000,
      ELITE: 1000000,
    }

    setSelectedPaymentPackage(recommendedPackages[plan.name] || 250000)
    setSelectedCheckoutItem({
      type: 'plan',
      planId: planMapping[plan.name] || plan.name.toLowerCase(),
      billingCycle,
      label: `${plan.name} ${billingCycle === 'annual' ? 'Anual' : 'Mensual'}`,
      price: billingCycle === 'monthly' ? Number(plan.price).toFixed(2) : Number(plan.price).toFixed(2),
    })
    setIsPaymentOpen(true)
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

  useEffect(() => {
    if (!user || !configReady) return
    const nextThemeMode = darkMode ? 'dark' : 'light'
    if (config.themeMode !== nextThemeMode) {
      updateConfig('themeMode', nextThemeMode)
    }
  }, [darkMode, user, configReady, config.themeMode])

  // Admin Panel (solo para admins)
  if (currentPage === 'admin' && user?.role === 'admin') {
    return (
      <AdminPanel
        onClose={() => setCurrentPage('studio')}
        darkMode={darkMode}
        user={user}
        authToken={authToken}
      />
    )
  }

  // Auth Page
  if (currentPage === 'auth') {
    return <AuthPage onLogin={handleLogin} onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} />
  }

  // Pricing Page
  if (currentPage === 'pricing') {
    return <PricingPage onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} onPlanAction={handlePlanAction} />
  }

  // Voice Workshop Page (se desmonta al salir, no tiene estado persistente crítico)
  if (currentPage === 'voice-workshop') {
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
            <VoiceWorkshopPanel onCloneSuccess={() => {/* Success message shown in panel, no reload */}} darkModeOverride={darkMode} config={config} updateConfig={updateConfig} user={user} />
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

  // AI Roleplay Workshop
  if (currentPage === 'ai-roleplay') {
    return (
      <AIRoleplayWorkshop
        onClose={() => setCurrentPage('control-panel')}
        darkMode={darkMode}
        user={user}
        config={config}
        updateConfig={updateConfig}
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
            onGoVoiceCloning={() => setCurrentPage('voice-workshop')}
            onGoControlPanel={() => setCurrentPage('control-panel')}
            onGoStatistics={() => setCurrentPage('statistics')}
            onGoAdmin={user?.role === 'admin' ? () => setCurrentPage('admin') : undefined}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            config={config}
            updateConfig={updateConfig}
            user={user}
          />
        </div>
        <div style={{ display: currentPage === 'control-panel' ? 'block' : 'none' }}>
          <ControlPanel
            onClose={() => setCurrentPage('studio')}
            onGoAIRoleplay={() => setCurrentPage('ai-roleplay')}
            onGoSynthesis={() => setCurrentPage('studio')}
            darkMode={darkMode}
            config={config}
            updateConfig={updateConfig}
            user={user}
          />
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
      priceMxn: '≈ 80 MXN',
      hours: '≈ 2 – 3 horas extra'
    },
    {
      size: 'M',
      tokens: '300,000',
      price: '$9.99',
      priceMxn: '≈ 200 MXN',
      hours: '≈ 5 – 8 horas extra'
    },
    {
      size: 'L',
      tokens: '1,000,000',
      price: '$24.99',
      priceMxn: '≈ 500 MXN',
      hours: '≈ 16 – 30 horas extra'
    },
    {
      size: 'XL',
      tokens: '2,500,000',
      price: '$49.99',
      priceMxn: '≈ 1,000 MXN',
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
        {user?.role === 'admin' && (
          <button
            onClick={() => setCurrentPage('admin')}
            title="Panel Admin"
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 transition-all"
          >
            <Shield className="w-4 h-4" />
          </button>
        )}
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
          <PricingCards darkMode={darkMode} showToggle={true} onPlanAction={handlePlanAction} />
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
                onClick={() => {
                  setSelectedCheckoutItem(null)
                  const tokenPackageMap = { S: 100000, M: 250000, L: 1000000, XL: 1000000 }
                  setSelectedPaymentPackage(tokenPackageMap[pkg.size] || 250000)
                  setIsPaymentOpen(true)
                }}
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
                    {exchangeRates && userCurrency !== 'USD' && (
                      <div className={"text-xs font-medium " + (darkMode ? "text-gray-500" : "text-gray-400")}>
                        {(() => {
                          const priceNum = parseFloat(pkg.price.replace('$', ''))
                          const converted = convertPrice(priceNum)
                          return `≈ ${converted.display} aprox.`
                        })()}
                      </div>
                    )}
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
              <div key={idx} className={darkMode ? "bg-white/5 border border-white/10 rounded-xl p-8" : "bg-white border border-gray-200 shadow-md rounded-xl p-8"}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className={`italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`rounded-2xl p-12 ${darkMode ? 'bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30' : 'bg-gradient-to-br from-cyan-50 to-purple-50 border border-cyan-200'}`}>
            <h3 className={`text-4xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Listo para revolucionar tus streams?
            </h3>
            <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => setShowTerms(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">Términos</button></li>
                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">Privacidad</button></li>
                <li><button onClick={() => setShowCookies(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">Cookies</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => setShowContact(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">Contacto</button></li>
                <li><button onClick={() => setShowFAQ(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">FAQ</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 StreamVoicer. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      <StripePayment
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        initialPackageTokens={selectedPaymentPackage}
        initialCheckoutItem={selectedCheckoutItem}
      />

      {/* Términos Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 overflow-y-auto">
          <div className={`rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Términos de Servicio</h2>
              <button onClick={() => setShowTerms(false)} className="text-2xl opacity-50 hover:opacity-100">×</button>
            </div>
            <div className={`space-y-4 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>1. Aceptación de Términos</h3>
                <p>Al usar StreamVoicer, aceptas estos términos y condiciones. Si no estás de acuerdo, no uses el servicio.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>2. Descripción del Servicio</h3>
                <p>StreamVoicer es una plataforma de síntesis de voz (TTS) para streamers. Proporciona características para leer mensajes en vivo usando inteligencia artificial.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>3. Uso Permitido</h3>
                <p>Debes usar StreamVoicer solo para propósitos legales y éticos. Se prohíbe:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Contenido ofensivo, discriminatorio o ilegal</li>
                  <li>Intentos de piratería o acceso no autorizado</li>
                  <li>Spam o abuso del servicio</li>
                  <li>Violación de derechos de terceros</li>
                </ul>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>4. Suscripciones y Pagos</h3>
                <p>Los planes son recurrentes. Puedes cancelar en cualquier momento. No hay reembolsos por uso parcial del período.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>5. Limitaciones de Responsabilidad</h3>
                <p>StreamVoicer se proporciona "tal cual". No garantizamos disponibilidad continua. No somos responsables por daños indirectos.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>6. Cambios en los Términos</h3>
                <p>Nos reservamos el derecho de modificar estos términos. Te notificaremos de cambios significativos.</p>
              </section>
            </div>
            <button onClick={() => setShowTerms(false)} className="mt-6 w-full py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:opacity-90">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Privacidad Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 overflow-y-auto">
          <div className={`rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Política de Privacidad</h2>
              <button onClick={() => setShowPrivacy(false)} className="text-2xl opacity-50 hover:opacity-100">×</button>
            </div>
            <div className={`space-y-4 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>1. Información que Recolectamos</h3>
                <p>Recolectamos información que voluntariamente proporcionas, como nombre, email, y datos de suscripción.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>2. Cómo Usamos Tu Información</h3>
                <p>Usamos tu información para:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Proporcionar y mejorar nuestros servicios</li>
                  <li>Procesar pagos y suscripciones</li>
                  <li>Enviarte actualizaciones importantes</li>
                  <li>Personalizar tu experiencia</li>
                </ul>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>3. Seguridad de Datos</h3>
                <p>Implementamos medidas de seguridad estándar para proteger tu información. Sin embargo, no podemos garantizar seguridad absoluta.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>4. Cookies y Tecnologías Similares</h3>
                <p>Usamos cookies para mejorar tu experiencia y analizar el uso del servicio.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>5. Derechos del Usuario</h3>
                <p>Tienes derecho a acceder, modificar o eliminar tu información personal. Contacta al correo de soporte para solicitar estos derechos.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>6. Cambios en la Política</h3>
                <p>Nos reservamos el derecho de actualizar esta política. Los cambios serán notificados en esta página.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>7. Contacto</h3>
                <p>Para preguntas sobre privacidad, contáctanos a: support@streamvoicer.com</p>
              </section>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="mt-6 w-full py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:opacity-90">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Contacto Modal */}
      {showContact && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4">
          <div className={`rounded-2xl p-8 max-w-md w-full ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contacto</h2>
              <button onClick={() => setShowContact(false)} className="text-2xl opacity-50 hover:opacity-100">×</button>
            </div>
            <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>¿Tienes preguntas o necesitas ayuda? Nos encantaría escucharte.</p>
              <div className="bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl p-4 text-center">
                <p className="text-white text-sm mb-2 font-bold">Envíanos un correo a:</p>
                <a href="mailto:opusvolt@gmail.com" className="text-white text-lg font-black hover:opacity-80 transition">
                  opusvolt@gmail.com
                </a>
              </div>
              <p className="text-sm">Responderemos tu mensaje lo antes posible. Esperamos tu contacto.</p>
            </div>
            <button onClick={() => setShowContact(false)} className="mt-6 w-full py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:opacity-90">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 overflow-y-auto">
          <div className={`rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Preguntas Frecuentes</h2>
              <button onClick={() => setShowFAQ(false)} className="text-2xl opacity-50 hover:opacity-100">×</button>
            </div>
            <div className={`space-y-6 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Cómo funciona StreamVoicer?</h3>
                <p>StreamVoicer es una plataforma de síntesis de voz (TTS) que lee automáticamente los mensajes de tu chat de TikTok LIVE usando inteligencia artificial con voces naturales en español.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Qué es un token?</h3>
                <p>Un token representa caracteres de texto. Cuando un usuario envía un mensaje, se consumen tokens según la cantidad de caracteres. Cada plan incluye una cantidad mensual de tokens renovables.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Puedo cambiar de plan cuando quiera?</h3>
                <p>Sí, puedes cambiar o cancelar tu plan en cualquier momento. Los cambios se reflejan en tu próximo período de facturación.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Qué hago si se me acaban los tokens?</h3>
                <p>Puedes comprar tokens adicionales en cualquier momento en la sección "Recarga de Tokens". Los tokens se acumulan con los de tu plan actual.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Los tokens expiran?</h3>
                <p>No, los tokens no expiran. Se acumulan en tu cuenta y puedes usarlos cuando quieras mientras tengas una suscripción activa.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Funciona con otros idiomas?</h3>
                <p>Actualmente StreamVoicer está optimizado para español. Estamos trabajando en agregar más idiomas próximamente.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Cuánto tiempo toma procesar un mensaje?</h3>
                <p>Los mensajes se procesan en tiempo real. Típicamente entre 2-5 segundos dependiendo de la longitud y el servidor.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Puedo personalizar las voces?</h3>
                <p>Sí, en el panel de control puedes elegir entre diferentes voces en español y configurar qué mensajes se leen según tus reglas.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Es seguro dar acceso a mi TikTok?</h3>
                <p>Sí, solo solicitamos acceso a la información pública de tu stream LIVE. Tus datos están protegidos y no compartimos información con terceros.</p>
              </div>
              <div>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Hay período de prueba gratuito?</h3>
                <p>Sí, ofrecemos un plan FREE con 20,000 tokens mensuales para que pruebes todas las características.</p>
              </div>
            </div>
            <button onClick={() => setShowFAQ(false)} className="mt-6 w-full py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:opacity-90">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Cookies Modal */}
      {showCookies && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 overflow-y-auto">
          <div className={`rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Política de Cookies</h2>
              <button onClick={() => setShowCookies(false)} className="text-2xl opacity-50 hover:opacity-100">×</button>
            </div>
            <div className={`space-y-4 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Qué son las cookies?</h3>
                <p>Las cookies son pequeños archivos de texto que se guardan en tu dispositivo cuando visitas nuestro sitio. Nos ayudan a mejorar tu experiencia y analizar cómo usas StreamVoicer.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Tipos de Cookies que Usamos</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento básico del sitio (autenticación, seguridad)</li>
                  <li><strong>Cookies de Rendimiento:</strong> Nos ayudan a entender cómo usas el sitio y mejorarlo</li>
                  <li><strong>Cookies de Análisis:</strong> Rastrean cómo interactúas con StreamVoicer para optimizar la experiencia</li>
                  <li><strong>Cookies de Publicidad:</strong> Permiten mostrar anuncios relevantes según tus intereses</li>
                </ul>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Cómo Usamos las Cookies?</h3>
                <p>Usamos cookies para:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Mantener tu sesión iniciada</li>
                  <li>Recordar tus preferencias de idioma y tema</li>
                  <li>Analizar el tráfico del sitio con Google Analytics</li>
                  <li>Personalizar contenido según tu actividad</li>
                  <li>Prevenir fraude y mejorar la seguridad</li>
                </ul>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Control de Cookies</h3>
                <p>Puedes controlar o eliminar cookies desde la configuración de tu navegador. Ten en cuenta que desactivarlas puede afectar la funcionalidad del sitio.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Cookies de Terceros</h3>
                <p>Usamos servicios de terceros como Google Analytics que también pueden guardar cookies. Consulta sus políticas para más información.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Cambios en la Política</h3>
                <p>Nos reservamos el derecho de actualizar esta política en cualquier momento. Te notificaremos de cambios significativos.</p>
              </section>
            </div>
            <button onClick={() => setShowCookies(false)} className="mt-6 w-full py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:opacity-90">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Cookie Consent Banner */}
      {!cookieConsent && (
        <div className={`fixed bottom-0 left-0 right-0 p-4 z-[998] ${darkMode ? 'bg-gray-900 border-t border-gray-700' : 'bg-white border-t border-gray-200 shadow-lg'}`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Usamos cookies para mejorar tu experiencia. Al continuar, aceptas nuestra{' '}
                <button onClick={() => setShowCookies(true)} className="underline hover:no-underline text-cyan-400 font-semibold">
                  política de cookies
                </button>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCookieConsent(true) && localStorage.setItem('cookieConsent', 'true')}
                className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:opacity-90 whitespace-nowrap"
              >
                Aceptar
              </button>
              <button
                onClick={() => setCookieConsent(true) && localStorage.setItem('cookieConsent', 'true')}
                className={`px-6 py-2 rounded-lg font-bold whitespace-nowrap ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// Cache buster 1774553392
