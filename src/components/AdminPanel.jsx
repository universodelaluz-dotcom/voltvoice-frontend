import { useState, useEffect, useCallback } from 'react'
import {
  Users, Zap, TrendingUp, Activity, Search, ChevronLeft,
  RefreshCw, Shield, Edit2, Check, X, Plus, BarChart2, Wifi, Tag, Trash2, PauseCircle, PlayCircle, KeyRound, Bell, AlertTriangle, Database, Download, Mic
} from 'lucide-react'
import CouponManager from './CouponManager'

const API_URL = import.meta.env.VITE_API_URL || ((typeof window !== 'undefined' && ['localhost','127.0.0.1'].includes(window.location.hostname)) ? 'http://localhost:3000' : 'https://voltvoice-backend.onrender.com')

const PLANS = ['all', 'free', 'base', 'pack_lite', 'pack_pro', 'pack_max', 'admin']
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const PLAN_LABEL = {
  all:      'Todos',
  free:     'Sin plan',
  base:     'Plan Base',
  pack_lite:'Pack Lite',
  pack_pro: 'Pack Pro',
  pack_max: 'Pack Max',
  admin:    'Admin',
  // legacy fallback
  start:    'Plan Base',
  creator:  'Pack Pro',
  pro:      'Pack Max',
}

const PLAN_STYLE = {
  all:      { bg: 'bg-white/10',          text: 'text-gray-200',     dot: 'bg-white' },
  free:     { bg: 'bg-gray-500/20',       text: 'text-gray-300',     dot: 'bg-gray-400' },
  base:     { bg: 'bg-cyan-500/20',       text: 'text-cyan-300',     dot: 'bg-cyan-400' },
  pack_lite:{ bg: 'bg-emerald-500/20',    text: 'text-emerald-300',  dot: 'bg-emerald-400' },
  pack_pro: { bg: 'bg-pink-500/20',       text: 'text-pink-300',     dot: 'bg-pink-400' },
  pack_max: { bg: 'bg-orange-500/20',     text: 'text-orange-300',   dot: 'bg-orange-400' },
  admin:    { bg: 'bg-red-500/20',        text: 'text-red-300',      dot: 'bg-red-400' },
  // legacy
  start:    { bg: 'bg-cyan-500/20',       text: 'text-cyan-300',     dot: 'bg-cyan-400' },
  creator:  { bg: 'bg-pink-500/20',       text: 'text-pink-300',     dot: 'bg-pink-400' },
  pro:      { bg: 'bg-orange-500/20',     text: 'text-orange-300',   dot: 'bg-orange-400' },
}

const PLAN_PILL_LIGHT = {
  free:     'bg-gray-200 text-gray-700',
  base:     'bg-cyan-100 text-cyan-700',
  pack_lite:'bg-emerald-100 text-emerald-700',
  pack_pro: 'bg-pink-100 text-pink-700',
  pack_max: 'bg-orange-100 text-orange-700',
  admin:    'bg-red-100 text-red-700',
  all:      'bg-gray-200 text-gray-700',
  // legacy
  start:    'bg-cyan-100 text-cyan-700',
  creator:  'bg-pink-100 text-pink-700',
  pro:      'bg-orange-100 text-orange-700',
}

const planStyle = (plan) => PLAN_STYLE[plan] || PLAN_STYLE.free
const fmtNum = (value) => Number(value || 0).toLocaleString('en-US')
const fmtUsd = (value) => `$${Number(value || 0).toFixed(2)}`

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
  const [usersError, setUsersError] = useState(null)
  const [opsLoading, setOpsLoading] = useState(false)
  const [anomalies, setAnomalies] = useState([])
  const [broadcasts, setBroadcasts] = useState([])
  const [movementLogsLoading, setMovementLogsLoading] = useState(false)
  const [movementLogsError, setMovementLogsError] = useState(null)
  const [movementLogsByMonth, setMovementLogsByMonth] = useState([])
  const [deletingMovementKey, setDeletingMovementKey] = useState('')
  const [activityUserId, setActivityUserId] = useState(null)
  const [activityData, setActivityData] = useState(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityHours, setActivityHours] = useState(48)
  const [activityLimit, setActivityLimit] = useState(5000)
  const [createUserForm, setCreateUserForm] = useState({ email: '', password: '', plan: 'base', tokens: 1000, role: 'user' })
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [suspendUserId, setSuspendUserId] = useState(null)
  const [suspendMinutes, setSuspendMinutes] = useState(60)
  const [suspendReason, setSuspendReason] = useState('Actividad anormal')
  const [resetPasswordUserId, setResetPasswordUserId] = useState(null)
  const [manualResetPassword, setManualResetPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState(null)
  const [broadcastForm, setBroadcastForm] = useState({
    kind: 'global_message',
    title: '',
    message: '',
    audiencePlan: 'all',
    priority: 'normal',
    status: 'active'
  })
  const [deployMonitorLoading, setDeployMonitorLoading] = useState(false)
  const [deployMonitorData, setDeployMonitorData] = useState({
    connectedUsers: 0,
    readyForDeploy: false,
    settings: {
      notifyEnabled: false,
      notifyEmail: 'soporte@streamvoicer.com',
      noticeTitle: 'Mensaje para usuarios',
      maintenanceMessage: 'Aviso importante: estaremos en mantenimiento durante 4 minutos para aplicar mejoras. Gracias por tu paciencia.',
      notifySentForCurrentWindow: false,
      lastNotifiedReadyAt: null
    }
  })
  const [deployMonitorSaving, setDeployMonitorSaving] = useState(false)
  const [audioCacheSettings, setAudioCacheSettings] = useState({
    enabled: true,
    maxCacheableChars: 600,
    personalTtlSeconds: 604800,
    globalTtlSeconds: 2592000,
    personalFreeTtlSeconds: 604800,
    personalPaidTtlSeconds: 2592000,
    personalFreeMaxEntries: 1500,
    personalPaidMaxEntries: 10000,
    globalMaxEntries: 20000,
    globalInactiveDays: 120,
    globalLowUsageThreshold: 0,
    subscriptionGraceDays: 15,
    purgePersonalizationAfterGrace: false,
    hotCacheMaxEntries: 12000,
    globalRepeatThreshold: 1,
    lookupTimeoutMs: 60
  })
  const [audioCacheStats, setAudioCacheStats] = useState(null)
  const [audioCacheEntries, setAudioCacheEntries] = useState([])
  const [audioCacheScopeFilter, setAudioCacheScopeFilter] = useState('all')
  const [audioCacheLoading, setAudioCacheLoading] = useState(false)

  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear())
  const [dashboardMonth, setDashboardMonth] = useState(0) // 0 = todos
  const [monthSortKey, setMonthSortKey] = useState('monthKey')
  const [monthSortDir, setMonthSortDir] = useState('desc') // más reciente primero

    const [voicesUser, setVoicesUser] = useState(null)
  const [voicesList, setVoicesList] = useState([])
  const [voicesLoading, setVoicesLoading] = useState(false)
