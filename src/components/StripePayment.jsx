import { useState, useEffect, useCallback } from 'react'
import { X, Zap, Check, AlertCircle, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const tokenPackages = [
  { tokens: 150000, price: 4.99, label: '150K', size: 'MINI BOOST' },
  { tokens: 350000, price: 9.99, label: '350K', size: 'POWER BOOST', popular: true },
  { tokens: 700000, price: 14.99, label: '700K', size: 'MAX BOOST' },
]

export function StripePayment({ isOpen, onClose, initialPackageTokens = null, initialCheckoutItem = null }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')
  const [selectedPackage, setSelectedPackage] = useState(tokenPackages[1])
  const [checkoutItem, setCheckoutItem] = useState(() => initialCheckoutItem || { type: 'tokens', package: tokenPackages[1] })
  const [couponCode, setCouponCode] = useState('')
  const [couponValidation, setCouponValidation] = useState(null) // { valid, message, discount, finalAmount, coupon }
  const [couponLoading, setCouponLoading] = useState(false)
  const [loading, setLoading] = useState(null)
  const [usdMxn, setUsdMxn] = useState(17)

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
      setCheckoutItem(initialCheckoutItem)
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
    const token = localStorage.getItem('sv-token')
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

  const validCoupon = couponValidation?.valid ? couponValidation : null

  const requestPayload = currentItem.type === 'plan'
    ? {
        planId: currentItem.planId,
        billingCycle: currentItem.billingCycle,
        itemType: 'plan',
        couponCode: validCoupon ? couponCode.trim() : undefined,
        couponId: validCoupon?.coupon?.id || undefined,
      }
    : {
        tokensPackage: currentItem.package.tokens,
        itemType: 'tokens',
        couponCode: validCoupon ? couponCode.trim() : undefined,
        couponId: validCoupon?.coupon?.id || undefined,
      }

  const handleMercadoPago = async () => {
    setLoading('mercadopago')
    try {
      const headers = getAuthHeaders()
      if (!headers) {
        alert('Inicia sesión para continuar con el pago.')
        setLoading(null)
        return
      }

      const res = await fetch(API_URL + '/api/mercadopago/create-preference', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
      else if (data.sandboxUrl) window.location.href = data.sandboxUrl
      else alert('Error MercadoPago: ' + (data.error || 'desconocido'))
    } catch (e) {
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
        alert('Inicia sesión para continuar con el pago.')
        setLoading(null)
        return
      }

      const res = await fetch(API_URL + '/api/paypal/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      })
      const data = await res.json()
      if (data.approvalUrl) {
        const w = 500
        const h = 650
        const left = (screen.width - w) / 2
        const top = (screen.height - h) / 2
        const popup = window.open(
          data.approvalUrl,
          'PayPalCheckout',
          'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',scrollbars=yes,resizable=yes'
        )
        const check = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(check)
            setLoading(null)
          }
        }, 500)
      } else {
        alert('Error PayPal: ' + (data.error || 'desconocido'))
        setLoading(null)
      }
    } catch (e) {
      alert('Error: ' + e.message)
      setLoading(null)
    }
  }

  if (!isOpen) return null
  const dm = darkMode

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className={dm
        ? 'bg-gradient-to-br from-[#0f0f23] to-[#1a0033] border border-cyan-500/30 rounded-2xl max-w-md w-full p-8'
        : 'bg-white border border-indigo-200 rounded-2xl max-w-md w-full p-8 shadow-2xl'
      }>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              {currentItem.type === 'plan' ? 'Comprar Plan' : 'Comprar Recarga'}
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
                      POPULAR
                    </span>
                  )}
                  <p className="text-xl font-black text-cyan-400">{pkg.size}</p>
                  <p className={`text-xs mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{pkg.label} caracteres</p>
                  <p className={`text-base font-black ${dm ? 'text-white' : 'text-gray-900'}`}>${pkg.price} USD</p>
                  <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Aprox. {formatMxnApprox(pkg.price)} MXN</p>
                </button>
              )
            })}
          </div>
        )}

        {currentItem.type === 'plan' && (
          <div className={`rounded-xl p-3 mb-5 flex items-center gap-2 ${dm ? 'bg-white/5 border border-white/10' : 'bg-indigo-50 border border-indigo-100'}`}>
            <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <p className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-bold text-cyan-400">{currentItem.label}</span>{' '}por{' '}
              <span className="font-bold">${currentItem.price} USD</span>{' '}
              <span>- facturación {currentItem.billingCycle === 'annual' ? 'anual' : 'mensual'}</span>
              <span className={`block text-[11px] ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                Aprox. {formatMxnApprox(Number(currentItem.price))} MXN
              </span>
            </p>
          </div>
        )}
        <p className={`text-[11px] mb-3 text-center ${dm ? 'text-gray-600' : 'text-gray-500'}`}>
          Referencia en MXN aproximada; se adapta al tipo de cambio USD/MXN del día.
        </p>

        <div className="space-y-3">
          <p className={`text-xs text-center ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Elige método de pago</p>

          <button
            onClick={handleMercadoPago}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #009ee3, #00b1ea)' }}
          >
            {loading === 'mercadopago' ? 'Procesando...' : 'Pagar con Mercado Pago'}
          </button>

          <button
            onClick={handlePayPal}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: '#ffc439', color: '#003087' }}
          >
            {loading === 'paypal' ? 'Procesando...' : 'Pagar con PayPal'}
          </button>

          <div className="pt-0.5">
            <label className={`block text-[10px] font-medium mb-1 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
              Cupón de descuento
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
                {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aplicar'}
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
                  <span className={dm ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                  <span>${validCoupon.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400 font-bold">
                  <span>Descuento</span>
                  <span>-${validCoupon.discount.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-black pt-1 mt-1 border-t ${dm ? 'border-white/10' : 'border-gray-200'}`}>
                  <span>Total</span>
                  <span className="text-cyan-400">${validCoupon.finalAmount.toFixed(2)} USD</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${dm ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            Cancelar
          </button>
        </div>

        {currentItem.type !== 'plan' && (
          <div className={`mt-4 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${dm ? 'bg-white/5 border border-white/10 text-gray-500' : 'bg-gray-50 border border-gray-200 text-gray-400'}`}>
            <p className="font-semibold mb-0.5">⚠️ Sin reembolsos en paquetes de tokens</p>
            <p>Los paquetes de tokens son productos digitales de consumo inmediato. Una vez procesada la compra, no aplican reembolsos ni devoluciones de ningún tipo.</p>
          </div>
        )}
        <p className={`text-xs mt-3 text-center ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
          Pagos 100% seguros - Mercado Pago y PayPal
        </p>
      </div>
    </div>
  )
}

