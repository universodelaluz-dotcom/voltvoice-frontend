import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PricingCards } from './PricingCards'
import { PricingComparison } from './PricingComparison'

export function PricingPage({ onGoHome, darkMode, onPlanAction }) {
  const [billingCycle, setBillingCycle] = useState('monthly')
  const isAnnual = billingCycle === 'annual'
  const quickPlans = [
    {
      planId: 'base',
      monthlyName: 'PLAN BASE',
      annualName: 'PLAN BASE ANUAL',
      monthlyPrice: 9.99,
      annualPrice: 99.90,
      monthlyCta: 'Comprar Plan Base',
      annualCta: 'Comprar Plan Base Anual',
      className: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    },
    {
      planId: 'pack_lite',
      monthlyName: 'PACK LITE',
      annualName: 'BASE + LITE',
      monthlyPrice: 9.99,
      annualPrice: 199.80,
      monthlyCta: 'Agregar Pack Lite',
      annualCta: 'Suscribirme Base + Lite',
      className: 'bg-gradient-to-r from-cyan-600 to-indigo-600',
    },
    {
      planId: 'pack_pro',
      monthlyName: 'PACK PRO',
      annualName: 'BASE + PRO',
      monthlyPrice: 24.99,
      annualPrice: 349.80,
      monthlyCta: 'Agregar Pack Pro',
      annualCta: 'Suscribirme Base + Pro',
      className: 'bg-gradient-to-r from-fuchsia-600 to-pink-600',
    },
    {
      planId: 'pack_max',
      monthlyName: 'PACK MAX',
      annualName: 'BASE + MAX',
      monthlyPrice: 49.99,
      annualPrice: 599.80,
      monthlyCta: 'Agregar Pack Max',
      annualCta: 'Suscribirme Base + Max',
      className: 'bg-gradient-to-r from-orange-500 to-red-600',
    },
  ]

  return (
    <div className={darkMode ? 'min-h-screen bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23] text-white' : 'min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900'}>
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-colors duration-300 ${darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Stream Voicer
          </h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4">
              Planes <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Flexibles</span>
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Elige el plan perfecto para tu stream
            </p>
            <div className={`mt-6 inline-flex items-center rounded-xl border p-1 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-black ${billingCycle === 'monthly' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-lg text-sm font-black ${billingCycle === 'annual' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Anual (2 meses gratis)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {quickPlans.map((plan) => (
              <button
                key={plan.planId}
                onClick={() => onPlanAction?.(
                  {
                    name: isAnnual ? plan.annualName : plan.monthlyName,
                    price: isAnnual ? plan.annualPrice : plan.monthlyPrice,
                    planId: plan.planId,
                  },
                  { billingCycle, planId: plan.planId }
                )}
                className={`py-3 rounded-xl font-black text-sm text-white ${plan.className} hover:opacity-90 transition-all shadow-lg`}
              >
                {isAnnual ? plan.annualCta : plan.monthlyCta}
              </button>
            ))}
          </div>

          <PricingCards darkMode={darkMode} showToggle={true} onPlanAction={onPlanAction} layout="pricing" />

          <div className="my-20 flex items-center gap-4">
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Comparativa detallada
            </span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>

          <PricingComparison darkMode={darkMode} onPlanAction={onPlanAction} billingCycle={billingCycle} />

          <div className="text-center mt-16">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Preguntas? <a href="#contact" className="text-cyan-400 hover:text-cyan-300 font-semibold">Contáctanos</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


