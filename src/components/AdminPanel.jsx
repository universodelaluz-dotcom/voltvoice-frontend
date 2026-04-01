import { useState, useEffect, useCallback } from 'react'
import {
  Users, Zap, TrendingUp, Activity, Search, ChevronLeft,
  RefreshCw, Shield, Edit2, Check, X, Plus, BarChart2
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const PLAN_COLORS = {
  free: 'bg-gray-500/20 text-gray-300',
  creator: 'bg-blue-500/20 text-blue-300',
  pro: 'bg-purple-500/20 text-purple-300',
  elite: 'bg-yellow-500/20 text-yellow-300',
  admin: 'bg-red-500/20 text-red-300',
}

export default function AdminPanel({ onClose, darkMode, user, authToken }) {
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
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
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [authToken])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(
        `${API_URL}/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`,
        { headers }
      )
      const d = await r.json()
      if (d.success) {
        setUsers(d.users)
        setTotalUsers(d.total)
        setTotalPages(d.pages)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [authToken, page, search])

  useEffect(() => {
    if (tab === 'dashboard') loadStats()
    if (tab === 'users') loadUsers()
  }, [tab, page])

  useEffect(() => {
    if (tab === 'users') {
      const t = setTimeout(loadUsers, 400)
      return () => clearTimeout(t)
    }
  }, [search])

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const saveUser = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editValues)
      })
      const d = await r.json()
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...d.user } : u))
        setEditingUser(null)
        showMsg('Usuario actualizado')
      }
    } catch (e) {
      showMsg('Error actualizando', 'error')
    }
  }

  const addTokens = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}/add-tokens`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: addTokensAmount })
      })
      const d = await r.json()
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, tokens: d.user.tokens } : u))
        setAddTokensUser(null)
        showMsg(`+${addTokensAmount.toLocaleString()} tokens agregados`)
      }
    } catch (e) {
      showMsg('Error', 'error')
    }
  }

  const bg = darkMode
    ? 'min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#12001f] to-[#0a0a1a] text-white'
    : 'min-h-screen bg-gray-50 text-gray-900'

  const card = darkMode
    ? 'bg-white/5 border border-white/10 rounded-xl p-5'
    : 'bg-white border border-gray-200 rounded-xl p-5 shadow-sm'

  const input = darkMode
    ? 'bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400'
    : 'bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400'

  return (
    <div className={bg}>
      {/* Header */}
      <div className={`fixed top-0 w-full z-50 backdrop-blur-md ${darkMode ? 'bg-[#0a0a1a]/90 border-b border-red-500/30' : 'bg-white/90 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Shield className="w-5 h-5 text-red-400" />
            <span className="font-black text-lg tracking-tight">
              <span className="text-red-400">VOLT</span>
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>ADMIN</span>
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'}`}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={tab === 'dashboard' ? loadStats : loadUsers}
            className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
            { id: 'users', label: 'Usuarios', icon: Users },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id
                  ? 'border-red-400 text-red-400'
                  : `border-transparent ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
          message.type === 'error'
            ? 'bg-red-500/90 text-white'
            : 'bg-green-500/90 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">

        {/* ===== DASHBOARD ===== */}
        {tab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Usuarios Totales', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-cyan-400', sub: `+${stats.usersToday} hoy` },
                { label: 'Tokens Usados', value: (stats.totalTokensUsed / 1000).toFixed(1) + 'K', icon: Zap, color: 'text-yellow-400', sub: `${(stats.tokensUsedToday / 1000).toFixed(1)}K hoy` },
                { label: 'Voces Clonadas', value: stats.voicesCloned.toLocaleString(), icon: Activity, color: 'text-purple-400', sub: 'total' },
                { label: 'Transacciones', value: stats.totalTransactions.toLocaleString(), icon: TrendingUp, color: 'text-green-400', sub: 'completadas' },
              ].map((k, i) => (
                <div key={i} className={card}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</span>
                    <k.icon className={`w-4 h-4 ${k.color}`} />
                  </div>
                  <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Planes + Actividad reciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribución de planes */}
              <div className={card}>
                <h3 className="font-bold mb-4">Distribución de Planes</h3>
                <div className="space-y-2">
                  {stats.planBreakdown.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PLAN_COLORS[p.plan] || 'bg-gray-500/20 text-gray-300'}`}>
                        {p.plan.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-3 flex-1 mx-4">
                        <div className={`flex-1 h-1.5 rounded-full ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                            style={{ width: `${(parseInt(p.count) / stats.totalUsers) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top usuarios por uso */}
              <div className={card}>
                <h3 className="font-bold mb-4">Top Usuarios por Tokens</h3>
                <div className="space-y-2">
                  {stats.topUsers.slice(0, 7).map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className={`truncate max-w-[200px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {i + 1}. {u.email}
                      </span>
                      <span className="text-yellow-400 font-bold text-xs">
                        {(parseInt(u.total_used) / 1000).toFixed(1)}K tokens
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actividad reciente */}
            <div className={card}>
              <h3 className="font-bold mb-4">Actividad Reciente</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                      <th className="text-left py-2 pr-4">Usuario</th>
                      <th className="text-left py-2 pr-4">Acción</th>
                      <th className="text-left py-2 pr-4">Tokens</th>
                      <th className="text-left py-2 pr-4">Voz</th>
                      <th className="text-left py-2">Cuando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.map((a, i) => (
                      <tr key={i} className={`border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                        <td className={`py-2 pr-4 truncate max-w-[150px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{a.email}</td>
                        <td className={`py-2 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.action || '-'}</td>
                        <td className="py-2 pr-4 text-yellow-400 font-bold">{a.tokens_used?.toLocaleString()}</td>
                        <td className={`py-2 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.voice_name || '-'}</td>
                        <td className={`py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(a.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== USUARIOS ===== */}
        {tab === 'users' && (
          <div className="space-y-4">
            {/* Buscador */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className={`${input} pl-9 w-full`}
                  placeholder="Buscar por email..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalUsers} usuarios
              </span>
            </div>

            {/* Tabla de usuarios */}
            <div className={`${card} p-0 overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-xs ${darkMode ? 'text-gray-500 bg-white/5' : 'text-gray-400 bg-gray-50'}`}>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">Tokens</th>
                      <th className="text-left px-4 py-3">Usados</th>
                      <th className="text-left px-4 py-3">Voces</th>
                      <th className="text-left px-4 py-3">Registro</th>
                      <th className="text-left px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={`border-t ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.role === 'admin' && <Shield className="w-3 h-3 text-red-400" />}
                            <span className={`text-xs truncate max-w-[200px] ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{u.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === u.id ? (
                            <select
                              className={input}
                              value={editValues.plan || u.plan}
                              onChange={e => setEditValues(prev => ({ ...prev, plan: e.target.value }))}
                            >
                              {['free', 'creator', 'pro', 'elite', 'admin'].map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${PLAN_COLORS[u.plan] || 'bg-gray-500/20 text-gray-300'}`}>
                              {u.plan?.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === u.id ? (
                            <input
                              type="number"
                              className={`${input} w-24`}
                              value={editValues.tokens ?? u.tokens}
                              onChange={e => setEditValues(prev => ({ ...prev, tokens: parseInt(e.target.value) }))}
                            />
                          ) : (
                            <span className="text-yellow-400 font-bold text-xs">{u.tokens?.toLocaleString()}</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {parseInt(u.total_tokens_used || 0).toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {u.voices_count}
                        </td>
                        <td className={`px-4 py-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(u.created_at).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {editingUser === u.id ? (
                              <>
                                <button onClick={() => saveUser(u.id)} className="p-1 rounded text-green-400 hover:bg-green-400/20">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingUser(null)} className="p-1 rounded text-red-400 hover:bg-red-400/20">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingUser(u.id); setEditValues({ plan: u.plan, tokens: u.tokens }) }}
                                  className={`p-1 rounded transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                                  title="Editar"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setAddTokensUser(u.id); setAddTokensAmount(100000) }}
                                  className={`p-1 rounded transition-all ${darkMode ? 'text-yellow-400 hover:bg-yellow-400/20' : 'text-yellow-500 hover:bg-yellow-50'}`}
                                  title="Agregar tokens"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 text-xs rounded ${darkMode ? 'bg-white/10 disabled:opacity-30' : 'bg-gray-100 disabled:opacity-30'}`}
                  >Anterior</button>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-3 py-1 text-xs rounded ${darkMode ? 'bg-white/10 disabled:opacity-30' : 'bg-gray-100 disabled:opacity-30'}`}
                  >Siguiente</button>
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
            <div className="space-y-3">
              {[10000, 100000, 500000, 1000000, 5000000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAddTokensAmount(amt)}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                    addTokensAmount === amt
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                      : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  +{amt.toLocaleString()} tokens
                </button>
              ))}
              <input
                type="number"
                className={`${input} w-full mt-2`}
                value={addTokensAmount}
                onChange={e => setAddTokensAmount(parseInt(e.target.value))}
                placeholder="Cantidad personalizada"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => addTokens(addTokensUser)}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg text-white text-sm font-bold"
              >Confirmar</button>
              <button
                onClick={() => setAddTokensUser(null)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
