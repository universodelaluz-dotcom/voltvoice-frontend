'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap } from 'lucide-react'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <nav className="fixed top-0 w-full backdrop-blur-md bg-voltvoice-dark/80 border-b border-voltvoice-cyan/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="w-8 h-8 text-voltvoice-cyan animate-pulse group-hover:animate-bounce" />
              <div className="absolute inset-0 bg-voltvoice-cyan blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:inline">VoltVoice</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-300 hover:text-voltvoice-cyan transition-colors duration-300">
              Características
            </Link>
            <Link href="#pricing" className="text-gray-300 hover:text-voltvoice-cyan transition-colors duration-300">
              Planes
            </Link>
            <Link href="#faq" className="text-gray-300 hover:text-voltvoice-cyan transition-colors duration-300">
              Preguntas
            </Link>
            <Link href="#contact" className="text-gray-300 hover:text-voltvoice-cyan transition-colors duration-300">
              Contacto
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <button className="px-6 py-2 bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple rounded-lg font-semibold text-white hover:shadow-glow-cyan transition-all duration-300 btn-glow">
              Comenzar Gratis
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-voltvoice-cyan hover:text-voltvoice-magenta transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <div className="flex flex-col gap-4">
              <Link
                href="#features"
                className="text-gray-300 hover:text-voltvoice-cyan transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Características
              </Link>
              <Link
                href="#pricing"
                className="text-gray-300 hover:text-voltvoice-cyan transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Planes
              </Link>
              <Link
                href="#faq"
                className="text-gray-300 hover:text-voltvoice-cyan transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Preguntas
              </Link>
              <Link
                href="#contact"
                className="text-gray-300 hover:text-voltvoice-cyan transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Contacto
              </Link>
              <button className="w-full px-6 py-2 bg-gradient-to-r from-voltvoice-cyan to-voltvoice-purple rounded-lg font-semibold text-white hover:shadow-glow-cyan transition-all mt-2">
                Comenzar Gratis
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
