import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { PricingCards } from './components/PricingCards'
import { PricingComparison } from './components/PricingComparison'
import { ChevronRight, Zap, Mic2, Sliders, TrendingUp, Users, Shield, Sun, Moon, ArrowLeft, LogOut, RotateCcw, Loader2, TestTube2, Check } from 'lucide-react'

const StripePayment = lazy(() => import('./components/StripePayment').then((m) => ({ default: m.StripePayment })))
const SynthesisStudio = lazy(() => import('./components/SynthesisStudio').then((m) => ({ default: m.SynthesisStudio })))
const VoiceWorkshopPanel = lazy(() => import('./components/VoiceCloningPanel'))
const PricingPage = lazy(() => import('./components/PricingPage').then((m) => ({ default: m.PricingPage })))
const ControlPanel = lazy(() => import('./components/ControlPanel').then((m) => ({ default: m.ControlPanel })))
const StatisticsDashboard = lazy(() => import('./components/StatisticsDashboard').then((m) => ({ default: m.StatisticsDashboard })))
const AuthPage = lazy(() => import('./components/AuthPage').then((m) => ({ default: m.AuthPage })))
const AIRoleplayWorkshop = lazy(() => import('./components/AIRoleplayWorkshop'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const resolveApiUrl = () => {
  const configured = String(import.meta.env.VITE_API_URL || '').trim()
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    const isHttpsPage = window.location.protocol === 'https:'
    const isNgrokPage = window.location.hostname.includes('ngrok-free.dev')
    if (isHttpsPage && isNgrokPage && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
      return origin
    }
  }
  return configured || 'https://voltvoice-backend.onrender.com'
}
const API_URL = resolveApiUrl()
const TOKEN_API_KEY = 'sv-token-api-v1'
const TOKEN_STORAGE_KEY = 'sv-token'
const TOKEN_PERSIST_KEY = 'sv-token-persist'
const PAYMENT_PENDING_KEY = 'sv-payment-pending-v1'
const LOCAL_CONFIG_CACHE_KEY = 'sv-config-cache-v1'
const LOCAL_CONFIG_CACHE_KEY_PREFIX = 'sv-config-cache-v2'
const COOKIE_CONSENT_KEY = 'cookieConsent'
const LAZY_FALLBACK = (
  <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
    Cargando...
  </div>
)

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
  readByCommandEnabled: false,
  readByCommandPrefix: 'bot/',
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
  commandVoiceEnabled: false,
  commandVoiceId: 'Lupita',
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
  variedVoicesEnabled: false,
  variedVoicesSelected: [],
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

const getStoredToken = () => sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_PERSIST_KEY) || ''

const persistAuthToken = (token) => {
  if (!token) return
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(TOKEN_PERSIST_KEY, token)
}

const clearStoredAuthToken = () => {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(TOKEN_PERSIST_KEY)
}

