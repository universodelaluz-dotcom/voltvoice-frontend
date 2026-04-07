import { useState, useEffect, useCallback } from 'react'
import {
  Users, Zap, TrendingUp, Activity, Search, ChevronLeft,
  RefreshCw, Shield, Edit2, Check, X, Plus, BarChart2, Wifi, Tag
} from 'lucide-react'
import CouponManager from './CouponManager'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const PLANS = ['all', 'free', 'start', 'creator', 'pro', 'admin']

const PLAN_STYLE = {
  all:     { bg: 'bg-white/10',          text: 'text-white',        dot: 'bg-white' },
  free:    { bg: 'bg-gray-500/20',       text: 'text-gray-300',     dot: 'bg-gray-400' },
  start:   { bg: 'bg-emerald-500/20',    text: 'text-emerald-300',  dot: 'bg-emerald-400' },
  creator: { bg: 'bg-blue-500/20',       text: 'text-blue-300',     dot: 'bg-blue-400' },
  pro:     { bg: 'bg-purple-500/20',     text: 'text-purple-300',   dot: 'bg-purple-400' },
  admin:   { bg: 'bg-red-500/20',        text: 'text-red-300',      dot: 'bg-red-400' },
}

const planStyle = (plan) => PLAN_STYLE[plan] || PLAN_STYLE.free

