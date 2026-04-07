'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface StripePaymentProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (tokens: number) => void
}

const packages = [
  { tokens: 150000, price: 4.99, priceId: 'price_1' },
  { tokens: 350000, price: 9.99, priceId: 'price_2', popular: true },
  { tokens: 700000, price: 14.99, priceId: 'price_3' },
]

export function StripePayment({ isOpen, onClose, onSuccess: _onSuccess }: StripePaymentProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(packages[1])

  const handlePayment = async (pkg: typeof packages[0]) => {
    setLoading(true)

    try {
      // Llamar al backend para crear la preferencia de pago
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123', // Cambiar por el usuario real
        },
        body: JSON.stringify({
          tokensPackage: pkg.tokens,
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        // Redirigir a Mercado Pago Checkout
        window.location.href = data.checkoutUrl
      } else if (data.sandboxUrl) {
        // En desarrollo, usar sandbox
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black gradient-text">Comprar Tokens</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Packages */}
        <div className="space-y-3 mb-8">
          {packages.map((pkg) => (
            <button
              key={pkg.tokens}
              onClick={() => setSelectedPackage(pkg)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedPackage.tokens === pkg.tokens
                  ? 'border-voltvoice-cyan bg-voltvoice-cyan/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {pkg.tokens.toLocaleString()} Tokens
                    {pkg.popular && <span className="ml-2 text-voltvoice-yellow text-sm">⭐ Popular</span>}
                  </p>
                  <p className="text-sm text-gray-400">{pkg.tokens.toLocaleString()} caracteres</p>
                </div>
                <p className="text-2xl font-black text-voltvoice-cyan">${pkg.price}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-voltvoice-cyan">Consumo variable</span> segun actividad del chat
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Acceso inmediato después del pago
          </p>
        </div>

        {/* Buttons */}
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
            className="flex-1 px-4 py-3 bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple rounded-lg font-bold text-white hover:shadow-glow-cyan transition-all disabled:opacity-50"
          >
            {loading ? '⏳ Procesando...' : `Pagar $${selectedPackage.price}`}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Pagos seguros con Stripe. No guardaremos tus datos de tarjeta.
        </p>
      </div>
    </div>
  )
}
