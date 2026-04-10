import { Navbar } from '@/components/Navbar'
import { Pricing } from '@/components/Pricing'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Pricing - VoltVoice',
  description: 'Planes START, CREATOR y PRO con opciones mensuales, anuales y recargas.',
}

export default function PricingPage() {
  return (
    <main className="relative">
      <Navbar />
      <div className="pt-32 pb-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl sm:text-6xl font-black mb-6">
            <span className="block text-white mb-2">Precios Transparentes</span>
            <span className="gradient-text">Para Todos los Tamaños</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Comienza gratis. Escala como necesites. Sin sorpresas en la facturación.
          </p>
        </div>
      </div>
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
