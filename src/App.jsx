import { useState, useEffect, useRef, useCallback } from 'react'
import { StripePayment } from './components/StripePayment'
import { SynthesisStudio } from './components/SynthesisStudio'
import VoiceWorkshopPanel from './components/VoiceCloningPanel'
import { PricingPage } from './components/PricingPage'
import { PricingCards } from './components/PricingCards'
import { PricingComparison } from './components/PricingComparison'
import { ControlPanel } from './components/ControlPanel'
import { StatisticsDashboard } from './components/StatisticsDashboard'
import { AuthPage } from './components/AuthPage'
import BotPanel from './components/BotPanel'
import AIRoleplayWorkshop from './components/AIRoleplayWorkshop'
import AdminPanel from './components/AdminPanel'
import { ChevronRight, Zap, Mic2, Sliders, TrendingUp, Users, Shield, Sun, Moon, ArrowLeft, LogOut } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'
const TOKEN_API_KEY = 'sv-token-api-v1'
const LOCAL_CONFIG_CACHE_KEY = 'sv-config-cache-v1'
const LOCAL_CONFIG_CACHE_KEY_PREFIX = 'sv-config-cache-v2'

const getApiFingerprint = () => {
  try {
    return new URL(API_URL).origin
  } catch {
    return String(API_URL || '').trim().toLowerCase()
  }
}

const DEFAULT_CONFIG = {
  audioSpeed: 1.0,
  chatVolume: 0.8,
  readOnlyMessage: false,
  skipRepeated: false,
  onlyDonors: false,
  onlySubscribers: false,
  onlyCommunityMembers: false,
  onlyQuestions: false,
  announceFollowers: false,
  announceGifts: false,
  ignoreLinks: false,
  profanityFilterEnabled: false,
  profanityWords: '',
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
  subscriberVoiceEnabled: false,
  subscriberVoiceId: 'Lupita',
  communityMemberVoiceEnabled: false,
  communityMemberVoiceId: 'Lupita',
  questionVoiceEnabled: false,
  questionVoiceId: 'Lupita',
  generalVoiceId: 'es-ES',
  notifVoiceEnabled: false,
  notifVoiceId: 'Lupita',
  likeCooldown: 60,
  viewerCooldown: 120,
  followCooldown: 10,
  shareCooldown: 15,
  giftCooldown: 5,
  // Bot response threshold settings (0 = disabled, >0 = required)
  minNewMessagesBeforeResponse: 0,       // Min new messages before responding
  minTimeBetweenResponsesMs: 0,          // Min milliseconds between responses
  botAutoInteractEnabled: false,         // Interactuador solo manual
  botShortcutEnabled: true,
  botShortcutKey: 'F9',
  interactorShortcutEnabled: true,
  interactorShortcutKey: 'F8',
  botAssistantCharacterId: '',
  botAssistantVoiceId: '',
  botAssistantVoiceSpeed: 1.0,
  botAssistantMaxResponseChars: 250,
  chatFontSize: 14,
  chatNickColorDark: '#22d3ee',
  chatNickColorLight: '#0f766e',
  chatMsgColorDark: '#d1d5db',
  chatMsgColorLight: '#1f2937',
  themeMode: 'dark',
  smartChatEnabled: false,
  lastTiktokUser: '',
  mobilePreviewEnabled: false,
  mobilePreviewMuted: true,
  configPreset1: null,
  configPreset2: null,
  configPreset3: null,
  sessionModerationList: [],
  highlightedUsers: {},
  highlightSelectedColor: '#06b6d4',
  highlightRules: {
    moderators: { enabled: false, color: '#a855f7' },
    donors: { enabled: false, color: '#f59e0b' },
    banned: { enabled: false, color: '#ef4444' },
    subscribers: { enabled: false, color: '#ec4899' },
    communityMembers: { enabled: false, color: '#22c55e' },
    topFans: { enabled: false, color: '#06b6d4' },
  },
  configUpdatedAt: 0,
}

const normalizeHighlightedUsers = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out = {}
  const entries = Object.entries(value).slice(0, 500)
  for (const [rawUser, rawColor] of entries) {
    const username = String(rawUser || '').trim()
    const color = String(rawColor || '').trim()
    if (!username) continue
    if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(color)) continue
    out[username] = color
  }
  return out
}

const normalizeSessionModerationList = (value) => {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const normalized = []
  for (const item of value) {
    const username = String(item?.username || '')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase()
    if (!username || seen.has(username)) continue
    seen.add(username)
    normalized.push({
      username,
      reason: String(item?.reason || 'Baneado o silenciado').slice(0, 120),
      source: String(item?.source || 'unknown').slice(0, 24),
      addedAt: item?.addedAt || new Date().toISOString()
    })
  }
  return normalized.slice(0, 500)
}

const normalizeUserConfig = (rawConfig = {}) => {
  const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}
  const assistantVoiceSpeed = Number(config.botAssistantVoiceSpeed)
  const assistantMaxChars = Number(config.botAssistantMaxResponseChars)
  const normalizedVoiceSpeed = Number.isFinite(assistantVoiceSpeed)
    ? Math.min(2, Math.max(0.5, assistantVoiceSpeed))
    : DEFAULT_CONFIG.botAssistantVoiceSpeed
  const normalizedMaxChars = Number.isFinite(assistantMaxChars)
    ? Math.min(500, Math.max(50, Math.round(assistantMaxChars)))
    : DEFAULT_CONFIG.botAssistantMaxResponseChars

  return {
    ...DEFAULT_CONFIG,
    ...config,
    chatNickColorDark: config.chatNickColorDark || config.chatNickColor || DEFAULT_CONFIG.chatNickColorDark,
    chatNickColorLight: config.chatNickColorLight || DEFAULT_CONFIG.chatNickColorLight,
    chatMsgColorDark: config.chatMsgColorDark || config.chatMsgColor || DEFAULT_CONFIG.chatMsgColorDark,
    chatMsgColorLight: config.chatMsgColorLight || DEFAULT_CONFIG.chatMsgColorLight,
    themeMode: config.themeMode || DEFAULT_CONFIG.themeMode,
    configUpdatedAt: Number.isFinite(Number(config.configUpdatedAt)) ? Number(config.configUpdatedAt) : Number(DEFAULT_CONFIG.configUpdatedAt || 0),
    botAssistantVoiceSpeed: normalizedVoiceSpeed,
    botAssistantMaxResponseChars: normalizedMaxChars,
    sessionModerationList: normalizeSessionModerationList(config.sessionModerationList),
    highlightedUsers: normalizeHighlightedUsers(config.highlightedUsers),
    highlightSelectedColor: /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(String(config.highlightSelectedColor || ''))
      ? String(config.highlightSelectedColor)
      : DEFAULT_CONFIG.highlightSelectedColor,
    highlightRules: {
      ...DEFAULT_CONFIG.highlightRules,
      ...(config.highlightRules || {}),
    },
  }
}