export default function AdminPanel({ onClose, darkMode, user, authToken }) {
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [addTokensUser, setAddTokensUser] = useState(null)
  const [addTokensAmount, setAddTokensAmount] = useState(100000)
  const [message, setMessage] = useState(null)

  const headers = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/admin/stats`, { headers })
      const d = await r.json()
      if (d.success) setStats(d.stats)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [authToken])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page, limit: 25,
        search,
        plan: planFilter
      })
      const r = await fetch(`${API_URL}/api/admin/users?${params}`, { headers })
      const d = await r.json()
      if (d.success) {
        setUsers(d.users)
        setTotalUsers(d.total)
        setTotalPages(d.pages)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [authToken, page, search, planFilter])

  useEffect(() => {
    if (tab === 'dashboard') loadStats()
    if (tab === 'users') {
      loadUsers()
      loadStats()
    }
  }, [tab, page, planFilter])

  useEffect(() => {
    if (tab !== 'users') return
    const t = setTimeout(loadUsers, 350)
    return () => clearTimeout(t)
  }, [search])

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const saveUser = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT', headers,
        body: JSON.stringify(editValues)
      })
      const d = await r.json()
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...d.user } : u))
        setEditingUser(null)
        showMsg('Guardado')
      }
    } catch { showMsg('Error', 'error') }
  }

  const addTokens = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}/add-tokens`, {
        method: 'POST', headers,
        body: JSON.stringify({ amount: addTokensAmount })
      })
      const d = await r.json()
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, tokens: d.user.tokens } : u))
        setAddTokensUser(null)
        showMsg(`+${addTokensAmount.toLocaleString()} tokens`)
      }
    } catch { showMsg('Error', 'error') }
  }

  const isOnline = (last_seen) => {
    if (!last_seen) return false
    return (Date.now() - new Date(last_seen).getTime()) < 5 * 60 * 1000
  }

  // ---- estilos base ----
  const bg = darkMode
    ? 'min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#12001f] to-[#0a0a1a] text-white'
    : 'min-h-screen bg-gray-50 text-gray-900'
  const card = darkMode
    ? 'bg-white/5 border border-white/10 rounded-xl p-5'
    : 'bg-white border border-gray-200 rounded-xl p-5 shadow-sm'
  const inp = darkMode
    ? 'bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400'
    : 'bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400'

  // contadores de plan desde stats
  const planCount = (plan) => {
    if (!stats) return 0
    const row = stats.planBreakdown.find(p => p.plan === plan)
    return row ? parseInt(row.count) : 0
  }
  const planOnline = (plan) => {
    if (!stats) return 0
    const row = stats.planBreakdown.find(p => p.plan === plan)
    return row ? parseInt(row.online || 0) : 0
  }

  return (
    <div className={bg}>
      {/* ===== HEADER ===== */}
      <div className={`fixed top-0 w-full z-50 backdrop-blur-md ${darkMode ? 'bg-[#0a0a1a]/90 border-b border-red-500/30' : 'bg-white/90 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Shield className="w-5 h-5 text-red-400" />
            <span className="font-black text-lg tracking-tight">
              <span className="text-red-400">VOLT</span>
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>ADMIN</span>
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:inline ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'}`}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={tab === 'dashboard' ? loadStats : tab === 'users' ? loadUsers : null}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {[{ id: 'dashboard', label: 'Dashboard', icon: BarChart2 }, { id: 'users', label: 'Usuarios', icon: Users }, { id: 'coupons', label: 'Cupones', icon: Tag }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${tab === t.id ? 'border-red-400 text-red-400' : `border-transparent ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${message.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">

        {/* ===== DASHBOARD ===== */}
        {tab === 'dashboard' && stats && (
          <div className="space-y-6">

            {/* KPIs fila superior */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Usuarios', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-cyan-400', sub: `+${stats.usersToday} hoy` },
                { label: 'En Línea Ahora', value: stats.onlineUsers.toLocaleString(), icon: Wifi, color: 'text-green-400', sub: 'últimos 5 min', pulse: true },
                { label: 'Tokens Usados', value: stats.totalTokensUsed >= 1000000 ? (stats.totalTokensUsed / 1000000).toFixed(1) + 'M' : (stats.totalTokensUsed / 1000).toFixed(1) + 'K', icon: Zap, color: 'text-yellow-400', sub: `${(stats.tokensUsedToday / 1000).toFixed(1)}K hoy` },
                { label: 'Transacciones', value: stats.totalTransactions.toLocaleString(), icon: TrendingUp, color: 'text-purple-400', sub: 'completadas' },
              ].map((k, i) => (
                <div key={i} className={card}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</span>
                    <div className="relative">
                      {k.pulse && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping" />}
                      <k.icon className={`w-4 h-4 ${k.color}`} />
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Contadores por plan */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Suscriptores por Plan</h3>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {stats.onlineUsers} online ahora
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {['free', 'start', 'creator', 'pro', 'admin'].map(plan => {
                  const s = planStyle(plan)
                  const count = planCount(plan)
                  const online = planOnline(plan)
                  const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0
                  return (
                    <div key={plan} className={`rounded-xl p-4 ${s.bg} border ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className={`text-xs font-bold uppercase ${s.text}`}>{plan}</span>
                      </div>
                      <div className={`text-3xl font-black ${s.text}`}>{count}</div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pct}% del total</div>
                      {online > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-400">{online} online</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top usuarios + Actividad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={card}>
                <h3 className="font-bold mb-4">Top por Tokens Usados</h3>
                <div className="space-y-2">
                  {stats.topUsers.slice(0, 8).map((u, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold w-4 shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{i + 1}</span>
                        <span className={`text-xs truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{u.email}</span>
                      </div>
                      <span className="text-yellow-400 font-bold text-xs shrink-0 ml-2">
                        {parseInt(u.total_used) >= 1000000
                          ? (parseInt(u.total_used) / 1000000).toFixed(1) + 'M'
                          : (parseInt(u.total_used) / 1000).toFixed(1) + 'K'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={card}>
                <h3 className="font-bold mb-4">Actividad Reciente</h3>
                <div className="space-y-2">
                  {stats.recentActivity.slice(0, 8).map((a, i) => (
                    <div key={i} className={`flex items-center justify-between text-xs border-b last:border-0 pb-1.5 ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                      <div className="min-w-0">
                        <span className={`truncate block max-w-[160px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{a.email}</span>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{a.action || 'síntesis'}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-yellow-400 font-bold block">{a.tokens_used?.toLocaleString()}</span>
                        <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                          {new Date(a.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== CUPONES ===== */}
        {tab === 'coupons' && (
          <CouponManager darkMode={darkMode} authToken={authToken} />
        )}

        {/* ===== USUARIOS ===== */}
        {tab === 'users' && (
          <div className="space-y-4">

            {/* Filtros de plan + buscador */}
            <div className="space-y-3">
              {/* Chips de plan con contadores */}
              <div className="flex flex-wrap gap-2">
                {PLANS.map(plan => {
                  const s = planStyle(plan)
                  const count = plan === 'all'
                    ? (stats?.totalUsers ?? totalUsers)
                    : planCount(plan)
                  const online = plan === 'all'
                    ? (stats?.onlineUsers ?? 0)
                    : planOnline(plan)
                  const active = planFilter === plan
                  return (
                    <button
                      key={plan}
                      onClick={() => { setPlanFilter(plan); setPage(1) }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        active
                          ? `${s.bg} ${s.text} border-current`
                          : darkMode
                            ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className="uppercase">{plan === 'all' ? 'Todos' : plan}</span>
                      <span className={`font-black ${active ? s.text : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {count}
                      </span>
                      {online > 0 && (
                        <span className="flex items-center gap-0.5 text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          {online}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Buscador */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className={`${inp} pl-9 w-full`}
                    placeholder="Buscar email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                  />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {totalUsers} usuarios
                </span>
              </div>
            </div>

            {/* Tabla */}
            <div className={`${card} p-0 overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-xs ${darkMode ? 'text-gray-500 bg-white/5' : 'text-gray-400 bg-gray-50'}`}>
                      <th className="text-left px-4 py-3">Estado</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">Comprados</th>
                      <th className="text-left px-4 py-3">Restantes</th>
                      <th className="text-left px-4 py-3">Usados</th>
                      <th className="text-left px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const online = isOnline(u.last_seen)
                      const userPlan = u.normalized_plan || u.plan || 'free'
                      const s = planStyle(userPlan)
                      return (
                        <tr key={u.id} className={`border-t ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>

                          {/* Estado online */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400 animate-pulse' : darkMode ? 'bg-white/20' : 'bg-gray-300'}`} />
                              <span className={`text-xs ${online ? 'text-green-400' : darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                {online ? 'Online' : 'Off'}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {u.role === 'admin' && <Shield className="w-3 h-3 text-red-400 shrink-0" />}
                              <span className={`text-xs truncate max-w-[180px] ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{u.email}</span>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-3">
                            {editingUser === u.id ? (
                              <select className={inp} value={editValues.plan || u.plan}
                                onChange={e => setEditValues(p => ({ ...p, plan: e.target.value }))}>
                                {['free', 'start', 'creator', 'pro', 'admin'].map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                                {String(userPlan || 'free').toUpperCase()}
                              </span>
                            )}
                          </td>

                          {/* Tokens comprados */}
                          <td className="px-4 py-3">
                            <span className="text-cyan-400 font-bold text-xs">
                              {parseInt(u.total_tokens_purchased || 0).toLocaleString()}
                            </span>
                          </td>

                          {/* Tokens restantes */}
                          <td className="px-4 py-3">
                            {editingUser === u.id ? (
                              <input type="number" className={`${inp} w-24`}
                                value={editValues.tokens ?? u.tokens}
                                onChange={e => setEditValues(p => ({ ...p, tokens: parseInt(e.target.value) }))} />
                            ) : (
                              <span className="text-yellow-400 font-bold text-xs">{u.tokens?.toLocaleString()}</span>
                            )}
                          </td>

                          {/* Tokens usados */}
                          <td className={`px-4 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {parseInt(u.total_tokens_used || 0).toLocaleString()}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {editingUser === u.id ? (
                                <>
                                  <button onClick={() => saveUser(u.id)} className="p-1 rounded text-green-400 hover:bg-green-400/20"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setEditingUser(null)} className="p-1 rounded text-red-400 hover:bg-red-400/20"><X className="w-3.5 h-3.5" /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setEditingUser(u.id); setEditValues({ plan: userPlan, tokens: u.tokens }) }}
                                    className={`p-1 rounded ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`} title="Editar">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => { setAddTokensUser(u.id); setAddTokensAmount(100000) }}
                                    className={`p-1 rounded ${darkMode ? 'text-yellow-400 hover:bg-yellow-400/20' : 'text-yellow-500 hover:bg-yellow-50'}`} title="Agregar tokens">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className={`px-3 py-1 text-xs rounded ${darkMode ? 'bg-white/10 disabled:opacity-30' : 'bg-gray-100 disabled:opacity-30'}`}>
                    ← Anterior
                  </button>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {page} / {totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className={`px-3 py-1 text-xs rounded ${darkMode ? 'bg-white/10 disabled:opacity-30' : 'bg-gray-100 disabled:opacity-30'}`}>
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal agregar tokens */}
      {addTokensUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-80 ${darkMode ? 'bg-[#1a1a35] border border-white/20' : 'bg-white border border-gray-200 shadow-xl'}`}>
            <h3 className="font-bold text-lg mb-4">Agregar Tokens</h3>
            <div className="grid grid-cols-2 gap-2">
              {[10000, 100000, 500000, 1000000, 5000000, 10000000].map(amt => (
                <button key={amt} onClick={() => setAddTokensAmount(amt)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${addTokensAmount === amt ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white' : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  +{amt >= 1000000 ? (amt / 1000000) + 'M' : (amt / 1000) + 'K'}
                </button>
              ))}
            </div>
            <input type="number" className={`${inp} w-full mt-3`} value={addTokensAmount}
              onChange={e => setAddTokensAmount(parseInt(e.target.value))} placeholder="Cantidad personalizada" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => addTokens(addTokensUser)} className="flex-1 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg text-white text-sm font-bold">
                Confirmar
              </button>
              <button onClick={() => setAddTokensUser(null)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