const reconcileMercadoPagoPayments = async (apiUrl, token) => {
  if (!apiUrl || !token) return
  try {
    // Reconcile any pending payments
    await fetch(`${apiUrl}/api/mercadopago/reconcile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    // Fetch fresh user data to get updated plan
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.success) {
      localStorage.setItem('sv-user', JSON.stringify(data.user))
    }
  } catch (_) {}
}

const capturePaypalOrder = async (apiUrl, token, orderId) => {
  if (!apiUrl || !orderId) return
  const headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(`${apiUrl}/api/paypal/capture-order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderId })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || 'No se pudo capturar el pago de PayPal')
  }
  // Fetch fresh user data to get updated plan
  if (token) {
    try {
      const userResponse = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userData = await userResponse.json()
      if (userData.success) {
        localStorage.setItem('sv-user', JSON.stringify(userData.user))
      }
    } catch (_) {}
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

function PublicTestResetCard({ darkMode, onAssumeUser }) {
  const [loading, setLoading] = useState(false)
  const [resettingId, setResettingId] = useState(null)
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [assumingId, setAssumingId] = useState(null)
  const USER_SLOTS = [
    { slot: 1, label: 'USUARIO FREE' },
    { slot: 2, label: 'USUARIO BASE' },
    { slot: 3, label: 'USUARIO PRO' },
    { slot: 4, label: 'USUARIO MAXX' },
  ]

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/api/test-lab/users`)
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || 'No se pudo cargar')
      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch (error) {
      setMessage(error.message || 'Error cargando usuarios de prueba.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const resetUser = async (userId) => {
    setResettingId(userId)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/api/test-lab/users/${userId}/reset-tokens`, { method: 'POST' })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || 'No se pudo resetear')
      setUsers(Array.isArray(data.users) ? data.users : [])
      setMessage(data.message || 'Reset aplicado.')
    } catch (error) {
      setMessage(error.message || 'Error al resetear usuario.')
    } finally {
      setResettingId(null)
    }
  }

  const assumeUser = async (userId) => {
    if (!onAssumeUser) return
    setAssumingId(userId)
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/api/test-lab/users/${userId}/assume`, { method: 'POST' })
      const data = await res.json()
      if (!data?.success || !data?.token || !data?.user) {
        throw new Error(data?.error || 'No se pudo tomar el rol del usuario.')
      }
      onAssumeUser(data.user, data.token)
      setMessage(`Entraste como ${data.user.email} (${String(data.user.plan || 'free').toUpperCase()})`)
    } catch (error) {
      setMessage(error.message || 'Error al iniciar sesión temporal.')
    } finally {
      setAssumingId(null)
    }
  }

  return (
    <section className="px-4 pb-2">
      <div className={`max-w-5xl mx-auto rounded-xl border p-4 ${darkMode ? 'bg-[#11142a]/70 border-cyan-500/25' : 'bg-white border-cyan-100 shadow-sm'}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <TestTube2 className="w-5 h-5 text-cyan-400" />
            <div>
              <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>TARJETA DE TESTS</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cambiar entre FREE, BASE, PRO y MAXX + reset rápido de tokens.</p>
            </div>
          </div>
          <button
            onClick={loadUsers}
            className={`text-xs font-bold px-3 py-1.5 rounded-md ${darkMode ? 'bg-white/10 text-cyan-300 hover:bg-white/20' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}
          >
            Recargar
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {USER_SLOTS.map((slotSpec) => {
              const user = users.find((entry) => Number(entry?.slot) === slotSpec.slot) || null
              return (
                <div key={slotSpec.slot} className={`rounded-md border p-3 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{slotSpec.label}</p>
                  {user ? (
                    <>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ID: {user.id}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Plan actual: <span className="font-bold uppercase">{user.plan}</span></p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tokens: <span className="font-bold">{Number(user.tokens || 0).toLocaleString()}</span></p>
                      <button
                        onClick={() => assumeUser(user.id)}
                        disabled={assumingId === user.id}
                        className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-black text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 disabled:opacity-70"
                      >
                        {assumingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                        CAMBIAR A {slotSpec.label}
                      </button>
                      <button
                        onClick={() => resetUser(user.id)}
                        disabled={resettingId === user.id}
                        className="mt-1.5 w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-black text-white bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 disabled:opacity-70"
                      >
                        {resettingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        RESET USUARIO
                      </button>
                    </>
                  ) : (
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Sin usuario asignado todavía.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nota: RESET USUARIO reinicia tokens, limpia pagos de prueba y restaura el plan base de ese slot.</p>
        {message && (
          <p className={`mt-2 text-xs font-semibold ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{message}</p>
        )}
      </div>
    </section>
  )
}

export function App() {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') return 'studio'
    if (params.get('preview') === 'admin') return 'admin'
    if (params.get('preview') === 'auth') return 'auth'
    return 'landing'
  }) // 'landing', 'studio', 'voice-workshop', 'pricing', 'control-panel', 'statistics', 'auth', 'admin'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [contactDone, setContactDone] = useState(false)
  const [contactError, setContactError] = useState(null)
  const [showCookies, setShowCookies] = useState(false)
  const [cookieConsent, setCookieConsent] = useState(() => {
    try {
      return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState(350000)
  const [selectedCheckoutItem, setSelectedCheckoutItem] = useState(null)
  const [paymentNotice, setPaymentNotice] = useState(null)

  // Auth state
  const [user, setUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [tokens, setTokens] = useState(100)
  const isLocalDevBypass = false // Desactivado para requerir login en local
  const canOpenStudioWithoutAuth = Boolean(user) || isLocalDevBypass

  // Currency detection state
  const [exchangeRates, setExchangeRates] = useState(null)
  const [userCurrency, setUserCurrency] = useState('USD')
  const [userCountry, setUserCountry] = useState(null)

  // Config centralizado para todas las opciones
  const [config, setConfig] = useState(() => normalizeUserConfig(loadCachedConfig('guest') || buildDefaultConfig()))
  const [configReady, setConfigReady] = useState(false)

  const isValidEmail = useCallback((value = '') => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
  }, [])

  const sendContactMessage = useCallback(async () => {
    if (contactSending) return
    const text = String(contactMessage || '').trim()
    if (text.length < 5) {
      setContactError('Escribe al menos 5 caracteres.')
      return
    }
    if (text.length > 500) {
      setContactError('El mensaje excede 500 caracteres.')
      return
    }
    const isLoggedIn = Boolean(authToken && user)
    const email = String(contactEmail || '').trim()
    if (!isLoggedIn && !isValidEmail(email)) {
      setContactError('Ingresa un correo valido para poder responderte.')
      return
    }

    setContactSending(true)
    setContactError(null)

    try {
      const endpoint = isLoggedIn ? '/api/support/message' : '/api/support/public'
      const headers = { 'Content-Type': 'application/json' }
      if (isLoggedIn) headers.Authorization = `Bearer ${authToken}`

      const body = isLoggedIn
        ? { message: text }
        : { email, message: text }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'No se pudo enviar el mensaje.')
      }

      setContactDone(true)
      setContactMessage('')
      if (!isLoggedIn) setContactEmail('')
    } catch (error) {
      setContactError(error.message || 'Error al enviar el mensaje.')
    } finally {
      setContactSending(false)
    }
  }, [API_URL, authToken, contactEmail, contactMessage, contactSending, isValidEmail, user])

  useEffect(() => {
    if (showContact) {
      setContactDone(false)
      setContactError(null)
    }
  }, [showContact])
  
  useEffect(() => {
    if (!paymentNotice) return
    const timeoutMs = paymentNotice.status === 'success'
      ? 3200
      : paymentNotice.status === 'processing'
        ? 12000
        : 7000
    const timer = setTimeout(() => setPaymentNotice(null), timeoutMs)
    return () => clearTimeout(timer)
  }, [paymentNotice])

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
    const savedToken = getStoredToken()
    const savedUser = localStorage.getItem('sv-user')
    const savedTokenApi = localStorage.getItem(TOKEN_API_KEY)
    const currentApi = getApiFingerprint()

    if (savedToken && savedTokenApi && savedTokenApi !== currentApi) {
      // Evita usar un token generado contra otro backend (local vs prod).
      clearStoredAuthToken()
      localStorage.removeItem('sv-user')
      localStorage.setItem(TOKEN_API_KEY, currentApi)
      setConfigReady(true)
      return
    }

    if (savedToken && savedUser) {
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, savedToken)
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
            reconcileMercadoPagoPayments(API_URL, savedToken)
            // Cargar config guardada del usuario
            loadAndApplyUserConfig(savedToken, data.user)
          } else {
            handleLogout()
          }
        }).catch(() => {
          setConfigReady(true)
        })
      } catch {
        clearStoredAuthToken()
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
        const ratesResponse = await fetch('https://open.er-api.com/v6/latest/USD')
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
      EUR: '\u20AC',
      GBP: '\u00A3',
      JPY: '\u00A5',
      CNY: '\u00A5',
      INR: '\u20B9',
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
    const token = getStoredToken()
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
    persistAuthToken(token)
    localStorage.setItem('sv-user', JSON.stringify(userData))
    setUser(userData)
    setAuthToken(token)
    setTokens(userData.tokens || 100)
    // Evita mostrar configuraciones heredadas mientras carga el perfil remoto
    const cleanConfig = buildDefaultConfig()
    setConfig(cleanConfig)
    setDarkMode(cleanConfig.themeMode !== 'light')
    setConfigReady(false)
    reconcileMercadoPagoPayments(API_URL, token)
    loadAndApplyUserConfig(token, userData)
    setCurrentPage('studio')
  }

  const handleAssumeTestUser = (userData, token) => {
    handleLogin(userData, token)
  }

  const handleLogout = async () => {
    const token = getStoredToken()
    const currentUser = user
    if (token && currentUser) {
      await persistConfigNow(token, latestConfigRef.current)
    }

    setUser(null)
    setAuthToken(null)
    clearStoredAuthToken()
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
            clearStoredAuthToken()
            localStorage.removeItem('sv-user')
            localStorage.removeItem(TOKEN_API_KEY)
            setUser(null)
            setAuthToken(null)
            setCurrentPage('auth')
            setConfig(buildDefaultConfig())
            setTimeout(() => {
              alert('\u26A0\uFE0F Tu sesi\u00f3n fue iniciada en otro dispositivo. Has sido desconectado.')
            }, 100)
          } else if (
            getStoredToken() &&
            (errText.includes('invalid token') || errText.includes('no token provided') || errText.includes('jwt'))
          ) {
            // Token vencido / inválido: limpiar sesión para evitar bloqueos raros.
            clearStoredAuthToken()
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
      const token = getStoredToken()
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

    const normalizedPlanName = String(plan.name || '').trim().toLowerCase()
    const planAliases = {
      start: 'base',
      creator: 'pack_lite',
      pro: 'pack_pro',
      elite: 'pack_max',
      'plan base': 'base',
      base: 'base',
      'pack lite': 'pack_lite',
      lite: 'pack_lite',
      'pack pro': 'pack_pro',
      'pack max': 'pack_max',
      max: 'pack_max',
    }
    const requestedPlanId = String(meta.planId || plan.planId || planAliases[normalizedPlanName] || '')
      .trim()
      .toLowerCase()

    const allowedPlanIds = new Set(['base', 'pack_lite', 'pack_pro', 'pack_max'])
    if (!allowedPlanIds.has(requestedPlanId)) {
      alert('Este plan todavia no esta disponible para checkout. Elige otro por ahora.')
      return
    }

    const planPrice = Number(plan.price)
    const inferredAnnualPrices = new Set([99, 249, 499])
    const inferredBillingCycle = inferredAnnualPrices.has(planPrice) ? 'annual' : 'monthly'
    const billingCycle = meta.billingCycle || inferredBillingCycle
    const recommendedPackagesByPlan = {
      base: 150000,
      pack_lite: 350000,
      pack_pro: 700000,
      pack_max: 700000,
    }
    const checkoutPriceByPlan = {
      base: 9.99,
      pack_lite: 9.99,
      pack_pro: 24.99,
      pack_max: 49.99,
    }

    setSelectedPaymentPackage(recommendedPackagesByPlan[requestedPlanId] || 350000)
    setSelectedCheckoutItem({
      type: 'plan',
      planId: requestedPlanId,
      billingCycle,
      label: `${plan.name} ${billingCycle === 'annual' ? 'Anual' : 'Mensual'}`,
      price: Number(checkoutPriceByPlan[requestedPlanId] || plan.price).toFixed(2),
    })
    setIsPaymentOpen(true)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const buyRaw = String(params.get('buy') || '').trim().toLowerCase()
    if (!buyRaw) return

    const buyToPlan = {
      base: { name: 'PLAN BASE', price: 9.99, planId: 'base' },
      pack_lite: { name: 'PACK LITE', price: 9.99, planId: 'pack_lite' },
      lite: { name: 'PACK LITE', price: 9.99, planId: 'pack_lite' },
      pack_pro: { name: 'PACK PRO', price: 24.99, planId: 'pack_pro' },
      pro: { name: 'PACK PRO', price: 24.99, planId: 'pack_pro' },
      pack_max: { name: 'PACK MAX', price: 49.99, planId: 'pack_max' },
      max: { name: 'PACK MAX', price: 49.99, planId: 'pack_max' },
    }

    const selected = buyToPlan[buyRaw]
    if (!selected) return
    setCurrentPage('landing')
    handlePlanAction(
      { name: selected.name, price: selected.price, planId: selected.planId },
      { planId: selected.planId, billingCycle: 'monthly' }
    )
    try {
      const cleanUrl = window.location.pathname + (window.location.hash || '')
      window.history.replaceState({}, document.title, cleanUrl)
    } catch {}
  }, [])

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

  // Bloquear scroll solo cuando falta consentimiento de cookies en landing.
  useEffect(() => {
    const shouldLockForCookies = !cookieConsent && currentPage === 'landing'
    if (shouldLockForCookies) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
    document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [cookieConsent, currentPage])

  // Testimonials carousel uses CSS animation (see .testimonials-track in index.css)

  useEffect(() => {
    if (false && currentPage === 'auth' && canOpenStudioWithoutAuth) { // TEMP: disabled for local preview
      setCurrentPage('studio')
    }
  }, [currentPage, canOpenStudioWithoutAuth])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus !== 'success') return

    const provider = String(params.get('provider') || '').toLowerCase()
    const paypalOrderId = params.get('token') || params.get('orderId') || ''
    const paypalAlreadyCaptured = params.get('captured') === '1'
    const callbackKey = `sv-payment-callback:${provider}:${paypalOrderId || 'na'}:${paymentStatus}`
    const token = getStoredToken()
    const isPaypalCallback = provider === 'paypal' && Boolean(paypalOrderId)
    if (!isPaypalCallback && !token) return

    const previousTokens = Number(user?.tokens || 0)
    const previousPlan = String(user?.plan || 'free').toLowerCase()

    const refreshUser = async () => {
      if (!token) return
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (data?.success) {
          setUser(data.user)
          setTokens(data.user.tokens || 100)
          localStorage.setItem('sv-user', JSON.stringify(data.user))
          return data.user
        }
      } catch (_) {}
      return null
    }

    const cleanPaymentQuery = () => {
      try {
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (_) {}
    }

    const callbackState = sessionStorage.getItem(callbackKey)
    if (callbackState === 'done') {
      localStorage.removeItem(PAYMENT_PENDING_KEY)
      cleanPaymentQuery()
      setCurrentPage('studio')
      setPaymentNotice({
        title: 'Pago acreditado',
        message: 'Tu compra se proceso correctamente. Ya estas en Studio con tus beneficios activos. Este mensaje se cerrara solo.',
        status: 'success'
      })
      return
    }
    if (callbackState === 'inflight') return
    setCurrentPage('studio')
    setPaymentNotice({
      title: 'Procesando pago...',
      message: 'Estamos acreditando tu compra en este momento.',
      status: 'processing'
    })

    ;(async () => {
      let completed = false
      sessionStorage.setItem(callbackKey, 'inflight')
      try {
        if (provider === 'paypal' && paypalAlreadyCaptured) {
          // Ya capturado por backend /api/paypal/return
        } else if (provider === 'paypal' && paypalOrderId) {
          await capturePaypalOrder(API_URL, token, paypalOrderId)
        } else {
          if (!token) throw new Error('Sesion no disponible para reconciliar el pago')
          await reconcileMercadoPagoPayments(API_URL, token)
        }
        const refreshedUser = await refreshUser()
        completed = true
        sessionStorage.setItem(callbackKey, 'done')
        localStorage.removeItem(PAYMENT_PENDING_KEY)
        setPaymentNotice({
          title: '✓ Pago Realizado',
          message: `Tu compra se procesó correctamente. Tokens actualizados: ${Number(refreshedUser?.tokens ?? previousTokens).toLocaleString()}. Ya tienes acceso a todos tus beneficios.`,
          status: 'success'
        })
      } catch (error) {
        const refreshedUser = await refreshUser()
        const refreshedTokens = Number(refreshedUser?.tokens || 0)
        const refreshedPlan = String(refreshedUser?.plan || 'free').toLowerCase()
        const paymentSeemsApplied = Boolean(
          refreshedUser && (
            refreshedTokens > previousTokens ||
            refreshedPlan !== previousPlan
          )
        )
        if (paymentSeemsApplied) {
          sessionStorage.setItem(callbackKey, 'done')
          localStorage.removeItem(PAYMENT_PENDING_KEY)
          setPaymentNotice({
            title: '✓ Pago Realizado',
            message: `Tu compra se procesó correctamente. Tokens actualizados: ${refreshedTokens.toLocaleString()}. Ya tienes acceso a todos tus beneficios.`,
            status: 'success'
          })
          return
        }
        sessionStorage.removeItem(callbackKey)
        console.error('[PAYMENT] Error completing payment callback:', error?.message || error)
        setPaymentNotice({
          title: 'No se pudo acreditar el pago',
          message: 'Hubo un problema al confirmar la compra. Intenta de nuevo en unos segundos.',
          status: 'error'
        })
      } finally {
        cleanPaymentQuery()
      }
    })()
  }, [])

  // Recuperacion de pago cuando el usuario vuelve manualmente del comprobante sin query de callback.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment')) return

    const token = getStoredToken()
    if (!token) return

    let pending = null
    try {
      pending = JSON.parse(localStorage.getItem(PAYMENT_PENDING_KEY) || 'null')
    } catch {
      pending = null
    }
    if (!pending) return

    const startedAt = Number(pending?.startedAt || 0)
    const maxAgeMs = 2 * 60 * 60 * 1000
    if (!Number.isFinite(startedAt) || (Date.now() - startedAt) > maxAgeMs) {
      localStorage.removeItem(PAYMENT_PENDING_KEY)
      return
    }

    const previousTokens = Number(user?.tokens || 0)
    const previousPlan = String(user?.plan || 'free').toLowerCase()

    const refreshUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (data?.success) {
          setUser(data.user)
          setTokens(data.user.tokens || 100)
          localStorage.setItem('sv-user', JSON.stringify(data.user))
          return data.user
        }
      } catch (_) {}
      return null
    }

    setCurrentPage('studio')
    setPaymentNotice({
      title: 'Procesando pago...',
      message: 'Estamos confirmando tu compra para actualizar plan y tokens.',
      status: 'processing'
    })

    ;(async () => {
      try {
        await reconcileMercadoPagoPayments(API_URL, token)
        const refreshedUser = await refreshUser()
        localStorage.removeItem(PAYMENT_PENDING_KEY)
        setPaymentNotice({
          title: '✓ Pago Realizado',
          message: `Tu compra se procesó correctamente. Tokens actualizados: ${Number(refreshedUser?.tokens ?? previousTokens).toLocaleString()}. Ya tienes acceso a todos tus beneficios.`,
          status: 'success'
        })
      } catch (error) {
        const refreshedUser = await refreshUser()
        const refreshedTokens = Number(refreshedUser?.tokens || 0)
        const refreshedPlan = String(refreshedUser?.plan || 'free').toLowerCase()
        const paymentSeemsApplied = Boolean(
          refreshedUser && (
            refreshedTokens > previousTokens ||
            refreshedPlan !== previousPlan
          )
        )
        if (paymentSeemsApplied) {
          localStorage.removeItem(PAYMENT_PENDING_KEY)
          setPaymentNotice({
            title: '✓ Pago Realizado',
            message: `Tu compra se procesó correctamente. Tokens actualizados: ${refreshedTokens.toLocaleString()}. Ya tienes acceso a todos tus beneficios.`,
            status: 'success'
          })
          return
        }
        console.error('[PAYMENT] pending reconcile error:', error?.message || error)
        setPaymentNotice({
          title: 'No se pudo acreditar el pago',
          message: 'No pudimos confirmar tu compra automaticamente. Reintenta en unos segundos.',
          status: 'error'
        })
      }
    })()
  }, [])
  const paymentNoticeBanner = paymentNotice ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div className={`relative w-[min(94vw,760px)] rounded-3xl border shadow-2xl ${
        darkMode
          ? 'bg-[#0d1630] border-cyan-400/50 text-white'
          : 'bg-white border-cyan-300 text-slate-900'
      }`}>
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
          <div className={`mt-0.5 w-11 h-11 rounded-full flex items-center justify-center ${
            paymentNotice.status === 'processing'
              ? 'bg-cyan-500/20 text-cyan-300'
              : paymentNotice.status === 'error'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-emerald-500/20 text-emerald-400'
          }`}>
              {paymentNotice.status === 'processing'
                ? <Loader2 className="w-6 h-6 animate-spin" />
                : <Check className="w-6 h-6" />
              }
          </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-2xl md:text-3xl leading-tight">{paymentNotice.title}</p>
              <p className={`text-sm md:text-lg mt-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {paymentNotice.message}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              onClick={() => {
                setCurrentPage('studio')
                setPaymentNotice(null)
              }}
              className="px-5 py-2.5 text-sm md:text-base font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition"
            >
              Ir a Studio
            </button>
            <button
              onClick={() => setPaymentNotice(null)}
              className={`px-4 py-2.5 text-sm md:text-base rounded-xl font-bold transition ${
                darkMode ? 'text-slate-200 bg-white/10 hover:bg-white/20' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null
  // Auth Page - también accesible por ?preview=auth en local
  if (currentPage === 'auth' || window.location.search.includes('preview=auth')) {
    return (
      <>
        {paymentNoticeBanner}
        <Suspense fallback={LAZY_FALLBACK}>
          <AuthPage onLogin={handleLogin} onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} />
        </Suspense>
      </>
    )
  }

  // Pricing Page
  if (currentPage === 'pricing') {
    return (
      <>
        {paymentNoticeBanner}
        <Suspense fallback={LAZY_FALLBACK}>
          <PricingPage onGoHome={() => setCurrentPage('landing')} darkMode={darkMode} onPlanAction={handlePlanAction} />
          <StripePayment
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            initialPackageTokens={selectedPaymentPackage}
            initialCheckoutItem={selectedCheckoutItem}
          />
        </Suspense>
      </>
    )
  }

  // AI Roleplay Workshop
  if (currentPage === 'ai-roleplay') {
    return (
      <>
        {paymentNoticeBanner}
        <Suspense fallback={LAZY_FALLBACK}>
          <AIRoleplayWorkshop
            onClose={() => setCurrentPage('control-panel')}
            darkMode={darkMode}
            user={user}
            config={config}
            updateConfig={updateConfig}
          />
        </Suspense>
      </>
    )
  }

  // Auto-process pending payments when entering studio
  useEffect(() => {
    if (currentPage !== 'studio') return
    const token = getStoredToken()
    if (!token) return
    let pending = null
    try {
      pending = JSON.parse(localStorage.getItem(PAYMENT_PENDING_KEY) || 'null')
    } catch { }
    if (!pending) return
    const startedAt = Number(pending?.startedAt || 0)
    const maxAgeMs = 2 * 60 * 60 * 1000
    if (!Number.isFinite(startedAt) || (Date.now() - startedAt) > maxAgeMs) {
      localStorage.removeItem(PAYMENT_PENDING_KEY)
      return
    }
    setPaymentNotice({
      title: 'Procesando pago...',
      message: 'Completando tu compra...',
      status: 'processing'
    })
    ;(async () => {
      try {
        await reconcileMercadoPagoPayments(API_URL, token)
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (data?.success) {
          setUser(data.user)
          setTokens(data.user.tokens || 100)
          localStorage.setItem('sv-user', JSON.stringify(data.user))
        }
        localStorage.removeItem(PAYMENT_PENDING_KEY)
        setPaymentNotice({
          title: '✓ Pago Realizado',
          message: `Tu compra se procesó correctamente. Tokens actualizados: ${data.user?.tokens || tokens}. Ya tienes acceso a todos tus beneficios.`,
          status: 'success'
        })
      } catch (error) {
        console.error('[PAYMENT] auto-process error:', error?.message || error)
        setPaymentNotice({
          title: 'No se pudo acreditar el pago',
          message: 'Intenta recargar la página en unos segundos.',
          status: 'error'
        })
      }
    })()
  }, [currentPage])

  // Studio + Voice Workshop + paneles secundarios: todos en el mismo bloque con display:none/block
  // para que SynthesisStudio nunca se desmonte (manteniendo el WebSocket de TikTok vivo al navegar a voice-workshop)
  if (['studio', 'control-panel', 'statistics', 'admin', 'voice-workshop'].includes(currentPage)) {
    return (
      <>
        {paymentNoticeBanner}
        <Suspense fallback={LAZY_FALLBACK}>
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
        </Suspense>
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
                  {t('landing.backToStudio')}
                </button>
              </div>
            </nav>

            {/* Voice Cloning Content */}
            <div className="pt-32 pb-20 px-4">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl font-black mb-4">
                  {t('landing.voiceWorkshop.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{t('landing.voiceWorkshop.titleHighlight')}</span>
                </h2>
                <p className={`text-lg mb-12 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('landing.voiceWorkshop.subtitle')}
                </p>
                <Suspense fallback={LAZY_FALLBACK}>
                  <VoiceWorkshopPanel onCloneSuccess={() => {/* Success message shown in panel, no reload */}} darkModeOverride={darkMode} config={config} updateConfig={updateConfig} user={user} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const benefits = t('landing.benefits', { returnObjects: true })

  const additionalPackages = t('landing.packages.items', { returnObjects: true })
  const howItWorks = t('landing.howItWorks', { returnObjects: true })
  const faqItems = t('landing.faq.items', { returnObjects: true })
  const advancedGuide = t('landing.advancedGuide', { returnObjects: true })

  return (
    <div className={"min-h-screen overflow-hidden transition-colors duration-300 " + (darkMode ? "bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white" : "bg-gradient-to-b from-[#eceff3] via-[#f7f8fa] to-[#e8ecf1] text-gray-900") + ""}>
      {paymentNoticeBanner}
      {/* Botones Esquina Superior */}
      <div className={`fixed top-4 left-4 z-40 flex items-stretch rounded-xl border overflow-hidden h-11 ${darkMode ? 'border-white/10' : 'border-slate-300 shadow-sm'}`}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? t('common.lightMode') : t('common.darkMode')}
          className={`flex items-center justify-center px-4 border-r transition-all ${darkMode ? 'border-white/10 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 bg-white hover:bg-slate-100'}`}
        >
          {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
        <button
          onClick={() => canOpenStudioWithoutAuth ? setCurrentPage('studio') : setCurrentPage('auth')}
          className={`flex items-center px-5 text-sm font-bold transition-all ${user?.role === 'admin' ? 'border-r' : ''} ${darkMode ? 'border-white/10 bg-slate-800 text-cyan-300 hover:bg-slate-700' : 'border-slate-300 bg-white text-cyan-700 hover:bg-slate-100'}`}
        >
          Studio
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => setCurrentPage('admin')}
            title="Panel Admin"
            className={`flex items-center justify-center px-4 transition-all ${darkMode ? 'bg-red-900/40 hover:bg-red-900/60 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
          >
            <Shield className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="fixed top-4 right-4 z-40">
        {user ? (
          <div className={`flex items-stretch rounded-xl border overflow-hidden h-11 ${darkMode ? 'border-white/10' : 'border-slate-300 shadow-sm'}`}>
            <span className={`flex items-center px-4 border-r text-sm font-medium ${darkMode ? 'border-white/10 bg-slate-800 text-slate-300' : 'border-slate-300 bg-white text-slate-600'}`}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              title={t('common.logout')}
              className={`flex items-center justify-center px-4 transition-all ${darkMode ? 'bg-slate-800 hover:bg-red-900/40 text-red-400' : 'bg-white hover:bg-red-50 text-red-500'}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => canOpenStudioWithoutAuth ? setCurrentPage('studio') : setCurrentPage('auth')}
            className={`h-11 px-5 rounded-xl border text-sm font-bold transition-all ${darkMode ? 'border-white/10 bg-slate-800 text-white hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'}`}
          >
            {canOpenStudioWithoutAuth ? t('landing.enterStudio') : t('auth.login.title')}
          </button>
        )}
      </div>


      {/* Hero Section */}
      <section className="pt-4 pb-14 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-[420px] h-[420px] bg-gradient-to-b from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          <div className="mb-2 md:mb-3 flex justify-center">
            <img
              src="/images/streamvoicer6.png"
              alt="StreamVoicer - Lector de chat para TikTok Live con voz IA"
              fetchPriority="high"
              decoding="async"
              className="w-full max-w-4xl h-auto object-contain opacity-90"
            />
          </div>

          <h1 className="relative -top-8 md:-top-10 text-5xl md:text-7xl font-black mb-8 md:mb-10 leading-tight">
            {t('landing.hero.title')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-orange-400">
              {t('landing.hero.titleHighlight')}
            </span>
          </h1>

          <p className={"text-xl md:text-2xl mb-8 max-w-2xl mx-auto " + (darkMode ? "text-gray-300" : "text-gray-600")}>
              {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {t('landing.hero.tags', { returnObjects: true }).map((tag) => (
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
                {t('landing.hero.viewPlans')}
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400 animate-ping pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      <PublicTestResetCard darkMode={darkMode} onAssumeUser={handleAssumeTestUser} />

      {/* Success Cases Section */}
      <section id="como-funciona-section" className={`py-20 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className={`text-4xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('landing.successCases.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{t('landing.successCases.titleHighlight')}</span>
            </h3>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('landing.successCases.subtitle')}
            </p>
          </div>

          {/* Success Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t('landing.successCases.items', { returnObjects: true }).map((caseItem, idx) => (
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

          <div className="mt-14 md:mt-20 mb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
              {t('landing.metrics', { returnObjects: true }).map((item) => (
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
      <section className={`pt-10 pb-20 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className={`text-4xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('landing.testimonials.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{t('landing.testimonials.titleHighlight')}</span>
            </h3>
          </div>

          {/* Horizontal Scroll Testimonials - CSS infinite animation */}
          <div className="overflow-x-hidden pb-4 -mx-4 px-4">
            <div className="testimonials-track flex gap-6 w-max">
              {/* Cards duplicated for seamless infinite loop (CSS translateX -50%) */}
              {[...Array(2)].flatMap((_, copy) =>
                t('landing.testimonials.items', { returnObjects: true }).map((testimonial, idx) => (
                  <div
                    key={`${copy}-${idx}`}
                    aria-hidden={copy === 1}
                    className={`flex-shrink-0 w-80 p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.stars)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-lg">{'\u2B50'}</span>
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
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="pt-12 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-4xl font-black mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{t('landing.pricing.title')}</span>
            </h3>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t('landing.pricing.subtitle')}</p>
          </div>
          <PricingCards darkMode={darkMode} showToggle={true} onPlanAction={handlePlanAction} />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="pt-10 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{t('landing.faq.title')}</span>
            </h3>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t('landing.faq.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqItems.map((faq, idx) => (
              <article
                key={idx}
                className={`group relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 ${
                  darkMode
                    ? 'bg-gradient-to-br from-[#0d1428] via-[#101a31] to-[#0b1325] border-cyan-400/25 hover:border-cyan-300/50 hover:shadow-[0_12px_35px_rgba(34,211,238,0.18)]'
                    : 'bg-gradient-to-br from-white via-cyan-50/45 to-indigo-50/45 border-cyan-200 hover:border-cyan-400 hover:shadow-[0_12px_30px_rgba(6,182,212,0.16)]'
                }`}
              >
                <span className={`absolute left-0 top-0 h-full w-1.5 ${
                  darkMode ? 'bg-gradient-to-b from-cyan-300 to-blue-500' : 'bg-gradient-to-b from-cyan-400 to-blue-500'
                }`} />
                <div className="flex items-start gap-3">
                  <span className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-[11px] font-black tracking-wide ${
                    darkMode ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-300/30' : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <h4 className={`text-lg font-extrabold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {faq.q}
                  </h4>
                </div>
                <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {faq.a}
                </p>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`rounded-2xl p-12 ${darkMode ? 'bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30' : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'}`}>
            <h3 className={`text-4xl font-black mb-6 ${darkMode ? 'text-white' : 'text-white'}`}>
              {t('landing.cta.title')}
            </h3>
            <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-slate-200'}`}>
              {t('landing.cta.subtitle')}
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
                {t('landing.cta.btn')} <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-8 py-4 border-2 rounded-lg font-bold text-lg transition-all inline-flex items-center gap-2 ${
                  darkMode
                    ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                    : 'border-slate-200 text-white hover:bg-white/10'
                }`}
              >
                {t('landing.hero.viewPlans')}
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
              <p className="text-sm text-gray-400">{'La mejor soluci\u00f3n para leer chats en vivo'}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => setShowTerms(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">{t('landing.footer.terms')}</button></li>
                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">{t('landing.footer.privacy')}</button></li>
                <li><button onClick={() => setShowCookies(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">Cookies</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => setShowContact(true)} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">{t('landing.footer.contact')}</button></li>
                <li><button onClick={() => window.location.assign('/precios/')} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">Precios</button></li>
                <li><button onClick={() => window.location.assign('/faq/')} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">FAQ</button></li>
                <li><button onClick={() => window.location.assign('/como-funciona/')} className="hover:text-cyan-400 transition cursor-pointer bg-none border-none p-0">Cómo funciona</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>{t('landing.footer.rights')}</p>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      <Suspense fallback={null}>
        <StripePayment
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          initialPackageTokens={selectedPaymentPackage}
          initialCheckoutItem={selectedCheckoutItem}
        />
      </Suspense>

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
                <p><strong>Última actualización:</strong> 19 de abril de 2026</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>1. Aceptación</h3>
                <p>Al crear una cuenta o usar Stream Voicer, aceptas estos términos y nuestra política de privacidad. Si no estás de acuerdo, no utilices el servicio.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>2. Descripción del servicio</h3>
                <p>Stream Voicer es una plataforma de voz para creadores y streamers. Ofrece lectura de mensajes en vivo, voces TTS, funciones con IA y herramientas de configuración para contenido en directo.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>3. Uso permitido</h3>
                <p>Debes usar la plataforma de forma legal, ética y respetuosa. Queda prohibido:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Generar o difundir contenido ilegal, ofensivo o discriminatorio</li>
                  <li>Intentar acceder sin autorización a cuentas, sistemas o datos</li>
                  <li>Spam o abuso del servicio</li>
                  <li>Infringir derechos de terceros (propiedad intelectual, imagen, privacidad)</li>
                </ul>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>4. Cuenta y seguridad</h3>
                <p>Eres responsable de mantener la confidencialidad de tu cuenta y credenciales. También eres responsable de la actividad realizada desde tu cuenta.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>5. Suscripciones, pagos y tokens</h3>
                <p>Los cambios de plan, renovaciones y cancelaciones se procesan según la configuración de tu cuenta y tu ciclo de facturación. Puedes cancelar cuando quieras y conservarás acceso hasta el cierre del periodo vigente.</p>
                <p className="mt-2"><strong>Paquetes de tokens:</strong> Los tokens son bienes digitales de consumo inmediato dentro de la plataforma. Una vez acreditados, no son reembolsables salvo obligación legal aplicable o error de cobro verificable.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>6. Disponibilidad y límites</h3>
                <p>Nos esforzamos por mantener el servicio disponible, pero puede haber interrupciones, mantenimiento o cambios técnicos. El servicio se ofrece "tal cual", sin garantía de disponibilidad ininterrumpida.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>7. Terminación o suspensión</h3>
                <p>Podemos suspender o finalizar cuentas que incumplan estos términos, representen riesgo de seguridad o hagan uso fraudulento de la plataforma.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>8. Cambios en estos términos</h3>
                <p>Podemos actualizar estos términos para reflejar mejoras del producto, cambios legales o ajustes operativos. Si los cambios son relevantes, te avisaremos por medios razonables.</p>
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
                <p><strong>Última actualización:</strong> 19 de abril de 2026</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>1. Información que recopilamos</h3>
                <p>Recopilamos datos que proporcionas al registrarte o usar la plataforma, como nombre, correo, plan, consumo de tokens y preferencias de configuración.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>2. Cómo usamos tu información</h3>
                <p>Usamos tus datos para:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Prestar y mejorar las funciones de voz, IA y configuración</li>
                  <li>Administrar pagos, suscripciones y saldo de tokens</li>
                  <li>Enviar avisos operativos, de seguridad o facturación</li>
                  <li>Prevenir fraude, abuso y accesos no autorizados</li>
                </ul>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>3. Base legal y conservación</h3>
                <p>Tratamos tus datos para ejecutar el servicio, cumplir obligaciones legales y proteger intereses legítimos de seguridad y operación. Conservamos la información el tiempo necesario para estos fines.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>4. Compartición con terceros</h3>
                <p>Podemos compartir datos con proveedores que nos ayudan a operar la plataforma (por ejemplo, autenticación, pagos, hosting, analítica o servicios de voz/IA), bajo medidas contractuales y de seguridad razonables.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>5. Cookies y tecnologías similares</h3>
                <p>{t('cookies.shortText')}</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>6. Seguridad de datos</h3>
                <p>Aplicamos medidas técnicas y organizativas razonables para proteger tu información. Ningún sistema es infalible, pero trabajamos para reducir riesgos de acceso indebido o pérdida de datos.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>7. Derechos del usuario</h3>
                <p>Puedes solicitar acceso, corrección, actualización o eliminación de tus datos personales, así como retirar tu consentimiento cuando aplique. Para ejercer tus derechos, escríbenos al correo de soporte.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>8. Cambios en esta política</h3>
                <p>Podemos actualizar esta política para reflejar cambios del servicio o requisitos legales. Publicaremos la versión vigente en esta misma sección.</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>9. Contacto</h3>
                <p>Para consultas sobre privacidad, contáctanos en: soporte@streamvoicer.com</p>
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
              <p>{t('tiktok.support.placeholder')}</p>
              {!user && (
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Correo de contacto
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className={`mt-1 w-full px-3 py-2 rounded-lg text-sm ${
                      darkMode
                        ? 'bg-[#0b1327] border border-cyan-400/30 text-white placeholder:text-gray-500 focus:border-cyan-300'
                        : 'bg-white border border-cyan-300 text-gray-900 placeholder:text-gray-400'
                    } outline-none`}
                  />
                </div>
              )}

              {contactDone ? (
                <div className={`text-center py-4 rounded-xl ${darkMode ? 'bg-green-500/10 border border-green-400/30' : 'bg-green-50 border border-green-300'}`}>
                  <p className={`font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Mensaje enviado correctamente.</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Te responderemos en 24-48 hrs.</p>
                </div>
              ) : (
                <div>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value.slice(0, 500))}
                    rows={5}
                    maxLength={500}
                    placeholder={t('tiktok.support.placeholder')}
                    className={`w-full rounded-xl px-3 py-2 text-sm resize-none outline-none ${
                      darkMode
                        ? 'bg-[#0b1327] border border-cyan-400/30 text-white placeholder:text-gray-500 focus:border-cyan-300'
                        : 'bg-white border border-cyan-300 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`text-xs ${contactMessage.length >= 450 ? 'text-orange-400' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('tiktok.support.charCount', { count: contactMessage.length })}
                    </span>
                    {contactError && <span className="text-xs text-red-400">{contactError}</span>}
                  </div>
                  <button
                    onClick={sendContactMessage}
                    disabled={!contactMessage.trim() || contactSending}
                    className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90 disabled:opacity-50"
                  >
                    {contactSending ? t('tiktok.support.sending') : t('tiktok.support.submit')}
                  </button>
                </div>
              )}
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
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{t('cookies.whatAre')}</h3>
                <p>{t('cookies.whatAreText')}</p>
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
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{'\u00bfC\u00f3mo Usamos las Cookies?'}</h3>
                <p>{t('cookies.weUse')}</p>
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
                <p>{t('cookies.control')}</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Cookies de Terceros</h3>
                <p>{t('cookies.thirdParty')}</p>
              </section>
              <section>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Cambios en la Política</h3>
                <p>Nos reservamos el derecho de actualizar esta política en cualquier momento. Te notificaremos de cambios significativos.</p>
              </section>
            </div>

            {/* Footer con botón */}
            <div className={`p-8 border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <button onClick={() => setShowCookies(false)} className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-400/50 transition-all">
                {'\u2705 Cerrar'}
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
                  <h3 className={`text-lg font-bold tracking-wide mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {'\u{1F36A} '} {t('cookies.title')}
                  </h3>
                  <p className={`text-sm mb-3 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('cookies.text')}
                  </p>
                  <button
                    onClick={() => setShowCookies(true)}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium underline underline-offset-2"
                  >
                    {t('cookies.details')}
                  </button>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    onClick={() => {
                      setCookieConsent(true)
                      localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
                    }}
                    className="px-7 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold text-sm rounded-lg hover:opacity-90 hover:shadow-lg hover:shadow-cyan-400/40 transition-all whitespace-nowrap"
                  >
                    {t('cookies.acceptAll')}
                  </button>
                  <button
                    onClick={() => {
                      setCookieConsent(true)
                      localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
                    }}
                    className={`px-7 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all border ${
                      darkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
                    }`}
                  >
                    {t('cookies.reject')}
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















