import { useState, useEffect, useRef } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY
const RECAPTCHA_REQUIRED = ['1', 'true', 'yes', 'on'].includes(String(import.meta.env.VITE_RECAPTCHA_REQUIRED ?? 'false').toLowerCase())

const maskEmail = (email) => {
  const [local, domain] = (email || '').split('@')
  if (!domain) return email
  const visible = local.length > 2 ? local[0] + '***' + local[local.length - 1] : local[0] + '***'
  return `${visible}@${domain}`
}

export function AuthPage({ onLogin, onGoHome, darkMode }) {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('form') // form | verification | forgot-request | forgot-reset | forgot-user
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const googleBtnRef = useRef(null)
  const recaptchaRef = useRef(null)
  const googleInitDoneRef = useRef(false)

  // Cargar Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[Auth] GOOGLE_CLIENT_ID no configurado')
      setShowEmailForm(true)
      return
    }

    const renderGoogleButton = () => {
      if (!window.google || !googleBtnRef.current) return
      if (!googleInitDoneRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        })
        googleInitDoneRef.current = true
      }
      googleBtnRef.current.innerHTML = ''
      const buttonWidth = Math.max(220, Math.floor(googleBtnRef.current.offsetWidth || 320))
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: darkMode ? 'filled_black' : 'outline',
        size: 'large',
        width: buttonWidth,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
      })
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      renderGoogleButton()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderGoogleButton
    document.head.appendChild(script)

    return () => {
      if (googleBtnRef.current) googleBtnRef.current.innerHTML = ''
    }
  }, [darkMode])

  // Cargar reCAPTCHA
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || mode !== 'register') return

    const scriptSrc = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      const existing = document.querySelector(`script[src="${scriptSrc}"]`)
      if (existing) existing.remove()
    }
  }, [mode])

  // Countdown para resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true)
    setError(null)
    setInfo(null)

    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        credentials: 'include',
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

  const handleRegisterStep1 = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim() || !password) {
      setError('Completa todos los campos')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (RECAPTCHA_REQUIRED && !RECAPTCHA_SITE_KEY) {
      setError('CAPTCHA no configurado. Falta VITE_RECAPTCHA_SITE_KEY.')
      return
    }

    setLoading(true)

    try {
      // Obtener reCAPTCHA token
      let recaptchaToken = null
      if (window.grecaptcha && RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await new Promise((resolve, reject) => {
            window.grecaptcha.ready(async () => {
              try {
                const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'register' })
                resolve(token)
              } catch (err) {
                reject(err)
              }
            })
          })
        } catch (err) {
          console.warn('[Auth] reCAPTCHA error:', err)
          if (RECAPTCHA_REQUIRED) {
            setError('No se pudo validar CAPTCHA. Intenta de nuevo.')
            setLoading(false)
            return
          }
        }
      }

      if (RECAPTCHA_REQUIRED && !recaptchaToken) {
        setError('CAPTCHA requerido para crear la cuenta.')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          recaptchaToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error en el registro')
        return
      }

      // Cambiar a paso de verificación
      setStep('verification')
      setVerificationCode('')
      setResendCooldown(0)
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!verificationCode.trim()) {
      setError('Ingresa el código de verificación')
      return
    }

    if (verificationCode.length < 6) {
      setError('El código debe tener 6 dígitos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Código incorrecto')
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

  const handleResendCode = async () => {
    setError(null)
    setInfo(null)
    setLoading(true)
    setResendCooldown(60)

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error reenviando código')
        setResendCooldown(0)
        return
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
      setResendCooldown(0)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim() || !password) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
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

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim()) {
      setError('Ingresa tu email para recuperar la contraseña')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'Error enviando recuperación')
        return
      }
      setInfo(data.message || 'Si el email existe, enviamos un código.')
      setStep('forgot-reset')
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim() || !resetCode.trim() || !resetNewPassword) {
      setError('Completa email, código y nueva contraseña')
      return
    }
    if (resetCode.trim().length < 6) {
      setError('El código debe tener 6 dígitos')
      return
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (resetNewPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: resetCode.trim(),
          newPassword: resetNewPassword
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'No se pudo restablecer la contraseña')
        return
      }
      setInfo('Contraseña actualizada. Ya puedes iniciar sesión.')
      setStep('form')
      setMode('login')
      setPassword('')
      setConfirmPassword('')
      setResetCode('')
      setResetNewPassword('')
      setResetConfirmPassword('')
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
        : 'bg-gradient-to-b from-[#eceff3] via-[#f7f8fa] to-[#e8ecf1]'
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
            {step === 'verification'
              ? 'Verifica tu Email'
              : step === 'forgot-request'
              ? 'Recuperar Contraseña'
              : step === 'forgot-reset'
              ? 'Restablecer Contraseña'
              : step === 'forgot-user'
              ? 'Olvidé mi Usuario'
              : showEmailForm ? (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta') : 'Bienvenido'
            }
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {step === 'verification'
              ? `Enviamos un código a ${email}`
              : step === 'forgot-request'
              ? 'Te enviaremos un código de recuperación por email'
              : step === 'forgot-reset'
              ? `Ingresa el código enviado a ${maskEmail(email)}`
              : step === 'forgot-user'
              ? 'Te ayudamos a recuperar el acceso a tu cuenta'
              : showEmailForm
              ? (mode === 'login' ? 'Accede con tu email' : 'Regístrate gratis y obtén 100 tokens')
              : 'Inicia sesión para acceder a Stream Voicer'
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

        {info && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
            darkMode ? 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {info}
          </div>
        )}

        {/* PASO 1: Registro/Login */}
        {step === 'form' && (
          <>
            {/* Google Sign In */}
            {mode === 'login' && GOOGLE_CLIENT_ID && (
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
            {mode === 'login' && GOOGLE_CLIENT_ID && (
              <div className="relative my-6">
                <div className={`absolute inset-0 flex items-center`}>
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
            {(showEmailForm || !GOOGLE_CLIENT_ID) && (
              <>
                <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterStep1} className="space-y-4">
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
                        {mode === 'login' ? 'Entrando...' : 'Enviando código...'}
                      </>
                    ) : (
                      mode === 'login' ? 'Entrar' : 'Crear cuenta gratis'
                    )}
                  </button>
                </form>

                {/* Toggle mode */}
                <div className="mt-5 text-center">
                  {mode === 'login' && (
                    <div className={`text-sm mb-2 flex flex-col gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <button
                        onClick={() => { setStep('forgot-request'); setError(null); setInfo(null); setResetCode(''); setResetNewPassword(''); setResetConfirmPassword('') }}
                        className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Olvidé mi contraseña
                      </button>
                      <button
                        onClick={() => { setStep('forgot-user'); setError(null); setInfo(null) }}
                        className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Olvidé con qué correo me registré
                      </button>
                    </div>
                  )}
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                    <button
                      onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setInfo(null); setStep('form') }}
                      className="ml-2 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
                    </button>
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* PASO 2: Verificación de Email */}
        {step === 'verification' && (
          <>
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              {/* Código de verificación */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Código de Verificación (6 dígitos)
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    className={`w-full px-4 py-3 rounded-lg border text-center text-2xl font-bold letter-spacing-widest ${
                      darkMode
                        ? 'bg-gray-800 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                    } focus:outline-none transition-colors`}
                    disabled={loading}
                  />
                </div>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Revisa tu email para el código
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || verificationCode.length < 6}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verificar Email
                  </>
                )}
              </button>
            </form>

            {/* Resend code */}
            <div className="mt-4 text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ¿No recibiste el código?
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className={`ml-2 font-semibold transition-colors ${
                    resendCooldown > 0
                      ? darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                      : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar'}
                </button>
              </p>
            </div>

            {/* Cambiar email */}
            <div className="mt-4 text-center">
              <button
                onClick={() => { setStep('form'); setVerificationCode(''); setError(null) }}
                className={`text-sm ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Cambiar email
              </button>
            </div>
          </>
        )}

        {/* PASO: Olvidé mi usuario */}
        {step === 'forgot-user' && (
          <div className="space-y-4">
            <div className={`rounded-xl p-4 text-sm space-y-3 ${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
              <p>Tu <strong>usuario</strong> en Stream Voicer es el <strong>correo electrónico</strong> con el que te registraste.</p>
              <p>Si no recuerdas cuál usaste, escríbenos y te ayudamos a encontrarlo:</p>
              <a
                href="mailto:opusvolt@gmail.com?subject=Recuperar%20acceso%20a%20mi%20cuenta&body=Hola%2C%20no%20recuerdo%20con%20qu%C3%A9%20correo%20me%20registr%C3%A9%20en%20Stream%20Voicer.%20Cualquier%20dato%20que%20recuerde%3A%20"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:opacity-90 transition-opacity"
              >
                <Mail className="w-4 h-4" />
                Contactar soporte
              </a>
              <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                opusvolt@gmail.com — respuesta en menos de 24h
              </p>
            </div>
            <button
              onClick={() => { setStep('form'); setError(null); setInfo(null) }}
              className={`w-full text-sm ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* PASO: Solicitar recuperación */}
        {step === 'forgot-request' && (
          <>
            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tu email
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
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviarme código'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => { setStep('form'); setError(null); setInfo(null) }}
                className={`text-sm ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

        {/* PASO: Restablecer contraseña */}
        {step === 'forgot-reset' && (
          <>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-4 ${
              darkMode ? 'bg-gray-800 border border-cyan-500/20' : 'bg-gray-50 border border-gray-200'
            }`}>
              <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Código enviado a <strong>{maskEmail(email)}</strong>
              </span>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Código de recuperación
                </label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className={`w-full mt-1 px-4 py-3 rounded-lg border text-center text-2xl font-bold ${
                    darkMode
                      ? 'bg-gray-800 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                  } focus:outline-none transition-colors`}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nueva contraseña
                </label>
                <div className="relative mt-1">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
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

              <div>
                <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Confirmar nueva contraseña
                </label>
                <div className="relative mt-1">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-gray-800 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                    } focus:outline-none transition-colors`}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length < 6 || !resetNewPassword || !resetConfirmPassword}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-cyan-400/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Cambiar contraseña
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => { setStep('forgot-request'); setError(null); setInfo(null) }}
                className={`text-sm ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ← Usar otro email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}



