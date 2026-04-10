import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle, Loader } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

const BASE_VOICES = [
  { id: 'es-ES', name: 'Voz Básica Español (ilimitada)' },
  { id: 'en-US', name: 'Voz Básica Inglés (ilimitada)' },
  { id: 'Diego',  name: 'Voz natural de Luis - Premium' },
  { id: 'Lupita', name: 'Voz natural de Sofia - Premium' },
  { id: 'Miguel', name: 'Voz natural de Gustavo - Premium' },
  { id: 'Rafael', name: 'Voz natural de Leonel - Premium' },
]

export default function AIRoleplayWorkshop({ darkMode = true }) {
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

  // Cargar personajes al montar
  useEffect(() => {
    loadCharacters()
    loadUserVoices()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sv-token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const loadCharacters = async () => {
    try {
      const token = localStorage.getItem('sv-token')
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
      const token = localStorage.getItem('sv-token')
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
      setError('Nombre y prompt del sistema son requeridos')
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
        setMessage(`Personaje "${name}" creado exitosamente`)
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
      setError('Nombre y prompt del sistema son requeridos')
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
        setMessage(`Personaje actualizado`)
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
    if (!confirm(`¿Eliminar el personaje "${charName}"?`)) return

    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/bot/characters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()

      if (data.success) {
        setMessage(`Personaje "${charName}" eliminado`)
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
          🎭 Taller de Asistentes de IA Roleplay
        </h2>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Personaje
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
        <div className={`p-6 rounded-lg border-2 ${darkMode ? 'bg-gray-800/50 border-purple-500/50' : 'bg-white border-purple-300'}`}>
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Crear Nuevo Personaje
          </h3>

          <form onSubmit={handleCreateCharacter} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del personaje (ej: Batman, Detective, etc.)"
              className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className={`w-full px-4 py-2 rounded-lg resize-none h-16 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            />

            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="System prompt (cómo debe actuar el personaje)..."
              className={`w-full px-4 py-2 rounded-lg resize-none h-24 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            />

            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
            >
              <option value="">Sin voz asignada (usar default)</option>
              <optgroup label="Voces base">
                {BASE_VOICES.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </optgroup>
              {userVoices.length > 0 && (
                <optgroup label="Mis voces clonadas">
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
                    Creando...
                  </>
                ) : (
                  'Crear Personaje'
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
                Cancelar
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
            No hay personajes creados aún. ¡Crea tu primer personaje!
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
                    <option value="">Sin voz asignada (usar default)</option>
                    <optgroup label="Voces base">
                      {BASE_VOICES.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </optgroup>
                    {userVoices.length > 0 && (
                      <optgroup label="Mis voces clonadas">
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
                      {editSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-3 py-2 rounded text-sm bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Cancelar
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
