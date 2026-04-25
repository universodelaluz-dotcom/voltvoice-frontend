import { useState, useEffect, useCallback } from 'react'
import { X, Zap, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
const TOKEN_STORAGE_KEY = 'sv-token'
const TOKEN_PERSIST_KEY = 'sv-token-persist'
const PAYMENT_PENDING_KEY = 'sv-payment-pending-v1'
const FREE_PLANS = new Set(['free', 'on_demand'])
const getFrontendOrigin = () => {
  if (typeof window === 'undefined') return ''
  return String(window.location.origin || '').trim()
}
const getFrontendReturnUrl = () => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/`
}

const tokenPackages = [
  { tokens: 150000, price: 4.99, label: '150K', size: 'MINI BOOST' },
  { tokens: 350000, price: 9.99, label: '350K', size: 'POWER BOOST', popular: true },
  { tokens: 700000, price: 14.99, label: '700K', size: 'MAX BOOST' },
]

const LEGACY_PLAN_FALLBACKS = {
  base: ['start'],
  pack_lite: ['creator'],
  pack_pro: ['pro'],
  pack_max: [],
}
const MONTHLY_PACK_PLAN_IDS = new Set(['pack_lite', 'pack_pro', 'pack_max'])

const PLAN_PRICE_BY_CYCLE = {
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

const PLAN_LABEL_BY_CYCLE = {
  monthly: {
    base: 'PLAN BASE',
    pack_lite: 'PACK LITE',
    pack_pro: 'PACK PRO',
    pack_max: 'PACK MAX',
    pack_lite_combo: 'BASE + LITE',
    pack_pro_combo: 'BASE + PRO',
    pack_max_combo: 'BASE + MAX',
  },
  annual: {
    base: 'PLAN BASE',
    pack_lite: 'BASE + LITE',
    pack_pro: 'BASE + PRO',
    pack_max: 'BASE + MAX',
  }
}

const normalizeBillingCycle = (value) => String(value || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly'
const normalizePlanIdForCycle = (planId, billingCycle) => {
  const normalized = String(planId || 'base').toLowerCase().trim()
  if (!normalized) return 'base'
  if (billingCycle === 'annual') return normalized.replace(/_combo$/i, '')
  return normalized
}
const buildPlanCheckoutItem = ({ planId, billingCycle }) => {
  const cycle = normalizeBillingCycle(billingCycle)
  const normalizedPlanId = normalizePlanIdForCycle(planId, cycle)
  const price = Number(PLAN_PRICE_BY_CYCLE[cycle]?.[normalizedPlanId] || 0)
  const planLabel = PLAN_LABEL_BY_CYCLE[cycle]?.[normalizedPlanId] || String(normalizedPlanId || 'base').toUpperCase()
  const cycleLabel = cycle === 'annual' ? 'Anual' : 'Mensual'
  return {
    type: 'plan',
    planId: normalizedPlanId,
    billingCycle: cycle,
    label: `${planLabel} ${cycleLabel}`,
    price: price.toFixed(2),
  }
}

export function StripePayment({ isOpen, onClose, initialPackageTokens = null, initialCheckoutItem = null }) {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')
  const [selectedPackage, setSelectedPackage] = useState(tokenPackages[1])
  const [checkoutItem, setCheckoutItem] = useState(() => initialCheckoutItem || { type: 'tokens', package: tokenPackages[1] })
  const [couponCode, setCouponCode] = useState('')
  const [couponValidation, setCouponValidation] = useState(null) // { valid, message, discount, finalAmount, coupon }
  const [couponLoading, setCouponLoading] = useState(false)
  const [loading, setLoading] = useState(null)
  const [usdMxn, setUsdMxn] = useState(17)
  const [planBillingCycle, setPlanBillingCycle] = useState('monthly')
  const [preferredMonthlyPlanId, setPreferredMonthlyPlanId] = useState('base')

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    setCouponCode('')
    setCouponValidation(null)

    if (initialCheckoutItem?.type === 'plan') {
      const initialCycle = normalizeBillingCycle(initialCheckoutItem.billingCycle)
      const initialPlanId = String(initialCheckoutItem.planId || 'base').toLowerCase().trim()
      const monthlyPlanId = initialCycle === 'monthly' ? initialPlanId : normalizePlanIdForCycle(initialPlanId, 'monthly')
      setPreferredMonthlyPlanId(monthlyPlanId)
      setPlanBillingCycle(initialCycle)
      setCheckoutItem(buildPlanCheckoutItem({ planId: initialCycle === 'monthly' ? monthlyPlanId : initialPlanId, billingCycle: initialCycle }))
      return
    }

    const matchedPackage = tokenPackages.find((pkg) => pkg.tokens === initialPackageTokens) || tokenPackages[1]
    setSelectedPackage(matchedPackage)
    setCheckoutItem({ type: 'tokens', package: matchedPackage })
  }, [isOpen, initialPackageTokens, initialCheckoutItem])

  useEffect(() => {
    let active = true

    const loadRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const data = await res.json()
        const nextRate = Number(data?.rates?.MXN)
        if (active && Number.isFinite(nextRate) && nextRate > 0) {
          setUsdMxn(nextRate)
        }
      } catch {
        // fallback
      }
    }

    loadRate()
    return () => {
      active = false
    }
  }, [])

  const formatMxnApprox = (usdPrice) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(usdPrice * usdMxn)

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_PERSIST_KEY)
    if (!token) return null
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  const getCurrentPrice = () => {
    if (checkoutItem?.type === 'plan') return parseFloat(checkoutItem.price)
    return selectedPackage.price
  }

  const isCurrentUserFreePlan = () => {
    try {
      const raw = localStorage.getItem('sv-user')
      if (!raw) return false
      const user = JSON.parse(raw)
      const plan = String(user?.plan || '').toLowerCase()
      return FREE_PLANS.has(plan)
    } catch {
      return false
    }
  }

  const fetchCurrentUserPlan = async (headers) => {
    try {
      const res = await fetch(API_URL + '/api/auth/me', { headers: { Authorization: headers.Authorization } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) return null
      return String(data?.user?.plan || '').toLowerCase()
    } catch {
      return null
    }
  }

  const validateCoupon = useCallback(async () => {
    const code = couponCode.trim()
    if (!code) {
      setCouponValidation(null)
      return
    }
    setCouponLoading(true)
    try {
      const authHeaders = getAuthHeaders()
      if (!authHeaders) { setCouponLoading(false); return }

      const ci = checkoutItem?.type === 'plan' ? checkoutItem : { type: 'tokens', package: selectedPackage }
      const res = await fetch(API_URL + '/api/coupons/validate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          code,
          amount: getCurrentPrice(),
          itemType: ci.type,
          itemId: ci.type === 'plan' ? ci.planId : ci.package?.tokens
        })
      })
      const data = await res.json()
      setCouponValidation(data)
    } catch (e) {
      setCouponValidation({ valid: false, message: 'Error validando cupón' })
    }
    setCouponLoading(false)
  }, [couponCode, checkoutItem, selectedPackage])

  // Reset coupon validation when package changes
  useEffect(() => {
    if (couponCode.trim() && couponValidation?.valid) {
      validateCoupon()
    }
  }, [selectedPackage])

  const currentItem = checkoutItem?.type === 'plan'
    ? checkoutItem
    : { type: 'tokens', package: selectedPackage }

  const switchPlanBillingCycle = (nextCycle) => {
    const normalizedCycle = normalizeBillingCycle(nextCycle)
    if (currentItem.type !== 'plan') return
    if (normalizedCycle === planBillingCycle) return

    if (normalizedCycle === 'annual') {
      const annualPlanId = normalizePlanIdForCycle(preferredMonthlyPlanId || currentItem.planId, 'annual')
      setPlanBillingCycle('annual')
      setCheckoutItem(buildPlanCheckoutItem({ planId: annualPlanId, billingCycle: 'annual' }))
      setCouponValidation(null)
      return
    }

    const monthlyPlanId = normalizePlanIdForCycle(preferredMonthlyPlanId || currentItem.planId, 'monthly')
    setPlanBillingCycle('monthly')
    setCheckoutItem(buildPlanCheckoutItem({ planId: monthlyPlanId, billingCycle: 'monthly' }))
    setCouponValidation(null)
  }

  const validCoupon = couponValidation?.valid ? couponValidation : null
  const isScheduledPlanAction = (action) => ['downgrade_next_cycle', 'billing_cycle_next_cycle'].includes(String(action || ''))

  const confirmScheduledPlanPayment = (action) => {
    if (!isScheduledPlanAction(action)) return true
    const planLabel = String(currentItem?.label || '').trim() || 'nuevo plan'
    const cycleLabel = currentItem?.billingCycle === 'annual' ? 'anual' : 'mensual'
    const message = [
      `Aviso importante: el cambio a ${planLabel} (${cycleLabel}) se aplicará en tu siguiente ciclo de facturación.`,
      'Hoy se procesa el pago, pero mantendrás tu plan actual hasta la renovación.',
      '¿Deseas continuar al pago?'
    ].join('\n\n')
    return window.confirm(message)
  }

  const getReturnUrl = () => {
    if (typeof window === 'undefined') return undefined
    const origin = window.location.origin
    return `${origin}/mercadopago-success.html`
  }

  const requestPayload = currentItem.type === 'plan'
    ? {
        planId: currentItem.planId,
        billingCycle: currentItem.billingCycle,
        itemType: 'plan',
        frontendOrigin: getFrontendOrigin(),
        frontendReturnUrl: getFrontendReturnUrl(),
        returnUrlBase: getReturnUrl(),
        couponCode: validCoupon ? couponCode.trim() : undefined,
        couponId: validCoupon?.coupon?.id || undefined,
      }
    : {
        tokensPackage: currentItem.package.tokens,
        itemType: 'tokens',
        frontendOrigin: getFrontendOrigin(),
        frontendReturnUrl: getFrontendReturnUrl(),
        returnUrlBase: getReturnUrl(),
        couponCode: validCoupon ? couponCode.trim() : undefined,
        couponId: validCoupon?.coupon?.id || undefined,
      }

  const requestWithLegacyFallback = async (endpoint, payload, headers) => {
    const post = (body) => fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    let res = await post(payload)
    let data = await res.json().catch(() => ({}))

    const shouldRetryLegacy =
      payload?.itemType === 'plan' &&
      !res.ok &&
      String(data?.error || '').toLowerCase().includes('invalid checkout item')

    if (!shouldRetryLegacy) return { res, data }

    const planId = String(payload?.planId || '').toLowerCase()
    const fallbacks = LEGACY_PLAN_FALLBACKS[planId] || []
    for (const fallbackPlanId of fallbacks) {
      const retryPayload = { ...payload, planId: fallbackPlanId }
      res = await post(retryPayload)
      data = await res.json().catch(() => ({}))
      if (res.ok) return { res, data }
    }

    return { res, data }
  }

  const handleMercadoPago = async () => {
    setLoading('mercadopago')
    try {
      const headers = getAuthHeaders()
      if (!headers) {
        alert(t('payment.loginRequired'))
        setLoading(null)
        return
      }
      const backendPlan = await fetchCurrentUserPlan(headers)
      const effectivePlan = backendPlan || (isCurrentUserFreePlan() ? 'free' : '')
      if (currentItem.type === 'tokens' && FREE_PLANS.has(effectivePlan)) {
        alert('Primero debes adquirir un plan de pago para poder comprar paquetes de tokens.')
        setLoading(null)
        return
      }
      if (
        currentItem.type === 'plan' &&
        currentItem.billingCycle === 'monthly' &&
        MONTHLY_PACK_PLAN_IDS.has(String(currentItem.planId || '').toLowerCase()) &&
        FREE_PLANS.has(effectivePlan)
      ) {
        alert('Para comprar un pack mensual primero debes activar el Plan Base.')
        setLoading(null)
        return
      }

      const { res, data } = await requestWithLegacyFallback(
        API_URL + '/api/mercadopago/create-preference',
        requestPayload,
        headers
      )
      const preferredCheckoutUrl = data.checkoutUrl || data.sandboxUrl

      if (!res.ok) {
        localStorage.removeItem(PAYMENT_PENDING_KEY)
        alert('Error MercadoPago: ' + (data.error || 'desconocido'))
        return
      }

      if (data.requiresPayment === false) {
        localStorage.removeItem(PAYMENT_PENDING_KEY)
        alert(data.message || t('payment.planScheduled'))
        onClose?.()
      } else if (preferredCheckoutUrl) {
        if (!confirmScheduledPlanPayment(data.action)) return
        localStorage.setItem(PAYMENT_PENDING_KEY, JSON.stringify({
          provider: 'mercadopago',
          startedAt: Date.now(),
          itemType: currentItem?.type || 'plan',
          planId: currentItem?.planId || null,
          action: data?.action || null,
        }))
        window.location.href = preferredCheckoutUrl
      }
      else alert('Error MercadoPago: ' + (data.error || 'desconocido'))
    } catch (e) {
      localStorage.removeItem(PAYMENT_PENDING_KEY)
      alert('Error: ' + e.message)
    } finally {
      setLoading(null)
    }
  }

  const handlePayPal = async () => {
    setLoading('paypal')
    try {
      const headers = getAuthHeaders()
      if (!headers) {
        alert(t('payment.loginRequired'))
        return
      }
      const backendPlan = await fetchCurrentUserPlan(headers)
      const effectivePlan = backendPlan || (isCurrentUserFreePlan() ? 'free' : '')
      if (currentItem.type === 'tokens' && FREE_PLANS.has(effectivePlan)) {
        alert('Primero debes adquirir un plan de pago para poder comprar paquetes de tokens.')
        return
      }
      if (
        currentItem.type === 'plan' &&
        currentItem.billingCycle === 'monthly' &&
        MONTHLY_PACK_PLAN_IDS.has(String(currentItem.planId || '').toLowerCase()) &&
        FREE_PLANS.has(effectivePlan)
      ) {
        alert('Para comprar un pack mensual primero debes activar el Plan Base.')
        return
      }

      const { res, data } = await requestWithLegacyFallback(
        API_URL + '/api/paypal/create-order',
        requestPayload,
        headers
      )
      if (!res.ok) {
        localStorage.removeItem(PAYMENT_PENDING_KEY)
        alert('Error PayPal: ' + (data.error || 'desconocido'))
        return
      }
      if (data.requiresPayment === false) {
        localStorage.removeItem(PAYMENT_PENDING_KEY)
        alert(data.message || t('payment.planScheduled'))
        onClose?.()
      } else if (data.approvalUrl) {
        if (!confirmScheduledPlanPayment(data.action)) return
        localStorage.setItem(PAYMENT_PENDING_KEY, JSON.stringify({
          provider: 'paypal',
          startedAt: Date.now(),
          itemType: currentItem?.type || 'plan',
          planId: currentItem?.planId || null,
          action: data?.action || null,
        }))
        window.location.href = data.approvalUrl
      } else {
        alert('Error PayPal: ' + (data.error || 'desconocido'))
      }
    } catch (e) {
      localStorage.removeItem(PAYMENT_PENDING_KEY)
      alert('Error: ' + e.message)
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen) return null
  const dm = darkMode

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`max-w-md w-full p-6 rounded-2xl max-h-[92vh] overflow-y-auto my-auto ${dm
        ? 'bg-gradient-to-br from-[#0f0f23] to-[#1a0033] border border-cyan-500/30'
        : 'bg-white border border-indigo-200 shadow-2xl'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              {currentItem.type === 'plan' ? t('payment.titlePlan') : t('payment.titleTokens')}
            </h2>
          </div>
          <button onClick={onClose} className={dm ? 'p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400' : 'p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500'}>
            <X size={22} />
          </button>
        </div>

        {currentItem.type !== 'plan' && (
          <div className="grid grid-cols-1 gap-3 mb-6">
            {tokenPackages.map((pkg) => {
              const sel = selectedPackage.tokens === pkg.tokens
              return (
                <button
                  key={pkg.tokens}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    sel ? 'border-cyan-400 bg-cyan-400/10'
                      : dm ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 right-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {t('payment.popular')}
                    </span>
                  )}
                  <p className="text-xl font-black text-cyan-400">{pkg.size}</p>
                  <p className={`text-xs mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{pkg.label} {t('payment.characters')}</p>
                  <p className={`text-base font-black ${dm ? 'text-white' : 'text-gray-900'}`}>${pkg.price} USD</p>
                  <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{t('payment.approxMxn', { mxn: formatMxnApprox(pkg.price) })}</p>
                </button>
              )
            })}
          </div>
        )}

        {currentItem.type === 'plan' && (
          <div className="mb-5">
            <div className={`rounded-xl p-3 mb-3 flex items-center gap-2 ${dm ? 'bg-white/5 border border-white/10' : 'bg-indigo-50 border border-indigo-100'}`}>
              <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <p className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className="font-bold text-cyan-400">{currentItem.label}</span>{' '}por{' '}
                <span className="font-bold">${currentItem.price} USD</span>{' '}
                <span>- {currentItem.billingCycle === 'annual' ? t('payment.billingAnnual') : t('payment.billingMonthly')}</span>
                <span className={`block text-[11px] ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                  {t('payment.approxMxn', { mxn: formatMxnApprox(Number(currentItem.price)) })}
                </span>
              </p>
            </div>
            <div className={`inline-flex w-full gap-2 rounded-xl p-1.5 border ${dm ? 'border-cyan-500/30 bg-[#0b1327]' : 'border-cyan-200 bg-cyan-50'}`}>
              <button
                type="button"
                onClick={() => switchPlanBillingCycle('monthly')}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-black transition-all ${planBillingCycle === 'monthly' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : dm ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => switchPlanBillingCycle('annual')}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-black transition-all ${planBillingCycle === 'annual' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : dm ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Anual (2 meses gratis)
              </button>
            </div>
          </div>
        )}
        <p className={`text-[11px] mb-3 text-center ${dm ? 'text-gray-600' : 'text-gray-500'}`}>
          {t('payment.reference')}
        </p>

        <div className="space-y-3">
          <p className={`text-xs text-center ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{t('payment.chooseMethod')}</p>

          <button
            onClick={handleMercadoPago}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #009ee3, #00b1ea)' }}
          >
            {loading === 'mercadopago' ? t('payment.processing') : t('payment.mercadopago')}
          </button>

          <button
            onClick={handlePayPal}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: '#ffc439', color: '#003087' }}
          >
            {loading === 'paypal' ? t('payment.processing') : t('payment.paypal')}
          </button>

          <div className="pt-0.5">
            <label className={`block text-[10px] font-medium mb-1 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('payment.coupon.label')}
            </label>
            <div className="flex gap-1.5 items-start">
              <div className="flex-1 max-w-[180px]">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase().slice(0, 24)); setCouponValidation(null) }}
                  placeholder="STREAM10"
                  className={`w-full h-7 px-2 rounded-md text-[11px] border outline-none transition ${
                    couponValidation?.valid
                      ? 'border-green-500 bg-green-500/10 text-green-300'
                      : couponValidation && !couponValidation.valid
                        ? 'border-red-500/50 bg-red-500/5'
                        : ''
                  } ${
                    dm
                      ? 'bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-cyan-500/40'
                      : 'bg-white border-gray-300 text-gray-700 placeholder:text-gray-400 focus:border-cyan-500'
                  }`}
                />
              </div>
              <button
                onClick={validateCoupon}
                disabled={!couponCode.trim() || couponLoading}
                className={`h-7 px-3 rounded-md text-[11px] font-bold transition-all disabled:opacity-40 ${
                  dm
                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30'
                    : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
                }`}
              >
                {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : t('payment.coupon.apply')}
              </button>
            </div>
            {couponValidation && (
              <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-medium ${
                couponValidation.valid ? 'text-green-400' : 'text-red-400'
              }`}>
                {couponValidation.valid
                  ? <Check className="w-3 h-3" />
                  : <AlertCircle className="w-3 h-3" />
                }
                <span>{couponValidation.message}</span>
              </div>
            )}
            {validCoupon && (
              <div className={`mt-2 rounded-lg p-2 text-[11px] ${dm ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex justify-between">
                  <span className={dm ? 'text-gray-400' : 'text-gray-500'}>{t('payment.coupon.subtotal')}</span>
                  <span>${validCoupon.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400 font-bold">
                  <span>{t('payment.coupon.discount')}</span>
                  <span>-${validCoupon.discount.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-black pt-1 mt-1 border-t ${dm ? 'border-white/10' : 'border-gray-200'}`}>
                  <span>{t('payment.coupon.total')}</span>
                  <span className="text-cyan-400">${validCoupon.finalAmount.toFixed(2)} USD</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${dm ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            {t('payment.cancel')}
          </button>
        </div>

        {currentItem.type !== 'plan' && (
          <div className={`mt-4 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${dm ? 'bg-white/5 border border-white/10 text-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-400'}`}>
            <p className="font-semibold mb-0.5">{t('payment.noRefund')}</p>
            <p>{t('payment.noRefundDetail')}</p>
          </div>
        )}
        <p className={`text-xs mt-3 text-center ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
          {t('payment.secure')}
        </p>
      </div>
    </div>
  )
}

