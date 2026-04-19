import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, Edit2, Check, X, ChevronLeft, ChevronRight,
  Tag, BarChart2, Clock, Download, Eye, RefreshCw, Copy,
  AlertTriangle, Filter, Trash2
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const STATUS_STYLES = {
  draft:     { bg: 'bg-gray-500/20',   text: 'text-gray-300',   label: 'Borrador' },
  active:    { bg: 'bg-green-500/20',  text: 'text-green-300',  label: 'Activo' },
  paused:    { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Pausado' },
  expired:   { bg: 'bg-red-500/20',    text: 'text-red-300',    label: 'Expirado' },
  exhausted: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Agotado' },
  archived:  { bg: 'bg-gray-500/20',   text: 'text-gray-500',   label: 'Archivado' },
}

const STATUSES = ['', 'draft', 'active', 'paused', 'expired', 'exhausted', 'archived']
const DISCOUNT_TYPES = ['percentage', 'fixed']
const ELIGIBLE_TYPES = ['all', 'new_users', 'existing_users', 'active_membership', 'no_previous_purchases', 'no_previous_coupons']
const APPLIES_TO = ['all', 'new_users', 'existing_users', 'selected_users', 'specific_product']

const ELIGIBLE_LABELS = {
  all: 'Todos',
  new_users: 'Nuevos usuarios',
  existing_users: 'Usuarios existentes',
  active_membership: 'Con membresía activa',
  no_previous_purchases: 'Sin compras previas',
  no_previous_coupons: 'Sin cupones previos'
}

const APPLIES_LABELS = {
  all: 'Todos los productos',
  new_users: 'Nuevos usuarios',
  existing_users: 'Usuarios existentes',
  selected_users: 'Usuarios seleccionados',
  specific_product: 'Producto específico'
}

const EMPTY_FORM = {
  code: '', internal_name: '', description: '', status: 'draft',
  discount_type: 'percentage', discount_value: '', max_discount: '', min_purchase: '0',
  max_uses_total: '', max_uses_per_user: '1',
  start_date: '', end_date: '',
  applies_to: 'all', applicable_products: [],
  eligible_user_type: 'all', eligible_user_ids: [],
  first_purchase_only: false, once_per_email: false, once_per_phone: false,
  compatible_with_others: true,
  limit_per_ip: '', limit_per_device: '', limit_per_card: '',
  campaign: '', priority: '0',
  scheduled_activate_at: '', scheduled_deactivate_at: ''
}

export default function CouponManager({ darkMode, authToken }) {
  const [view, setView] = useState('list') // list, create, edit, detail, metrics
  const [coupons, setCoupons] = useState([])
  const [totalCoupons, setTotalCoupons] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [discountTypeFilter, setDiscountTypeFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')

  // Form
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState(null)

  // Detail view
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [redemptions, setRedemptions] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [couponMetrics, setCouponMetrics] = useState(null)

  // Global metrics
  const [globalMetrics, setGlobalMetrics] = useState(null)

  const headers = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }

  const dm = darkMode
  const card = dm ? 'bg-white/5 border border-white/10 rounded-xl p-5' : 'bg-white border border-gray-200 rounded-xl p-5 shadow-sm'
  const inp = dm
    ? 'bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-400'
    : 'bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400'
  const lbl = `block text-xs font-medium mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`
  const sel = dm
    ? 'bg-white text-gray-900 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500'
    : 'bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400'

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // ===== API CALLS =====

  const loadCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page, limit: 25, search,
        ...(statusFilter && { status: statusFilter }),
        ...(discountTypeFilter && { discount_type: discountTypeFilter }),
        ...(campaignFilter && { campaign: campaignFilter }),
      })
      const r = await fetch(`${API_URL}/api/coupons/admin/list?${params}`, { headers })
      const d = await r.json()
      if (d.success) {
        setCoupons(d.coupons)
        setTotalCoupons(d.total)
        setTotalPages(d.pages)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [authToken, page, search, statusFilter, discountTypeFilter, campaignFilter])

  const loadGlobalMetrics = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/coupons/admin/metrics`, { headers })
      const d = await r.json()
      if (d.success) setGlobalMetrics(d.metrics)
    } catch (e) { console.error(e) }
  }, [authToken])

  useEffect(() => {
    loadCoupons()
    loadGlobalMetrics()
  }, [page, statusFilter, discountTypeFilter])

  useEffect(() => {
    const t = setTimeout(loadCoupons, 350)
    return () => clearTimeout(t)
  }, [search, campaignFilter])

  const saveCoupon = async () => {
    setLoading(true)
    try {
      const payload = { ...form }
      // Parse numbers
      if (payload.discount_value) payload.discount_value = parseFloat(payload.discount_value)
      if (payload.max_discount) payload.max_discount = parseFloat(payload.max_discount)
      if (payload.min_purchase) payload.min_purchase = parseFloat(payload.min_purchase)
      if (payload.max_uses_total) payload.max_uses_total = parseInt(payload.max_uses_total)
      else payload.max_uses_total = null
      if (payload.max_uses_per_user) payload.max_uses_per_user = parseInt(payload.max_uses_per_user)
      if (payload.priority) payload.priority = parseInt(payload.priority)
      if (payload.limit_per_ip) payload.limit_per_ip = parseInt(payload.limit_per_ip)
      else payload.limit_per_ip = null
      if (payload.limit_per_device) payload.limit_per_device = parseInt(payload.limit_per_device)
      else payload.limit_per_device = null
      if (payload.limit_per_card) payload.limit_per_card = parseInt(payload.limit_per_card)
      else payload.limit_per_card = null

      // Clean empty dates
      if (!payload.start_date) payload.start_date = null
      if (!payload.end_date) payload.end_date = null
      if (!payload.scheduled_activate_at) payload.scheduled_activate_at = null
      if (!payload.scheduled_deactivate_at) payload.scheduled_deactivate_at = null

      const url = editingId
        ? `${API_URL}/api/coupons/admin/${editingId}`
        : `${API_URL}/api/coupons/admin/create`
      const method = editingId ? 'PUT' : 'POST'

      const r = await fetch(url, { method, headers, body: JSON.stringify(payload) })
      const d = await r.json()

      if (d.success) {
        showMsg(editingId ? 'Cupón actualizado' : 'Cupón creado')
        setView('list')
        setEditingId(null)
        setForm({ ...EMPTY_FORM })
        loadCoupons()
        loadGlobalMetrics()
      } else {
        showMsg(d.error || 'Error', 'error')
      }
    } catch (e) {
      showMsg(e.message, 'error')
    }
    setLoading(false)
  }

  const openEdit = (coupon) => {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code || '',
      internal_name: coupon.internal_name || '',
      description: coupon.description || '',
      status: coupon.status || 'draft',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value?.toString() || '',
      max_discount: coupon.max_discount?.toString() || '',
      min_purchase: coupon.min_purchase?.toString() || '0',
      max_uses_total: coupon.max_uses_total?.toString() || '',
      max_uses_per_user: coupon.max_uses_per_user?.toString() || '1',
      start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().slice(0, 16) : '',
      end_date: coupon.end_date ? new Date(coupon.end_date).toISOString().slice(0, 16) : '',
      applies_to: coupon.applies_to || 'all',
      applicable_products: coupon.applicable_products || [],
      eligible_user_type: coupon.eligible_user_type || 'all',
      eligible_user_ids: coupon.eligible_user_ids || [],
      first_purchase_only: coupon.first_purchase_only || false,
      once_per_email: coupon.once_per_email || false,
      once_per_phone: coupon.once_per_phone || false,
      compatible_with_others: coupon.compatible_with_others !== false,
      limit_per_ip: coupon.limit_per_ip?.toString() || '',
      limit_per_device: coupon.limit_per_device?.toString() || '',
      limit_per_card: coupon.limit_per_card?.toString() || '',
      campaign: coupon.campaign || '',
      priority: coupon.priority?.toString() || '0',
      scheduled_activate_at: coupon.scheduled_activate_at ? new Date(coupon.scheduled_activate_at).toISOString().slice(0, 16) : '',
      scheduled_deactivate_at: coupon.scheduled_deactivate_at ? new Date(coupon.scheduled_deactivate_at).toISOString().slice(0, 16) : '',
    })
    setView('edit')
  }

  const openDetail = async (coupon) => {
    setSelectedCoupon(coupon)
    setView('detail')
    try {
      const [mRes, rRes, aRes] = await Promise.all([
        fetch(`${API_URL}/api/coupons/admin/${coupon.id}/metrics`, { headers }),
        fetch(`${API_URL}/api/coupons/admin/${coupon.id}/redemptions`, { headers }),
        fetch(`${API_URL}/api/coupons/admin/${coupon.id}/audit`, { headers }),
      ])
      const [mData, rData, aData] = await Promise.all([mRes.json(), rRes.json(), aRes.json()])
      if (mData.success) setCouponMetrics(mData.metrics)
      if (rData.success) setRedemptions(rData.redemptions)
      if (aData.success) setAuditLog(aData.log)
    } catch (e) { console.error(e) }
  }

  const exportCoupon = async (couponId) => {
    try {
      const r = await fetch(`${API_URL}/api/coupons/admin/${couponId}/export`, { headers })
      const d = await r.json()
      if (d.success) {
        const blob = new Blob([JSON.stringify(d.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `coupon_${d.data.coupon.code}_export.json`
        a.click()
        URL.revokeObjectURL(url)
        showMsg('Exportado')
      }
    } catch (e) { showMsg('Error exportando', 'error') }
  }

  const quickStatusChange = async (couponId, newStatus) => {
    try {
      const r = await fetch(`${API_URL}/api/coupons/admin/${couponId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status: newStatus })
      })
      const d = await r.json()
      if (d.success) {
        showMsg(`Estado cambiado a ${STATUS_STYLES[newStatus]?.label || newStatus}`)
        loadCoupons()
      } else {
        showMsg(d.error || 'Error', 'error')
      }
    } catch (e) { showMsg('Error', 'error') }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    showMsg('Código copiado')
  }

  const statusBadge = (status) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.draft
    return <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
  }

  // ===== FORM VIEW =====
  const renderForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { setView('list'); setEditingId(null); setForm({ ...EMPTY_FORM }) }}
          className={`p-2 rounded-lg ${dm ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold">{editingId ? 'Editar Cupón' : 'Crear Cupón'}</h2>
      </div>

      <div className={card}>
        <h3 className="font-bold mb-4">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Código del Cupón *</label>
            <input className={`${inp} w-full uppercase`} value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30) }))}
              placeholder="STREAM20" disabled={!!editingId} />
          </div>
          <div>
            <label className={lbl}>Nombre Interno *</label>
            <input className={`${inp} w-full`} value={form.internal_name}
              onChange={e => setForm(p => ({ ...p, internal_name: e.target.value }))}
              placeholder="Promo lanzamiento enero" />
          </div>
          <div className="md:col-span-2">
            <label className={lbl}>Descripción / Nota Interna</label>
            <textarea className={`${inp} w-full h-20 resize-none`} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Notas internas sobre este cupón..." />
          </div>
          <div>
            <label className={lbl}>Estado</label>
            <select className={`${sel} w-full`} value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {Object.entries(STATUS_STYLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Campaña</label>
            <input className={`${inp} w-full`} value={form.campaign}
              onChange={e => setForm(p => ({ ...p, campaign: e.target.value }))}
              placeholder="black_friday_2026" />
          </div>
          <div>
            <label className={lbl}>Prioridad</label>
            <input type="number" className={`${inp} w-full`} value={form.priority}
              onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              placeholder="0" />
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold mb-4">Descuento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Tipo de Descuento *</label>
            <select className={`${sel} w-full`} value={form.discount_type}
              onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}>
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto Fijo (USD)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Valor del Descuento *</label>
            <input type="number" step="0.01" className={`${inp} w-full`} value={form.discount_value}
              onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))}
              placeholder={form.discount_type === 'percentage' ? 'ej: 20' : 'ej: 5.00'} />
          </div>
          {form.discount_type === 'percentage' && (
            <div>
              <label className={lbl}>Descuento Máximo (USD) *</label>
              <input type="number" step="0.01" className={`${inp} w-full`} value={form.max_discount}
                onChange={e => setForm(p => ({ ...p, max_discount: e.target.value }))}
                placeholder="ej: 10.00" />
            </div>
          )}
          <div>
            <label className={lbl}>Monto Mínimo de Compra (USD)</label>
            <input type="number" step="0.01" className={`${inp} w-full`} value={form.min_purchase}
              onChange={e => setForm(p => ({ ...p, min_purchase: e.target.value }))}
              placeholder="0" />
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold mb-4">Límites de Uso</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Usos Totales Máximos</label>
            <input type="number" className={`${inp} w-full`} value={form.max_uses_total}
              onChange={e => setForm(p => ({ ...p, max_uses_total: e.target.value }))}
              placeholder="Ilimitado" />
          </div>
          <div>
            <label className={lbl}>Usos Máximos por Usuario</label>
            <input type="number" className={`${inp} w-full`} value={form.max_uses_per_user}
              onChange={e => setForm(p => ({ ...p, max_uses_per_user: e.target.value }))}
              placeholder="1" />
          </div>
          <div>
            <label className={lbl}>Límite por IP</label>
            <input type="number" className={`${inp} w-full`} value={form.limit_per_ip}
              onChange={e => setForm(p => ({ ...p, limit_per_ip: e.target.value }))}
              placeholder="Sin límite" />
          </div>
          <div>
            <label className={lbl}>Límite por Dispositivo</label>
            <input type="number" className={`${inp} w-full`} value={form.limit_per_device}
              onChange={e => setForm(p => ({ ...p, limit_per_device: e.target.value }))}
              placeholder="Sin límite" />
          </div>
          <div>
            <label className={lbl}>Límite por Tarjeta</label>
            <input type="number" className={`${inp} w-full`} value={form.limit_per_card}
              onChange={e => setForm(p => ({ ...p, limit_per_card: e.target.value }))}
              placeholder="Sin límite" />
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold mb-4">Vigencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Fecha de Inicio</label>
            <input type="datetime-local" className={`${inp} w-full`} value={form.start_date}
              onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}>Fecha de Expiración</label>
            <input type="datetime-local" className={`${inp} w-full`} value={form.end_date}
              onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}>Activación Programada</label>
            <input type="datetime-local" className={`${inp} w-full`} value={form.scheduled_activate_at}
              onChange={e => setForm(p => ({ ...p, scheduled_activate_at: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}>Desactivación Programada</label>
            <input type="datetime-local" className={`${inp} w-full`} value={form.scheduled_deactivate_at}
              onChange={e => setForm(p => ({ ...p, scheduled_deactivate_at: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold mb-4">Elegibilidad y Restricciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Aplica Para</label>
            <select className={`${sel} w-full`} value={form.applies_to}
              onChange={e => setForm(p => ({ ...p, applies_to: e.target.value }))}>
              {Object.entries(APPLIES_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Tipo de Usuario Elegible</label>
            <select className={`${sel} w-full`} value={form.eligible_user_type}
              onChange={e => setForm(p => ({ ...p, eligible_user_type: e.target.value }))}>
              {Object.entries(ELIGIBLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { key: 'first_purchase_only', label: 'Solo primera compra' },
            { key: 'once_per_email', label: 'Una vez por email' },
            { key: 'once_per_phone', label: 'Una vez por teléfono' },
            { key: 'compatible_with_others', label: 'Compatible con otros' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[opt.key]}
                onChange={e => setForm(p => ({ ...p, [opt.key]: e.target.checked }))}
                className="rounded border-gray-500 text-cyan-500 focus:ring-cyan-500" />
              <span className={`text-xs ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{opt.label}</span>
            </label>
          ))}
        </div>

        {form.applies_to === 'specific_product' && (
          <div className="mt-4">
            <label className={lbl}>Productos Aplicables (separados por coma)</label>
            <input className={`${inp} w-full`}
              value={form.applicable_products.join(', ')}
              onChange={e => setForm(p => ({ ...p, applicable_products: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="start_monthly, creator_monthly, tokens_150000" />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={saveCoupon} disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg text-white text-sm font-bold disabled:opacity-50">
          {loading ? 'Guardando...' : (editingId ? 'Actualizar Cupón' : 'Crear Cupón')}
        </button>
        <button onClick={() => { setView('list'); setEditingId(null); setForm({ ...EMPTY_FORM }) }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold ${dm ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          Cancelar
        </button>
      </div>
    </div>
  )

  // ===== DETAIL VIEW =====
  const renderDetail = () => {
    if (!selectedCoupon) return null
    const c = selectedCoupon
    const m = couponMetrics

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setView('list'); setSelectedCoupon(null); setCouponMetrics(null) }}
            className={`p-2 rounded-lg ${dm ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{c.code}</h2>
              {statusBadge(c.status)}
              <button onClick={() => copyCode(c.code)} className={`p-1 rounded ${dm ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{c.internal_name}</span>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => openEdit(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${dm ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Edit2 className="w-3 h-3 inline mr-1" />Editar
            </button>
            <button onClick={() => exportCoupon(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${dm ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Download className="w-3 h-3 inline mr-1" />Exportar
            </button>
          </div>
        </div>

        {/* Metrics */}
        {m && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Usos Totales', value: m.redemptions.total, color: 'text-cyan-400' },
              { label: 'Restantes', value: m.uses_remaining ?? 'Ilimitado', color: 'text-green-400' },
              { label: 'Descuento Dado', value: `$${m.revenue.total_discount.toFixed(2)}`, color: 'text-yellow-400' },
              { label: 'Revenue Generado', value: `$${m.revenue.total_revenue.toFixed(2)}`, color: 'text-purple-400' },
              { label: 'Usuarios Únicos', value: m.revenue.unique_users, color: 'text-pink-400' },
            ].map((item, i) => (
              <div key={i} className={card}>
                <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Coupon info */}
        <div className={card}>
          <h3 className="font-bold mb-3">Detalles del Cupón</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Tipo</span>
              <p className="font-bold">{c.discount_type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Valor</span>
              <p className="font-bold">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Máx. Descuento</span>
              <p className="font-bold">{c.max_discount ? `$${c.max_discount}` : '-'}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Mín. Compra</span>
              <p className="font-bold">${c.min_purchase || '0'}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Usos / Máx</span>
              <p className="font-bold">{c.uses_count} / {c.max_uses_total ?? 'Ilimitado'}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Por Usuario</span>
              <p className="font-bold">{c.max_uses_per_user}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Inicio</span>
              <p className="font-bold">{c.start_date ? new Date(c.start_date).toLocaleDateString() : '-'}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Expiración</span>
              <p className="font-bold">{c.end_date ? new Date(c.end_date).toLocaleDateString() : '-'}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Elegibilidad</span>
              <p className="font-bold">{ELIGIBLE_LABELS[c.eligible_user_type] || c.eligible_user_type}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Aplica a</span>
              <p className="font-bold">{APPLIES_LABELS[c.applies_to] || c.applies_to}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Campaña</span>
              <p className="font-bold">{c.campaign || '-'}</p></div>
            <div><span className={dm ? 'text-gray-500' : 'text-gray-400'}>Creado por</span>
              <p className="font-bold">{c.created_by_email || '-'}</p></div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {c.first_purchase_only && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">1ra compra</span>}
            {c.once_per_email && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">1x email</span>}
            {c.once_per_phone && <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">1x teléfono</span>}
            {!c.compatible_with_others && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">No combinable</span>}
          </div>
        </div>

        {/* Redemptions */}
        <div className={card}>
          <h3 className="font-bold mb-3">Historial de Redenciones ({redemptions.length})</h3>
          {redemptions.length === 0 ? (
            <p className={`text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Sin redenciones aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={dm ? 'text-gray-500' : 'text-gray-400'}>
                    <th className="text-left px-2 py-2">Usuario</th>
                    <th className="text-left px-2 py-2">Descuento</th>
                    <th className="text-left px-2 py-2">Original</th>
                    <th className="text-left px-2 py-2">Final</th>
                    <th className="text-left px-2 py-2">Estado</th>
                    <th className="text-left px-2 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map(r => (
                    <tr key={r.id} className={`border-t ${dm ? 'border-white/5' : 'border-gray-100'}`}>
                      <td className="px-2 py-2">{r.user_email}</td>
                      <td className="px-2 py-2 text-yellow-400 font-bold">${parseFloat(r.discount_applied).toFixed(2)}</td>
                      <td className="px-2 py-2">${parseFloat(r.original_amount).toFixed(2)}</td>
                      <td className="px-2 py-2 text-green-400">${parseFloat(r.final_amount).toFixed(2)}</td>
                      <td className="px-2 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          r.status === 'applied' ? 'bg-green-500/20 text-green-300' :
                          r.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                          r.status === 'refunded' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-2 py-2">{new Date(r.redeemed_at).toLocaleString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className={card}>
          <h3 className="font-bold mb-3">Historial de Cambios</h3>
          {auditLog.length === 0 ? (
            <p className={`text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Sin historial</p>
          ) : (
            <div className="space-y-2">
              {auditLog.map(entry => (
                <div key={entry.id} className={`flex items-start gap-3 text-xs py-2 border-b ${dm ? 'border-white/5' : 'border-gray-100'}`}>
                  <Clock className={`w-3 h-3 mt-0.5 shrink-0 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                  <div>
                    <span className="font-bold">{entry.action}</span>
                    <span className={`ml-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                      por {entry.changed_by_email || 'sistema'} - {new Date(entry.created_at).toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===== LIST VIEW =====
  const renderList = () => (
    <div className="space-y-4">

      {/* Global metrics summary */}
      {globalMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Cupones', value: globalMetrics.total_coupons, color: 'text-cyan-400' },
            { label: 'Activos', value: globalMetrics.active_coupons, color: 'text-green-400' },
            { label: 'Redenciones', value: globalMetrics.total_redemptions, color: 'text-purple-400' },
            { label: 'Descuento Total', value: `$${globalMetrics.total_discount_given.toFixed(2)}`, color: 'text-yellow-400' },
            { label: 'Revenue con Cupón', value: `$${globalMetrics.total_revenue_with_coupons.toFixed(2)}`, color: 'text-pink-400' },
          ].map((item, i) => (
            <div key={i} className={card}>
              <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
              <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingId(null); setView('create') }}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg text-white text-sm font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Crear Cupón
        </button>
        <button onClick={() => { loadCoupons(); loadGlobalMetrics() }}
          className={`p-2 rounded-lg ${dm ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className={`${inp} pl-9 w-full`} placeholder="Buscar código o nombre..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
              <select className={`${sel}`} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
              <select className={`${sel}`} value={discountTypeFilter}
          onChange={e => { setDiscountTypeFilter(e.target.value); setPage(1) }}>
          <option value="">Tipo de descuento</option>
          <option value="percentage">Porcentaje</option>
          <option value="fixed">Monto Fijo</option>
        </select>
        <input className={`${inp} max-w-[150px]`} placeholder="Campaña..."
          value={campaignFilter} onChange={e => { setCampaignFilter(e.target.value); setPage(1) }} />
        <span className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{totalCoupons} cupones</span>
      </div>

      {/* Table */}
      <div className={`${card} p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs ${dm ? 'text-gray-500 bg-white/5' : 'text-gray-400 bg-gray-50'}`}>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Descuento</th>
                <th className="text-left px-4 py-3">Usos</th>
                <th className="text-left px-4 py-3">Vigencia</th>
                <th className="text-left px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const usesText = c.max_uses_total ? `${c.uses_count}/${c.max_uses_total}` : `${c.uses_count}/inf`
                const remaining = c.max_uses_total ? c.max_uses_total - c.uses_count : null
                return (
                  <tr key={c.id} className={`border-t ${dm ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-cyan-400" />
                        <span className="font-mono font-bold text-xs text-cyan-400">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className={`p-0.5 rounded ${dm ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                          <Copy className="w-2.5 h-2.5 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-xs ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      {c.internal_name}
                      {c.campaign && <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${dm ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>{c.campaign}</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-xs font-bold">
                      {c.discount_type === 'percentage'
                        ? <span className="text-yellow-400">{c.discount_value}%</span>
                        : <span className="text-green-400">${c.discount_value}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${remaining !== null && remaining <= 5 ? 'text-red-400' : dm ? 'text-gray-300' : 'text-gray-700'}`}>
                        {usesText}
                      </span>
                      {remaining !== null && remaining <= 5 && remaining > 0 && (
                        <AlertTriangle className="w-3 h-3 text-red-400 inline ml-1" />
                      )}
                    </td>
                    <td className={`px-4 py-3 text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                      {c.end_date ? new Date(c.end_date).toLocaleDateString('es-MX') : 'Sin límite'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(c)}
                          className={`p-1 rounded ${dm ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`} title="Ver detalle">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(c)}
                          className={`p-1 rounded ${dm ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`} title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {c.status === 'active' && (
                          <button onClick={() => quickStatusChange(c.id, 'paused')}
                            className="p-1 rounded text-yellow-400 hover:bg-yellow-400/20" title="Pausar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(c.status === 'paused' || c.status === 'draft') && (
                          <button onClick={() => quickStatusChange(c.id, 'active')}
                            className="p-1 rounded text-green-400 hover:bg-green-400/20" title="Activar">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {c.status !== 'archived' && (
                          <button onClick={() => quickStatusChange(c.id, 'archived')}
                            className={`p-1 rounded ${dm ? 'text-gray-600 hover:text-gray-400 hover:bg-white/10' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'}`} title="Archivar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => exportCoupon(c.id)}
                          className={`p-1 rounded ${dm ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`} title="Exportar">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan="7" className={`px-4 py-8 text-center text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                    No se encontraron cupones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${dm ? 'border-white/5' : 'border-gray-100'}`}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`px-3 py-1 text-xs rounded ${dm ? 'bg-white/10 disabled:opacity-30' : 'bg-gray-100 disabled:opacity-30'}`}>
              <ChevronLeft className="w-3 h-3 inline" /> Anterior
            </button>
            <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`px-3 py-1 text-xs rounded ${dm ? 'bg-white/10 disabled:opacity-30' : 'bg-gray-100 disabled:opacity-30'}`}>
              Siguiente <ChevronRight className="w-3 h-3 inline" />
            </button>
          </div>
        )}
      </div>

      {/* Recent redemptions from global metrics */}
      {globalMetrics?.recent_redemptions?.length > 0 && (
        <div className={card}>
          <h3 className="font-bold mb-3">Redenciones Recientes</h3>
          <div className="space-y-2">
            {globalMetrics.recent_redemptions.map((r, i) => (
              <div key={i} className={`flex items-center justify-between text-xs py-1.5 border-b last:border-0 ${dm ? 'border-white/5' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold">{r.code}</span>
                  <span className={dm ? 'text-gray-400' : 'text-gray-600'}>{r.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-bold">-${parseFloat(r.discount_applied).toFixed(2)}</span>
                  <span className={dm ? 'text-gray-600' : 'text-gray-400'}>
                    {new Date(r.redeemed_at).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Toast */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${message.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
          {message.text}
        </div>
      )}

      {view === 'list' && renderList()}
      {(view === 'create' || view === 'edit') && renderForm()}
      {view === 'detail' && renderDetail()}
    </div>
  )
}

