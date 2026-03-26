import { useState, useEffect, useRef } from 'react'
import { X, Zap, CheckCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const packages = [
  { tokens: 100000,  price: 3.00,  label: '100K', size: 'Peque\u00f1o'              },
  { tokens: 250000,  price: 7.00,  label: '250K', size: 'Mediano', popular: true },
  { tokens: 500000,  price: 12.00, label: '500K', size: 'Grande'               },
  { tokens: 1000000, price: 20.00, label: '1M',   size: 'M\u00e1ximo'               },
]

function loadPayPalSDK(clientId) {
  return new Promise((resolve, reject) => {
    if (window.paypal) return resolve(window.paypal)
    const old = document.querySelector('script[data-paypal-sdk]')
    if (old) old.remove()
    const script = document.createElement('script')
    script.src = 'https://www.paypal.com/sdk/js?client-id=' + clientId + '&currency=USD'
    script.setAttribute('data-paypal-sdk', 'true')
    script.onload = () => resolve(window.paypal)
    script.onerror = () => reject(new Error('No se pudo cargar PayPal SDK'))
    document.head.appendChild(script)
  })
}

export function StripePayment({ isOpen, onClose }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')
  const [selectedPackage, setSelectedPackage] = useState(packages[1])
  const [loading, setLoading] = useState(null)
  const [paypalReady, setPaypalReady] = useState(false)
  const [paypalClientId, setPaypalClientId] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const paypalContainerRef = useRef(null)
  const paypalButtonsRef = useRef(null)
  const selectedPkgRef = useRef(selectedPackage)
  const onCloseRef = useRef(onClose)

  useEffect(() => { selectedPkgRef.current = selectedPackage }, [selectedPackage])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    fetch(API_URL + '/api/paypal/client-id')
      .then(r => r.json())
      .then(data => { if (data.clientId) setPaypalClientId(data.clientId) })
      .catch(() => {})
  }, [isOpen])

  useEffect(() => {
    if (!paypalClientId || !isOpen || !paypalContainerRef.current) return
    let cancelled = false

    loadPayPalSDK(paypalClientId).then(paypal => {
      if (cancelled || !paypalContainerRef.current) return
      paypalContainerRef.current.innerHTML = ''

      const buttons = paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal', height: 45 },
        createOrder: async () => {
          const pkg = selectedPkgRef.current
          const res = await fetch(API_URL + '/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-123' },
            body: JSON.stringify({ tokensPackage: pkg.tokens })
          })
          const data = await res.json()
          if (!data.orderId) throw new Error(data.error || 'Error creando orden')
          return data.orderId
        },
        onApprove: async (data) => {
          const res = await fetch(API_URL + '/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-123' },
            body: JSON.stringify({ orderId: data.orderID })
          })
          const result = await res.json()
          if (result.success) {
            setPaymentSuccess(true)
            setTimeout(() => { setPaymentSuccess(false); onCloseRef.current() }, 3000)
          }
        },
        onError: (err) => {
          console.error('[PayPal] Error:', err)
          alert('Error en el pago con PayPal')
        }
      })

      if (buttons.isEligible()) {
        buttons.render(paypalContainerRef.current)
        paypalButtonsRef.current = buttons
        setPaypalReady(true)
      }
    }).catch(err => console.error('Error cargando PayPal SDK:', err))

    return () => {
      cancelled = true
      if (paypalButtonsRef.current) {
        try { paypalButtonsRef.current.close() } catch(e) {}
        paypalButtonsRef.current = null
      }
    }
  }, [paypalClientId, isOpen])

  const handleMercadoPago = async () => {
    setLoading('mercadopago')
    try {
      const res = await fetch(API_URL + '/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-123' },
        body: JSON.stringify({ tokensPackage: selectedPackage.tokens }),
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

  if (!isOpen) return null
  const dm = darkMode

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className={dm
          ? "bg-gradient-to-br from-[#0f0f23] to-[#1a0033] border border-green-500/30 rounded-2xl max-w-sm w-full p-8 text-center"
          : "bg-white border border-green-200 rounded-2xl max-w-sm w-full p-8 shadow-2xl text-center"
        }>
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-green-400 mb-2">Pago exitoso!</h2>
          <p className={dm ? "text-gray-300" : "text-gray-600"}>
            Se agregaron <span className="font-bold text-cyan-400">{selectedPackage.label}</span> tokens a tu cuenta
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className={dm
        ? "bg-gradient-to-br from-[#0f0f23] to-[#1a0033] border border-cyan-500/30 rounded-2xl max-w-md w-full p-8"
        : "bg-white border border-indigo-200 rounded-2xl max-w-md w-full p-8 shadow-2xl"
      }>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Comprar Tokens
            </h2>
          </div>
          <button onClick={onClose} className={dm ? "p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400" : "p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"}>
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {packages.map((pkg) => {
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
                <p className="text-xl font-black text-cyan-400">{pkg.label}</p>
                <p className={`text-xs mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{pkg.size}</p>
                <p className={`text-base font-black ${dm ? 'text-white' : 'text-gray-900'}`}>${pkg.price} USD</p>
              </button>
            )
          })}
        </div>

        <div className={`rounded-xl p-3 mb-5 flex items-center gap-2 ${dm ? 'bg-white/5 border border-white/10' : 'bg-indigo-50 border border-indigo-100'}`}>
          <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <p className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="font-bold text-cyan-400">{selectedPackage.label} tokens</span>{' '}por{' '}
            <span className="font-bold">${selectedPackage.price} USD</span> - 1 token = 1 caracter
          </p>
        </div>

        <div className="space-y-3">
          <p className={`text-xs text-center ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Elige metodo de pago</p>

          <button
            onClick={handleMercadoPago}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #009ee3, #00b1ea)' }}
          >
            {loading === 'mercadopago' ? 'Procesando...' : 'Pagar con Mercado Pago'}
          </button>

          <div ref={paypalContainerRef} className="w-full min-h-[45px]">
            {!paypalReady && (
              <div className={`w-full py-3 rounded-xl text-center text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                Cargando PayPal...
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

        <p className={`text-xs mt-4 text-center ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
          Pagos 100% seguros - Mercado Pago y PayPal
        </p>
      </div>
    </div>
  )
}