const buildHeaders = () => ({ 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' })

  // Mapea los nuevos nombres de plan al valor que espera el backend
  const toBackendPlan = (plan) => {
    const map = { base: 'start', pack_lite: 'start', pack_pro: 'creator', pack_max: 'pro' }
    return map[plan] ?? plan
  }
  const secondsToHours = (seconds, fallbackHours = 1) => {
    const sec = Number(seconds)
    if (!Number.isFinite(sec) || sec <= 0) return fallbackHours
    return Math.max(1, Math.round(sec / 3600))
  }
  const hoursToSeconds = (hours, fallbackSeconds = 3600) => {
    const parsed = parseInt(hours, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return fallbackSeconds
    return parsed * 3600
  }
  const cacheLabel = (title, hint) => (
    <span className={`flex items-center flex-wrap gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      <span>{title}</span>
      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${darkMode ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>?</span>
      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-[10px]`}>{hint}</span>
    </span>
  )

  const loadStats = useCallback(async () => {
    if (!authToken) {
      setUsersError('Sesion no valida. Vuelve a iniciar sesion.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/admin/stats?year=${dashboardYear}`, { headers: buildHeaders() })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.success) {
        setStats(d.stats)
      } else {
        const msg = d.error || `Error del servidor (HTTP ${r.status})`
        setUsersError(msg)
        console.error('[Admin] Stats error:', msg, d)
      }
    } catch (e) {
      setUsersError('Error de conexion con el servidor')
      console.error('[Admin] Stats fetch error:', e)
    }
    setLoading(false)
  }, [authToken, dashboardYear])

  const loadUsers = useCallback(async () => {
    if (!authToken) {
      setUsersError('Sesion no valida. Vuelve a iniciar sesion.')
      return
    }
    setLoading(true)
    setUsersError(null)
    try {
      const params = new URLSearchParams({
        page, limit: 25,
        search,
        plan: toBackendPlan(planFilter)
      })
      const r = await fetch(`${API_URL}/api/admin/users?${params}`, { headers: buildHeaders() })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.success) {
        setUsers(d.users)
        setTotalUsers(d.total)
        setTotalPages(d.pages)
      } else {
        setUsersError(d.error || `Error del servidor (HTTP ${r.status})`)
        console.error('[Admin] Users error:', d)
      }
    } catch (e) {
      setUsersError('Error de conexion con el servidor')
      console.error('[Admin] Users fetch error:', e)
    }
    setLoading(false)
  }, [authToken, page, search, planFilter])

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const saveUser = async (userId) => {
    try {
      const payload = { ...editValues, plan: toBackendPlan(editValues.plan) }
      const r = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT', headers: buildHeaders(),
        body: JSON.stringify(payload)
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && (d.success || d.user)) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...(d.user || {}), plan: editValues.plan } : u))
        setEditingUser(null)
        showMsg('Guardado')
      } else {
        showMsg(d.error || d.message || `Error ${r.status}`, 'error')
      }
    } catch { showMsg('Error de conexión', 'error') }
  }

  const addTokens = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}/add-tokens`, {
        method: 'POST', headers: buildHeaders(),
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

  const loadOps = useCallback(async () => {
    if (!authToken) return
    setOpsLoading(true)
    try {
      const [anR, bR] = await Promise.all([
        fetch(`${API_URL}/api/admin/anomalies`, { headers: buildHeaders() }),
        fetch(`${API_URL}/api/admin/broadcasts?status=all&limit=100`, { headers: buildHeaders() })
      ])
      const anD = await anR.json().catch(() => ({}))
      const bD = await bR.json().catch(() => ({}))
      if (anR.ok && anD.success) setAnomalies(anD.anomalies || [])
      if (bR.ok && bD.success) setBroadcasts(bD.broadcasts || [])
    } catch (e) {
      console.error('[Admin] Ops load error:', e)
    }
    setOpsLoading(false)
  }, [authToken])

  const loadDeployMonitor = useCallback(async () => {
    if (!authToken) return
    setDeployMonitorLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/admin/deploy-monitor/status`, { headers: buildHeaders() })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.success) {
        setDeployMonitorData({
          connectedUsers: Number(d.connectedUsers || 0),
          readyForDeploy: d.readyForDeploy === true,
          settings: {
            notifyEnabled: Boolean(d?.settings?.notifyEnabled),
            notifyEmail: d?.settings?.notifyEmail || 'soporte@streamvoicer.com',
            noticeTitle: d?.settings?.noticeTitle || 'Mensaje para usuarios',
            maintenanceMessage: d?.settings?.maintenanceMessage || 'Aviso importante: estaremos en mantenimiento durante 4 minutos para aplicar mejoras. Gracias por tu paciencia.',
            notifySentForCurrentWindow: Boolean(d?.settings?.notifySentForCurrentWindow),
            lastNotifiedReadyAt: d?.settings?.lastNotifiedReadyAt || null,
          }
        })
        if (d.emailNotificationSentNow) {
          showMsg('Aviso de deploy enviado a tu correo')
        }
      }
    } catch (e) {
      console.error('[Admin] Deploy monitor load error:', e)
    } finally {
      setDeployMonitorLoading(false)
    }
  }, [authToken])

  const loadMovementLogs = useCallback(async () => {
    if (!authToken) return
    setMovementLogsLoading(true)
    setMovementLogsError(null)
    try {
      const params = new URLSearchParams({
        year: String(dashboardYear),
        month: String(dashboardMonth || 0),
        page: '1',
        limit: '300'
      })
      const r = await fetch(`${API_URL}/api/admin/transactions/logs?${params.toString()}`, { headers: buildHeaders() })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) {
        setMovementLogsError(d.error || `Error del servidor (HTTP ${r.status})`)
        setMovementLogsByMonth([])
        return
      }
      setMovementLogsByMonth(Array.isArray(d.byMonth) ? d.byMonth : [])
    } catch (e) {
      console.error('[Admin] Movement logs load error:', e)
      setMovementLogsError('Error de conexion con el servidor')
      setMovementLogsByMonth([])
    } finally {
      setMovementLogsLoading(false)
    }
  }, [authToken, dashboardYear, dashboardMonth])


  const deleteMovementLog = async (item) => {
    try {
      const source = String(item?.source || '').trim()
      const entryId = Number.parseInt(item?.entryId, 10)
      if (!source || !Number.isFinite(entryId) || entryId <= 0) {
        showMsg('No se puede borrar este movimiento (faltan datos).', 'error')
        return
      }

      const movementKey = `${source}:${entryId}`
      setDeletingMovementKey(movementKey)

      const r = await fetch(`${API_URL}/api/admin/transactions/logs/${encodeURIComponent(source)}/${entryId}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) {
        showMsg(d.error || 'No se pudo borrar el movimiento', 'error')
        return
      }

      showMsg('Movimiento borrado')
      await loadMovementLogs()
    } catch (e) {
      showMsg(e.message || 'Error borrando movimiento', 'error')
    } finally {
      setDeletingMovementKey('')
    }
  }
  const loadAudioCache = useCallback(async () => {
    if (!authToken) return
    setAudioCacheLoading(true)
    try {
      const [settingsR, statsR, entriesR] = await Promise.all([
        fetch(`${API_URL}/api/admin/audio-cache/settings`, { headers: buildHeaders() }),
        fetch(`${API_URL}/api/admin/audio-cache/stats`, { headers: buildHeaders() }),
        fetch(`${API_URL}/api/admin/audio-cache/entries?scope=${audioCacheScopeFilter}&limit=100`, { headers: buildHeaders() })
      ])
      const settingsD = await settingsR.json().catch(() => ({}))
      const statsD = await statsR.json().catch(() => ({}))
      const entriesD = await entriesR.json().catch(() => ({}))

      if (settingsR.ok && settingsD.success) setAudioCacheSettings(settingsD.settings)
      if (statsR.ok && statsD.success) setAudioCacheStats(statsD.stats)
      if (entriesR.ok && entriesD.success) setAudioCacheEntries(entriesD.entries || [])
    } catch (e) {
      console.error('[Admin] Audio cache load error:', e)
    }
    setAudioCacheLoading(false)
  }, [authToken, audioCacheScopeFilter])

  const saveAudioCacheSettings = async () => {
    try {
      const r = await fetch(`${API_URL}/api/admin/audio-cache/settings`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(audioCacheSettings)
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error guardando cache', 'error')
      setAudioCacheSettings(d.settings || audioCacheSettings)
      showMsg('Configuracion de cache guardada')
      loadAudioCache()
    } catch {
      showMsg('Error guardando cache', 'error')
    }
  }

  const purgeAudioCache = async (scope = 'all', expiredOnly = false) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/audio-cache/purge`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ scope, expiredOnly })
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error purgando cache', 'error')
      showMsg(`Cache purgada (${d.deleted})`)
      loadAudioCache()
    } catch {
      showMsg('Error purgando cache', 'error')
    }
  }

  const deleteAudioCacheEntry = async (cacheKey) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/audio-cache/entries/${encodeURIComponent(cacheKey)}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error eliminando entrada', 'error')
      showMsg('Entrada eliminada')
      loadAudioCache()
    } catch {
      showMsg('Error eliminando entrada', 'error')
    }
  }

  useEffect(() => {
    if (!authToken) return
    if (tab === 'dashboard') loadStats()
    if (tab === 'users') {
      loadUsers()
      loadStats()
    }
    if (tab === 'ops') {
      loadOps()
      loadMovementLogs()
      loadDeployMonitor()
    }
    if (tab === 'cache') loadAudioCache()
  }, [authToken, tab, page, planFilter, loadStats, loadUsers, loadOps, loadMovementLogs, loadDeployMonitor, loadAudioCache])

  useEffect(() => {
    if (!authToken || tab !== 'users') return
    const t = setTimeout(loadUsers, 350)
    return () => clearTimeout(t)
  }, [authToken, tab, search, loadUsers])

  useEffect(() => {
    if (!authToken || tab !== 'ops') return
    const id = setInterval(() => {
      loadDeployMonitor()
    }, 30000)
    return () => clearInterval(id)
  }, [authToken, tab, loadDeployMonitor])

  const createUser = async () => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ ...createUserForm, plan: toBackendPlan(createUserForm.plan) })
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error creando usuario', 'error')
      showMsg(`Usuario creado: ${d.user.email}`)
      setCreateUserForm({ email: '', password: '', plan: 'base', tokens: 1000, role: 'user' })
      setShowCreateUserModal(false)
      loadUsers()
      loadStats()
    } catch {
      showMsg('Error creando usuario', 'error')
    }
  }

  const deleteUser = async (target) => {
    if (!window.confirm(`Eliminar usuario ${target.email}? Esta acción es irreversible.`)) return
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${target.id}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error eliminando usuario', 'error')
      showMsg(`Usuario eliminado: ${target.email}`)
      loadUsers()
      loadStats()
    } catch {
      showMsg('Error eliminando usuario', 'error')
    }
  }

  const suspendUser = async () => {
    if (!suspendUserId) return
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${suspendUserId}/suspend`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ reason: suspendReason, minutes: suspendMinutes })
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error suspendiendo usuario', 'error')
      showMsg('Usuario suspendido')
      setSuspendUserId(null)
      loadUsers()
      loadStats()
    } catch {
      showMsg('Error suspendiendo usuario', 'error')
    }
  }

  const unsuspendUser = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
        headers: buildHeaders()
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error reactivando usuario', 'error')
      showMsg('Usuario reactivado')
      loadUsers()
      loadStats()
    } catch {
      showMsg('Error reactivando usuario', 'error')
    }
  }

  const resetUserPassword = async () => {
    if (!resetPasswordUserId) return
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${resetPasswordUserId}/reset-password`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ newPassword: manualResetPassword || undefined })
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error restableciendo password', 'error')
      if (d.temporaryPassword) setGeneratedPassword(d.temporaryPassword)
      showMsg('Password restablecida')
      setManualResetPassword('')
      setResetPasswordUserId(null)
    } catch {
      showMsg('Error restableciendo password', 'error')
    }
  }

  const loadActivity = async (userId) => {
    setActivityUserId(userId)
    setActivityLoading(true)
    setActivityData(null)
    try {
      const params = new URLSearchParams({
        limit: String(activityLimit || 5000),
        hours: String(activityHours || 48),
      })
      const r = await fetch(`${API_URL}/api/admin/users/${userId}/activity?${params.toString()}`, { headers: buildHeaders() })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.success) setActivityData(d)
      else showMsg(d.error || 'Error cargando actividad', 'error')
    } catch {
      showMsg('Error cargando actividad', 'error')
    }
    setActivityLoading(false)
  }

  const exportActivityLogs = async (format = 'json') => {
    if (!activityUserId) return
    try {
      const params = new URLSearchParams({
        limit: String(activityLimit || 5000),
        hours: String(activityHours || 48),
        format
      })
      const r = await fetch(`${API_URL}/api/admin/users/${activityUserId}/activity/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        return showMsg(d.error || 'Error exportando actividad', 'error')
      }

      const blob = await r.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voltvoice-activity-${activityUserId}-${activityHours}h-${activityLimit}.${format === 'csv' ? 'csv' : 'json'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showMsg(`Actividad exportada (${format.toUpperCase()})`)
    } catch {
      showMsg('Error exportando actividad', 'error')
    }
  }

  const exportEmailsCsv = async () => {
    try {
      const r = await fetch(`${API_URL}/api/admin/users/export-emails?plan=${planFilter || 'all'}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        return showMsg(d.error || 'Error exportando correos', 'error')
      }
      const blob = await r.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voltvoice-users-${planFilter || 'all'}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showMsg('CSV de correos exportado')
    } catch {
      showMsg('Error exportando correos', 'error')
    }
  }

  const loadUserVoices = async (targetUser) => {
    setVoicesUser(targetUser)
    setVoicesLoading(true)
    setVoicesList([])
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/voices`, { headers: buildHeaders() })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) {
        showMsg(d.error || 'Error cargando voces del usuario', 'error')
      } else {
        setVoicesList(d.voices || [])
      }
    } catch {
      showMsg('Error cargando voces del usuario', 'error')
    }
    setVoicesLoading(false)
  }

  const deleteUserVoice = async (voiceRecordId) => {
    if (!voicesUser) return
    if (!window.confirm('Eliminar esta voz del usuario?')) return
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${voicesUser.id}/voices/${voiceRecordId}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error eliminando voz', 'error')
      setVoicesList(prev => prev.filter(v => String(v.id) !== String(voiceRecordId)))
      showMsg('Voz eliminada')
    } catch {
      showMsg('Error eliminando voz', 'error')
    }
  }
  const createBroadcast = async () => {
    try {
      const r = await fetch(`${API_URL}/api/admin/broadcasts`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(broadcastForm)
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error creando comunicado', 'error')
      showMsg('Comunicado creado')
      setBroadcastForm((prev) => ({ ...prev, title: '', message: '' }))
      loadOps()
    } catch {
      showMsg('Error creando comunicado', 'error')
    }
  }

  const setBroadcastStatus = async (broadcastId, status) => {
    try {
      const r = await fetch(`${API_URL}/api/admin/broadcasts/${broadcastId}/status`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ status })
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error actualizando comunicado', 'error')
      showMsg('Comunicado actualizado')
      loadOps()
    } catch {
      showMsg('Error actualizando comunicado', 'error')
    }
  }

  const deleteBroadcast = async (broadcastId) => {
    if (!window.confirm('¿Borrar comunicado? Esta acción no se puede deshacer.')) return
    try {
      const r = await fetch(`${API_URL}/api/admin/broadcasts/${broadcastId}`, {
        method: 'DELETE',
        headers: buildHeaders()
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error borrando comunicado', 'error')
      showMsg('Comunicado borrado')
      loadOps()
    } catch {
      showMsg('Error borrando comunicado', 'error')
    }
  }

  const saveDeployMonitorSettings = async () => {
    try {
      setDeployMonitorSaving(true)
      const payload = {
        notifyEnabled: deployMonitorData.settings.notifyEnabled,
        notifyEmail: (deployMonitorData.settings.notifyEmail || 'soporte@streamvoicer.com')
      }
      const r = await fetch(`${API_URL}/api/admin/deploy-monitor/settings`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error guardando notificador', 'error')
      setDeployMonitorData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...(d.settings || {}) }
      }))
      showMsg('Notificador de deploy actualizado')
    } catch {
      showMsg('Error guardando notificador', 'error')
    } finally {
      setDeployMonitorSaving(false)
    }
  }

  const saveDeployMaintenanceMessage = async () => {
    try {
      setDeployMonitorSaving(true)
      const r = await fetch(`${API_URL}/api/admin/deploy-monitor/message`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ maintenanceMessage: deployMonitorData.settings.maintenanceMessage })
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error guardando mensaje', 'error')
      setDeployMonitorData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...(d.settings || {}) }
      }))
      showMsg('Mensaje de mantenimiento guardado')
    } catch {
      showMsg('Error guardando mensaje', 'error')
    } finally {
      setDeployMonitorSaving(false)
    }
  }

  const sendMaintenanceNoticeNow = async () => {
    try {
      setDeployMonitorSaving(true)
      const r = await fetch(`${API_URL}/api/admin/deploy-monitor/send-maintenance-notice`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          title: (deployMonitorData.settings.noticeTitle || 'Mensaje para usuarios'),
          message: deployMonitorData.settings.maintenanceMessage
        })
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) return showMsg(d.error || 'Error enviando aviso', 'error')
      showMsg('Aviso enviado a usuarios')
      loadOps()
    } catch {
      showMsg('Error enviando aviso', 'error')
    } finally {
      setDeployMonitorSaving(false)
    }
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
  const fmtCompact = (n) => {
    const value = Number(n || 0)
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toLocaleString()
  }
  const fmtUsd = (n) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
  const formatActionLabel = (action = '') =>
    String(action || '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase())

  const movementSummary = (item = {}) => {
    if (item.source === 'payment') {
      const tokens = Number(item?.details?.tokensPurchased || 0)
      const amount = Number(item?.details?.amountUsd || 0)
      const buyer = item.actorEmail || `Usuario #${item.actorUserId || 'N/A'}`
      if (tokens > 0) {
        return `${buyer} compro ${tokens.toLocaleString()} tokens (${fmtUsd(amount)})`
      }
      return `${buyer} completo un pago (${fmtUsd(amount)})`
    }

    const actor = item.actorEmail || `Admin #${item.actorUserId || 'N/A'}`
    const target = item.targetEmail ? ` -> ${item.targetEmail}` : ''
    return `${actor}: ${formatActionLabel(item.action)}${target}`
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
            onClick={
              tab === 'dashboard'
                ? loadStats
                : tab === 'users'
                ? loadUsers
                : tab === 'ops'
                ? () => { loadOps(); loadMovementLogs(); loadDeployMonitor() }
                : tab === 'cache'
                ? loadAudioCache
                : null
            }
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {[{ id: 'dashboard', label: 'Dashboard', icon: BarChart2 }, { id: 'users', label: 'Usuarios', icon: Users }, { id: 'ops', label: 'Operaciones', icon: Bell }, { id: 'cache', label: 'Audio Cache', icon: Database }, { id: 'coupons', label: 'Cupones', icon: Tag }].map(t => (
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
        {tab === 'dashboard' && loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mr-3" />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Cargando estadísticas...</span>
          </div>
        )}
        {tab === 'dashboard' && !loading && !stats && (
          <div className={`max-w-md mx-auto mt-16 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'} rounded-xl p-8 text-center`}>
            <Shield className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <p className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sin datos</p>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {usersError || 'No se pudieron cargar las estadísticas. Verifica que estés autenticado como admin.'}
            </p>
            <button onClick={loadStats} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              Reintentar
            </button>
          </div>
        )}
        {tab === 'dashboard' && !loading && stats && (() => {
          const allMonths = stats.monthlyOverview || []
          const filteredMonths = dashboardMonth === 0
            ? allMonths
            : allMonths.filter(m => parseInt(m.monthKey.split('-')[1], 10) === dashboardMonth)
          const sortedMonths = [...filteredMonths].sort((a, b) => {
            const va = monthSortKey === 'monthKey' ? a.monthKey : Number(a[monthSortKey] || 0)
            const vb = monthSortKey === 'monthKey' ? b.monthKey : Number(b[monthSortKey] || 0)
            if (va < vb) return monthSortDir === 'asc' ? -1 : 1
            if (va > vb) return monthSortDir === 'asc' ? 1 : -1
            return 0
          })
          const toggleSort = (key) => {
            if (monthSortKey === key) setMonthSortDir(d => d === 'asc' ? 'desc' : 'asc')
            else { setMonthSortKey(key); setMonthSortDir('desc') }
          }
          const sortIcon = (key) => monthSortKey === key ? (monthSortDir === 'desc' ? ' v' : ' ^') : ' -'
          const maxTokens  = Math.max(...allMonths.map(m => Number(m.tokens || 0)), 1)
          const maxRevenue = Math.max(...allMonths.map(m => Number(m.revenueUsd || 0)), 1)
          const maxUsers   = Math.max(...allMonths.map(m => Number(m.users || 0)), 1)
          const yearOptions = []
          for (let y = 2023; y <= new Date().getFullYear(); y++) yearOptions.push(y)

          return (
            <div className="space-y-6">

              {/* === Selector Año / Mes === */}
              <div className={card}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Año</span>
                    <div className="flex gap-1">
                      {yearOptions.map(y => (
                        <button key={y} onClick={() => { setDashboardYear(y); setDashboardMonth(0) }}
                          className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${dashboardYear === y ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >{y}</button>
                      ))}
                    </div>
                  </div>
                  <div className={`w-px h-5 hidden md:block ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mes</span>
                    <div className="flex flex-wrap gap-1">
                      {[['Todos', 0], ...MONTH_NAMES.map((m, i) => [m, i + 1])].map(([lbl, val]) => (
                        <button key={val} onClick={() => setDashboardMonth(val)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${dashboardMonth === val ? 'bg-cyan-500 text-white' : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs ml-auto hidden sm:block ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {dashboardYear}{dashboardMonth > 0 ? ` · ${MONTH_NAMES[dashboardMonth - 1]}` : ' · Todo el año'}
                  </span>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Usuarios', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-cyan-400', sub: `+${stats.usersToday} hoy` },
                  { label: 'En Línea Ahora', value: stats.onlineUsers.toLocaleString(), icon: Wifi, color: 'text-green-400', sub: 'Últimos 5 min', pulse: true },
                  { label: 'Tokens Usados', value: fmtCompact(stats.totalTokensUsed), icon: Zap, color: 'text-yellow-400', sub: `${fmtCompact(stats.tokensUsedToday)} hoy` },
                  { label: 'Transacciónes', value: stats.totalTransactions.toLocaleString(), icon: TrendingUp, color: 'text-purple-400', sub: 'completadas' },
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

              {/* Financiero año seleccionado + mini gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={card}>
                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ingresos {dashboardYear}</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{fmtUsd(stats.revenueYearUsd)}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Mes actual: {fmtUsd(stats.revenueMonthUsd)} · Total: {fmtUsd(stats.revenueTotalUsd)}</p>
                  <div className="flex items-end gap-0.5 h-10 mt-3">
                    {allMonths.map((m, i) => (
                      <div key={i} title={`${m.monthKey}: ${fmtUsd(m.revenueUsd)}`}
                        className={`flex-1 rounded-t-sm transition-all cursor-pointer hover:opacity-100 ${dashboardMonth === i + 1 || dashboardMonth === 0 ? 'opacity-90' : 'opacity-20'}`}
                        style={{ height: `${Math.max(4, (Number(m.revenueUsd || 0) / maxRevenue) * 100)}%`, backgroundColor: '#34d399' }}
                        onClick={() => setDashboardMonth(dashboardMonth === i + 1 ? 0 : i + 1)}
                      />
                    ))}
                  </div>
                  <div className="flex mt-1">
                    {allMonths.map((m, i) => (
                      <div key={i} className={`flex-1 text-center text-[9px] ${dashboardMonth === i + 1 ? 'text-emerald-400 font-bold' : darkMode ? 'text-gray-700' : 'text-gray-300'}`}>{MONTH_NAMES[i]}</div>
                    ))}
                  </div>
                </div>
                <div className={card}>
                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Costos est. {dashboardYear}</p>
                  <p className="text-xl font-black text-orange-400 mt-1">{fmtUsd(stats.estimatedCostYearUsd)}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Mes actual: {fmtUsd(stats.estimatedCostMonthUsd)}</p>
                  <div className="flex items-end gap-0.5 h-10 mt-3">
                    {allMonths.map((m, i) => (
                      <div key={i} title={`${m.monthKey}: ${fmtCompact(m.tokens)} tokens`}
                        className={`flex-1 rounded-t-sm transition-all cursor-pointer hover:opacity-100 ${dashboardMonth === i + 1 || dashboardMonth === 0 ? 'opacity-90' : 'opacity-20'}`}
                        style={{ height: `${Math.max(4, (Number(m.tokens || 0) / maxTokens) * 100)}%`, backgroundColor: '#fb923c' }}
                        onClick={() => setDashboardMonth(dashboardMonth === i + 1 ? 0 : i + 1)}
                      />
                    ))}
                  </div>
                  <div className="flex mt-1">
                    {allMonths.map((m, i) => (
                      <div key={i} className={`flex-1 text-center text-[9px] ${dashboardMonth === i + 1 ? 'text-orange-400 font-bold' : darkMode ? 'text-gray-700' : 'text-gray-300'}`}>{MONTH_NAMES[i]}</div>
                    ))}
                  </div>
                </div>
                <div className={card}>
                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Margen est. {dashboardYear}</p>
                  <p className={`text-xl font-black mt-1 ${Number(stats.estimatedMarginYearUsd || 0) >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{fmtUsd(stats.estimatedMarginYearUsd)}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Mes actual: {fmtUsd(stats.estimatedMarginMonthUsd)}</p>
                  <div className="flex items-end gap-0.5 h-10 mt-3">
                    {allMonths.map((m, i) => (
                      <div key={i} title={`${m.monthKey}: ${m.users} usuarios`}
                        className={`flex-1 rounded-t-sm transition-all cursor-pointer hover:opacity-100 ${dashboardMonth === i + 1 || dashboardMonth === 0 ? 'opacity-90' : 'opacity-20'}`}
                        style={{ height: `${Math.max(4, (Number(m.users || 0) / maxUsers) * 100)}%`, backgroundColor: '#22d3ee' }}
                        onClick={() => setDashboardMonth(dashboardMonth === i + 1 ? 0 : i + 1)}
                      />
                    ))}
                  </div>
                  <div className="flex mt-1">
                    {allMonths.map((m, i) => (
                      <div key={i} className={`flex-1 text-center text-[9px] ${dashboardMonth === i + 1 ? 'text-cyan-400 font-bold' : darkMode ? 'text-gray-700' : 'text-gray-300'}`}>{MONTH_NAMES[i]}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contadores período */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={card}>
                  <h3 className="font-bold mb-2">Usuarios registrados</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Hoy: <span className="font-bold">{stats.usersToday?.toLocaleString()}</span></p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mes actual: <span className="font-bold">{stats.usersThisMonth?.toLocaleString()}</span></p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{dashboardYear}: <span className="font-bold text-cyan-400">{stats.usersThisYear?.toLocaleString()}</span></p>
                </div>
                <div className={card}>
                  <h3 className="font-bold mb-2">Tokens consumidos</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Hoy: <span className="font-bold">{fmtCompact(stats.tokensUsedToday)}</span></p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mes actual: <span className="font-bold">{fmtCompact(stats.tokensUsedMonth)}</span></p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{dashboardYear}: <span className="font-bold text-yellow-400">{fmtCompact(stats.tokensUsedYear)}</span></p>
                </div>
                <div className={card}>
                  <h3 className="font-bold mb-2">Transacciónes</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mes actual: <span className="font-bold">{stats.transactionsMonth?.toLocaleString()}</span></p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{dashboardYear}: <span className="font-bold text-purple-400">{stats.transactionsYear?.toLocaleString()}</span></p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total: <span className="font-bold">{stats.totalTransactions?.toLocaleString()}</span></p>
                </div>
              </div>

              {/* Resumen mensual con gráfico + tabla ordenable */}
              <div className={card}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-bold">Resumen mensual — {dashboardYear}{dashboardMonth > 0 ? ` · ${MONTH_NAMES[dashboardMonth - 1]}` : ''}</h3>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sortedMonths.length} {sortedMonths.length === 1 ? 'mes' : 'meses'} · clic columna para ordenar</span>
                </div>
                {/* Gráfico de barras — tokens */}
                <div className="mb-4">
                  <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tokens por mes (clic para filtrar)</p>
                  <div className="flex items-end gap-0.5 h-20">
                    {allMonths.map((m, i) => {
                      const isActive = dashboardMonth === 0 || dashboardMonth === i + 1
                      return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end cursor-pointer group"
                          onClick={() => setDashboardMonth(dashboardMonth === i + 1 ? 0 : i + 1)}>
                          <div
                            title={`${m.monthKey}: ${fmtCompact(m.tokens)}`}
                            className={`w-full rounded-t-sm transition-all group-hover:opacity-100 ${isActive ? 'opacity-85' : 'opacity-20'}`}
                            style={{ height: `${Math.max(3, (Number(m.tokens || 0) / maxTokens) * 100)}%`, backgroundColor: '#facc15' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex mt-1">
                    {allMonths.map((m, i) => (
                      <div key={i} className={`flex-1 text-center text-[9px] cursor-pointer ${dashboardMonth === i + 1 ? 'text-yellow-400 font-bold' : darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                        onClick={() => setDashboardMonth(dashboardMonth === i + 1 ? 0 : i + 1)}>
                        {MONTH_NAMES[i]}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Tabla ordenable */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {[['monthKey', 'Mes'], ['users', 'Usuarios'], ['tokens', 'Tokens'], ['revenueUsd', 'Ingresos USD']].map(([key, label]) => (
                          <th key={key}
                            className={`py-2 ${key === 'monthKey' ? 'text-left' : 'text-right'} cursor-pointer select-none hover:text-cyan-400 transition-colors`}
                            onClick={() => toggleSort(key)}>
                            {label}<span className="font-mono">{sortIcon(key)}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMonths.map((m) => (
                        <tr key={m.monthKey} className={`border-t ${darkMode ? 'border-white/10' : 'border-gray-100'} hover:${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <td className={`py-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{m.monthKey}</td>
                          <td className="py-2 text-right">{Number(m.users || 0).toLocaleString()}</td>
                          <td className="py-2 text-right text-yellow-400 font-semibold">{fmtCompact(m.tokens || 0)}</td>
                          <td className="py-2 text-right text-emerald-400 font-semibold">{fmtUsd(m.revenueUsd || 0)}</td>
                        </tr>
                      ))}
                      {sortedMonths.length === 0 && (
                        <tr>
                          <td colSpan={4} className={`py-4 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Sin datos para este período</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Uso por horario y día de la semana */}
              {(stats.hourlyUsage || stats.weekdayUsage) && (() => {
                const hours   = stats.hourlyUsage  || []
                const weekdays = stats.weekdayUsage || []
                const maxHToken = Math.max(...hours.map(h => h.tokens), 1)
                const maxWToken = Math.max(...weekdays.map(d => d.tokens), 1)
                const DOW_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
                const peakHour = hours.reduce((p, c) => c.tokens > p.tokens ? c : p, hours[0] || { hour: 0, tokens: 0 })
                const peakDay  = weekdays.reduce((p, c) => c.tokens > p.tokens ? c : p, weekdays[0] || { dow: 0, tokens: 0 })

                // heat color based on intensity
                const heatColor = (val, max) => {
                  const pct = max > 0 ? val / max : 0
                  if (pct === 0) return darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                  const r = Math.round(34 + pct * (250 - 34))
                  const g = Math.round(211 - pct * (211 - 100))
                  const b = Math.round(238 - pct * (238 - 20))
                  return `rgba(${r},${g},${b},${0.3 + pct * 0.7})`
                }

                return (
                  <div className={card}>
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                      <h3 className="font-bold">Uso por Horario — {dashboardYear}</h3>
                      <div className="flex gap-4 text-xs">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Pico diario: <span className="text-cyan-400 font-bold">{peakHour.hour}:00h</span>
                        </span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Pico semanal: <span className="text-yellow-400 font-bold">{DOW_NAMES[peakDay.dow]}</span>
                        </span>
                      </div>
                    </div>

                    {/* Gráfico de horas — 24 barras */}
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tokens por hora del día (hora México)</p>
                    <div className="flex items-end gap-px h-24 mb-1">
                      {hours.map((h) => {
                        const pct = Math.max(2, (h.tokens / maxHToken) * 100)
                        const isNight = h.hour < 6 || h.hour >= 22
                        const isPeak  = h.hour === peakHour.hour
                        return (
                          <div key={h.hour} className="flex-1 h-full flex flex-col justify-end group relative cursor-default">
                            <div
                              className="w-full rounded-t-sm transition-all"
                              style={{ height: `${pct}%`, backgroundColor: isPeak ? '#facc15' : isNight ? '#6366f1' : '#22d3ee', opacity: isPeak ? 1 : 0.7 }}
                              title={`${h.hour}:00h — ${fmtCompact(h.tokens)} tokens · ${h.messages.toLocaleString()} msgs`}
                            />
                          </div>
                        )
                      })}
                    </div>
                    {/* etiquetas cada 3 horas */}
                    <div className="flex mb-5">
                      {hours.map((h) => (
                        <div key={h.hour} className={`flex-1 text-center text-[8px] ${h.hour % 3 === 0 ? (darkMode ? 'text-gray-500' : 'text-gray-400') : 'text-transparent'}`}>
                          {h.hour}h
                        </div>
                      ))}
                    </div>

                    {/* Gráfico de días de semana — 7 barras grandes */}
                    <p className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tokens por día de la semana</p>
                    <div className="grid grid-cols-7 gap-2">
                      {weekdays.map((d) => {
                        const pct = maxWToken > 0 ? Math.round((d.tokens / maxWToken) * 100) : 0
                        const isWeekend = d.dow === 0 || d.dow === 6
                        const isPeakD   = d.dow === peakDay.dow
                        const barColor  = isPeakD ? '#facc15' : isWeekend ? '#a78bfa' : '#22d3ee'
                        return (
                          <div key={d.dow} className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-bold ${isPeakD ? 'text-yellow-400' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {fmtCompact(d.tokens)}
                            </span>
                            <div className={`w-full rounded-lg flex items-end ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`} style={{ height: 80 }}>
                              <div
                                className="w-full rounded-lg transition-all"
                                style={{ height: `${Math.max(4, pct)}%`, backgroundColor: barColor, opacity: 0.85 }}
                                title={`${DOW_NAMES[d.dow]}: ${fmtCompact(d.tokens)} tokens · ${d.messages.toLocaleString()} msgs`}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${isPeakD ? 'text-yellow-400' : isWeekend ? 'text-violet-400' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {DOW_NAMES[d.dow]}
                            </span>
                            <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{d.messages.toLocaleString()} msgs</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Leyenda */}
                    <div className={`flex gap-4 mt-4 text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-400 inline-block" /> Hora/día pico</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" /> Días laborales</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-400 inline-block" /> Fin de semana</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-400 inline-block" /> Noche (22h–6h)</span>
                    </div>
                  </div>
                )
              })()}

              {/* Suscriptores por plan */}
              <div className={card}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Suscriptores por Plan</h3>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{stats.onlineUsers} online ahora</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {['free', 'base', 'pack_lite', 'pack_pro', 'pack_max', 'admin'].map(plan => {
                    const s = planStyle(plan)
                    const count = planCount(plan)
                    const online = planOnline(plan)
                    const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0
                    return (
                      <div key={plan} className={`rounded-xl p-4 ${s.bg} border ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                          <span className={`text-xs font-bold uppercase ${s.text}`}>{PLAN_LABEL[plan]}</span>
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

              {/* Top usuarios + Actividad reciente */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className={card}>
                  <h3 className="font-bold mb-1">Top por Tokens Usados</h3>
                  <p className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Mayor a menor · histórico total</p>
                  <div className="space-y-2.5">
                    {[...stats.topUsers].sort((a, b) => Number(b.total_used) - Number(a.total_used)).slice(0, 10).map((u, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs font-black w-5 shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : darkMode ? 'text-gray-600' : 'text-gray-400'}`}>#{i + 1}</span>
                          <span className={`text-xs truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{u.email}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-yellow-400 font-bold text-xs block">{fmtCompact(u.total_used)}</span>
                          <div className="w-16 h-1 bg-white/10 rounded-full mt-0.5">
                            <div className="h-1 bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (Number(u.total_used) / (Number(stats.topUsers[0]?.total_used) || 1)) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={card}>
                  <h3 className="font-bold mb-1">Actividad Reciente</h3>
                  <p className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Más reciente primero</p>
                  <div className="space-y-2">
                    {[...stats.recentActivity].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10).map((a, i) => (
                      <div key={i} className={`flex items-center justify-between text-xs border-b last:border-0 pb-1.5 ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                        <div className="min-w-0">
                          <span className={`truncate block max-w-[150px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{a.email}</span>
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{a.action || 'síntesis'}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-yellow-400 font-bold block">{a.tokens_used?.toLocaleString()}</span>
                          <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                            {new Date(a.timestamp).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )
        })()}

        {/* ===== OPERACIONES ===== */}
        {tab === 'ops' && (
          <div className="space-y-6">
            <div className={card}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="font-bold">Deploy inteligente (Stream Voicer)</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Usuarios conectados ahora y herramientas para desplegar sin interrumpir.
                  </p>
                </div>
                <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${deployMonitorData.readyForDeploy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                  {deployMonitorData.readyForDeploy ? 'LISTO PARA DEPLOY' : 'AUN HAY USUARIOS CONECTADOS'}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-xl border p-4 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>USUARIOS CONECTADOS AHORA</p>
                  <p className="text-3xl font-black mt-1">{Number(deployMonitorData.connectedUsers || 0)}</p>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Se considera conectado quien tuvo actividad en los ultimos 5 minutos.
                  </p>
                </div>

                <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(deployMonitorData.settings.notifyEnabled)}
                      onChange={(e) => setDeployMonitorData((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, notifyEnabled: e.target.checked }
                      }))}
                    />
                    Activar avisador por correo
                  </label>
                  <input
                    className={`${inp} w-full`}
                    placeholder="tu-correo@dominio.com"
                    value={deployMonitorData.settings.notifyEmail || ''}
                    onChange={(e) => setDeployMonitorData((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, notifyEmail: e.target.value }
                    }))}
                  />
                  <button
                    onClick={saveDeployMonitorSettings}
                    disabled={deployMonitorSaving}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold ${deployMonitorSaving ? 'bg-gray-500/40 text-gray-200' : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'}`}
                  >
                    Guardar avisador
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold block mb-2">Mensaje para usuarios</label>
                <input
                  className={`${inp} w-full mb-2`}
                  placeholder="Titulo del comunicado"
                  value={deployMonitorData.settings.noticeTitle || ''}
                  onChange={(e) => setDeployMonitorData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, noticeTitle: e.target.value }
                  }))}
                />
                <textarea
                  className={`${inp} w-full min-h-24`}
                  placeholder="Mensaje del comunicado"
                  value={deployMonitorData.settings.maintenanceMessage || ''}
                  onChange={(e) => setDeployMonitorData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, maintenanceMessage: e.target.value }
                  }))}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={saveDeployMaintenanceMessage}
                    disabled={deployMonitorSaving}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold ${deployMonitorSaving ? 'bg-gray-500/40 text-gray-200' : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'}`}
                  >
                    Guardar mensaje
                  </button>
                  <button
                    onClick={sendMaintenanceNoticeNow}
                    disabled={deployMonitorSaving}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold ${deployMonitorSaving ? 'bg-gray-500/40 text-gray-200' : 'bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30'}`}
                  >
                    Mandar aviso ahora
                  </button>
                  <button
                    onClick={loadDeployMonitor}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold ${darkMode ? 'bg-white/10 text-gray-200 hover:bg-white/15' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                  >
                    Recargar estado
                  </button>
                </div>
                {deployMonitorLoading && (
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actualizando estado...</p>
                )}
              </div>
            </div>
            <div className={card}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold">Log general de movimientos</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Formato bruto: USUARIO hizo acción en fecha y hora.
                  </p>
                </div>
                <button
                  onClick={loadMovementLogs}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${darkMode ? 'border-white/15 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'}`}
                >
                  Recargar log
                </button>
              </div>

              {movementLogsLoading && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando movimientos...</div>
              )}
              {!movementLogsLoading && movementLogsError && (
                <div className="text-sm text-red-400">{movementLogsError}</div>
              )}
              {!movementLogsLoading && !movementLogsError && movementLogsByMonth.length === 0 && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sin movimientos para el periodo seleccionado.</div>
              )}
              {!movementLogsLoading && !movementLogsError && movementLogsByMonth.length > 0 && (
                <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                  {movementLogsByMonth.map((group) => (
                    <div key={group.monthKey} className={`rounded-xl border ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold">{group.monthKey}</p>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{group.total} movimientos</span>
                      </div>
                      <div className="space-y-2">
                        {(group.items || []).map((item, idx) => {
                          const movementKey = `${item.source || 'unknown'}:${item.entryId || `${group.monthKey}-${idx}`}`
                          const isDeletingMovement = deletingMovementKey === movementKey
                          return (
                          <div key={movementKey} className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm">{movementSummary(item)}</p>
                              <button
                                onClick={() => deleteMovementLog(item)}
                                disabled={isDeletingMovement || !item?.entryId}
                                className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${darkMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50' : 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'}`}
                                title={item?.entryId ? 'Borrar movimiento' : 'No se puede borrar este movimiento'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {isDeletingMovement ? 'Borrando...' : 'Borrar'}
                              </button>
                            </div>
                            <div className={`mt-1 text-[11px] flex flex-wrap gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span>{new Date(item.eventAt).toLocaleString('es-MX')}</span>
                              <span>-</span>
                              <span>{item.source}</span>
                              <span>-</span>
                              <span>{formatActionLabel(item.action)}</span>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className={card}>
                <h3 className="font-bold mb-3">Crear Usuario</h3>
                <div className="space-y-2">
                  <input className={`${inp} w-full`} placeholder="email@dominio.com" value={createUserForm.email}
                    onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))} />
                  <input className={`${inp} w-full`} placeholder="Password inicial" value={createUserForm.password}
                    onChange={(e) => setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-2">
                    <select className={inp} value={createUserForm.plan}
                      onChange={(e) => setCreateUserForm((prev) => ({ ...prev, plan: e.target.value }))}>
                      {['free', 'base', 'pack_lite', 'pack_pro', 'pack_max', 'admin'].map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                    </select>
                    <input type="number" className={inp} value={createUserForm.tokens}
                      onChange={(e) => setCreateUserForm((prev) => ({ ...prev, tokens: parseInt(e.target.value || '0') }))} />
                    <select className={inp} value={createUserForm.role}
                      onChange={(e) => setCreateUserForm((prev) => ({ ...prev, role: e.target.value }))}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <button onClick={createUser}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-bold">
                    Crear Usuario
                  </button>
                </div>
              </div>
            </div>

            <div className={card}>
              <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Deteccion de Uso Anormal</h3>
              {opsLoading ? (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando...</div>
              ) : anomalies.length === 0 ? (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sin anomalias detectadas.</div>
              ) : (
                <div className="space-y-2">
                  {anomalies.slice(0, 20).map((a, idx) => (
                    <div key={`${a.userId}-${a.type}-${idx}`} className={`rounded-lg px-3 py-2 border ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{a.email}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{a.severity}</span>
                      </div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{a.details}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={card}>
              <h3 className="font-bold mb-3">Historial de Comunicados</h3>
              <div className="space-y-2">
                {broadcasts.length === 0 && <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sin comunicados registrados.</div>}
                {broadcasts.slice(0, 20).map((b) => (
                  <div key={b.id} className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{b.title}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{b.kind} A {b.status} A {new Date(b.created_at).toLocaleString('es-MX')}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setBroadcastStatus(b.id, 'active')} className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300">Activar</button>
                        <button onClick={() => setBroadcastStatus(b.id, 'paused')} className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300">Pausar</button>
                        <button onClick={() => deleteBroadcast(b.id)} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300">Borrar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== AUDIO CACHE ===== */}
        {tab === 'cache' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hot Cache</p>
                <p className="text-2xl font-black text-cyan-400">{fmtNum(audioCacheStats?.hotCacheEntries || 0)}</p>
              </div>
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Global Entries</p>
                <p className="text-2xl font-black text-purple-400">{fmtNum(audioCacheStats?.byScope?.global?.entries || 0)}</p>
              </div>
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Personal Entries</p>
                <p className="text-2xl font-black text-emerald-400">{fmtNum(audioCacheStats?.byScope?.personal?.entries || 0)}</p>
              </div>
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hit Rate</p>
                <p className="text-2xl font-black text-green-400">{Number(audioCacheStats?.runtime?.hit_rate_percent || 0).toFixed(2)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tokens Ahorrados 24h (real)</p>
                <p className="text-2xl font-black text-yellow-400">{fmtNum(audioCacheStats?.realSavings?.tokensSaved24h || 0)}</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>≈ {fmtUsd(audioCacheStats?.realSavings?.savedUsdMax24h || 0)} en MAX</p>
              </div>
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tokens Ahorrados 30d (real)</p>
                <p className="text-2xl font-black text-orange-400">{fmtNum(audioCacheStats?.realSavings?.tokensSaved30d || 0)}</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>≈ {fmtUsd(audioCacheStats?.realSavings?.savedUsdMax30d || 0)} en MAX</p>
              </div>
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mes actual (real)</p>
                <p className="text-2xl font-black text-cyan-400">{fmtNum(audioCacheStats?.realSavings?.tokensSavedMonth || 0)}</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>≈ {fmtUsd(audioCacheStats?.realSavings?.savedUsdMaxMonth || 0)} en MAX</p>
              </div>
              <div className={card}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Proyección mensual</p>
                <p className="text-2xl font-black text-fuchsia-400">{fmtNum(audioCacheStats?.realSavings?.projectedTokensMonth || 0)}</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>≈ {fmtUsd(audioCacheStats?.realSavings?.projectedSavedUsdMaxMonth || 0)} en MAX</p>
              </div>
            </div>
            <div className={card}>
              <h3 className="font-bold mb-2">Ahorro real del caché</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {audioCacheStats?.realSavings?.methodology || 'Basado en eventos reales de token_logs con acciones de caché.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Eventos caché 30d</p>
                  <p className="text-lg font-black text-cyan-400">{fmtNum(audioCacheStats?.realSavings?.cacheEvents30d || 0)}</p>
                </div>
                <div className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chars ahorrados 30d</p>
                  <p className="text-lg font-black text-emerald-400">{fmtNum(audioCacheStats?.realSavings?.charsSaved30d || 0)}</p>
                </div>
                <div className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Precio usado</p>
                  <p className="text-lg font-black text-yellow-400">
                    MAX ${Number(audioCacheStats?.realSavings?.pricing?.maxPer1M || 0).toFixed(2)}/1M
                  </p>
                </div>
              </div>
            </div>

            <div className={card}>
              <h3 className="font-bold mb-4">Configuracion Cache Hibrido</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="text-xs">
                  {cacheLabel('Habilitado', 'Activa o desactiva el sistema de cache.')}
                  <select className={`${inp} w-full mt-1`} value={audioCacheSettings.enabled ? '1' : '0'} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, enabled: e.target.value === '1' }))}>
                    <option value="1">Si</option>
                    <option value="0">No</option>
                  </select>
                </label>
                <label className="text-xs">
                  {cacheLabel('Max caracteres cacheables', 'Textos mas largos no se guardan en cache.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.maxCacheableChars} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, maxCacheableChars: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Lookup timeout (ms)', 'Tiempo maximo de busqueda antes de render directo.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.lookupTimeoutMs} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, lookupTimeoutMs: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('TTL personal FREE (horas)', 'Duracion del cache personal para usuarios free.')}
                  <input type="number" min="1" className={`${inp} w-full mt-1`} value={secondsToHours(audioCacheSettings.personalFreeTtlSeconds, 168)} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, personalFreeTtlSeconds: hoursToSeconds(e.target.value, prev.personalFreeTtlSeconds || 604800) }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('TTL personal PAID (horas)', 'Duracion del cache personal para usuarios de pago.')}
                  <input type="number" min="1" className={`${inp} w-full mt-1`} value={secondsToHours(audioCacheSettings.personalPaidTtlSeconds, 720)} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, personalPaidTtlSeconds: hoursToSeconds(e.target.value, prev.personalPaidTtlSeconds || 2592000) }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Max entries personal FREE', 'Maximo de audios por usuario free.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.personalFreeMaxEntries} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, personalFreeMaxEntries: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Max entries personal PAID', 'Maximo de audios por usuario de pago.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.personalPaidMaxEntries} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, personalPaidMaxEntries: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('TTL personal legacy (horas)', 'Compatibilidad con reglas antiguas de personal.')}
                  <input type="number" min="1" className={`${inp} w-full mt-1`} value={secondsToHours(audioCacheSettings.personalTtlSeconds, 168)} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, personalTtlSeconds: hoursToSeconds(e.target.value, prev.personalTtlSeconds || 604800) }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('TTL global legacy (horas)', 'Compatibilidad con reglas antiguas de global.')}
                  <input type="number" min="1" className={`${inp} w-full mt-1`} value={secondsToHours(audioCacheSettings.globalTtlSeconds, 720)} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, globalTtlSeconds: hoursToSeconds(e.target.value, prev.globalTtlSeconds || 2592000) }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Hot cache max entries', 'Capacidad maxima del cache rapido en memoria.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.hotCacheMaxEntries} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, hotCacheMaxEntries: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Global max entries', 'Tope total de entradas del cache compartido.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.globalMaxEntries} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, globalMaxEntries: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Global inactivo (dias)', 'Si no se usa este tiempo, puede eliminarse.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.globalInactiveDays} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, globalInactiveDays: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Global uso bajo (hits)', 'Minimo uso para considerar una entrada poco util.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.globalLowUsageThreshold} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, globalLowUsageThreshold: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Umbral repeticion global', 'Cuantas repeticiones pide antes de guardar en global.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.globalRepeatThreshold} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, globalRepeatThreshold: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Gracia suscripcion (dias)', 'Dias extra para mantener cache tras perder plan.')}
                  <input type="number" className={`${inp} w-full mt-1`} value={audioCacheSettings.subscriptionGraceDays} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, subscriptionGraceDays: parseInt(e.target.value || '0') }))} />
                </label>
                <label className="text-xs">
                  {cacheLabel('Reset voces/config tras gracia', 'Borra voces/config cuando termina la gracia.')}
                  <select className={`${inp} w-full mt-1`} value={audioCacheSettings.purgePersonalizationAfterGrace ? '1' : '0'} onChange={(e) => setAudioCacheSettings(prev => ({ ...prev, purgePersonalizationAfterGrace: e.target.value === '1' }))}>
                    <option value="0">No</option>
                    <option value="1">Si</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={saveAudioCacheSettings} className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-bold">Guardar Configuracion</button>
                <button onClick={() => purgeAudioCache('all', false)} className="px-4 py-2 rounded-lg bg-red-500/80 text-white text-sm font-bold">Purgar Todo</button>
                <button onClick={() => purgeAudioCache('all', true)} className="px-4 py-2 rounded-lg bg-yellow-500/80 text-white text-sm font-bold">Purgar Expirados</button>
              </div>
            </div>

            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Entradas de Cache Persistente</h3>
                <select className={inp} value={audioCacheScopeFilter} onChange={(e) => setAudioCacheScopeFilter(e.target.value)}>
                  <option value="all">Todos</option>
                  <option value="global">Global</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              {audioCacheLoading ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando cache...</p>
              ) : audioCacheEntries.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay entradas de cache.</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-auto">
                  {audioCacheEntries.map((entry) => (
                    <div key={entry.cache_key} className={`rounded-lg border px-3 py-2 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{entry.voice_id} A {entry.scope}</p>
                          <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            chars: {entry.char_count} A hits: {entry.hits} A user: {entry.user_email || '-'}
                          </p>
                          <p className={`text-[11px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{entry.cache_key}</p>
                        </div>
                        <button onClick={() => deleteAudioCacheEntry(entry.cache_key)} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                          ? (darkMode
                              ? `${s.bg} ${s.text} border-current`
                              : `${PLAN_PILL_LIGHT[plan] || PLAN_PILL_LIGHT.free} border-current`)
                          : darkMode
                            ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className="uppercase">{PLAN_LABEL[plan] ?? plan}</span>
                      <span className={`font-black ${active ? (darkMode ? s.text : 'text-gray-800') : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Usuario
                </button>
                <button
                  onClick={exportEmailsCsv}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${darkMode ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar correos CSV
                </button>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {totalUsers} usuarios
                </span>
              </div>
            </div>

            {/* Error de carga */}
            {usersError && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
                <span>Error: {usersError}</span>
                <button onClick={loadUsers} className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-xs font-semibold">
                  Reintentar
                </button>
              </div>
            )}

            {/* Tabla */}
            <div className={`${card} p-0 overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-xs ${darkMode ? 'text-gray-500 bg-white/5' : 'text-gray-400 bg-gray-50'}`}>
                      <th className="text-left px-4 py-3">Estado</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">Suscripción</th>
                      <th className="text-left px-4 py-3">Seguridad</th>
                      <th className="text-left px-4 py-3">Comprados</th>
                      <th className="text-left px-4 py-3">Restantes</th>
                      <th className="text-left px-4 py-3">Usados</th>
                      <th className="text-left px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && !usersError && users.length === 0 && (
                      <tr>
                        <td colSpan={9} className={`px-4 py-10 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          No hay usuarios registrados con este filtro
                        </td>
                      </tr>
                    )}
                    {users.map(u => {
                      const online = isOnline(u.last_seen)
                      const suspended = !!u.is_suspended
                      const userPlan = u.normalized_plan || u.plan || 'free'
                      const billingCycle = String(u.subscription_billing_cycle || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly'
                      const renewalAt = u.subscription_current_period_end ? new Date(u.subscription_current_period_end) : null
                      const hasPendingPlan = !!u.subscription_pending_plan_display
                      const pendingPlanLabel = hasPendingPlan
                        ? `${String(u.subscription_pending_plan_display || '').toUpperCase()} ${u.subscription_pending_billing_cycle === 'annual' ? 'ANUAL' : 'MENSUAL'}`
                        : null
                      const pendingAt = u.subscription_pending_effective_at ? new Date(u.subscription_pending_effective_at) : null
                      const s = planStyle(userPlan)
                      const pillClass = darkMode
                        ? `${s.bg} ${s.text}`
                        : (PLAN_PILL_LIGHT[userPlan] || PLAN_PILL_LIGHT.free)
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
                                {['free', 'base', 'pack_lite', 'pack_pro', 'pack_max', 'admin'].map(p => (
                                  <option key={p} value={p}>{PLAN_LABEL[p]}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pillClass}`}>
                                {PLAN_LABEL[userPlan] ?? String(userPlan || 'free').toUpperCase()}
                              </span>
                            )}
                          </td>

                          {/* Seguridad */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold inline-block w-fit ${billingCycle === 'annual' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                                {billingCycle === 'annual' ? 'ANUAL' : 'MENSUAL'}
                              </span>
                              <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Renueva: {renewalAt ? renewalAt.toLocaleString('es-MX') : 'N/D'}
                              </span>
                              {hasPendingPlan && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 inline-block w-fit">
                                  Programado: {pendingPlanLabel}
                                  {pendingAt ? ` (${pendingAt.toLocaleDateString('es-MX')})` : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Seguridad */}
                          <td className="px-4 py-3">
                            {suspended ? (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                                Suspendido
                              </span>
                            ) : (
                              <span className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Activo</span>
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
                                  <button onClick={() => loadActivity(u.id)}
                                    className={`p-1 rounded ${darkMode ? 'text-cyan-300 hover:bg-cyan-400/20' : 'text-cyan-700 hover:bg-cyan-100'}`} title="Ver historial">
                                    <Activity className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => loadUserVoices(u)}
                                    className={`p-1 rounded ${darkMode ? 'text-indigo-300 hover:bg-indigo-400/20' : 'text-indigo-700 hover:bg-indigo-100'}`} title="Gestionar voces">
                                    <Mic className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => { setAddTokensUser(u.id); setAddTokensAmount(100000) }}
                                    className={`p-1 rounded ${darkMode ? 'text-yellow-400 hover:bg-yellow-400/20' : 'text-yellow-500 hover:bg-yellow-50'}`} title="Agregar tokens">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  {suspended ? (
                                    <button onClick={() => unsuspendUser(u.id)}
                                      className={`p-1 rounded ${darkMode ? 'text-green-400 hover:bg-green-400/20' : 'text-green-600 hover:bg-green-50'}`} title="Reactivar usuario">
                                      <PlayCircle className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button onClick={() => { setSuspendUserId(u.id); setSuspendMinutes(60); setSuspendReason('Actividad anormal') }}
                                      className={`p-1 rounded ${darkMode ? 'text-orange-300 hover:bg-orange-400/20' : 'text-orange-600 hover:bg-orange-50'}`} title="Suspender usuario">
                                      <PauseCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button onClick={() => { setResetPasswordUserId(u.id); setManualResetPassword('') }}
                                    className={`p-1 rounded ${darkMode ? 'text-purple-300 hover:bg-purple-400/20' : 'text-purple-700 hover:bg-purple-100'}`} title="Reset password">
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => deleteUser(u)}
                                    className={`p-1 rounded ${darkMode ? 'text-red-300 hover:bg-red-400/20' : 'text-red-700 hover:bg-red-100'}`} title="Eliminar usuario">
                                    <Trash2 className="w-3.5 h-3.5" />
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
                    Anterior
                  </button>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {page} / {totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className={`px-3 py-1 text-xs rounded ${darkMode ? 'bg-white/10 disabled:opacity-30' : 'bg-gray-100 disabled:opacity-30'}`}>
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal voces de usuario */}
      {voicesUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-auto ${darkMode ? 'bg-[#111127] border border-white/20' : 'bg-white border border-gray-200 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Voces de {voicesUser.email}</h3>
              <button onClick={() => { setVoicesUser(null); setVoicesList([]) }} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}><X className="w-4 h-4" /></button>
            </div>
            {voicesLoading ? (
              <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Cargando voces...</p>
            ) : voicesList.length === 0 ? (
              <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Este usuario no tiene voces registradas.</p>
            ) : (
              <div className="space-y-2">
                {voicesList.map((voice) => (
                  <div key={voice.id} className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{voice.voice_name}</p>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ID: {voice.voice_id}  Provider: {voice.provider || '-'}</p>
                    </div>
                    <button
                      onClick={() => deleteUserVoice(voice.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${darkMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      Borrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal crear usuario */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-96 ${darkMode ? 'bg-[#1a1a35] border border-white/20' : 'bg-white border border-gray-200 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Nuevo Usuario</h3>
              <button onClick={() => setShowCreateUserModal(false)} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email *</label>
                <input
                  className={`${inp} w-full`}
                  placeholder="email@dominio.com"
                  value={createUserForm.email}
                  onChange={e => setCreateUserForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contraseña inicial *</label>
                <input
                  className={`${inp} w-full`}
                  placeholder="Mínimo 6 caracteres"
                  value={createUserForm.password}
                  onChange={e => setCreateUserForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Plan</label>
                  <select className={`${inp} w-full`} value={createUserForm.plan}
                    onChange={e => setCreateUserForm(p => ({ ...p, plan: e.target.value }))}>
                    {['free', 'base', 'pack_lite', 'pack_pro', 'pack_max', 'admin'].map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tokens</label>
                  <input type="number" className={`${inp} w-full`} value={createUserForm.tokens}
                    onChange={e => setCreateUserForm(p => ({ ...p, tokens: parseInt(e.target.value || '0') }))} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rol</label>
                  <select className={`${inp} w-full`} value={createUserForm.role}
                    onChange={e => setCreateUserForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold ${darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={createUser}
                  disabled={!createUserForm.email || !createUserForm.password}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold disabled:opacity-40"
                >
                  Crear Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal suspender usuario */}
      {suspendUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-96 ${darkMode ? 'bg-[#1a1a35] border border-white/20' : 'bg-white border border-gray-200 shadow-xl'}`}>
            <h3 className="font-bold text-lg mb-3">Suspender Usuario</h3>
            <input type="number" className={`${inp} w-full mb-2`} value={suspendMinutes}
              onChange={(e) => setSuspendMinutes(parseInt(e.target.value || '0'))} placeholder="Minutos (0 = indefinido)" />
            <textarea className={`${inp} w-full min-h-20`} value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)} placeholder="Motivo de suspension" />
            <div className="flex gap-2 mt-4">
              <button onClick={suspendUser} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-bold">Suspender</button>
              <button onClick={() => setSuspendUserId(null)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reset password */}
      {resetPasswordUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-96 ${darkMode ? 'bg-[#1a1a35] border border-white/20' : 'bg-white border border-gray-200 shadow-xl'}`}>
            <h3 className="font-bold text-lg mb-3">Restablecer Password</h3>
            <input className={`${inp} w-full`} value={manualResetPassword}
              onChange={(e) => setManualResetPassword(e.target.value)}
              placeholder="Nueva password (opcional, vacio = generar temporal)" />
            <div className="flex gap-2 mt-4">
              <button onClick={resetUserPassword} className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-sm font-bold">Restablecer</button>
              <button onClick={() => setResetPasswordUserId(null)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal password generada */}
      {generatedPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-6 w-96 ${darkMode ? 'bg-[#1a1a35] border border-white/20' : 'bg-white border border-gray-200 shadow-xl'}`}>
            <h3 className="font-bold text-lg mb-2">Password Temporal Generada</h3>
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Guarda esta password y compArtela al usuario.</p>
            <div className={`rounded-lg px-3 py-2 font-mono text-sm ${darkMode ? 'bg-white/10 text-cyan-300' : 'bg-gray-100 text-gray-800'}`}>{generatedPassword}</div>
            <button onClick={() => setGeneratedPassword(null)} className="w-full mt-3 py-2 rounded-lg bg-cyan-500 text-white text-sm font-bold">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal actividad/logs */}
      {activityUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-auto ${darkMode ? 'bg-[#111127] border border-white/20' : 'bg-white border border-gray-200 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Historial de Usuario</h3>
              <button onClick={() => { setActivityUserId(null); setActivityData(null) }} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold">
                Ventana (horas)
                <input
                  type="number"
                  min="1"
                  max="336"
                  value={activityHours}
                  onChange={(e) => setActivityHours(Math.max(1, Math.min(336, Number(e.target.value) || 48)))}
                  className={`${inp} ml-2 w-20`}
                />
              </label>
              <label className="text-xs font-semibold">
                Max logs
                <input
                  type="number"
                  min="100"
                  max="20000"
                  step="100"
                  value={activityLimit}
                  onChange={(e) => setActivityLimit(Math.max(100, Math.min(20000, Number(e.target.value) || 5000)))}
                  className={`${inp} ml-2 w-24`}
                />
              </label>
              <button
                onClick={() => loadActivity(activityUserId)}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold ${darkMode ? 'bg-white/10 text-gray-200 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recargar
              </button>
              <button
                onClick={() => exportActivityLogs('json')}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold ${darkMode ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'}`}
              >
                <Download className="w-3.5 h-3.5" />
                Exportar JSON
              </button>
              <button
                onClick={() => exportActivityLogs('csv')}
                className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold ${darkMode ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>
            </div>
            {activityLoading && <p className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Cargando actividad...</p>}
            {!activityLoading && activityData && (
              <div className="space-y-4">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-semibold">{activityData.user?.email}</span> | Plan {activityData.user?.plan} | Tokens {activityData.user?.tokens}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ventana: ultimas {activityData.filters?.hours || activityHours} horas | Limite: {activityData.filters?.limit || activityLimit} por bloque
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                  <div className={card}>
                    <h4 className="font-semibold mb-2">Consumo / Token Logs ({(activityData.activity?.tokenLogs || []).length})</h4>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {(activityData.activity?.tokenLogs || []).map((l, i) => (
                        <div key={i} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(l.timestamp).toLocaleString('es-MX')}  {l.action || 'sintesis'}  {Number(l.tokens_used || 0).toLocaleString()} tokens
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={card}>
                    <h4 className="font-semibold mb-2">Transacciónes ({(activityData.activity?.transactions || []).length})</h4>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {(activityData.activity?.transactions || []).map((t, i) => (
                        <div key={i} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(t.created_at).toLocaleString('es-MX')}  {t.status}  +{Number(t.tokens_purchased || 0).toLocaleString()} tokens
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={card}>
                    <h4 className="font-semibold mb-2">Logs Tecnicos / Admin ({(activityData.activity?.adminActions || []).length})</h4>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {(activityData.activity?.adminActions || []).map((a, i) => (
                        <div key={i} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(a.created_at).toLocaleString('es-MX')}  {a.action}  {a.admin_email || 'admin'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={card}>
                    <h4 className="font-semibold mb-2">Logs Backend API ({(activityData.activity?.requestLogs || []).length})</h4>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {(activityData.activity?.requestLogs || []).map((r, i) => (
                        <div key={i} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(r.created_at).toLocaleString('es-MX')}  {r.method} {r.path}  {r.status_code}{r.error_message ? `  ${r.error_message}` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={card}>
                    <h4 className="font-semibold mb-2">Logs Stream Runtime ({(activityData.activity?.streamRuntime || []).length})</h4>
                    <div className="space-y-1 max-h-64 overflow-auto">
                      {(activityData.activity?.streamRuntime || []).map((r, i) => (
                        <div key={i} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(r.created_at).toLocaleString('es-MX')} {r.stream_username ? ` @${r.stream_username}` : ''} {r.event_type}
                          {r.message ? `  ${r.message}` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}












