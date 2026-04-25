import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle, Loader, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

function FeatureLockedOverlay({ darkMode, message = 'Función no disponible', showIcon = false, showMessage = false }) {
  const glassClasses = darkMode
    ? 'bg-gradient-to-br from-slate-950/20 via-slate-900/14 to-slate-800/10 border border-cyan-300/14 backdrop-blur-[0.7px]'
    : 'bg-slate-900/8 border border-slate-500/20 backdrop-blur-[0.35px]'

  return (
    <div className={`absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none ${glassClasses}`}>
      <div className={`flex flex-col items-center pointer-events-auto ${showMessage || showIcon ? 'gap-2' : 'gap-0'}`}>
        {showIcon && <Lock className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`} />}
        {showMessage && (
          <span className={`text-xs font-semibold text-center ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  )
}

const getBaseVoices = (t, plan = 'free') => {
  const suffix = String(plan || 'free').toLowerCase() === 'free' ? '' : ` ${t('studio.voice.unlimited')}`
  return [
    { id: 'es-ES', name: `${t('studio.voiceLocal.spanish')}${suffix}` },
    { id: 'en-US', name: `${t('studio.voiceLocal.english')}${suffix}` },
    { id: 'Diego', name: t('voiceNames.diegoPremium') },
    { id: 'Lupita', name: t('voiceNames.lupitaPremium') },
    { id: 'Miguel', name: t('voiceNames.miguelPremium') },
    { id: 'Rafael', name: t('voiceNames.rafaelPremium') },
  ]
}

export default function AIRoleplayWorkshop({ darkMode = true, user = null }) {
  const { t } = useTranslation()
  const [characters, setCharacters] = useState([])
  const [loadingCharacters, setLoadingCharacters] = useState(true)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)

  // Edit states
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSystemPrompt, setEditSystemPrompt] = useState('')
  const [editVoiceId, setEditVoiceId] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Available voices
  const [userVoices, setUserVoices] = useState([])
  const currentPlan = (() => {
    try {
      const cachedUser = JSON.parse(localStorage.getItem('sv-user') || '{}')
      const userData = user || cachedUser
      const role = String(userData?.role || '').trim().toLowerCase()
      if (role === 'admin') return 'admin'

      const addonRaw = userData?.subscription?.addonPack || null
      const addonPlan = String(addonRaw?.planKey || '').trim().toLowerCase().replace(/\s+/g, '_')
      const addonExpiresAtMs = addonRaw?.expiresAt ? Date.parse(addonRaw.expiresAt) : NaN
      const addonValid = Boolean(addonRaw?.active) && Number.isFinite(addonExpiresAtMs) && addonExpiresAtMs > Date.now()
      if (addonValid && ['pack_lite', 'pack_pro', 'pack_max'].includes(addonPlan)) return addonPlan

      return String(
        userData?.subscription?.backendPlan ||
        userData?.plan ||
        userData?.subscription?.plan ||
        'free'
      ).toLowerCase().replace(/\s+/g, '_')
    } catch {
      return 'free'
    }
  })()
  const normalizedCurrentPlan = ['on_demand', 'ondemand', 'free_plan', 'free_monthly', 'plan_free'].includes(currentPlan) ? 'free' : currentPlan
  const isAdminPlan = normalizedCurrentPlan === 'admin'
  const isBasePlan = !isAdminPlan && (normalizedCurrentPlan === 'base' || normalizedCurrentPlan === 'plan base')
  const baseVoices = getBaseVoices(t, normalizedCurrentPlan)

  // Cargar personajes al montar
  useEffect(() => {
    loadCharacters()
    loadUserVoices()
  }, [])

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('sv-token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const loadCharacters = async () => {
    try {
      const token = sessionStorage.getItem('sv-token')
      if (!token) { setLoadingCharacters(false); return }

      const res = await fetch(`${API_URL}/api/bot/characters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success) {
        // Filtrar solo los personajes custom (excluir ejemplo)
        setCharacters(data.characters.filter(c => c.is_custom))
      }
    } catch (err) {
      console.error('[AIWorkshop] Error loading characters:', err)
    } finally {
      setLoadingCharacters(false)
    }
  }

  const loadUserVoices = async () => {
    try {
      const token = sessionStorage.getItem('sv-token')
      if (!token) return

      const res = await fetch(`${API_URL}/api/settings/voices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success) {
        setUserVoices(data.voices || [])
      }
    } catch (err) {
      console.error('[AIWorkshop] Error loading voices:', err)
    }
  }

  const handleCreateCharacter = async (e) => {
    e.preventDefault()

    if (!name.trim() || !systemPrompt.trim()) {
      setError(t('aiWorkshop.form.nameRequired'))
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`${API_URL}/api/bot/characters`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          system_prompt: systemPrompt.trim(),
          voice_id: voiceId || null,
          avatar_url: avatarUrl || null
        })
      })

      const data = await res.json()

      if (data.success) {
        setMessage(t('aiWorkshop.messages.created', { name }))
        setName('')
        setDescription('')
        setSystemPrompt('')
        setVoiceId('')
        setAvatarUrl('')
        setShowCreateForm(false)
        loadCharacters()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(data.error || 'Error creando personaje')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (char) => {
    setEditingId(char.id)
    setEditName(char.name)
    setEditDescription(char.description)
    setEditSystemPrompt(char.system_prompt)
    setEditVoiceId(char.voice_id || '')
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editSystemPrompt.trim()) {
      setError(t('aiWorkshop.form.nameRequired'))
      return
    }

    setEditSaving(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/bot/characters/${editingId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          system_prompt: editSystemPrompt.trim(),
          voice_id: editVoiceId || null
        })
      })

      const data = await res.json()

      if (data.success) {
        setMessage(t('aiWorkshop.messages.updated'))
        setEditingId(null)
        loadCharacters()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(data.error || 'Error actualizando personaje')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteCharacter = async (id, charName) => {
    if (!confirm(`${t('aiWorkshop.messages.deleted', { name: charName })}?`)) return

    try {
      const token = sessionStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/bot/characters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()

      if (data.success) {
        setMessage(t('aiWorkshop.messages.deleted', { name: charName }))
        loadCharacters()
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(data.error || 'Error eliminando personaje')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('aiWorkshop.title')}
        </h2>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('aiWorkshop.newChar')}
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg flex gap-3 ${darkMode ? 'bg-green-500/30 border-2 border-green-400' : 'bg-green-100 border-2 border-green-300'}`}>
          <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-green-300' : 'text-green-600'}`} />
          <p className={darkMode ? 'text-green-50' : 'text-green-700'}>{message}</p>
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-lg flex gap-3 ${darkMode ? 'bg-red-500/30 border-2 border-red-400' : 'bg-red-100 border-2 border-red-300'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-300' : 'text-red-600'}`} />
          <p className={darkMode ? 'text-red-50' : 'text-red-700'}>{error}</p>
        </div>
      )}

      {/* Crear formulario */}
      {showCreateForm && (
        <div className={`relative p-6 rounded-lg border-2 ${darkMode ? 'bg-gray-800/50 border-purple-500/50' : 'bg-white border-purple-300'}`}>
          {isBasePlan && (
            <FeatureLockedOverlay darkMode={darkMode} message="Disponible con pack" showIcon showMessage />
          )}
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('aiWorkshop.form.title')}
          </h3>

          <form onSubmit={handleCreateCharacter} className={`space-y-4 ${isBasePlan ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('aiWorkshop.form.name')}
              className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('aiWorkshop.form.description')}
              className={`w-full px-4 py-2 rounded-lg resize-none h-16 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            />

            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={t('aiWorkshop.form.prompt')}
              className={`w-full px-4 py-2 rounded-lg resize-none h-24 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            />

            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            >
              <option value="">{t('aiWorkshop.form.noVoice')}</option>
              <optgroup label={t('aiWorkshop.form.baseVoices')}>
                {baseVoices.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </optgroup>
              {userVoices.length > 0 && (
                <optgroup label={t('aiWorkshop.form.customVoices')}>
                  {userVoices.map(voice => (
                    <option key={voice.id} value={voice.voice_id}>
                      {voice.voice_name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t('aiWorkshop.form.creating')}
                  </>
                ) : (
                  t('aiWorkshop.form.create')
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setName('')
                  setDescription('')
                  setSystemPrompt('')
                  setVoiceId('')
                }}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
              >
                {t('aiWorkshop.form.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de personajes */}
      {loadingCharacters ? (
        <div className="flex justify-center py-8">
          <Loader className={`w-6 h-6 animate-spin ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
      ) : characters.length === 0 ? (
        <div className={`p-8 rounded-lg text-center ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-100 border border-gray-300'}`}>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            {t('aiWorkshop.empty')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {characters.map(char => (
            <div
              key={char.id}
              className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              {editingId === char.id ? (
                // Modo edición
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                  />
                  <textarea
                    value={editSystemPrompt}
                    onChange={(e) => setEditSystemPrompt(e.target.value)}
                    className={`w-full px-3 py-2 rounded text-sm h-20 resize-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                  />
                  <select
                    value={editVoiceId}
                    onChange={(e) => setEditVoiceId(e.target.value)}
                    className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} border`}
                  >
                    <option value="">{t('aiWorkshop.form.noVoice')}</option>
                    <optgroup label={t('aiWorkshop.form.baseVoices')}>
                      {baseVoices.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </optgroup>
                    {userVoices.length > 0 && (
                      <optgroup label={t('aiWorkshop.form.customVoices')}>
                        {userVoices.map(voice => (
                          <option key={voice.id} value={voice.voice_id}>
                            {voice.voice_name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={editSaving}
                      className="flex-1 px-3 py-2 rounded text-sm bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      {editSaving ? t('aiWorkshop.form.saving') : t('aiWorkshop.form.save')}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-3 py-2 rounded text-sm bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      {t('aiWorkshop.form.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {char.name}
                      </h4>
                      {char.description && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {char.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(char)}
                        className="p-2 rounded hover:bg-yellow-500/20 text-yellow-500"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(char.id, char.name)}
                        className="p-2 rounded hover:bg-red-500/20 text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Creado: {new Date(char.created_at).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



