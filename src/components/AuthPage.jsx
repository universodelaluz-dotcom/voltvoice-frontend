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
    <div className="min-h-screen flex">

      {/* ===== PANEL IZQUIERDO — Branding ===== */}
      <div className={`hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-14 pulse-glow ${
        darkMode
          ? 'bg-gradient-to-br from-[#0a0a1a] via-[#110022] to-[#0a0a1a]'
          : 'bg-gradient-to-br from-[#eef2ff] via-[#f5f0ff] to-[#e0f2fe]'
      }`}>

        {/* Blobs decorativos */}
        <div className={`absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full blur-3xl ${darkMode ? 'bg-cyan-500/10' : 'bg-cyan-400/20'}`} />
        <div className={`absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full blur-3xl ${darkMode ? 'bg-purple-600/10' : 'bg-purple-400/20'}`} />

        {/* Logo */}
        <div className="relative z-10 text-center mb-10">
          <img src="/images/logo-main.png" alt="Stream Voicer" className="h-14 mx-auto mb-6 object-contain drop-shadow-lg" />
          <h2 className={`text-4xl font-black leading-tight mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Tu chat TikTok<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">cobró vida.</span>
          </h2>
          <p className={`text-lg max-w-xs mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Voces con IA que leen tu stream en tiempo real.</p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4 w-full max-w-xs mb-10">
          {[
            { icon: '🎙️', title: 'Voces con IA', desc: 'Más de 20 voces premium' },
            { icon: '⚡', title: 'Tiempo real', desc: 'Sin delay, sin complicaciones' },
            { icon: '🎭', title: 'Bots con personalidad', desc: 'Personajes que interactúan solos' },
          ].map((f, i) => (
            <div key={i} className={`flex items-center gap-4 rounded-xl px-4 py-3 backdrop-blur-sm border ${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-gray-200 shadow-sm'
            }`}>
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{f.title}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat bubbles animados */}
        <div className="relative z-10 w-full max-w-xs space-y-2">
          <div className={`float-1 border rounded-2xl rounded-tl-sm px-4 py-2 text-sm w-fit ${darkMode ? 'bg-white/5 border-cyan-500/20 text-gray-300' : 'bg-white border-cyan-300 text-gray-600 shadow-sm'}`}>
            💬 <span className={`font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>@alexgamer:</span> gg crack!
          </div>
          <div className={`float-2 border rounded-2xl rounded-tr-sm px-4 py-2 text-sm w-fit ml-auto ${darkMode ? 'bg-white/5 border-purple-500/20 text-gray-300' : 'bg-white border-purple-300 text-gray-600 shadow-sm'}`}>
            🔊 <em className={darkMode ? 'text-purple-300' : 'text-purple-500'}>leyendo mensaje...</em>
          </div>
          <div className={`float-3 border rounded-2xl rounded-tl-sm px-4 py-2 text-sm w-fit ${darkMode ? 'bg-white/5 border-cyan-500/20 text-gray-300' : 'bg-white border-cyan-300 text-gray-600 shadow-sm'}`}>
            💬 <span className={`font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>@sofia_art:</span> qué voz más chida
          </div>
        </div>

        {/* Wave bars */}
        <div className="relative z-10 mt-8 flex items-end gap-1 h-8">
          {[0.3,0.6,1,0.7,0.4,0.8,1,0.5,0.3,0.9,0.6,1,0.4].map((h, i) => (
            <div
              key={i}
              className={`wave-bar w-1.5 rounded-full ${darkMode ? 'bg-gradient-to-t from-cyan-500 to-purple-400' : 'bg-gradient-to-t from-cyan-500 to-purple-500'}`}
              style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>

      {/* ===== PANEL DERECHO — Formulario ===== */}
      <div className={`w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center px-10 py-12 relative ${
        darkMode
          ? 'bg-[#0f0f23]'
          : 'bg-white'
      }`}>

        {/* Back button */}
        <button
          onClick={onGoHome}
          className={`absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            darkMode
              ? 'bg-gray-800/80 border border-cyan-500/30 text-cyan-400 hover:bg-gray-700'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Inicio
        </button>

        {/* Logo visible solo en mobile */}
        <div className="lg:hidden mb-8">
          <img src="/images/logo-main.png" alt="Stream Voicer" className="h-10 mx-auto object-contain" />
        </div>

      <div className={`w-full max-w-md p-10 ${
        darkMode
          ? 'bg-gray-900/80 rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5'
          : 'bg-white rounded-2xl border border-gray-200 shadow-xl'
      }`}>
        {/* Header */}
        <div className="text-center mb-8">
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

            {/* ¿Eres nuevo? — solo visible antes de expandir el email form */}
            {!showEmailForm && GOOGLE_CLIENT_ID && mode === 'login' && (
              <p className={`text-center text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ¿Eres nuevo?{' '}
                <button
                  onClick={() => { setMode('register'); setShowEmailForm(true); setError(null) }}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Regístrate gratis
                </button>
              </p>
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

                {/* reCAPTCHA disclosure */}
                {mode === 'register' && RECAPTCHA_SITE_KEY && (
                  <p className={`text-xs text-center mt-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Protegido por reCAPTCHA.{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Privacidad</a>
                    {' '}y{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">Términos</a> de Google.
                  </p>
                )}

                {/* Toggle mode */}
                <div className="mt-5 text-center">
                  {mode === 'login' && (
                    <div className={`text-sm mb-2 flex flex-col gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Olvidé:{' '}
                        <button onClick={() => { setStep('forgot-request'); setError(null); setInfo(null); setResetCode(''); setResetNewPassword(''); setResetConfirmPassword('') }} className={`font-semibold transition-colors ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-indigo-600 hover:text-indigo-500'}`}>
                          mi contraseña
                        </button>
                        {' · '}
                        <button onClick={() => { setStep('forgot-user'); setError(null); setInfo(null) }} className={`font-semibold transition-colors ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-indigo-600 hover:text-indigo-500'}`}>
                          mi usuario
                        </button>
                      </span>
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
            <div className={`rounded-xl p-4 text-sm ${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
              <p>Tu <strong>usuario</strong> en Stream Voicer es el <strong>correo electrónico</strong> con el que te registraste.</p>
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
    </div>
  )
}



