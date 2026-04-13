import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  DollarSign,
  Loader2,
  MessageSquare,
  Mic2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const formatCompact = (value) => Number(value || 0).toLocaleString()
const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

function StatTile({ darkMode, icon: Icon, label, value, hint, tone = 'cyan' }) {
  const tones = {
    cyan: darkMode
      ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300'
      : 'border-cyan-200 bg-cyan-50 text-cyan-700',
    purple: darkMode
      ? 'border-purple-400/20 bg-purple-500/10 text-purple-300'
      : 'border-purple-200 bg-purple-50 text-purple-700',
    emerald: darkMode
      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: darkMode
      ? 'border-amber-400/20 bg-amber-500/10 text-amber-300'
      : 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return (
    <div className={`h-full rounded-2xl border p-4 overflow-hidden ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-white/55' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {hint && (
            <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-white/60' : 'text-gray-500'}`}>
              {hint}
            </p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${darkMode ? 'bg-white/6' : 'bg-white/70'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function SectionCard({ darkMode, title, subtitle, action, children }) {
  return (
    <section className={`rounded-3xl border p-5 md:p-6 ${
      darkMode
        ? 'border-cyan-400/15 bg-[#11162a]/82 backdrop-blur-xl'
        : 'border-indigo-200 bg-white shadow-sm'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
          {subtitle && (
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function TinyBarChart({ darkMode, values }) {
  const max = Math.max(...values.map((item) => item.messages), 1)

  return (
    <div className="grid grid-cols-7 gap-2 items-end h-40">
      {values.map((item) => {
        const height = Math.max(10, (item.messages / max) * 100)
        return (
          <div key={item.date} className="flex flex-col items-center justify-end h-full">
            <div
              className={`w-full rounded-t-xl rounded-b-md transition-all ${
                darkMode
                  ? 'bg-gradient-to-t from-cyan-500 via-sky-400 to-purple-400'
                  : 'bg-gradient-to-t from-cyan-500 via-sky-400 to-indigo-400'
              }`}
              style={{ height: `${height}%` }}
              title={`${item.label}: ${formatCompact(item.messages)} mensajes`}
            />
            <span className={`mt-2 text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {item.shortLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function StatisticsDashboard({ onGoHome, onGoStudio, darkMode, user, authToken }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadStats = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const res = await fetch(`${API_URL}/api/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const data = await res.json()

      if (data.success) {
        setStats(data)
      } else {
        setError(data.error || 'Error cargando estadísticas')
      }
    } catch (err) {
      console.error('[Stats] Error:', err)
      setError('Error conectando con el servidor')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!authToken || !user) return
    loadStats()
  }, [authToken, user])

  useEffect(() => {
    const onTokenUpdate = () => {
      if (authToken && user) {
        loadStats(true)
      }
    }
    window.addEventListener('voltvoice:tokens-updated', onTokenUpdate)
    return () => window.removeEventListener('voltvoice:tokens-updated', onTokenUpdate)
  }, [authToken, user])

  const derived = useMemo(() => {
    if (!stats) return null

    const { current_month, benefits, daily_breakdown, top_voices, plan_info, all_time } = stats
    const sortedDaily = [...(daily_breakdown || [])].sort((a, b) => a.date.localeCompare(b.date))
    const last7 = sortedDaily.slice(-7).map((item) => {
      const date = new Date(`${item.date}T00:00:00`)
      return {
        ...item,
        label: date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' }),
        shortLabel: date.toLocaleDateString('es-MX', { weekday: 'short' }).slice(0, 3)
      }
    })

    const bestDay = sortedDaily.reduce((best, item) => {
      if (!best || item.messages > best.messages) return item
      return best
    }, null)

    const activeDays = sortedDaily.filter((item) => item.messages > 0).length
    const avgMessagesPerActiveDay = activeDays > 0
      ? Math.round(current_month.messages_count / activeDays)
      : 0
    const avgTokensPerMessage = current_month.messages_count > 0
      ? (current_month.tokens_used / current_month.messages_count).toFixed(1)
      : '0.0'
    const usagePercent = plan_info.token_limit > 0
      ? Math.min(100, Math.round((plan_info.tokens_balance / plan_info.token_limit) * 100))
      : 0
    const voiceLeader = top_voices?.[0] || null
    const growth = benefits?.growth_vs_last_month?.messages_change_percent || 0

    return {
      last7,
      bestDay,
      activeDays,
      avgMessagesPerActiveDay,
      avgTokensPerMessage,
      usagePercent,
      voiceLeader,
      growth,
      current_month,
      benefits,
      plan_info,
      all_time
    }
  }, [stats])

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#07111f]' : 'bg-[#f5f7fb]'}`}>
        <nav className={`fixed top-0 w-full backdrop-blur-md z-50 ${
          darkMode ? 'bg-[#0c1528]/85 border-b border-cyan-400/15' : 'bg-white/85 border-b border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={onGoStudio} className={`flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Rendimiento del Stream
            </h1>
            <div className="w-20" />
          </div>
        </nav>
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className={`flex items-center gap-3 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Loader2 className="w-6 h-6 animate-spin" />
            Cargando estadísticas...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#07111f]' : 'bg-[#f5f7fb]'}`}>
        <nav className={`fixed top-0 w-full backdrop-blur-md z-50 ${
          darkMode ? 'bg-[#0c1528]/85 border-b border-cyan-400/15' : 'bg-white/85 border-b border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={onGoStudio} className={`flex items-center gap-2 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Rendimiento del Stream
            </h1>
            <div className="w-20" />
          </div>
        </nav>
        <div className="min-h-screen pt-24 flex items-center justify-center px-6">
          <div className={`max-w-xl rounded-3xl border p-8 text-center ${
            darkMode ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            <p className="text-lg font-bold">No pude cargar el panel</p>
            <p className="mt-2 text-sm opacity-80">{error}</p>
            <button
              onClick={() => loadStats()}
              className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold ${
                darkMode ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!stats || !derived) return null

  const { current_month, benefits, plan_info, all_time, last7, bestDay, activeDays, avgMessagesPerActiveDay, avgTokensPerMessage, usagePercent, voiceLeader, growth } = derived
  const bestDayLabel = bestDay
    ? new Date(`${bestDay.date}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    : 'N/A'

  return (
    <div className={`min-h-screen pb-20 ${
      darkMode
        ? 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_28%),linear-gradient(180deg,#07111f_0%,#0b1020_52%,#0d1528_100%)]'
        : 'bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_25%),linear-gradient(180deg,#f6fbff_0%,#f5f7fb_100%)]'
    }`}>
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 ${
        darkMode ? 'bg-[#0c1528]/80 border-b border-cyan-400/15' : 'bg-white/80 border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onGoStudio}
            className={`flex items-center gap-2 transition-colors ${
              darkMode ? 'text-cyan-300 hover:text-cyan-200' : 'text-indigo-600 hover:text-indigo-700'
            }`}
          >
            <ArrowLeft className="w-5 h-5" /> Volver
          </button>
          <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Rendimiento del Stream
          </h1>
          <button
            onClick={() => loadStats(true)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
              darkMode ? 'bg-white/6 text-white hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-28 space-y-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${
          darkMode
            ? 'border-cyan-400/15 bg-[linear-gradient(135deg,rgba(8,15,30,0.95),rgba(16,27,48,0.88))]'
            : 'border-indigo-200 bg-[linear-gradient(135deg,#ffffff,#eef6ff)] shadow-sm'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                darkMode ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'
              }`}>
                <Sparkles className="w-4 h-4" />
                Vista general
              </div>
              <h2 className={`mt-4 text-3xl md:text-5xl font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Resumen real de tu operación de voz.
              </h2>
              <p className={`mt-4 max-w-2xl text-sm md:text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Aquí ves métricas clave de uso: saldo de tokens, actividad del mes, consumo y rendimiento por voz para tomar decisiones rápidas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <StatTile
                  darkMode={darkMode}
                  icon={Wallet}
                  label="Tokens disponibles"
                  value={`${formatCompact(plan_info.tokens_balance)} / ${formatCompact(plan_info.token_limit)}`}
                  hint={`${usagePercent}% del cupo actual todavía disponible`}
                  tone="cyan"
                />
                <StatTile
                  darkMode={darkMode}
                  icon={MessageSquare}
                  label="Mensajes del mes"
                  value={formatCompact(current_month.messages_count)}
                  hint={`${avgMessagesPerActiveDay} promedio por día activo`}
                  tone="purple"
                />
                <StatTile
                  darkMode={darkMode}
                  icon={Clock3}
                  label="Horas ahorradas"
                  value={benefits.hours_saved.toFixed(1)}
                  hint="Tiempo recuperado este mes gracias a lectura automatizada"
                  tone="emerald"
                />
              </div>
            </div>

            <div className={`rounded-3xl border p-5 ${
              darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white bg-white/80'
            }`}>
              <p className={`text-xs uppercase tracking-[0.2em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Saldo del plan
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCompact(plan_info.tokens_balance)}
                  </p>
                  <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    tokens listos para usar
                  </p>
                </div>
                <div className={`text-right ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                  <p className="text-xs uppercase tracking-[0.2em]">Plan</p>
                  <p className="text-lg font-black">{String(plan_info.current_plan || 'free').toUpperCase()}</p>
                </div>
              </div>
              <div className={`mt-5 h-3 rounded-full overflow-hidden ${darkMode ? 'bg-[#07111f]' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className={`mt-3 flex items-center justify-between text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                <span>{formatCompact(plan_info.tokens_balance)} disponibles</span>
                <span>{formatCompact(plan_info.token_limit)} de capacidad base</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
          <SectionCard
            darkMode={darkMode}
            title="Pulso del mes"
            subtitle="Actividad de tu stream en lectura de voz y consumo"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <StatTile
                darkMode={darkMode}
                icon={BarChart3}
                label="Mensajes procesados"
                value={formatCompact(current_month.messages_count)}
                hint="Mensajes que entraron al sistema este mes"
                tone="cyan"
              />
              <StatTile
                darkMode={darkMode}
                icon={Zap}
                label="Tokens usados"
                value={formatCompact(current_month.tokens_used)}
                hint={`${avgTokensPerMessage} tokens por mensaje en promedio`}
                tone="purple"
              />
              <StatTile
                darkMode={darkMode}
                icon={Mic2}
                label="Caracteres sintetizados"
                value={formatCompact(current_month.characters_synthesized)}
                hint="Texto total convertido en voz este mes"
                tone="amber"
              />
              <StatTile
                darkMode={darkMode}
                icon={TrendingUp}
                label="Cambio vs mes pasado"
                value={`${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
                hint="Comparación de actividad frente al mes anterior"
                tone={growth >= 0 ? 'emerald' : 'purple'}
              />
            </div>

            {last7.length > 0 ? (
              <>
                <TinyBarChart darkMode={darkMode} values={last7} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  <div className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Mejor día reciente
                    </p>
                    <p className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {bestDayLabel}
                    </p>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {bestDay ? `${formatCompact(bestDay.messages)} mensajes` : 'Sin datos'}
                    </p>
                  </div>
                  <div className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Días activos
                    </p>
                    <p className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {activeDays}
                    </p>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      de los últimos 30 días
                    </p>
                  </div>
                  <div className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                    <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Voces usadas
                    </p>
                    <p className={`mt-2 text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {current_month.unique_voices_used}
                    </p>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      variedad real este mes
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className={`rounded-2xl border border-dashed p-6 text-sm ${
                darkMode ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-500'
              }`}>
                Aún no hay suficiente historial diario para dibujar tendencia.
              </div>
            )}
          </SectionCard>

          <SectionCard
            darkMode={darkMode}
            title="Beneficios para el stream"
            subtitle="Indicadores para medir retorno y carga operativa"
          >
            <div className="space-y-4">
              <StatTile
                darkMode={darkMode}
                icon={DollarSign}
                label="Ahorro estimado del mes"
                value={formatMoney(benefits.money_saved_usd)}
                hint="Estimación basada en tiempo de lectura que ya no haces manualmente"
                tone="emerald"
              />
              <div className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Valor más útil para ti
                </p>
                <p className={`mt-2 text-base leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Si mantienes este ritmo, el sistema seguirá reduciendo carga operativa en chat y lectura de voz.
                </p>
              </div>
              <div className={`rounded-2xl p-4 ${darkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Historial total
                </p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCompact(all_time.total_messages)}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>mensajes totales</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {all_time.total_hours_saved.toFixed(1)}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>horas recuperadas</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <SectionCard
            darkMode={darkMode}
            title="Voces más usadas"
            subtitle="Uso real según logs"
          >
            {stats.top_voices?.length ? (
              <div className="space-y-3">
                {stats.top_voices.map((voice, index) => (
                  <div
                    key={`${voice.voice_name}-${index}`}
                    className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${
                      darkMode ? 'border-cyan-400/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {voice.voice_name || 'Sin nombre'}
                      </p>
                      <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatCompact(voice.count)} usos · {formatCompact(voice.tokens_used)} tokens
                      </p>
                    </div>
                    <div className={`text-right ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                      <p className="text-xl font-black">#{index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border border-dashed p-6 text-sm ${
                darkMode ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-500'
              }`}>
                Todavía no hay suficientes usos registrados para mostrar ranking de voces.
              </div>
            )}
          </SectionCard>

          <SectionCard
            darkMode={darkMode}
            title="Tu cuenta"
            subtitle="Datos clave para operación y crecimiento"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatTile
                darkMode={darkMode}
                icon={Wallet}
                label="Plan actual"
                value={String(plan_info.current_plan || 'free').toUpperCase()}
                hint={`${formatCompact(plan_info.tokens_balance)} tokens disponibles`}
                tone="cyan"
              />
              <StatTile
                darkMode={darkMode}
                icon={Mic2}
                label="Voces clonadas"
                value={`${formatCompact(plan_info.voice_clones_used)} / ${formatCompact(plan_info.voice_clone_limit)}`}
                hint="Capacidad usada de tu plan"
                tone="purple"
              />
              <StatTile
                darkMode={darkMode}
                icon={Sparkles}
                label="Voz líder"
                value={voiceLeader?.voice_name || 'N/A'}
                hint={voiceLeader ? `${formatCompact(voiceLeader.count)} usos registrados` : 'Todavía sin suficiente uso'}
                tone="amber"
              />
              <StatTile
                darkMode={darkMode}
                icon={Clock3}
                label="Antigüedad"
                value={`${formatCompact(all_time.account_age_days)} días`}
                hint="Tiempo de vida de tu cuenta"
                tone="emerald"
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

