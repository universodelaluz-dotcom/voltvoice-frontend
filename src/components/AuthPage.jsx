import { useState, useEffect, useRef } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader, AlertCircle, ArrowLeft } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function AuthPage({ onLogin, onGoHome, darkMode }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const googleBtnRef = useRef(null)

  // Cargar Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[Auth] GOOGLE_CLIENT_ID no configurado')
      setShowEmailForm(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        })
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: darkMode ? 'filled_black' : 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existing) existing.remove()
    }
  }, [darkMode])

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error con Google')
        return
      }

      localStorage.setItem('sv-token', data.token)
      localStorage.setItem('sv-user', JSON.stringify(data.user))
      onLogin(data.user, data.token)
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Completa todos los campos')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (mode === 'register' && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error en la solicitud')
        return
      }

      localStorage.setItem('sv-token', data.token)
      localStorage.setItem('sv-user', JSON.stringify(data.user))
      onLogin(data.user, data.token)
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      darkMode
        ? 'bg-gradient-to-b from-[#0f0f23] via-[#1a0033] to-[#0f0f23]'
        : 'bg-gradient-to-b from-gray-50 via-white to-gray-100'
    }`}>
      {/* Back button */}
      <button
        onClick={onGoHome}
        className={`fixed top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
          darkMode
            ? 'bg-gray-800/80 border border-cyan-500/30 text-cyan-400 hover:bg-gray-700'
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Inicio
      </button>

      <div className={`w-full max-w-md rounded-2xl p-8 ${
        darkMode
          ? 'bg-gray-900/80 border border-cyan-500/20 shadow-2xl shadow-cyan-500/5'
          : 'bg-white border border-gray-200 shadow-xl'
      }`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black text-white">S</span>
          </div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {showEmailForm ? (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta') : 'Bienvenido'}
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {showEmailForm
              ? (mode === 'login' ? 'Accede con tu email' : 'Regístrate gratis y obtén 100 tokens')
              : 'Inicia sesión para acceder a StreamVoicer'
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
            darkMode ? 'bg-red-900/20 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Google Sign In - PRINCIPAL */}
        {GOOGLE_CLIENT_ID && (
          <div className="mb-4">
            {googleLoading ? (
              <div className="flex items-center justify-center gap-3 py-3">
                <Loader className="w-5 h-5 animate-spin text-cyan-400" />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Conectando con Google...</span>
              </div>
            ) : (
              <div ref={googleBtnRef} className="flex justify-center [&>div]:w-full" />
            )}
          </div>
        )}

        {/* Divider */}
        {GOOGLE_CLIENT_ID && (
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            </div>
            <div className="relative flex justify-center">
              {!showEmailForm ? (
                <button
                  onClick={() => setShowEmailForm(true)}
                  className={`px-4 text-sm ${darkMode ? 'bg-gray-900/80 text-gray-400 hover:text-gray-200' : 'bg-white text-gray-500 hover:text-gray-700'} transition-colors`}
                >
                  o continúa con email
                </button>
              ) : (
                <span className={`px-4 text-xs ${darkMode ? 'bg-gray-900/80 text-gray-500' : 'bg-white text-gray-400'}`}>
                  o con email
                </span>
              )}
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        {showEmailForm && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-gray-800 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                    } focus:outline-none transition-colors`}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Contraseña
                </label>
                <div className="relative mt-1">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-gray-800 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                    } focus:outline-none transition-colors`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              {mode === 'register' && (
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Confirmar Contraseña
                  </label>
                  <div className="relative mt-1">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm ${
                        darkMode
                          ? 'bg-gray-800 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                      } focus:outline-none transition-colors`}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {mode === 'login' ? 'Entrando...' : 'Creando cuenta...'}
                  </>
                ) : (
                  mode === 'login' ? 'Entrar' : 'Crear cuenta gratis'
                )}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-5 text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
                  className="ml-2 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
