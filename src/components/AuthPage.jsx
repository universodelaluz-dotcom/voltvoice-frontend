import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader, AlertCircle, ArrowLeft } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export function AuthPage({ onLogin, onGoHome, darkMode }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

    if (mode === 'register' && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
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

      // Guardar token y datos del usuario
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
            <span className="text-2xl font-black">S</span>
          </div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {mode === 'login' ? 'Accede a tu cuenta de StreamVoicer' : 'Regístrate gratis y obtén 100 tokens'}
          </p>
        </div>

        {/* Form */}
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

          {/* Error */}
          {error && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
              darkMode ? 'bg-red-900/20 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
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
        <div className="mt-6 text-center">
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
      </div>
    </div>
  )
}
