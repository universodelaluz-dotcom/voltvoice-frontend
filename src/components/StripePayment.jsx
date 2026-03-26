import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const packages = [
  { tokens: 500, price: 4.99, priceId: 'price_1' },
  { tokens: 1000, price: 8.99, priceId: 'price_2', popular: true },
  { tokens: 5000, price: 39.99, priceId: 'price_3' },
]

export function StripePayment({ isOpen, onClose, onSuccess }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('voltvoice-theme') !== 'light')

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(packages[1])

  const handlePayment = async (pkg) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/mercadopago/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123',
        },
        body: JSON.stringify({
          tokensPackage: pkg.tokens,
        }),
      })
      const data = await response.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.sandboxUrl) {
        window.location.href = data.sandboxUrl
      } else {
        alert('Error al crear la sesión de pago')
      }
    } catch (error) {
      alert('Error al procesar el pago')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={darkMode ? "bg-gradient-to-br from-[#0f0f23] to-[#1a0033] border border-cyan-500/30 rounded-xl max-w-md w-full p-8" : "bg-white border border-indigo-200 rounded-xl max-w-md w-full p-8 shadow-2xl"}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Comprar Tokens</h2>
          <button onClick={onClose} className={darkMode ? "p-2 hover:bg-white/10 rounded-lg transition-colors" : "p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"}>
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3 mb-8">
          {packages.map((pkg) => (
            <button
              key={pkg.tokens}
              onClick={() => setSelectedPackage(pkg)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedPackage.tokens === pkg.tokens
                  ? 'border-cyan-400 bg-cyan-400/10 text-white'
                  : (darkMode ? 'border-white/10 hover:border-white/20 text-white' : 'border-gray-200 hover:border-indigo-300 text-gray-800')
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {pkg.tokens.toLocaleString()} Tokens
                    {pkg.popular && <span className="ml-2 text-yellow-400 text-sm">⭐ Popular</span>}
                  </p>
                  <p className={darkMode ? "text-sm text-gray-400" : "text-sm text-gray-500"}>{Math.round(pkg.tokens / 100)} voces</p>
                </div>
                <p className="text-2xl font-black text-cyan-400">${pkg.price}</p>
              </div>
            </button>
          ))}
        </div>

        <div className={darkMode ? "bg-white/5 rounded-lg p-4 mb-6 border border-white/10" : "bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-100"}>
          <p className={darkMode ? "text-sm text-gray-300" : "text-sm text-gray-700"}>
            <span className="font-bold text-cyan-400">1 Token</span> = ~100 caracteres
          </p>
          <p className={darkMode ? "text-sm text-gray-400 mt-2" : "text-sm text-gray-500 mt-2"}>Acceso inmediato después del pago</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
className={darkMode ? "flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold transition-colors text-white" : "flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors text-gray-700"}
          >
            Cancelar
          </button>
          <button
            onClick={() => handlePayment(selectedPackage)}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? '⏳ Procesando...' : `Pagar $${selectedPackage.price}`}
          </button>
        </div>

        <p className={darkMode ? "text-xs text-gray-500 mt-4 text-center" : "text-xs text-gray-400 mt-4 text-center"}>Pagos seguros con Mercado Pago.</p>
      </div>
    </div>
  )
}
