'use client'

import Link from 'next/link'
import { Zap, Mail, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-voltvoice-cyan/20 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-voltvoice-cyan" />
              <span className="text-lg font-bold gradient-text">VoltVoice</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Voces clonadas de tus personajes favoritos en tus streams.
            </p>
          </div>


          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-voltvoice-cyan" />
                <a href="mailto:opusvoltlabs@gmail.com" className="hover:text-voltvoice-cyan transition-colors">
                  opusvoltlabs@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-voltvoice-cyan flex-shrink-0 mt-0.5" />
                <span>México</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-voltvoice-cyan/20 py-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} VoltVoice, Inc. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-voltvoice-cyan transition-colors text-sm">
              Política de Privacidad
            </a>
            <a href="#" className="text-gray-500 hover:text-voltvoice-cyan transition-colors text-sm">
              Términos de Servicio
            </a>
            <a href="#" className="text-gray-500 hover:text-voltvoice-cyan transition-colors text-sm">
              Política de Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
