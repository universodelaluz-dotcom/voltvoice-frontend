import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Check, Loader2, Lock, Youtube } from 'lucide-react'

const SynthesisStudio = lazy(() => import('../components/SynthesisStudio').then((m) => ({ default: m.SynthesisStudio })))
const YouTubeControlPanel = lazy(() => import('../components/YouTubeControlPanel').then((m) => ({ default: m.YouTubeControlPanel })))
const StatisticsDashboard = lazy(() => import('../components/StatisticsDashboard').then((m) => ({ default: m.StatisticsDashboard })))
const VoiceWorkshopPanel = lazy(() => import('../components/VoiceCloningPanel'))
const AIRoleplayWorkshop = lazy(() => import('../components/AIRoleplayWorkshop'))
const PricingPage = lazy(() => import('../components/PricingPage').then((m) => ({ default: m.PricingPage })))
const StripePayment = lazy(() => import('../components/StripePayment').then((m) => ({ default: m.StripePayment })))

const TOKEN_STORAGE_KEY = 'sv-token'
const TOKEN_PERSIST_KEY = 'sv-token-persist'
const YT_CONFIG_CACHE_KEY_PREFIX = 'sv-yt-config-v1'
const LAZY_FALLBACK = (
  <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
    Cargando...
  </div>
)

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
  minNewMessagesBeforeResponse: 0,
  minTimeBetweenResponsesMs: 0,
  botAutoInteractEnabled: false,
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

