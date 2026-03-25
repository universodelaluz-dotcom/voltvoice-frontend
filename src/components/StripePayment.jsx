import { useState } from 'react'
import { X } from 'lucide-react'

const packages = [
  { tokens: 500, price: 4.99, priceId: 'price_1' },
  { tokens: 1000, price: 8.99, priceId: 'price_2', popular: true },
  { tokens: 5000, price: 39.99, priceId: 'price_3' },
]

export function StripePayment({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(packages[1])

  const handlePayment = async (pkg) => {
    setLoading(true)
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://voltvoice-backend.onrender.com'
      const response = await fetch(`${apiUrl}/api/mercadopago/create-preference`, {
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
      <div className="bg-gradient-to-br from-[#0f0f23] to-[#1a0033] border border-voltvoice-cyan/30 rounded-xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Comprar Tokens</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {pkg.tokens.toLocaleString()} Tokens
                    {pkg.popular && <span className="ml-2 text-yellow-400 text-sm">⭐ Popular</span>}
                  </p>
                  <p className="text-sm text-gray-400">{Math.round(pkg.tokens / 100)} voces</p>
                </div>
                <p className="text-2xl font-black text-cyan-400">${pkg.price}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-cyan-400">1 Token</span> = ~100 caracteres
          </p>
          <p className="text-sm text-gray-400 mt-2">Acceso inmediato después del pago</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold transition-colors"
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

        <p className="text-xs text-gray-500 mt-4 text-center">Pagos seguros con Mercado Pago.</p>
      </div>
    </div>
  )
}