const getConfigCacheKey = (userIdentifier = 'guest') => `${LOCAL_CONFIG_CACHE_KEY_PREFIX}:${String(userIdentifier || 'guest')}`
const buildDefaultConfig = () => normalizeUserConfig(DEFAULT_CONFIG)

const normalizeServerConfigPayload = (rawConfig) => {
  if (!rawConfig) return {}
  if (typeof rawConfig === 'string') {
    try {
      const parsed = JSON.parse(rawConfig)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return (typeof rawConfig === 'object' && !Array.isArray(rawConfig)) ? rawConfig : {}
}

const loadCachedConfig = (userIdentifier = 'guest') => {
  try {
    const scopedRaw = localStorage.getItem(getConfigCacheKey(userIdentifier))
    if (scopedRaw) return JSON.parse(scopedRaw)
    if (userIdentifier !== 'guest') return null
    const raw = localStorage.getItem(LOCAL_CONFIG_CACHE_KEY) // compatibilidad legado
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function AnimatedMetric({ value, className = '', animateOnView = false }) {
  const buildZeroValue = (rawValue) => {
    const raw = String(rawValue || '').trim()
    const hasPlus = raw.startsWith('+')
    const hasPercent = raw.includes('%')
    const numericText = raw.replace(/[^0-9.,]/g, '')
    const decimals = numericText.includes('.') ? (numericText.split('.')[1]?.length || 0) : 0
    const zero = decimals > 0 ? (0).toFixed(decimals) : '0'
    return `${hasPlus ? '+' : ''}${zero}${hasPercent ? '%' : ''}`
  }

  const [display, setDisplay] = useState(animateOnView ? buildZeroValue(value) : value)
  const [isAnimating, setIsAnimating] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    if (!animateOnView) {
      setDisplay(value)
      return
    }

    const node = targetRef.current
    if (!node) return

    const raw = String(value || '').trim()
    const hasPlus = raw.startsWith('+')
    const hasPercent = raw.includes('%')
    const numericText = raw.replace(/[^0-9.,]/g, '').replace(/,/g, '')
    const target = Number(numericText || 0)
    const decimals = numericText.includes('.') ? (numericText.split('.')[1]?.length || 0) : 0
    const durationMs = 1400
    let rafId = null
    let started = false
    let startTimeoutId = null

    const formatValue = (num) => {
      const fixed = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString()
      const withCommas = Number(fixed).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
      return `${hasPlus ? '+' : ''}${withCommas}${hasPercent ? '%' : ''}`
    }

    const animate = () => {
      if (started) return
      started = true
      setIsAnimating(true)
      setDisplay(buildZeroValue(value))
      const start = performance.now()
      const step = (now) => {
        const progress = Math.min(1, (now - start) / durationMs)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = target * eased
        setDisplay(formatValue(current))
        if (progress < 1) {
          rafId = requestAnimationFrame(step)
        } else {
          setIsAnimating(false)
          setDisplay(value)
        }
      }
      rafId = requestAnimationFrame(step)
    }

    const isVisibleEnough = () => {
      const rect = node.getBoundingClientRect()
      const viewport = window.innerHeight || 0
      return rect.top <= viewport * 0.82 && rect.bottom >= viewport * 0.2
    }

    const onScrollCheck = () => {
      const scrolled = (window.scrollY || window.pageYOffset || 0) > 100
      const visible = isVisibleEnough()
      if (!started && scrolled && visible) {
        if (startTimeoutId) clearTimeout(startTimeoutId)
        startTimeoutId = setTimeout(() => {
          animate()
        }, 180)
      }
      if (started && !visible) {
        // Reinicia para que se vuelva a animar al reingresar.
        started = false
        setIsAnimating(false)
        setDisplay(buildZeroValue(value))
      }
    }

    window.addEventListener('scroll', onScrollCheck, { passive: true })
    window.addEventListener('resize', onScrollCheck)
    setTimeout(onScrollCheck, 40)

    return () => {
      window.removeEventListener('scroll', onScrollCheck)
      window.removeEventListener('resize', onScrollCheck)
      if (startTimeoutId) clearTimeout(startTimeoutId)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [animateOnView, value])

  return (
    <p
      ref={targetRef}
      className={`${className} transition-all duration-300 ${isAnimating ? 'scale-110 brightness-125' : 'scale-100'}`}
    >
      {display}
    </p>
  )
}

export function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const params = window.location.search
    if (params.includes('preview=admin')) return 'admin'
    if (params.includes('preview=auth')) return 'auth'
    return 'landing'
  }) // 'landing', 'studio', 'voice-workshop', 'pricing', 'control-panel', 'statistics', 'auth', 'admin'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showCookies, setShowCookies] = useState(false)
  const [cookieConsent, setCookieConsent] = useState(false) // Siempre comienza en false para mostrar el banner
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState(350000)
  const [selectedCheckoutItem, setSelectedCheckoutItem] = useState(null)

  // Auth state
  const [user, setUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [tokens, setTokens] = useState(100)
  const isLocalDevBypass = import.meta.env.DEV && typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const canOpenStudioWithoutAuth = Boolean(user) || isLocalDevBypass

  // Currency detection state
  const [exchangeRates, setExchangeRates] = useState(null)
  const [userCurrency, setUserCurrency] = useState('USD')
  const [userCountry, setUserCountry] = useState(null)

  // Config centralizado para todas las opciones
  const [config, setConfig] = useState(() => normalizeUserConfig(loadCachedConfig('guest') || buildDefaultConfig()))
  const [configReady, setConfigReady] = useState(false)

  const updateConfig = useCallback((key, value) => {
    setConfig((prev) => {
      if (Object.is(prev?.[key], value)) return prev
      return { ...prev, [key]: value, configUpdatedAt: Date.now() }
    })
  }, [])
  const latestConfigRef = useRef(config)

  useEffect(() => {
    latestConfigRef.current = config
  }, [config])

  // Restaurar sesión al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('sv-token')
    const savedUser = localStorage.getItem('sv-user')
    const savedTokenApi = localStorage.getItem(TOKEN_API_KEY)
    const currentApi = getApiFingerprint()

    if (savedToken && savedTokenApi && savedTokenApi !== currentApi) {
      // Evita usar un token generado contra otro backend (local vs prod).
      localStorage.removeItem('sv-token')
      localStorage.removeItem('sv-user')
      localStorage.setItem(TOKEN_API_KEY, currentApi)
      setConfigReady(true)
      return
    }

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
            loadAndApplyUserConfig(savedToken, data.user)
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
        // Detectar país por navegador/zona horaria
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        const lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : ''
        const isMexico = tz.includes('Mexico') || /-MX$/i.test(lang)

        if (isMexico) {
          setUserCountry('MX')
          setUserCurrency('MXN')
        } else {
          setUserCountry('US')
          setUserCurrency('USD')
        }

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

  const loadAndApplyUserConfig = async (token, userInfo = null) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        const userKey = userInfo?.id || userInfo?.email || 'guest'
        const cachedConfigRaw = loadCachedConfig(userKey) || {}
        const remoteConfigRaw = normalizeServerConfigPayload(data.config)
        const hasRemoteConfig = Object.keys(remoteConfigRaw).length > 0
        const cachedUpdatedAt = Number(cachedConfigRaw?.configUpdatedAt || 0)
        const remoteUpdatedAt = Number(remoteConfigRaw?.configUpdatedAt || 0)
        const preferCached = cachedUpdatedAt >= remoteUpdatedAt
        const mergedRaw = hasRemoteConfig
          ? (preferCached
            ? { ...remoteConfigRaw, ...cachedConfigRaw }
            : { ...cachedConfigRaw, ...remoteConfigRaw })
          : cachedConfigRaw
        const mergedConfig = normalizeUserConfig(mergedRaw)
        setConfig(mergedConfig)
        setDarkMode(mergedConfig.themeMode !== 'light')
        if (hasRemoteConfig && preferCached && Object.keys(cachedConfigRaw).length > 0) {
          // Backfill asíncrono: solo si local es mas reciente que remoto.
          persistConfigNow(token, mergedConfig).catch(() => {})
        }
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
  const testimonialsScrollRef = useRef(null)

  const persistConfigNow = async (token, configToPersist) => {
    if (!token || !configToPersist) return false
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ config: configToPersist }),
        keepalive: true
      })
      if (!response.ok) {
        console.warn('[Config] Guardado inmediato falló con estado:', response.status)
        return false
      }
      const payload = await response.json().catch(() => ({ success: true }))
      if (!payload?.success) {
        console.warn('[Config] Guardado inmediato rechazado por API')
        return false
      }
      return true
    } catch (error) {
      console.warn('[Config] Guardado inmediato error:', error?.message || error)
      return false
    }
  }

  // Cache local inmediata por usuario activo (respaldo si falla red/backend)
  useEffect(() => {
    if (user && !configReady) return
    try {
      const userKey = user?.id || user?.email || 'guest'
      localStorage.setItem(getConfigCacheKey(userKey), JSON.stringify(config))
      // Mantener legado para evitar perder estado de usuarios previos en transición
      if (!user) {
        localStorage.setItem(LOCAL_CONFIG_CACHE_KEY, JSON.stringify(config))
      }
    } catch {}
  }, [config, user])

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
      }).then(async (response) => {
        if (!response.ok) {
          console.warn('[Config] Error guardando config. HTTP:', response.status)
          return
        }
        const payload = await response.json().catch(() => ({ success: true }))
        if (!payload?.success) {
          console.warn('[Config] Guardado automático rechazado por API')
          return
        }
        console.log('[Config] Guardado automático')
      }).catch(() => {})
    }, 2000) // Espera 2 segundos después del último cambio

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [config, user, configReady])

  const handleLogin = (userData, token) => {
    localStorage.setItem(TOKEN_API_KEY, getApiFingerprint())
    setUser(userData)
    setAuthToken(token)
    setTokens(userData.tokens || 100)
    // Evita mostrar configuraciones heredadas mientras carga el perfil remoto
    const cleanConfig = buildDefaultConfig()
    setConfig(cleanConfig)
    setDarkMode(cleanConfig.themeMode !== 'light')
    setConfigReady(false)
    loadAndApplyUserConfig(token, userData)
    setCurrentPage('studio')
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('sv-token')
    const currentUser = user
    if (token && currentUser) {
      await persistConfigNow(token, latestConfigRef.current)
    }

    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('sv-token')
    localStorage.removeItem('sv-user')
    localStorage.removeItem(TOKEN_API_KEY)
    setConfigReady(true)
    // Reset config a defaults
    const cleanConfig = buildDefaultConfig()
    setConfig(cleanConfig)
    setDarkMode(cleanConfig.themeMode !== 'light')
    setCurrentPage('landing')
  }

  // Detectar sesión desplazada desde cualquier fetch de la app
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status === 401) {
        const clone = response.clone()
        try {
          const data = await clone.json()
          const errText = String(data?.error || data?.message || '').toLowerCase()

          if (data?.error === 'SESSION_DISPLACED') {
            localStorage.removeItem('sv-token')
            localStorage.removeItem('sv-user')
            localStorage.removeItem(TOKEN_API_KEY)
            setUser(null)
            setAuthToken(null)
            setCurrentPage('auth')
            setConfig(buildDefaultConfig())
            setTimeout(() => {
              alert('⚠️ Tu sesión fue iniciada en otro dispositivo. Has sido desconectado.')
            }, 100)
          } else if (
            localStorage.getItem('sv-token') &&
            (errText.includes('invalid token') || errText.includes('no token provided') || errText.includes('jwt'))
          ) {
            // Token vencido / inválido: limpiar sesión para evitar bloqueos raros.
            localStorage.removeItem('sv-token')
            localStorage.removeItem('sv-user')
            localStorage.removeItem(TOKEN_API_KEY)
            setUser(null)
            setAuthToken(null)
            setCurrentPage('auth')
            setConfig(buildDefaultConfig())
            setTimeout(() => {
              alert('Tu sesión expiró o quedó inválida. Inicia sesión de nuevo.')
            }, 100)
          }
        } catch (_) {}
      }
      return response
    }
    return () => { window.fetch = originalFetch }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const token = localStorage.getItem('sv-token')
      const currentUser = user
      if (!token || !currentUser) return
      fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ config: latestConfigRef.current }),
        keepalive: true
      }).catch(() => {})
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [user])

  const handlePlanAction = (plan, meta = {}) => {
    if (!plan) return

    if (plan.price === 0) {
      setCurrentPage(canOpenStudioWithoutAuth ? 'studio' : 'auth')
      return
    }

    if (!canOpenStudioWithoutAuth) {
      setCurrentPage('auth')
      return
    }

    const planMapping = {
      START: 'start',
      CREATOR: 'creator',
      PRO: 'pro',
    }

    const billingCycle = meta.billingCycle || 'monthly'
    const recommendedPackages = {
      START: 150000,
      CREATOR: 350000,
      PRO: 700000,
    }

    setSelectedPaymentPackage(recommendedPackages[plan.name] || 350000)
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
      if (window.location.search.includes('light=1')) return false
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

  // Scroll al top cuando carga la página
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Bloquear scroll si no hay consentimiento de cookies
  useEffect(() => {
    if (!cookieConsent) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [cookieConsent])

  // Auto-scroll testimonials
  useEffect(() => {
    const container = testimonialsScrollRef.current
    if (!container) return

    let scrollAmount = 0
    const scrollStep = 2
    const scrollInterval = 50

    const interval = setInterval(() => {
      scrollAmount += scrollStep
      container.scrollLeft = scrollAmount

      // Reset cuando llega al final
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        scrollAmount = 0
        container.scrollLeft = 0
      }
    }, scrollInterval)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (false && currentPage === 'auth' && canOpenStudioWithoutAuth) { // TEMP: disabled for local preview
      setCurrentPage('studio')
    }
  }, [currentPage, canOpenStudioWithoutAuth])

  // Auth Page — también accesible por ?preview=auth en local
  if (currentPage === 'auth' || window.location.search.includes('preview=auth')) {
    return <AuthPage onLogin={handleLogin} onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} />
  }

  // Pricing Page
  if (currentPage === 'pricing') {
    return (
      <>
        <PricingPage onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} onPlanAction={handlePlanAction} />
        <StripePayment
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          initialPackageTokens={selectedPaymentPackage}
          initialCheckoutItem={selectedCheckoutItem}
        />
      </>
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

  // Studio + Voice Workshop + paneles secundarios: todos en el mismo bloque con display:none/block
  // para que SynthesisStudio nunca se desmonte (manteniendo el WebSocket de TikTok vivo al navegar a voice-workshop)
  if (['studio', 'control-panel', 'statistics', 'admin', 'voice-workshop'].includes(currentPage)) {
    return (
      <>
        <div style={{ display: currentPage === 'studio' ? 'block' : 'none' }}>
          <SynthesisStudio
            onGoHome={() => setCurrentPage('landing')}
            onGoVoiceCloning={() => setCurrentPage('voice-workshop')}
            onGoControlPanel={() => setCurrentPage('control-panel')}
            onGoStatistics={() => setCurrentPage('statistics')}
            onGoAdmin={user?.role === 'admin' ? () => setCurrentPage('admin') : undefined}
            onGoPricingPage={() => setCurrentPage('pricing')}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            config={config}
            updateConfig={updateConfig}
            configReady={configReady}
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
        <div style={{ display: currentPage === 'statistics' ? 'block' : 'none' }}>
          <StatisticsDashboard
            onGoHome={() => setCurrentPage('landing')}
            onGoStudio={() => setCurrentPage('studio')}
            darkMode={darkMode}
            user={user}
            authToken={authToken}
          />
        </div>
        <div style={{ display: (currentPage === 'admin' && (user?.role === 'admin' || window.location.search.includes('preview=admin'))) ? 'block' : 'none' }}>
          <AdminPanel
            onClose={() => setCurrentPage('studio')}
            darkMode={darkMode}
            user={user}
            authToken={authToken}
          />
        </div>
        {/* Voice Workshop Page */}
        <div style={{ display: currentPage === 'voice-workshop' ? 'block' : 'none' }}>
          <div className={darkMode ? "min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "min-h-screen bg-gradient-to-b from-[#eceff3] via-[#f7f8fa] to-[#e8ecf1] text-gray-900"}>
            {/* Header */}
            <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-colors duration-300 ${darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/75 border-b border-[#d7dce3] shadow-sm'}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage('landing')}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img src="/images/streamvoicer6.png" alt="StreamVoicer" className="h-14 w-auto" />
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
      icon: '🟢',
      size: 'MINI BOOST',
      tokens: '150,000',
      price: '$4.99',
      priceMxn: '$4.99 USD',
      hours: '1.5–3 horas'
    },
    {
      icon: '🔵',
      size: 'POWER BOOST',
      tokens: '350,000',
      price: '$9.99',
      priceMxn: '$9.99 USD',
      hours: '4–7 horas'
    },
    {
      icon: '🔥',
      size: 'MAX BOOST',
      tokens: '700,000',
      price: '$14.99',
      priceMxn: '$14.99 USD',
      hours: '8–12 horas'
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
      title: 'Activa Stream Voicer',
      description: 'Inicia la lectura de mensajes de chat en tiempo real'
    },
    {
      step: '3',
      title: 'Disfruta',
      description: 'Los mensajes se leen automáticamente durante tu stream'
    }
  ]
  const faqItems = [
    { icon: '🔊', q: '¿Cómo funciona Stream Voicer?', a: 'Stream Voicer lee en tiempo real los mensajes de tu chat de TikTok LIVE y los reproduce con voz para mantener interacción constante en tu stream.' },
    { icon: '🧩', q: '¿Qué es un token?', a: '1 token equivale a 1 carácter generado. El consumo aplica cuando usas voces premium o voces personalizadas.' },
    { icon: '🎙️', q: '¿Qué voces consumen tokens?', a: 'Las voces premium y las voces personalizadas consumen tokens. La voz esencial no consume tokens.' },
    { icon: '♻️', q: '¿Si el audio sale de caché también se cobran tokens?', a: 'Sí. El caché optimiza rendimiento y costos internos de procesamiento, pero el consumo de tokens del usuario se mantiene según caracteres generados en voces premium/personalizadas.' },
    { icon: '💳', q: '¿Qué hago si se me acaban los tokens?', a: 'Puedes recargar al instante desde la sección "Recarga de Tokens". Si no tienes tokens, las voces premium/personalizadas dejan de reproducirse hasta recargar.' },
    { icon: '⏳', q: '¿Cómo funciona el plan FREE?', a: 'El plan FREE incluye 1 voz esencial con 2 horas diarias. El contador se restablece cada 24 horas.' },
    { icon: '🔄', q: '¿Puedo cambiar o cancelar mi plan cuando quiera?', a: 'Sí. Puedes actualizar, cambiar o cancelar tu plan cuando quieras desde tu cuenta. Los cambios se aplican según tu ciclo de facturación.' },
    { icon: '🌍', q: '¿Funciona con otros idiomas?', a: 'Actualmente Stream Voicer está optimizado para español. Próximamente se integrarán más idiomas.' },
    { icon: '⚡', q: '¿Cuánto tarda en procesarse un mensaje?', a: 'Se procesa en tiempo real. Normalmente tarda entre 1 y 5 segundos según longitud del mensaje, voz elegida y carga del sistema.' },
    { icon: '🔐', q: '¿Es seguro conectar mi TikTok?', a: 'Sí. Solo se usa el acceso necesario para leer la actividad pública de tu LIVE. No compartimos tus datos con terceros.' },
    { icon: '🆓', q: '¿Hay prueba gratis?', a: 'Sí. Puedes empezar con FREE y subir a START, CREATOR o PRO cuando necesites más capacidad y más voces.' },
    { icon: '🛠️', q: '¿Puedo crear y editar mis voces personalizadas?', a: 'Sí. Puedes gestionar voces personalizadas desde tu panel. La cantidad disponible depende de tu plan activo.' },
  ]
  const advancedGuide = [
    {
      title: 'Filtro inteligente (en simple)',
      description: 'Cuando el chat va rápido, prioriza mensajes con valor de conversación y reduce ruido (spam, repetidos, puro emoji o texto poco legible). Cuando el chat se calma, abre más cobertura para leer más mensajes útiles.'
    },
    {
      title: 'Asistente de IA en vivo',
      description: 'El asistente toma contexto reciente del chat para responder en tono de tu stream. Puedes dispararlo manualmente o con reglas de interacción para equilibrar frecuencia, naturalidad y control.'
    },
    {
      title: 'Tokens y consumo real',
      description: 'Las voces premium y personalizadas consumen tokens por caracteres generados. La voz esencial del plan FREE no consume tokens, pero mantiene su ventana diaria de uso para cuidar estabilidad y costos.'
    },
    {
      title: 'Roles y prioridad de lectura',
      description: 'Puedes darle preferencia a moderadores, suscriptores, comunidad y donadores. También puedes forzar solo preguntas o combinarlas con otros filtros para que el chat mantenga foco.'
    },
    {
      title: 'Recomendación de arranque',
      description: 'Empieza con filtros básicos: saltar repetidos, ignorar links y mínimo de longitud. Luego ajusta voces por rol (ej. donadores/preguntas) y sube agresividad solo si el volumen del chat lo exige.'
    },
    {
      title: 'Cómo evaluar si está bien configurado',
      description: 'Usa el resumen de sesión: si mejora la calidad de mensajes leídos sin perder ritmo del live, vas bien. Ajusta poco a poco para mantener el balance entre cantidad, claridad y engagement.'
    }
  ]

  return (
    <div className={"min-h-screen overflow-hidden transition-colors duration-300 " + (darkMode ? "bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "bg-gradient-to-b from-[#eceff3] via-[#f7f8fa] to-[#e8ecf1] text-gray-900") + ""}>
      {/* Botones Esquina Superior */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={"p-2 rounded-lg transition-all " + (darkMode ? "bg-white/10 hover:bg-white/20 text-yellow-400" : "bg-white/90 hover:bg-white text-gray-700 shadow-md")}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => canOpenStudioWithoutAuth ? setCurrentPage('studio') : setCurrentPage('auth')}
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
            onClick={() => canOpenStudioWithoutAuth ? setCurrentPage('studio') : setCurrentPage('auth')}
            className={"px-4 py-2 rounded-lg font-semibold text-sm transition-all " + (darkMode ? "bg-white/10 hover:bg-white/20 text-white border border-white/20" : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm")}
          >
            {canOpenStudioWithoutAuth ? 'Entrar al Studio' : 'Iniciar Sesión'}
          </button>
        )}
      </div>

      {/* Hero Section */}
      <section className="pt-10 pb-16 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-[420px] h-[420px] bg-gradient-to-b from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          {/* Logo/Título de la app */}
          <div className="mb-10 flex justify-center">
            <img
              src="/images/streamvoicer6.png"
              alt="StreamVoicer"
              className="w-full max-w-4xl h-auto object-contain opacity-90"
            />
          </div>

          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Tu LIVE ya no sonará
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-orange-400">
              genérico
            </span>
          </h2>

          <p className={"text-xl md:text-2xl mb-8 max-w-2xl mx-auto " + (darkMode ? "text-gray-300" : "text-gray-600")}>
              Dale voz a tu chat de TikTok LIVE con personajes en vivo y crea una experiencia única.
          </p>

          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {[
              '🎮 Tu personaje famoso leyendo comentarios',
              '😂 Narrador gracioso reaccionando',
              '😈 Voz troll para donaciones'
            ].map((tag) => (
              <span
                key={tag}
                className={"px-3 py-2 rounded-lg text-sm border " + (darkMode ? "bg-white/5 border-cyan-400/20 text-cyan-200" : "bg-white border-cyan-200 text-cyan-700")}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="relative inline-flex">
              <span
                className={"absolute -inset-1 rounded-xl pointer-events-none animate-ping opacity-60 " + (darkMode
                  ? "bg-cyan-400/30"
                  : "bg-cyan-300/40")}
              />
              <button
                onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
                className={"relative z-10 px-10 py-4 rounded-lg font-extrabold text-lg transition-all shadow-lg hover:scale-[1.03] animate-pulse flex items-center gap-2 " + (darkMode
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:shadow-cyan-400/50"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-300/70")}
              >
                Ver Planes
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400 animate-ping pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      {/* Success Cases Section */}
      <section className={`py-20 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className={`text-4xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Resultados reales de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">nuestros creadores</span>
            </h3>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Números que hablan por sí solos
            </p>
          </div>

          {/* Success Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { metric: '+150%', label: 'De 50K → 125K seguidores en 3 meses', creator: '🎮 Alex Gaming', category: 'Gaming Live', description: 'Chat activo en vivo gracias a voces que reaccionan en tiempo real.', img: 'https://raw.githubusercontent.com/universodelaluz-dotcom/voltvoice-frontend/main/public/images/web1.png' },
              { metric: '+2,500', label: 'Comentarios por LIVE', creator: '🎮 Max JuanGamingPro', category: 'Gaming Live', description: 'El chat cobra vida con voces y se vuelve parte del show.', img: 'https://raw.githubusercontent.com/universodelaluz-dotcom/voltvoice-frontend/refs/heads/main/public/images/web%207.png' },
              { metric: '+85%', label: 'Aumento en donaciones', creator: '😂 Carlos Comedy', category: 'Comedia Live', description: 'Las voces en vivo hacen el stream más divertido y participativo.', img: 'https://raw.githubusercontent.com/universodelaluz-dotcom/voltvoice-frontend/main/public/images/web3.png' },
            ].map((caseItem, idx) => (
              <div
                key={idx}
                className={`rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Metric Header */}
                <div className={`p-6 text-center border-b ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                }`}>
                  <AnimatedMetric
                    value={caseItem.metric}
                    animateOnView={true}
                    className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_2px_8px_rgba(255,115,0,0.35)] mb-2"
                  />
                  <p className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {caseItem.label}
                  </p>
                </div>

                {/* Image */}
                <div className="h-48 overflow-hidden bg-gray-300">
                  <img
                    src={caseItem.img}
                    alt={caseItem.creator}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h4 className={`text-lg font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {caseItem.creator}
                  </h4>
                  <p className={`text-xs font-bold mb-3 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {caseItem.category}
                  </p>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {caseItem.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-32 mb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              {[
                { metric: '+200%', title: 'Seguidores diarios' },
                { metric: '+70%', title: 'Conversión a seguidores' },
                { metric: '+45%', title: 'Retención de viewers' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="text-center"
                >
                  <AnimatedMetric
                    value={item.metric}
                    animateOnView={true}
                    className="text-6xl md:text-7xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_3px_12px_rgba(255,115,0,0.4)]"
                  />
                  <p className={`mt-3 text-base md:text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Horizontal Scroll */}
      <section className={`py-20 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className={`text-4xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Lo que dicen nuestros <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">creadores</span>
            </h3>
          </div>

          {/* Horizontal Scroll Testimonials - Auto Scroll */}
          <div
            ref={testimonialsScrollRef}
            className="overflow-x-hidden pb-4 -mx-4 px-4"
          >
            <div className="flex gap-6 min-w-min">
              {[
                { name: '@alexgamertok', type: 'TikTok Creator Gaming', benefit: '🟢 Tu stream nunca se queda muerto', text: 'Antes mis Lives en TikTok se moría si no hablaba constantemente. Con Stream Voicer, el chat siempre tiene algo que leer, comentar y participar. Los viewers ven que hay actividad incluso cuando estoy concentrado en el juego.', stars: 5 },
                { name: '@sofiaart', type: 'TikTok Creator Art', benefit: '💬 Tu chat trabaja por ti', text: 'No tengo que estar leyendo comentarios todo el tiempo. Stream Voicer los procesa, destaca los mejores y mantiene la conversación fluida. Yo solo me concentro en crear contenido y el chat se cuida solo.', stars: 5 },
                { name: '@carlosmusica.live', type: 'TikTok Creator Música', benefit: '⚡ Más interacción sin más esfuerzo', text: 'Mis Lives ahora tienen 3x más engagement sin que yo haga nada diferente. La gente comenta más porque sabe que sus mensajes van a ser valorados. Es increíble cuánta interacción genera sin esfuerzo extra.', stars: 5 },
                { name: '@dianabeauty_tk', type: 'TikTok Creator Belleza', benefit: '🎯 Convierte mensajes en participación', text: 'Cada comentario que llega se convierte en una participación real. Ya no es solo "jeje" abajo, ahora los comentarios generan conversación. Mi comunidad se siente escuchada y eso atrae más personas al Live.', stars: 5 },
                { name: '@javierstreamer22', type: 'TikTok Creator Competitivo', benefit: '⭐ Destaca a tus seguidores y donadores', text: 'El sistema automáticamente reconoce a mis followers y donadores. No tengo que perder tiempo dándoles shout-outs manuales. Ellos se sienten valorados naturalmente y eso me genera más donaciones y suscripciones.', stars: 5 },
                { name: '@mariacomedy_tk', type: 'TikTok Creator Comedia', benefit: '🚀 Haz tu stream dinámico sin hablar más', text: 'Mi Live es mucho más dinámico y entretenido sin que tenga que estar hablando todo el tiempo para mantener atención. El chat está tan activo y valorado que la gente viene por la comunidad, no solo por mí.', stars: 5 },
              ].map((testimonial, idx) => (
                <div
                  key={idx}
                  className={`flex-shrink-0 w-80 p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">⭐</span>
                    ))}
                  </div>

                  {/* Benefit Highlight */}
                  <p className={`text-sm font-bold mb-3 pb-3 border-b ${
                    darkMode
                      ? 'text-cyan-400 border-gray-700'
                      : 'text-cyan-600 border-gray-200'
                  }`}>
                    {testimonial.benefit}
                  </p>

                  {/* Text */}
                  <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {testimonial.text}
                  </p>

                  {/* Name & Type */}
                  <div className="border-t pt-4" style={{borderColor: darkMode ? '#374151' : '#e5e7eb'}}>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {testimonial.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {testimonial.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black mb-4">
              💰 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">PAQUETES COMPLETOS</span>
            </h3>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Elige el plan perfecto para tu stream</p>
          </div>
          <PricingCards darkMode={darkMode} showToggle={true} onPlanAction={handlePlanAction} />

          {/* Divider */}
          <div className="my-20 flex items-center gap-4">
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              📋 Comparativa detallada
            </span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>

          {/* Pricing Comparison */}
          <PricingComparison darkMode={darkMode} onPlanAction={handlePlanAction} />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pt-10 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black mb-4">
              ❓ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Preguntas Frecuentes</span>
            </h3>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Resuelve tus dudas sobre Stream Voicer</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqItems.map((faq, idx) => (
              <div key={idx} className={`p-6 rounded-lg border-l-4 ${darkMode ? 'bg-gray-800/50 border-cyan-500' : 'bg-gray-50 border-cyan-400'}`}>
                <h4 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {faq.icon} {faq.q}
                </h4>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

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
              💰 PAQUETES EXTRA (RECARGAS) →
            </span>
            <h3 className="text-5xl font-black mt-4 mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                Recarga de Tokens
              </span>
            </h3>
            <p className={"text-xl font-medium " + (darkMode ? "text-gray-200" : "text-gray-700")}>Si tu plan mensual se queda corto, recarga al instante sin esperar al siguiente mes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {additionalPackages.map((pkg, idx) => {
              const gradients = ['from-cyan-500 to-blue-500', 'from-blue-500 to-purple-500', 'from-purple-500 to-pink-500']
                const gradient = gradients[idx]
                const icon = pkg.icon
              const isPopular = idx === 1
              return (
              <div
                key={idx}
                className={"relative group rounded-2xl p-px transition-all duration-300 cursor-pointer " + (isPopular ? "scale-105 shadow-2xl shadow-purple-500/20" : "hover:scale-102 hover:shadow-xl")}
                style={{ background: isPopular ? 'linear-gradient(135deg, #a855f7, #ec4899)' : undefined }}
                onClick={() => {
                  setSelectedCheckoutItem(null)
                  const tokenPackageMap = { 'MINI BOOST': 150000, 'POWER BOOST': 350000, 'MAX BOOST': 700000 }
                  setSelectedPaymentPackage(tokenPackageMap[pkg.size] || 350000)
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
                    {exchangeRates?.MXN && (
                      <div className={"text-xs font-medium " + (darkMode ? "text-gray-500" : "text-gray-400")}>
                        {(() => {
                          const priceNum = parseFloat(pkg.price.replace('$', ''))
                          const mxnAmount = priceNum * exchangeRates.MXN
                          const mxnDisplay = new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            maximumFractionDigits: 0
                          }).format(mxnAmount)
                          return `Aprox. ${mxnDisplay} MXN`
                        })()}
                      </div>
                    )}
                  </div>

                    <div className={"rounded-xl px-3 py-2 mb-4 " + (darkMode ? "bg-white/5" : "bg-gray-50")}>
                      <div className={"text-xs " + (darkMode ? "text-gray-500" : "text-gray-400")}>🎙️ Caracteres</div>
                      <div className={"font-black text-lg text-transparent bg-clip-text bg-gradient-to-r " + gradient}>{pkg.tokens}</div>
                    </div>

                    <p className={"text-sm mb-2 " + (darkMode ? "text-gray-400" : "text-gray-500")}>⏱️ {pkg.hours}</p>

                  {isPopular ? (
                    <div className="relative mt-auto">
                      <span className={"absolute -inset-1 rounded-xl pointer-events-none animate-ping opacity-50 bg-gradient-to-r " + gradient} />
                      <button className={"relative z-10 w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r animate-pulse transition-all shadow-lg " + gradient + " hover:opacity-90"}>
                        🚀 Comprar ahora →
                      </button>
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400 animate-ping pointer-events-none z-20" />
                    </div>
                  ) : (
                    <button className={"w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r transition-all mt-auto " + gradient + " hover:opacity-90 hover:shadow-lg"}>
                      Comprar ahora →
                    </button>
                  )}
                </div>
              </div>
              )
            })}
          </div>

          {/* Bottom note */}
          <p className={"text-center text-xs mt-10 " + (darkMode ? "text-gray-600" : "text-gray-400")}>
            🧠 NOTA: El consumo depende de la actividad del chat y la configuración. Puedes extender la duración usando filtros inteligentes y lectura selectiva.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`rounded-2xl p-12 ${darkMode ? 'bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30' : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'}`}>
            <h3 className={`text-4xl font-black mb-6 ${darkMode ? 'text-white' : 'text-white'}`}>
              Listo para revolucionar tus streams?
            </h3>
            <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-slate-200'}`}>
              Únete a miles de creadores que ya están usando Stream Voicer
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => canOpenStudioWithoutAuth ? setCurrentPage('studio') : setCurrentPage('auth')}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-all inline-flex items-center gap-2 ${
                  darkMode
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:shadow-xl hover:shadow-cyan-400/50'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {canOpenStudioWithoutAuth ? 'Ir al Studio' : 'Comenzar Gratis'} <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-8 py-4 border-2 rounded-lg font-bold text-lg transition-all inline-flex items-center gap-2 ${
                  darkMode
                    ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                    : 'border-slate-200 text-white hover:bg-white/10'
                }`}
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
              <h4 className="font-bold mb-4">Stream Voicer</h4>
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
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Stream Voicer. Todos los derechos reservados.</p>
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
                <p>Al usar Stream Voicer, aceptas estos términos y condiciones. Si no estás de acuerdo, no uses el servicio.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>2. Descripción del Servicio</h3>
                <p>Stream Voicer es una plataforma de síntesis de voz (TTS) para streamers. Proporciona características para leer mensajes en vivo usando inteligencia artificial.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>3. Uso Permitido</h3>
                <p>Debes usar Stream Voicer solo para propósitos legales y éticos. Se prohíbe:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Contenido ofensivo, discriminatorio o ilegal</li>
                  <li>Intentos de piratería o acceso no autorizado</li>
                  <li>Spam o abuso del servicio</li>
                  <li>Violación de derechos de terceros</li>
                </ul>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>4. Suscripciones, Pagos y Reembolsos</h3>
                <p>Los planes son recurrentes. Puedes cancelar en cualquier momento. No hay reembolsos por uso parcial del período.</p>
                <p className="mt-2"><strong>Paquetes de tokens:</strong> Los paquetes de tokens son productos digitales de consumo inmediato. Una vez procesada la compra, no aplican reembolsos ni devoluciones de ningún tipo, independientemente del uso realizado. Al completar la compra, el usuario acepta expresamente esta política.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>5. Limitaciones de Responsabilidad</h3>
                <p>Stream Voicer se proporciona "tal cual". No garantizamos disponibilidad continua. No somos responsables por daños indirectos.</p>
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
                <p>Para preguntas sobre privacidad, contáctanos a: soporte@streamvoicer.com</p>
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
                <a href="mailto:soporte@streamvoicer.com" className="text-white text-lg font-black hover:opacity-80 transition">
                  soporte@streamvoicer.com
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


      {/* Cookies Modal */}
      {showCookies && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 overflow-y-auto">
          <div className={`rounded-2xl w-full max-w-4xl my-8 flex flex-col ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`} style={{maxHeight: 'calc(100vh - 64px)'}}>
            {/* Header */}
            <div className={`flex justify-between items-center p-8 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Política de Cookies</h2>
              <button onClick={() => setShowCookies(false)} className="text-2xl opacity-50 hover:opacity-100 font-bold">×</button>
            </div>

            {/* Contenido scrolleable */}
            <div className={`flex-1 overflow-y-auto px-8 pt-8 pb-16 space-y-4 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>¿Qué son las cookies?</h3>
                <p>Las cookies son pequeños archivos de texto que se guardan en tu dispositivo cuando visitas nuestro sitio. Nos ayudan a mejorar tu experiencia y analizar cómo usas Stream Voicer.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Tipos de Cookies que Usamos</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento básico del sitio (autenticación, seguridad)</li>
                  <li><strong>Cookies de Rendimiento:</strong> Nos ayudan a entender cómo usas el sitio y mejorarlo</li>
                  <li><strong>Cookies de Análisis:</strong> Rastrean cómo interactúas con Stream Voicer para optimizar la experiencia</li>
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

            {/* Footer con botón */}
            <div className={`p-8 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <button onClick={() => setShowCookies(false)} className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-400/50 transition-all">
                ✅ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Cookie Consent Banner - Agresivo */}
      {!cookieConsent && (
        <>
          {/* Overlay oscuro que bloquea clicks */}
          <div className="fixed inset-0 bg-black/40 z-[997] pointer-events-auto" onClick={() => {}} />

          {/* Banner */}
          <div className={`fixed bottom-0 left-0 right-0 z-[999] border-t-4 ${darkMode ? 'bg-gray-900 border-cyan-500' : 'bg-white border-cyan-400'} shadow-2xl`}>
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Texto */}
                <div className="md:col-span-2">
                  <h3 className={`text-2xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🍪 POLÍTICA DE COOKIES
                  </h3>
                  <p className={`text-base mb-3 leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <strong>Utilizamos cookies</strong> para mejorar tu experiencia, analizar cómo usas Stream Voicer y personalizar contenido. Al continuar navegando, aceptas nuestra política.
                  </p>
                  <button
                    onClick={() => setShowCookies(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline text-base"
                  >
                    👉 Ver detalles completos
                  </button>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={() => {
                      setCookieConsent(true)
                      localStorage.setItem('cookieConsent', 'true')
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-black text-lg rounded-lg hover:shadow-lg hover:shadow-cyan-400/60 transition-all whitespace-nowrap"
                  >
                    ✅ ACEPTAR TODAS
                  </button>
                  <button
                    onClick={() => {
                      setCookieConsent(true)
                      localStorage.setItem('cookieConsent', 'true')
                    }}
                    className={`px-8 py-4 rounded-lg font-bold text-lg whitespace-nowrap transition-all border-2 ${
                      darkMode
                        ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-600'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
                    }`}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
// Cache buster 1774553392