const getConfigCacheKey = (userIdentifier = 'guest') => `${YT_CONFIG_CACHE_KEY_PREFIX}:${String(userIdentifier || 'guest')}`
const loadCachedConfig = (userIdentifier = 'guest') => {
  try {
    const raw = localStorage.getItem(getConfigCacheKey(userIdentifier))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
const saveCachedConfig = (config, userIdentifier = 'guest') => {
  try {
    localStorage.setItem(getConfigCacheKey(userIdentifier), JSON.stringify(config))
  } catch (_) {}
}

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('sv-user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
const getStoredToken = () => sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_PERSIST_KEY) || ''

export function YouTubeStudioApp() {
  const [currentPage, setCurrentPage] = useState('studio')
  const [user, setUser] = useState(() => getStoredUser())
  const [authToken, setAuthToken] = useState(() => getStoredToken())
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')
  const userIdentifier = String(user?.id || user?.email || 'guest')
  const [config, setConfig] = useState(() => loadCachedConfig(userIdentifier) || { ...DEFAULT_CONFIG })
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedPaymentPackage, setSelectedPaymentPackage] = useState(350000)
  const [selectedCheckoutItem, setSelectedCheckoutItem] = useState(null)
  const [paymentNotice, setPaymentNotice] = useState(null)
  const isLocalDevHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const isAdminPreview = (() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return String(params.get('preview') || '').toLowerCase() === 'admin'
  })()
  const effectiveUser = isAdminPreview
    ? {
        ...(user || {}),
        role: 'admin',
        is_admin: true,
        plan: String(user?.plan || 'admin').toLowerCase() === 'free' ? 'admin' : (user?.plan || 'admin'),
        subscription: {
          ...(user?.subscription || {}),
          backendPlan: 'admin',
          plan: 'admin',
        },
      }
    : user

  const refreshUser = useCallback(async (token) => {
    if (!token) return null
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success || !data?.user) return null
      localStorage.setItem('sv-user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const nextToken = getStoredToken()
    setAuthToken(nextToken)
    setUser(getStoredUser())
  }, [])

  useEffect(() => {
    if (!authToken) return
    refreshUser(authToken)
  }, [authToken, refreshUser])

  useEffect(() => {
    document.title = 'YouTube Chat Studio | StreamVoicer'
  }, [])

  useEffect(() => {
    const next = loadCachedConfig(userIdentifier) || { ...DEFAULT_CONFIG }
    setConfig(next)
  }, [userIdentifier])

  useEffect(() => {
    saveCachedConfig(config, userIdentifier)
  }, [config, userIdentifier])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('voltvoice-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('voltvoice-theme', 'light')
    }
  }, [darkMode])

  const updateConfig = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value, configUpdatedAt: Date.now() }))
  }, [])

  const handlePlanAction = useCallback((plan, meta = {}) => {
    if (!plan) return
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
    const requestedPlanId = String(meta.planId || plan.planId || planAliases[normalizedPlanName] || '').trim().toLowerCase()
    const allowedPlanIds = new Set(['base', 'pack_lite', 'pack_pro', 'pack_max', 'pack_lite_combo', 'pack_pro_combo', 'pack_max_combo'])
    if (!allowedPlanIds.has(requestedPlanId)) {
      alert('Este plan todavia no esta disponible para checkout. Elige otro por ahora.')
      return
    }

    const planPrice = Number(plan.price)
    const inferredAnnualPrices = new Set([99, 99.9, 199.8, 349.8, 599.8])
    const billingCycle = meta.billingCycle || (inferredAnnualPrices.has(planPrice) ? 'annual' : 'monthly')
    const recommendedPackagesByPlan = {
      base: 150000,
      pack_lite: 350000,
      pack_pro: 700000,
      pack_max: 700000,
      pack_lite_combo: 350000,
      pack_pro_combo: 700000,
      pack_max_combo: 700000,
    }
    const checkoutPriceByPlan = {
      monthly: {
        base: 9.99,
        pack_lite: 9.99,
        pack_pro: 24.99,
        pack_max: 49.99,
        pack_lite_combo: 19.98,
        pack_pro_combo: 34.98,
        pack_max_combo: 59.98,
      },
      annual: {
        base: 99.90,
        pack_lite: 199.80,
        pack_pro: 349.80,
        pack_max: 599.80,
      }
    }

    setSelectedPaymentPackage(recommendedPackagesByPlan[requestedPlanId] || 350000)
    setSelectedCheckoutItem({
      type: 'plan',
      planId: requestedPlanId,
      billingCycle,
      label: `${plan.name} ${billingCycle === 'annual' ? 'Anual' : 'Mensual'}`,
      price: Number(checkoutPriceByPlan[billingCycle]?.[requestedPlanId] || plan.price).toFixed(2),
    })
    setIsPaymentOpen(true)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = String(params.get('payment') || '').toLowerCase()
    if (!payment) return

    const provider = String(params.get('provider') || '').toLowerCase()
    const token = getStoredToken()
    setCurrentPage('studio')

    const cleanQuery = () => {
      try {
        window.history.replaceState({}, document.title, '/youtube/')
      } catch (_) {}
    }

    ;(async () => {
      if (payment === 'success') {
        setPaymentNotice({ status: 'processing', title: 'Procesando pago...', message: 'Estamos sincronizando tus tokens y beneficios.' })
        if (provider === 'mercadopago' && token) {
          await fetch(`${API_URL}/api/mercadopago/reconcile`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {})
        }
        if (token) await refreshUser(token)
        setPaymentNotice({ status: 'success', title: 'Pago confirmado', message: 'Tu compra se acreditó correctamente en este Studio.' })
        cleanQuery()
        return
      }

      if (payment === 'failure' || payment === 'failed' || payment === 'cancelled' || payment === 'error' || payment === 'pending') {
        setPaymentNotice({ status: 'error', title: 'Pago no completado', message: 'No se pudo confirmar el pago. Intenta de nuevo.' })
        cleanQuery()
      }
    })()
  }, [refreshUser])

  const loggedIn = Boolean(authToken && effectiveUser)
  const shellBg = darkMode
    ? 'min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white'
    : 'min-h-screen bg-gradient-to-b from-[#eceff3] via-[#f7f8fa] to-[#e8ecf1] text-gray-900'

  const header = (
    <header className={`sticky top-0 z-50 border-b ${darkMode ? 'border-cyan-500/20 bg-[#0f0f23]/85 backdrop-blur-md' : 'border-slate-200 bg-white/90 backdrop-blur-md'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <button
          onClick={() => {
            if (currentPage !== 'studio') {
              setCurrentPage('studio')
              return
            }
            window.location.assign('/')
          }}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${
            darkMode ? 'border-white/10 text-slate-200 hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {currentPage !== 'studio' ? 'Volver al Studio' : 'Volver al inicio'}
        </button>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
          darkMode ? 'bg-red-500/15 text-red-300 border border-red-400/30' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <Youtube className="w-4 h-4" />
          YOUTUBE CHAT STUDIO
        </div>
      </div>
    </header>
  )

  const paymentNoticeBanner = paymentNotice ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div className={`relative w-[min(94vw,640px)] rounded-3xl border shadow-2xl ${darkMode ? 'bg-[#0d1630] border-cyan-400/50 text-white' : 'bg-white border-cyan-300 text-slate-900'}`}>
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className={`mt-0.5 w-11 h-11 rounded-full flex items-center justify-center ${paymentNotice.status === 'processing' ? 'bg-cyan-500/20 text-cyan-300' : paymentNotice.status === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {paymentNotice.status === 'processing' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-2xl md:text-3xl leading-tight">{paymentNotice.title}</p>
              <p className={`text-sm md:text-lg mt-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{paymentNotice.message}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={() => setPaymentNotice(null)} className={`px-4 py-2.5 text-sm md:text-base rounded-xl font-bold transition ${darkMode ? 'text-slate-200 bg-white/10 hover:bg-white/20' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  if (!loggedIn) {
    return (
      <div className={shellBg}>
        {header}
        <main className="mx-auto max-w-xl px-4 py-10">
          <div className={`rounded-2xl border p-6 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-amber-500">
              <Lock className="w-4 h-4" />
              Inicia sesión primero
            </div>
            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Este Studio de YouTube requiere tu sesión activa para cargar voces, tokens y paneles.
            </p>
            <button
              onClick={() => window.location.assign('/')}
              className="mt-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-black text-white"
            >
              Ir al inicio
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (currentPage === 'pricing') {
    return (
      <div className={shellBg}>
        {header}
        {paymentNoticeBanner}
        <Suspense fallback={LAZY_FALLBACK}>
          <PricingPage onGoHome={() => setCurrentPage('studio')} darkMode={darkMode} onPlanAction={handlePlanAction} />
          <StripePayment
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            initialPackageTokens={selectedPaymentPackage}
            initialCheckoutItem={selectedCheckoutItem}
            returnPath="/youtube/"
          />
        </Suspense>
      </div>
    )
  }

  return (
    <div className={shellBg}>
      {header}
      {paymentNoticeBanner}
      <Suspense fallback={LAZY_FALLBACK}>
        <div style={{ display: currentPage === 'studio' ? 'block' : 'none' }}>
          <SynthesisStudio
            onGoHome={() => window.location.assign('/')}
            onGoVoiceCloning={() => setCurrentPage('voice-workshop')}
            onGoControlPanel={() => setCurrentPage('control-panel')}
            onGoStatistics={() => setCurrentPage('statistics')}
            onGoAdmin={undefined}
            onGoPricingPage={() => setCurrentPage('pricing')}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            config={config}
            updateConfig={updateConfig}
            configReady={true}
            user={effectiveUser}
            platformMode="youtube"
          />
        </div>
        <div style={{ display: currentPage === 'control-panel' ? 'block' : 'none' }}>
          <YouTubeControlPanel
            onClose={() => setCurrentPage('studio')}
            onGoAIRoleplay={() => setCurrentPage('ai-roleplay')}
            onGoSynthesis={() => setCurrentPage('studio')}
            darkMode={darkMode}
            config={config}
            updateConfig={updateConfig}
            user={effectiveUser}
            forceUnrestricted={isLocalDevHost}
          />
        </div>
        <div style={{ display: currentPage === 'statistics' ? 'block' : 'none' }}>
          <StatisticsDashboard
            onGoHome={() => window.location.assign('/')}
            onGoStudio={() => setCurrentPage('studio')}
            darkMode={darkMode}
            user={effectiveUser}
            authToken={authToken}
          />
        </div>
        <div style={{ display: currentPage === 'ai-roleplay' ? 'block' : 'none' }}>
          <AIRoleplayWorkshop darkMode={darkMode} user={effectiveUser} />
        </div>
      </Suspense>
      <div style={{ display: currentPage === 'voice-workshop' ? 'block' : 'none' }}>
        <VoiceWorkshopPanel
          onCloneSuccess={() => setCurrentPage('studio')}
          darkModeOverride={darkMode}
          config={config}
          updateConfig={updateConfig}
          user={effectiveUser}
          forceUnrestricted={isLocalDevHost}
        />
      </div>
    </div>
  )
}
