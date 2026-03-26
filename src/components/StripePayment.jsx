import { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const packages = [
  { tokens: 100000,  price: 3.00,  label: '100K', size: 'Peque\u00f1o'              },
  { tokens: 250000,  price: 7.00,  label: '250K', size: 'Mediano', popular: true },
  { tokens: 500000,  price: 12.00, label: '500K', size: 'Grande'               },
  { tokens: 1000000, price: 20.00, label: '1M',   size: 'M\u00e1ximo'               },
]

export function StripePayment({ isOpen, onClose }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')
  const [selectedPackage, setSelectedPackage] = useState(packages[1])
  const [loading, setLoading] = useState(null)

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

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

  const handlePayPal = async () => {
    setLoading('paypal')
    try {
      const res = await fetch(API_URL + '/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'user-123' },
        body: JSON.stringify({ tokensPackage: selectedPackage.tokens }),
      })
      const data = await res.json()
      if (data.approvalUrl) window.location.href = data.approvalUrl
      else alert('Error PayPal: ' + (data.error || 'desconocido'))
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen) return null
  const dm = darkMode

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

          <button
            onClick={handlePayPal}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: '#ffc439', color: '#003087' }}
          >
            {loading === 'paypal' ? 'Procesando...' : 'Pagar con PayPal'}
          </button>

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
