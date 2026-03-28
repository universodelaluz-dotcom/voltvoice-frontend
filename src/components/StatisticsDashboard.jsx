import React, { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, Users, Clock, DollarSign, BarChart3, Zap } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export function StatisticsDashboard({ onGoHome, onGoStudio, darkMode, user, authToken }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authToken || !user) return
    loadStats()
  }, [authToken, user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
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
    }
  }

  const StatCard = ({ label, value, icon: Icon, color = 'cyan' }) => {
    const bgColor = color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-purple-500/10 border-purple-500/30'
    const textColor = color === 'cyan' ? 'text-cyan-300' : 'text-purple-300'
    return (
      <div className={`${darkMode ? bgColor : 'bg-indigo-50 border-indigo-200'} border rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          {Icon && <Icon className={`w-4 h-4 ${darkMode ? textColor : 'text-indigo-500'}`} />}
        </div>
        <p className={`text-2xl font-bold ${darkMode ? textColor : 'text-indigo-600'}`}>{value}</p>
      </div>
    )
  }

  const BenefitCard = ({ label, value, icon: Icon, color = 'green' }) => {
    const bgColor = color === 'green'
      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30'
      : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
    const textColor = color === 'green' ? 'text-green-300' : 'text-cyan-300'
    return (
      <div className={`${darkMode ? bgColor : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'} border rounded-lg p-5`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
          {Icon && <Icon className={`w-5 h-5 ${darkMode ? textColor : 'text-green-600'}`} />}
        </div>
        <p className={`text-3xl font-bold ${darkMode ? textColor : 'text-green-600'}`}>{value}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#0a0a1a]' : 'bg-gray-50'}`}>
        <nav className={`fixed top-0 w-full backdrop-blur-md z-50 ${
          darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-indigo-200'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={onGoStudio} className={`flex items-center gap-2 ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-indigo-600'}`}>
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Estadísticas
            </h1>
            <div className="w-20"></div>
          </div>
        </nav>
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cargando estadísticas...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#0a0a1a]' : 'bg-gray-50'}`}>
        <nav className={`fixed top-0 w-full backdrop-blur-md z-50 ${
          darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-indigo-200'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={onGoStudio} className={`flex items-center gap-2 ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-indigo-600'}`}>
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Estadísticas
            </h1>
            <div className="w-20"></div>
          </div>
        </nav>
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className={`text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const { current_month, benefits, all_time, daily_breakdown, top_voices, plan_info } = stats
  const growthPercent = benefits.growth_vs_last_month.messages_change_percent

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0a0a1a]' : 'bg-gray-50'} pb-20`}>
      {/* Header */}
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 ${
        darkMode ? 'bg-[#0f0f23]/80 border-b border-cyan-500/20' : 'bg-white/80 border-b border-indigo-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onGoHome} className={`flex items-center gap-2 transition-colors ${
            darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-indigo-600 hover:text-indigo-700'
          }`}>
            <ArrowLeft className="w-5 h-5" /> Volver
          </button>
          <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Estadísticas
          </h1>
          <div className="w-20"></div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-28">
        {/* Beneficios Ganados - HERO */}
        <section className="mb-10">
          <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🎯 Beneficios Ganados</h2>

          {/* Gran ROI Card */}
          <div className={`${darkMode ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-500/40' : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300'} border rounded-lg p-8 mb-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Dinero ahorrado este mes</p>
                <p className={`text-5xl font-black mt-2 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  ${benefits.money_saved_usd.toFixed(2)}
                </p>
                <p className={`text-xs mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{benefits.money_saved_calculation}</p>
              </div>
              <DollarSign className={`w-16 h-16 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
            </div>
          </div>

          {/* 4 Benefit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <BenefitCard
              label="💰 Dinero ahorrado"
              value={`$${benefits.money_saved_usd.toFixed(2)}`}
              color="green"
            />
            <BenefitCard
              label="⏱️ Horas ahorradas"
              value={benefits.hours_saved.toFixed(1)}
              color="cyan"
            />
            <BenefitCard
              label="👥 Alcance estimado"
              value={benefits.estimated_viewers_reached.toLocaleString()}
              color="cyan"
            />
            <BenefitCard
              label={`📈 Crecimiento mes anterior`}
              value={`${growthPercent > 0 ? '+' : ''}${growthPercent.toFixed(1)}%`}
              color={growthPercent >= 0 ? 'green' : 'cyan'}
            />
          </div>
        </section>

        {/* Current Month */}
        <section className="mb-10">
          <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📊 Este Mes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Mensajes escuchados" value={current_month.messages_count.toLocaleString()} icon={BarChart3} color="cyan" />
            <StatCard label="Tokens usados" value={current_month.tokens_used.toLocaleString()} icon={Zap} color="purple" />
            <StatCard label="Caracteres sintetizados" value={current_month.characters_synthesized.toLocaleString()} icon={BarChart3} color="cyan" />
            <StatCard label="Voces únicas" value={current_month.unique_voices_used} icon={Users} color="purple" />
          </div>
        </section>

        {/* All-Time Stats */}
        <section className="mb-10">
          <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🏆 Historial Total</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total de mensajes" value={all_time.total_messages.toLocaleString()} icon={BarChart3} color="cyan" />
            <StatCard label="Total tokens" value={all_time.total_tokens_used.toLocaleString()} icon={Zap} color="purple" />
            <StatCard label="Dinero ahorrado (total)" value={`$${all_time.total_money_saved_usd.toFixed(2)}`} icon={DollarSign} color="cyan" />
            <StatCard label="Horas ahorradas (total)" value={all_time.total_hours_saved.toFixed(1)} icon={Clock} color="purple" />
          </div>
        </section>

        {/* Top Voices */}
        {top_voices.length > 0 && (
          <section className="mb-10">
            <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🎤 Voces Más Usadas</h2>
            <div className={`${darkMode ? 'bg-[#1a1a2e] border-cyan-400/30' : 'bg-white border-indigo-200'} border rounded-lg overflow-hidden`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${darkMode ? 'bg-[#0f0f23] border-b border-cyan-400/20' : 'bg-gray-50 border-b border-indigo-200'}`}>
                    <th className={`text-left px-6 py-3 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Voz</th>
                    <th className={`text-right px-6 py-3 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Usos</th>
                    <th className={`text-right px-6 py-3 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tokens consumidos</th>
                  </tr>
                </thead>
                <tbody>
                  {top_voices.map((voice, idx) => (
                    <tr key={idx} className={`${darkMode ? 'border-b border-cyan-400/10 hover:bg-[#0f0f23]/50' : 'border-b border-indigo-100 hover:bg-gray-50'}`}>
                      <td className={`px-6 py-3 font-medium ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>{voice.voice_name}</td>
                      <td className={`px-6 py-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{voice.count}</td>
                      <td className={`px-6 py-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{voice.tokens_used.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Plan Info */}
        <section>
          <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🎁 Tu Plan</h2>
          <div className={`${darkMode ? 'bg-[#1a1a2e] border-cyan-400/30' : 'bg-white border-indigo-200'} border rounded-lg p-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Plan actual</p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>{plan_info.current_plan.toUpperCase()}</p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tokens disponibles</p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>{plan_info.tokens_balance} / {plan_info.token_limit}</p>
                <div className={`mt-2 w-full h-2 rounded-full ${darkMode ? 'bg-[#0f0f23]' : 'bg-gray-200'}`}>
                  <div className={`h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500`} style={{width: `${(plan_info.tokens_balance / plan_info.token_limit) * 100}%`}}></div>
                </div>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Voces clonadas</p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>{plan_info.voice_clones_used} / {plan_info.voice_clone_limit}</p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Antigüedad</p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>{all_time.account_age_days} días</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
