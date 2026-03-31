import { useState, useEffect, useRef } from 'react'
import { Upload, Zap, AlertCircle, CheckCircle, Loader, Trash2, Mic2, Sparkles, Edit2, Bot } from 'lucide-react'
import AIRoleplayWorkshop from './AIRoleplayWorkshop'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function VoiceWorkshopPanel({ onCloneSuccess, darkModeOverride, config, updateConfig, user }) {
  const [darkMode, setDarkMode] = useState(() => darkModeOverride !== undefined ? darkModeOverride : localStorage.getItem('voltvoice-theme') !== 'light')

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('voltvoice-theme') !== 'light')
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  // Clone section
  const [voiceName, setVoiceName] = useState('')
  const [voiceLanguage, setVoiceLanguage] = useState('es-ES')
  const [audioFile, setAudioFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [userVoices, setUserVoices] = useState([])
  const [loadingVoices, setLoadingVoices] = useState(true)

  // Generate section
  const [activeTab, setActiveTab] = useState('clone') // 'clone' or 'generate'
  const [voiceDescription, setVoiceDescription] = useState('')
  const [voiceType, setVoiceType] = useState('Narrator')
  const [scriptMode, setScriptMode] = useState('auto')
  const [voiceScript, setVoiceScript] = useState('')
  const [generatingVoice, setGeneratingVoice] = useState(false)

  // Modal de preview después de generar
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewVoice, setPreviewVoice] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Modal de renombrar voz existente
  const [editingVoiceId, setEditingVoiceId] = useState(null)
  const [editingVoiceName, setEditingVoiceName] = useState('')

  // Prueba de voz
  const [testVoiceId, setTestVoiceId] = useState(null)
  const [testText, setTestText] = useState('Hola, esta es una prueba de mi voz personalizada.')
  const [testingVoice, setTestingVoice] = useState(false)
  const [testAudioUrl, setTestAudioUrl] = useState(null)
  const testAudioRef = useRef(null)
  const testRequestRef = useRef(0)
  const testingVoiceRef = useRef(false)

  const languageOptions = [
    { code: 'es-ES', label: 'Voz en Español' },
    { code: 'en-US', label: 'English (USA)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'pt-BR', label: 'Português (Brasil)' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'it-IT', label: 'Italiano' }
  ]

  // Cargar voces del usuario al montar
  useEffect(() => {
    loadUserVoices()
  }, [])

  // Limpiar audio cuando cambia la voz seleccionada
  useEffect(() => {
    setTestAudioUrl(null)
  }, [testVoiceId])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sv-token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const loadUserVoices = async () => {
    try {
      const token = localStorage.getItem('sv-token')
      if (!token) { setLoadingVoices(false); return }

      // Migrar voces pre-existentes (solo la primera vez, ON CONFLICT ignora duplicados)
      await fetch(`${API_URL}/api/settings/voices/migrate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {})

      const res = await fetch(`${API_URL}/api/settings/voices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUserVoices(data.voices || [])
      }
    } catch (err) {
      console.error('[Voices] Error cargando voces:', err)
    } finally {
      setLoadingVoices(false)
    }
  }

  const handleEditVoice = (voice) => {
    setEditingVoiceId(voice.id)
    setEditingVoiceName(voice.voice_name)
  }

  const handleSaveVoiceEdit = async () => {
    if (!editingVoiceName.trim()) {
      setError('El nombre no puede estar vacío')
      return
    }

    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/settings/voices/${editingVoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voiceName: editingVoiceName.trim() })
      })

      if (res.ok) {
        setUserVoices(prev =>
          prev.map(v => v.id === editingVoiceId ? {...v, voice_name: editingVoiceName.trim()} : v)
        )
        setMessage(`Voz renombrada a "${editingVoiceName}"`)
        setEditingVoiceId(null)
        setEditingVoiceName('')
        // Notificar a otros componentes que se actualizó una voz
        window.dispatchEvent(new CustomEvent('voice-added'))
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError('Error renombrando la voz')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  const handleDeleteVoice = async (id, name) => {
    if (!confirm(`¿Eliminar la voz "${name}"?`)) return

    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/settings/voices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setUserVoices(prev => prev.filter(v => v.id !== id))
        setMessage(`Voz "${name}" eliminada`)
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      setError('Error eliminando voz')
    }
  }

  const handleSaveVoiceName = async () => {
    if (!editingName.trim()) {
      setError('El nombre de la voz no puede estar vacío')
      return
    }

    setSavingName(true)
    try {
      const token = localStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/settings/voices/${previewVoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voiceName: editingName.trim() })
      })

      if (res.ok) {
        setMessage(`Voz renombrada a "${editingName}"`)
        setShowPreviewModal(false)
        setPreviewVoice(null)
        loadUserVoices()
        // Notificar a otros componentes que se guardó una voz
        window.dispatchEvent(new CustomEvent('voice-added'))
        setTimeout(() => setMessage(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Error al renombrar la voz')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setSavingName(false)
    }
  }

  const handleCloseModal = () => {
    setShowPreviewModal(false)
    setPreviewVoice(null)
    setEditingName('')
    loadUserVoices() // Recargar igual aunque no haya renombrado
  }

  const handleTestVoice = async () => {
    if (testingVoiceRef.current) return

    if (!testVoiceId || !testText.trim()) {
      setError('Selecciona una voz y escribe un texto para probar')
      return
    }

    testingVoiceRef.current = true
    const requestId = ++testRequestRef.current
    setTestingVoice(true)
    setError(null)
    setTestAudioUrl(null)

    if (testAudioRef.current) {
      testAudioRef.current.pause()
      testAudioRef.current.currentTime = 0
    }

    try {
      const token = localStorage.getItem('sv-token')
      let response = await fetch(`${API_URL}/api/inworld/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          text: testText.trim(),
          voiceId: testVoiceId
        })
      })

      let data = await response.json().catch(() => ({}))

      // Fallback para backends que no tengan ruta directa.
      if (!response.ok && response.status === 404) {
        response = await fetch(`${API_URL}/api/tiktok/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: (config?.lastTiktokUser || 'preview_studio').trim(),
            messageUsername: 'preview',
            messageText: testText.trim(),
            voiceId: testVoiceId
          })
        })
        data = await response.json().catch(() => ({}))
      }

      if (requestId !== testRequestRef.current) {
        return
      }

      if (response.ok && (data.audio || data.audioUrl)) {
        setTestAudioUrl(data.audio || data.audioUrl)
        setMessage('✓ Audio generado exitosamente')
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(data.error || 'Error al sintetizar el audio')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      if (requestId === testRequestRef.current) {
        testingVoiceRef.current = false
        setTestingVoice(false)
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['audio/mpeg', 'audio/wav'].includes(file.type)) {
        setError('Solo se aceptan archivos MP3 o WAV')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no debe exceder 10MB')
        return
      }
      setAudioFile(file)
      setError(null)
    }
  }

  const handleGenerateVoice = async (e) => {
    e.preventDefault()

    if (!voiceDescription.trim()) {
      setError('Describe cómo deseas que suene la voz')
      return
    }

    if (scriptMode === 'custom' && !voiceScript.trim()) {
      setError('Escribe el script para la voz')
      return
    }

    const token = localStorage.getItem('sv-token')
    if (!token) {
      setError('Debes iniciar sesión')
      return
    }

    setGeneratingVoice(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/settings/voices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: voiceDescription.trim(),
          voiceType: voiceType,
          language: voiceLanguage,
          scriptMode: scriptMode,
          script: scriptMode === 'custom' ? voiceScript.trim() : undefined
        })
      })

      const data = await response.json()

      console.log('[VoiceGenerate] Response:', { ok: response.ok, data })

      if (response.ok && data.success) {
        // Mostrar modal de preview con reproductor y opción de renombrar
        console.log('[VoiceGenerate] ✓ Voz generada, mostrando modal')
        setPreviewVoice(data.voice)
        setEditingName(data.voice.voice_name || data.voice.defaultName)
        setShowPreviewModal(true)
        setVoiceDescription('')
        setVoiceScript('')
        setScriptMode('auto')
        setMessage(null)
        setError(null)
      } else {
        console.error('[VoiceGenerate] ✗ Error:', data)
        setError(data.error || data.details || 'Error al generar la voz')
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setGeneratingVoice(false)
    }
  }

  const handleCloneVoice = async (e) => {
    e.preventDefault()

    if (!voiceName.trim()) {
      setError('Ingresa un nombre para la voz')
      return
    }

    if (!audioFile) {
      setError('Selecciona un archivo de audio')
      return
    }

    const token = localStorage.getItem('sv-token')
    if (!token) {
      setError('Debes iniciar sesión para clonar voces')
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const base64 = event.target.result.split(',')[1]

          const response = await fetch(`${API_URL}/api/settings/voices/clone`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              voiceName: voiceName.trim(),
              base64Audio: base64,
              language: voiceLanguage,
              transcription: undefined,
            })
          })

          const data = await response.json()

          if (response.ok && data.success) {
            setMessage(`Voz "${voiceName}" clonada exitosamente`)
            setVoiceName('')
            setAudioFile(null)
            // Recargar lista de voces
            loadUserVoices()
            // Notificar a otros componentes que se agregó una voz
            window.dispatchEvent(new CustomEvent('voice-added'))
            if (onCloneSuccess) {
              onCloneSuccess(data.voice.voice_id, voiceName)
            }
          } else {
            setError(data.error || data.details || 'Error al clonar la voz')
          }
        } catch (err) {
          setError(`Error: ${err.message}`)
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(audioFile)
    } catch (err) {
      setError(`Error: ${err.message}`)
      setLoading(false)
    }
  }

  // Filtros por tipo de voz
  const clonedVoices = userVoices.filter(v => v.provider === 'inworld')
  const generatedVoices = userVoices.filter(v => v.provider === 'inworld-generated')

  // Renderiza la sección "Mis Voces Creadas" filtrada
  const renderVoiceList = (voices) => (
    <div className={`${darkMode ? 'bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6' : 'bg-white border border-indigo-200 rounded-lg p-6 shadow-sm'}`}>
      <div className="flex items-center gap-3 mb-4">
        <Mic2 className="w-6 h-6 text-purple-400" />
        <h2 className={darkMode ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>Mis Voces Creadas</h2>
        <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>
          {voices.length}/10
        </span>
      </div>
      {loadingVoices ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-5 h-5 animate-spin text-cyan-400" />
        </div>
      ) : voices.length === 0 ? (
        <p className={`text-sm py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Aún no tienes voces de este tipo. ¡Crea tu primera voz arriba!
        </p>
      ) : (
        <div className="space-y-2">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'}`}
            >
              <div className="flex-1">
                {editingVoiceId === voice.id ? (
                  <input
                    type="text"
                    value={editingVoiceName}
                    onChange={(e) => setEditingVoiceName(e.target.value)}
                    autoFocus
                    className={`w-full mb-1 px-2 py-1 rounded ${darkMode ? 'bg-[#0f0f23] border border-cyan-400/30 text-white focus:outline-none focus:border-cyan-400' : 'bg-white border border-indigo-300 text-gray-900 focus:outline-none focus:border-indigo-500'}`}
                  />
                ) : (
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{voice.voice_name}</p>
                )}
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {new Date(voice.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingVoiceId === voice.id ? (
                  <>
                    <button onClick={handleSaveVoiceEdit} className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-semibold transition-colors flex-shrink-0">Guardar</button>
                    <button onClick={() => { setEditingVoiceId(null); setEditingVoiceName('') }} className="px-2 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded text-xs font-semibold transition-colors flex-shrink-0">Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditVoice(voice)} className="p-1.5 rounded hover:bg-cyan-500/20 transition-colors flex-shrink-0" title="Renombrar voz">
                      <Edit2 className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button onClick={() => handleDeleteVoice(voice.id, voice.voice_name)} className="p-1.5 rounded hover:bg-red-500/20 transition-colors flex-shrink-0" title="Eliminar voz">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Renderiza la sección "Probar Voz" filtrada
  const renderTestVoice = (voices) => (
    voices.length > 0 && (
      <div className={darkMode ? 'bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6' : 'bg-white border border-indigo-200 rounded-lg p-6 shadow-sm'}>
        <div className="flex items-center gap-3 mb-4">
          <Mic2 className="w-6 h-6 text-cyan-400" />
          <h2 className={darkMode ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>Probar Voz</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className={darkMode ? 'block text-sm font-medium text-cyan-300 mb-2' : 'block text-sm font-medium text-indigo-600 mb-2'}>Selecciona una voz</label>
            <select
              value={testVoiceId || ''}
              onChange={(e) => setTestVoiceId(e.target.value)}
              className={darkMode ? 'w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400' : 'w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500'}
            >
              <option value="">-- Elige una voz --</option>
              {voices.map(voice => (
                <option key={voice.id} value={voice.voice_id}>{voice.voice_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={darkMode ? 'block text-sm font-medium text-cyan-300 mb-2' : 'block text-sm font-medium text-indigo-600 mb-2'}>Escribe un texto para probar</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Ej: Hola, esto es una prueba de mi voz personalizada"
              className={darkMode ? 'w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 min-h-20' : 'w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500 min-h-20'}
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{testText.length} caracteres</p>
          </div>
          <button
            onClick={handleTestVoice}
            disabled={testingVoice || !testVoiceId || !testText.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {testingVoice ? <><Loader className="w-5 h-5 animate-spin" />Generando audio...</> : <><Mic2 className="w-5 h-5" />Probar voz</>}
          </button>
          {testAudioUrl && (
            <div className={darkMode ? 'bg-gray-800/60 border border-gray-700/50 rounded-lg p-4' : 'bg-gray-50 border border-gray-200 rounded-lg p-4'}>
              <p className={`text-sm mb-2 ${darkMode ? 'text-cyan-300' : 'text-gray-700'}`}>🔊 Escucha el resultado:</p>
              <audio key={testAudioUrl} ref={testAudioRef} controls className="w-full" autoPlay>
                <source src={testAudioUrl} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>
      </div>
    )
  )

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className={`flex gap-3 p-1 rounded-lg mb-2 ${darkMode ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
        <button
          onClick={() => setActiveTab('clone')}
          className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all ${
            activeTab === 'clone'
              ? darkMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white'
          }`}
        >
          <Mic2 className="inline w-4 h-4 mr-2" />
          Clonar Voz
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all ${
            activeTab === 'generate'
              ? darkMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white'
          }`}
        >
          <Sparkles className="inline w-4 h-4 mr-2" />
          Generar Voz Personalizada
        </button>
        <button
          onClick={() => setActiveTab('ai-assistant')}
          className={`flex-1 px-6 py-3 rounded-md font-semibold transition-all ${
            activeTab === 'ai-assistant'
              ? darkMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white'
          }`}
        >
          <Bot className="inline w-4 h-4 mr-2" />
          Asistente IA
        </button>
      </div>

      {/* Clonar Nueva Voz */}
      {activeTab === 'clone' && (
        <>
        <div className={darkMode ? "bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6" : "bg-white border border-indigo-200 rounded-lg p-6 shadow-sm"}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>Clonar Nueva Voz</h2>
          </div>

        <form onSubmit={handleCloneVoice} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              Nombre de la voz
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Ej: Mi voz, Voz profesional..."
              className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
              disabled={loading}
            />
          </div>

          {/* Idioma */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              Idioma de la voz
            </label>
            <select
              value={voiceLanguage}
              onChange={(e) => setVoiceLanguage(e.target.value)}
              className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
              disabled={loading}
            >
              {languageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Selecciona el idioma del audio que vas a subir
            </p>
          </div>

          {/* File upload */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              Archivo de audio (MP3 o WAV, 10-15 seg ideal)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="audio/mpeg,audio/wav"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="audio-input"
              />
              <label
                htmlFor="audio-input"
                className={darkMode ? "flex items-center justify-center gap-2 w-full bg-gray-800 border-2 border-dashed border-cyan-500/30 rounded-lg p-4 cursor-pointer hover:border-cyan-500 transition" : "flex items-center justify-center gap-2 w-full bg-gray-50 border-2 border-dashed border-indigo-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500 transition"}
              >
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  {audioFile ? audioFile.name : 'Clic para seleccionar archivo'}
                </span>
              </label>
            </div>
          </div>

          {/* Requerimientos */}
          <div className={darkMode ? "text-xs text-gray-400 space-y-1" : "text-xs text-gray-500 space-y-1"}>
            <p>✓ Duración ideal: 10-15 segundos (máx 15 seg)</p>
            <p>✓ Audio claro, sin ruido de fondo ni música</p>
            <p>✓ Formato: MP3 o WAV</p>
            <p>✓ Mejor calidad si incluyes la transcripción</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !voiceName || !audioFile}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Clonando voz...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Clonar voz
              </>
            )}
          </button>

          {/* Messages */}
          {message && (
            <div className="p-4 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <p className="text-green-50 font-semibold">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-gradient-to-r from-red-500/30 to-rose-500/30 border-2 border-red-400 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-50 font-semibold">{error}</p>
            </div>
          )}
        </form>
      </div>

      {/* Probar Voz — solo clonadas */}
      {renderTestVoice(clonedVoices)}

      {/* Mis Voces Creadas — solo clonadas */}
      {renderVoiceList(clonedVoices)}
        </>
      )}

      {/* Generar Voz Personalizada */}
      {activeTab === 'generate' && (
        <>
        <div className={darkMode ? "bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6" : "bg-white border border-indigo-200 rounded-lg p-6 shadow-sm"}>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>Generar Voz Personalizada</h2>
          </div>

          <form onSubmit={handleGenerateVoice} className="space-y-4">
            {/* Voice Description */}
            <div>
              <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
                Descripción de la voz
              </label>
              <textarea
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                placeholder="Ej: Un hombre de mediana edad, acento español neutral, tono profesional y amigable"
                className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 min-h-28" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500 min-h-28"}
                disabled={generatingVoice}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Incluye edad, género, acento, tono y personalidad
              </p>
            </div>

            {/* Voice Type */}
            <div>
              <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
                Tipo de voz
              </label>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value)}
                className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
                disabled={generatingVoice}
              >
                <option value="Narrator">Narrador</option>
                <option value="Support Agent">Agente de Soporte</option>
                <option value="Companion">Compañero</option>
                <option value="Meditation Instructor">Instructor de Meditación</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
                Idioma
              </label>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
                disabled={generatingVoice}
              >
                <option value="es-ES">Español (España)</option>
                <option value="es-MX">Español (México)</option>
                <option value="es-AR">Español (Argentina)</option>
                <option value="en-US">English (USA)</option>
                <option value="en-GB">English (UK)</option>
                <option value="pt-BR">Português (Brasil)</option>
              </select>
            </div>

            {/* Preview Audio Mode */}
            <div>
              <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
                Texto para el Preview de Voz
              </label>
              <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Este es el texto que Inworld sintetizará para que escuches cómo suena la voz generada
              </p>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setScriptMode('auto')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    scriptMode === 'auto'
                      ? 'bg-cyan-500 text-white'
                      : darkMode
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                  }`}
                  disabled={generatingVoice}
                >
                  Usar descripción
                </button>
                <button
                  type="button"
                  onClick={() => setScriptMode('custom')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    scriptMode === 'custom'
                      ? 'bg-cyan-500 text-white'
                      : darkMode
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                  }`}
                  disabled={generatingVoice}
                >
                  Personalizado
                </button>
              </div>

              {scriptMode === 'custom' && (
                <textarea
                  value={voiceScript}
                  onChange={(e) => setVoiceScript(e.target.value.substring(0, 200))}
                  placeholder="Escribe el texto que quieres escuchar en el preview (máx 200 caracteres)"
                  className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 min-h-24" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500 min-h-24"}
                  disabled={generatingVoice}
                  maxLength="200"
                />
              )}
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {scriptMode === 'custom' ? `${voiceScript.length}/200 caracteres` : 'Se usará tu descripción de voz como texto para sintetizar'}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={generatingVoice || !voiceDescription.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {generatingVoice ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generando voz con Inworld...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generar voz personalizada
                </>
              )}
            </button>

            {/* Messages */}
            {message && (
              <div className="p-4 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-lg flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                <p className="text-green-50 font-semibold">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-gradient-to-r from-red-500/30 to-rose-500/30 border-2 border-red-400 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                <p className="text-red-50 font-semibold">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Probar Voz — solo generadas */}
        {renderTestVoice(generatedVoices)}

        {/* Mis Voces Creadas — solo generadas */}
        {renderVoiceList(generatedVoices)}
        </>
      )}

      {/* Modal de Preview de Voz Generada */}
      {showPreviewModal && previewVoice && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-[#1a1a2e]' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4`}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Voz Generada
              </h3>
            </div>

            {/* Reproductor */}
            {previewVoice.previewAudio && (
              <div className={`${darkMode ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  📢 Escucha tu voz generada:
                </p>
                <audio
                  controls
                  className="w-full"
                  style={{
                    accentColor: '#06b6d4'
                  }}
                >
                  <source src={previewVoice.previewAudio} type="audio/mpeg" />
                  Tu navegador no soporta el reproductor de audio
                </audio>
              </div>
            )}

            {/* Nombre editable */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>
                Nombre de la voz
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg transition ${
                  darkMode
                    ? 'bg-[#0f0f23] border border-cyan-400/30 text-white focus:outline-none focus:border-cyan-400'
                    : 'bg-gray-50 border border-indigo-300 text-gray-900 focus:outline-none focus:border-indigo-500'
                }`}
                disabled={savingName}
              />
            </div>

            {/* Detalles */}
            <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              <p>🎯 Proveedor: <span className="text-cyan-400">{previewVoice.provider}</span></p>
              <p>🆔 ID: <span className="font-mono text-cyan-400">{previewVoice.voiceId.substring(0, 20)}...</span></p>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCloseModal}
                disabled={savingName}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveVoiceName}
                disabled={savingName || !editingName.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {savingName ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>

            {/* Error en modal */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-400/50 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-100 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asistente IA — Primero Taller, luego Probar Voz */}
      {activeTab === 'ai-assistant' && (
        <div className="space-y-6">
          {/* 1. Taller de Asistentes de IA Roleplay */}
          <AIRoleplayWorkshop darkMode={darkMode} config={config || {}} updateConfig={updateConfig || (() => {})} user={user} />

          {/* 2. Probar Voz */}
          {renderTestVoice(userVoices)}
        </div>
      )}
    </div>
  )
}
