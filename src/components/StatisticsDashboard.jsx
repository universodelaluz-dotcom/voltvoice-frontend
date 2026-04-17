import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  Loader2,
  MessageSquare,
  Mic2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Zap,
  Star,
  Calendar,
  Activity,
  Users
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'
const formatCompact = (value) => Number(value || 0).toLocaleString()

/* ── Contador animado ─────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 1000 }) {
  const [displayed, setDisplayed] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const start = prev.current
    const end = Number(value) || 0
    prev.current = end
    if (start === end) return
    const startTime = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(start + (end - start) * ease))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])
  return displayed.toLocaleString()
}

/* ── KPI Card con gradiente y animación ──────────────────────── */
function KpiCard({ darkMode, icon: Icon, label, value, sub, accent = 'cyan', delay = 0, large = false }) {
  const accents = {
    cyan:    { border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    glow: 'shadow-cyan-500/20'   },
    purple:  { border: 'border-purple-500/30', bg: 'bg-purple-500/10',  text: 'text-purple-400',  glow: 'shadow-purple-500/20' },
    emerald: { border: 'border-emerald-500/30',bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/20'},
    amber:   { border: 'border-amber-500/30',  bg: 'bg-amber-500/10',   text: 'text-amber-400',   glow: 'shadow-amber-500/20'  },
    pink:    { border: 'border-pink-500/30',   bg: 'bg-pink-500/10',    text: 'text-pink-400',    glow: 'shadow-pink-500/20'   },
  }
  const a = accents[accent] || accents.cyan

  return (
    <div
      className={`relative rounded-2xl border p-5 overflow-hidden group cursor-default
        transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
        animate-slide-up ${a.border} ${darkMode ? 'bg-white/[0.03]' : 'bg-white'} ${a.glow}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both', opacity: 0 }}
    >
      {/* Fondo degradado sutil en hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${a.bg}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {label}
          </p>
          <p className={`mt-2 ${large ? 'text-4xl' : 'text-3xl'} font-black ${darkMode ? 'text-white' : 'text-gray-900'} leading-none`}>
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </p>
          {sub && (
            <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${a.bg} ${a.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

/* ── Barra de progreso animada ───────────────────────────────── */
function ProgressBar({ value, max, color = 'cyan', darkMode }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))
  const colors = {
    cyan:    'from-cyan-500 to-sky-400',
    purple:  'from-purple-500 to-violet-400',
    emerald: 'from-emerald-500 to-green-400',
    amber:   'from-amber-500 to-yellow-400',
  }
  return (
    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${colors[color] || colors.cyan} transition-all duration-1000 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ── SectionCard con entrada animada ─────────────────────────── */
function SectionCard({ darkMode, title, subtitle, children, delay = 0, accent }) {
  const accentBar = {
    cyan:    'bg-cyan-400',
    purple:  'bg-purple-400',
    emerald: 'bg-emerald-400',
    amber:   'bg-amber-400',
  }
  return (
    <section
      className={`rounded-3xl border p-5 md:p-6 animate-slide-up
        ${darkMode ? 'border-white/10 bg-[#0e1525]/90 backdrop-blur-xl' : 'border-gray-200 bg-white shadow-sm'}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both', opacity: 0 }}
    >
      <div className="flex items-start gap-3 mb-5">
        {accent && <div className={`w-1 h-10 rounded-full shrink-0 mt-0.5 ${accentBar[accent] || accentBar.cyan}`} />}
        <div>
          <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
          {subtitle && <p className={`mt-0.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

/* ── Gráfico de barras rediseñado ────────────────────────────── */
function BarChart({ darkMode, values }) {
  const [hovered, setHovered] = useState(null)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const found = values.find(v => v.date === key) || { date: key, messages: 0 }
    return {
      ...found,
      dayName: d.toLocaleDateString('es-MX', { weekday: 'short' }),
      dayNum:  d.toLocaleDateString('es-MX', { day: 'numeric' }),
      month:   d.toLocaleDateString('es-MX', { month: 'short' }),
    }
  })

  const max = Math.max(...days.map(d => d.messages), 1)
  const bestVal = Math.max(...days.map(d => d.messages))
  const total = days.reduce((s, d) => s + d.messages, 0)
  const avg = Math.round(total / 7)

  return (
    <div className="space-y-4">
      {/* Línea de promedio + barras */}
      <div className="relative h-52">
        {/* Grid de referencia */}
        {[0, 25, 50, 75, 100].map(pct => (
          <div
            key={pct}
            className={`absolute w-full border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}
            style={{ bottom: `${pct}%` }}
          />
        ))}

        {/* Línea de promedio */}
        {avg > 0 && (
          <div
            className={`absolute w-full border-t-2 border-dashed z-10 flex items-center ${darkMode ? 'border-yellow-400/50' : 'border-yellow-500/60'}`}
            style={{ bottom: `${(avg / max) * 100}%` }}
          >
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto mr-1 ${darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
              prom {avg}
            </span>
          </div>
        )}

        {/* Barras */}
        <div className="absolute inset-0 flex items-end gap-2 px-1">
          {days.map((item, idx) => {
            const heightPct = max > 0 ? Math.max(4, (item.messages / max) * 100) : 4
            const isBest = item.messages === bestVal && bestVal > 0
            const isHovered = hovered === idx

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center justify-end h-full gap-1 cursor-pointer group"
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHovered && item.messages > 0 && (
                  <div className={`absolute z-20 -top-2 px-3 py-2 rounded-xl text-xs font-bold shadow-xl whitespace-nowrap
                    ${darkMode ? 'bg-gray-800 text-white border border-white/10' : 'bg-gray-900 text-white'}`}
                    style={{ bottom: `${heightPct + 8}%` }}
                  >
                    {item.dayName} {item.dayNum} {item.month}<br />
                    <span className="text-cyan-400">{formatCompact(item.messages)} mensajes</span>
                  </div>
                )}

                {/* Valor encima */}
                {item.messages > 0 && (
                  <span className={`text-[11px] font-black mb-1 transition-all
                    ${isBest ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-gray-300' : 'text-gray-700')}
                    ${isHovered ? 'scale-125' : ''}`}
                    style={{ animationDelay: `${200 + idx * 80}ms` }}
                  >
                    {item.messages}
                  </span>
                )}

                {/* Barra */}
                <div
                  className={`w-full rounded-t-xl transition-all duration-200
                    ${isBest
                      ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300 shadow-lg shadow-emerald-500/30'
                      : isHovered
                        ? 'bg-gradient-to-t from-cyan-500 via-sky-400 to-blue-300 shadow-lg shadow-cyan-500/30 scale-x-110'
                        : darkMode
                          ? 'bg-gradient-to-t from-cyan-600 via-sky-500 to-purple-400'
                          : 'bg-gradient-to-t from-cyan-500 via-sky-400 to-indigo-400'
                    }`}
                  style={{
                    height: `${heightPct}%`,
                    animationDelay: `${300 + idx * 80}ms`,
                  }}
                />

                {/* Etiqueta */}
                <div className="text-center mt-1.5 leading-none">
                  <p className={`text-[11px] font-bold capitalize
                    ${isBest ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                    {item.dayName}
                  </p>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {item.dayNum}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resumen debajo del gráfico */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Mejor día', val: formatCompact(bestVal), color: darkMode ? 'text-emerald-400' : 'text-emerald-600' },
          { label: 'Promedio',  val: avg,                    color: darkMode ? 'text-yellow-400' : 'text-yellow-600'  },
          { label: 'Total 7d',  val: formatCompact(total),   color: darkMode ? 'text-cyan-400'   : 'text-cyan-600'    },
          { label: 'Con datos', val: `${days.filter(d => d.messages > 0).length}/7`, color: darkMode ? 'text-purple-400' : 'text-purple-600' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-xl p-3 text-center ${darkMode ? 'bg-white/5 border border-white/8' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-[10px] uppercase tracking-wider font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
            <p className={`mt-1 text-lg font-black ${color}`}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────── */
export function StatisticsDashboard({ onGoHome, onGoStudio, darkMode, user, authToken }) {
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState(null)

  const loadStats = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true)
      setError(null)
      const res  = await fetch(`${API_URL}/api/stats`, { headers: { Authorization: `Bearer ${authToken}` } })
      const data = await res.json()
      if (data.success) setStats(data)
      else setError(data.error || 'Error cargando estadísticas')
    } catch (err) {
      setError('Error conectando con el servidor')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { if (authToken && user) loadStats() }, [authToken, user])

  useEffect(() => {
    const onTok = () => { if (authToken && user) loadStats(true) }
    window.addEventListener('voltvoice:tokens-updated', onTok)
    return () => window.removeEventListener('voltvoice:tokens-updated', onTok)
  }, [authToken, user])

  const derived = useMemo(() => {
    if (!stats) return null
    const { current_month, benefits, daily_breakdown, top_voices, plan_info, all_time } = stats
    const sortedDaily = [...(daily_breakdown || [])].sort((a, b) => a.date.localeCompare(b.date))
    const last7 = sortedDaily.slice(-7).map(item => ({
      ...item,
      label: new Date(`${item.date}T00:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' }),
    }))
    const bestDay          = sortedDaily.reduce((b, i) => (!b || i.messages > b.messages ? i : b), null)
    const activeDays       = sortedDaily.filter(i => i.messages > 0).length
    const avgPerDay        = activeDays > 0 ? Math.round(current_month.messages_count / activeDays) : 0
    const avgTokensPerMsg  = current_month.messages_count > 0
      ? (current_month.tokens_used / current_month.messages_count).toFixed(1) : '0.0'
    const usagePct         = plan_info.token_limit > 0
      ? Math.min(100, Math.round((plan_info.tokens_balance / plan_info.token_limit) * 100)) : 0
    const growth           = benefits?.growth_vs_last_month?.messages_change_percent || 0

    return { last7, bestDay, activeDays, avgPerDay, avgTokensPerMsg, usagePct, growth,
             current_month, benefits, plan_info, all_time, top_voices: top_voices || [] }
  }, [stats])

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#07111f]' : 'bg-gray-50'}`}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30 animate-pulse">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Cargando estadísticas…
        </div>
      </div>
    </div>
  )

  /* ── Error ───────────────────────────────────────────────── */
  if (error) return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${darkMode ? 'bg-[#07111f]' : 'bg-gray-50'}`}>
      <div className={`max-w-sm w-full rounded-3xl border p-8 text-center ${darkMode ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
        <p className="text-lg font-bold">No se pudieron cargar las estadísticas</p>
        <p className="mt-2 text-sm opacity-70">{error}</p>
        <button onClick={() => loadStats()} className="mt-5 px-5 py-2 rounded-xl bg-red-500/20 text-red-300 font-semibold hover:bg-red-500/30 transition-colors inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    </div>
  )

  if (!stats || !derived) return null

  const { current_month, benefits, plan_info, all_time, last7, activeDays,
          avgPerDay, avgTokensPerMsg, usagePct, growth, top_voices } = derived

  const growthPositive = growth >= 0

  /* ── Render principal ────────────────────────────────────── */
  return (
    <div className={`min-h-screen pb-24 ${
      darkMode
        ? 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(6,182,212,0.12),transparent),linear-gradient(180deg,#060d1a_0%,#08111f_100%)]'
        : 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(14,165,233,0.08),transparent),linear-gradient(180deg,#f0f7ff_0%,#f5f7fb_100%)]'
    }`}>

      {/* Nav */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-[#060d1a]/80 border-white/8' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onGoStudio} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 bg-clip-text text-transparent">
            Estadísticas del Stream
          </h1>
          <button
            onClick={() => loadStats(true)}
            className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all ${darkMode ? 'text-gray-300 hover:text-white hover:bg-white/8' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-6">

        {/* ── HERO: KPIs principales ── */}
        <div
          className={`rounded-3xl border p-6 md:p-8 animate-slide-up ${
            darkMode
              ? 'border-cyan-500/20 bg-[linear-gradient(135deg,rgba(6,182,212,0.07),rgba(139,92,246,0.05))]'
              : 'border-indigo-200 bg-white shadow-sm'
          }`}
          style={{ animationFillMode: 'both', opacity: 0 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5
              ${darkMode ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
              <Sparkles className="w-3.5 h-3.5" /> Vista general
            </div>
            <div className={`ml-auto flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full
              ${growthPositive
                ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                : (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')}`}>
              {growthPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {growthPositive ? '+' : ''}{growth.toFixed(1)}% vs mes anterior
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard darkMode={darkMode} icon={Wallet}       label="Tokens disponibles"  value={plan_info.tokens_balance}       sub={`Plan ${String(plan_info.current_plan || 'free').toUpperCase()} · ${usagePct}% disponible`} accent="cyan"    delay={0}   />
            <KpiCard darkMode={darkMode} icon={MessageSquare} label="Mensajes este mes"   value={current_month.messages_count}   sub={`${avgPerDay} por día activo`}                                                            accent="purple"  delay={80}  />
            <KpiCard darkMode={darkMode} icon={Clock3}       label="Horas recuperadas"   value={benefits.hours_saved.toFixed(1)} sub="Tiempo que ya no haces manualmente"                                                       accent="emerald" delay={160} />
            <KpiCard darkMode={darkMode} icon={Activity}     label="Días activos"        value={activeDays}                     sub={`de los últimos 30 días`}                                                                 accent="amber"   delay={240} />
          </div>

          {/* Barra de capacidad */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Capacidad de tokens</span>
              <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatCompact(plan_info.tokens_balance)} / {formatCompact(plan_info.token_limit)}
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-white/8' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 transition-all duration-1000"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── GRÁFICO DE TENDENCIA ── */}
        <SectionCard
          darkMode={darkMode}
          title="Tendencia de los últimos 7 días"
          subtitle="Mensajes procesados día por día — el mejor día se marca en verde"
          accent="cyan"
          delay={200}
        >
          {last7.length > 0
            ? <BarChart darkMode={darkMode} values={last7} />
            : <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${darkMode ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                Sin datos suficientes para mostrar tendencia. Usa StreamVoicer durante unos días y vuelve aquí.
              </div>
          }
        </SectionCard>

        {/* ── RENDIMIENTO + IMPACTO ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <SectionCard darkMode={darkMode} title="Consumo del mes" subtitle="Uso detallado de recursos" accent="purple" delay={300}>
            <div className="space-y-4">
              {[
                { label: 'Tokens usados',          value: current_month.tokens_used,          total: plan_info.token_limit, unit: 'tokens',    color: 'purple', icon: Zap         },
                { label: 'Caracteres sintetizados', value: current_month.characters_synthesized, total: null,                unit: 'caracteres', color: 'amber',  icon: Mic2        },
                { label: 'Voces distintas',         value: current_month.unique_voices_used,   total: plan_info.voice_clone_limit, unit: 'voces', color: 'cyan', icon: Users       },
              ].map(({ label, value, total, unit, color, icon: Ic }) => (
                <div key={label} className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.03] border border-white/8' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Ic className={`w-4 h-4 ${darkMode ? `text-${color}-400` : `text-${color}-600`}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
                    </div>
                    <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <AnimatedNumber value={value} />
                    </span>
                  </div>
                  {total && <ProgressBar value={value} max={total} color={color} darkMode={darkMode} />}
                  {!total && <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatCompact(value)} {unit} este mes</div>}
                </div>
              ))}
              <div className={`rounded-xl px-4 py-2.5 flex justify-between items-center ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Promedio tokens/mensaje</span>
                <span className={`text-sm font-black ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{avgTokensPerMsg}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard darkMode={darkMode} title="Impacto de StreamVoicer" subtitle="El valor real de tu automatización" accent="emerald" delay={380}>
            <div className="space-y-3 h-full">
              {[
                { icon: MessageSquare, label: 'Mensajes automatizados',  val: formatCompact(current_month.messages_count),  color: 'cyan'    },
                { icon: Clock3,        label: 'Horas recuperadas',        val: `${benefits.hours_saved.toFixed(1)} hrs`,     color: 'emerald' },
                { icon: Users,         label: 'Voces utilizadas',         val: current_month.unique_voices_used,             color: 'purple'  },
                { icon: Calendar,      label: 'Días activos este mes',    val: activeDays,                                   color: 'amber'   },
                { icon: Star,          label: 'Total histórico',          val: formatCompact(all_time.total_messages),       color: 'pink'    },
                { icon: Zap,           label: 'Antigüedad de la cuenta',  val: `${all_time.account_age_days} días`,          color: 'cyan'    },
              ].map(({ icon: Ic, label, val, color }, i) => (
                <div key={label}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl group transition-all duration-200 cursor-default
                    hover:-translate-x-1 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                  style={{ animationDelay: `${400 + i * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                      ${darkMode ? `bg-${color}-500/15 text-${color}-400` : `bg-${color}-100 text-${color}-600`}`}>
                      <Ic className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                  </div>
                  <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{val}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── RANKING DE VOCES ── */}
        <SectionCard darkMode={darkMode} title="Ranking de voces" subtitle="Las voces más usadas en tu stream este mes" accent="amber" delay={450}>
          {top_voices.length > 0 ? (
            <div className="space-y-3">
              {top_voices.map((voice, i) => {
                const maxCount = top_voices[0].count
                const pct = Math.round((voice.count / maxCount) * 100)
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div
                    key={`${voice.voice_name}-${i}`}
                    className={`rounded-2xl p-4 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      i === 0
                        ? darkMode ? 'border-amber-500/30 bg-amber-500/8' : 'border-amber-200 bg-amber-50'
                        : darkMode ? 'border-white/8 bg-white/[0.02]'     : 'border-gray-200 bg-gray-50'
                    }`}
                    style={{ animationDelay: `${500 + i * 70}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{medals[i] || `#${i + 1}`}</span>
                        <div>
                          <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {voice.voice_name || 'Sin nombre'}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatCompact(voice.tokens_used)} tokens usados
                          </p>
                        </div>
                      </div>
                      <span className={`text-2xl font-black ${i === 0 ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                        {formatCompact(voice.count)}
                        <span className={`text-xs font-normal ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>usos</span>
                      </span>
                    </div>
                    <ProgressBar value={voice.count} max={maxCount} color={i === 0 ? 'amber' : 'cyan'} darkMode={darkMode} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${darkMode ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
              Aún no hay suficiente uso registrado para mostrar ranking de voces.
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
