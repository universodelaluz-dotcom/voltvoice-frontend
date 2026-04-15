import { useState, useEffect, useRef } from 'react'
import { Upload, Zap, AlertCircle, CheckCircle, Loader, Trash2, Mic2, Edit2, Bot, Lock } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('clone')

  // Modal de renombrar voz existente
  const [editingVoiceId, setEditingVoiceId] = useState(null)
  const [editingVoiceName, setEditingVoiceName] = useState('')

  // Prueba de voz
  const [testVoiceId, setTestVoiceId] = useState(null)
  const [testText, setTestText] = useState('Asi suena tu voz elegida')
  const [testingVoice, setTestingVoice] = useState(false)
  const [testAudioUrl, setTestAudioUrl] = useState(null)
  const testAudioRef = useRef(null)
  const testRequestRef = useRef(0)
  const testingVoiceRef = useRef(false)

  // Studio Pro section
  const [studioPro, setStudioPro] = useState({
    file: null,
    fileId: null,
    duration: 0,
    startMs: 0,
    endMs: 0,
    voiceName: '',
    langCode: 'ES_ES',
    uploading: false,
    processing: false
  })

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

  // Studio Pro handlers
  const handleStudioProFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska']
      if (!allowedMimes.some(mime => file.type.includes(mime.split('/')[0]))) {
        setError('Formato de archivo no soportado. Usa video (MP4, AVI, MOV) o audio (MP3, WAV)')
        return
      }
      if (file.size > 150 * 1024 * 1024) {
        setError('El archivo no debe exceder 150MB')
        return
      }
      setStudioPro(prev => ({ ...prev, file }))
      setError(null)
    }
  }

  const handleStudioProUpload = async () => {
    if (!studioPro.file) {
      setError('Selecciona un archivo')
      return
    }

    const token = localStorage.getItem('sv-token')
    if (!token) {
      setError('Debes iniciar sesión')
      return
    }

    setError(null)
    setStudioPro(prev => ({ ...prev, uploading: true }))

    const formData = new FormData()
    formData.append('file', studioPro.file)

    try {
      const res = await fetch(`${API_URL}/api/inworld/extract-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStudioPro(prev => ({
          ...prev,
          fileId: data.fileId,
          duration: data.duration,
          endMs: data.duration,
          uploading: false
        }))
        setMessage(`Archivo subido exitosamente. Duración: ${(data.duration / 1000).toFixed(1)}s`)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(data.error || 'Error subiendo archivo')
        setStudioPro(prev => ({ ...prev, uploading: false }))
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
      setStudioPro(prev => ({ ...prev, uploading: false }))
    }
  }

  const handleStudioProExtract = async () => {
    if (!studioPro.fileId || !studioPro.voiceName) {
      setError('Ingresa nombre de voz')
      return
    }

    const clipDuration = studioPro.endMs - studioPro.startMs
    if (clipDuration < 1000) {
      setError('El clip debe tener al menos 1 segundo')
      return
    }

    const token = localStorage.getItem('sv-token')
    if (!token) {
      setError('Debes iniciar sesión')
      return
    }

    setError(null)
    setStudioPro(prev => ({ ...prev, processing: true }))

    try {
      const res = await fetch(`${API_URL}/api/inworld/extract-clip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: studioPro.fileId,
          startMs: studioPro.startMs,
          endMs: studioPro.endMs,
          voiceName: studioPro.voiceName,
          langCode: studioPro.langCode
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage(`✅ ¡Voz "${studioPro.voiceName}" clonada exitosamente!`)
        setStudioPro({
          file: null,
          fileId: null,
          duration: 0,
          startMs: 0,
          endMs: 0,
          voiceName: '',
          langCode: 'ES_ES',
          uploading: false,
          processing: false
        })
        await loadUserVoices()
        window.dispatchEvent(new CustomEvent('voice-added'))
        setTimeout(() => setMessage(null), 5000)
      } else {
        setError(data.error || 'Error clonando voz')
        setStudioPro(prev => ({ ...prev, processing: false }))
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
      setStudioPro(prev => ({ ...prev, processing: false }))
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
            setMessage(`✅ ¡LISTO! Voz "${voiceName}" clonada exitosamente.`)
            setVoiceName('')
            setAudioFile(null)
            // Recargar lista de voces inmediatamente
            await loadUserVoices()
            // Notificar a otros componentes que se agregó una voz
            window.dispatchEvent(new CustomEvent('voice-added'))
            // Auto-limpiar mensaje después de 5 segundos
            setTimeout(() => setMessage(null), 5000)
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
  const clonedVoices = userVoices.filter(v => v.provider === 'inworld' || v.provider === 'inworld-cloned')

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
              placeholder="Asi suena tu voz elegida"
              className={darkMode ? 'w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 min-h-20' : 'w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500 min-h-20'}
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {testText.length} caracteres · 1 token = 1 caracter
            </p>
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

  // Feature access control
  const userPlan = user?.plan || 'free'
  const isFreeUser = userPlan === 'free'

  return (
    <div className={`relative space-y-6 ${isFreeUser ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Tabs */}
      <div className={`flex gap-3 p-1 rounded-lg mb-2 flex-wrap ${darkMode ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
        <button
          onClick={() => setActiveTab('clone')}
          className={`flex-1 min-w-32 px-6 py-3 rounded-md font-semibold transition-all ${
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
        {(user?.role === 'admin' || ['creator', 'pro'].includes((user?.plan || 'free').toLowerCase())) && (
          <button
            onClick={() => setActiveTab('studio-pro')}
            className={`flex-1 min-w-32 px-6 py-3 rounded-md font-semibold transition-all ${
              activeTab === 'studio-pro'
                ? darkMode
                  ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <Zap className="inline w-4 h-4 mr-2" />
            Studio Pro
          </button>
        )}
        <button
          onClick={() => setActiveTab('ai-assistant')}
          className={`flex-1 min-w-32 px-6 py-3 rounded-md font-semibold transition-all ${
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

      {/* Studio Pro — Extract audio from video/long audio */}
      {activeTab === 'studio-pro' && (
        <div className={darkMode ? "bg-[#1a1a2e] border border-orange-400/30 rounded-lg p-6" : "bg-white border border-orange-200 rounded-lg p-6 shadow-sm"}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-orange-400" />
            <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>Studio Pro</h2>
            <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-50 text-orange-600'}`}>PRO</span>
          </div>

          <div className="space-y-6">
            {/* Step 1: File Upload */}
            {!studioPro.fileId && (
              <div className={darkMode ? "bg-gray-800/40 border border-cyan-400/20 rounded-lg p-4" : "bg-gray-50 border border-orange-200 rounded-lg p-4"}>
                <h3 className={`font-semibold mb-3 ${darkMode ? 'text-cyan-300' : 'text-orange-700'}`}>Paso 1: Sube tu archivo</h3>
                <div className="space-y-3">
                  <div>
                    <label className={darkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>
                      Video o Audio (Máx 150MB, 10 min)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        onChange={handleStudioProFileChange}
                        disabled={studioPro.uploading}
                        className="hidden"
                        id="studio-pro-file"
                      />
                      <label
                        htmlFor="studio-pro-file"
                        className={darkMode ? "flex items-center justify-center gap-2 w-full bg-gray-900 border-2 border-dashed border-orange-500/30 rounded-lg p-4 cursor-pointer hover:border-orange-500 transition" : "flex items-center justify-center gap-2 w-full bg-white border-2 border-dashed border-orange-300 rounded-lg p-4 cursor-pointer hover:border-orange-500 transition"}
                      >
                        <Upload className="w-5 h-5 text-orange-400" />
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                          {studioPro.file ? studioPro.file.name : 'Clic para seleccionar'}
                        </span>
                      </label>
                    </div>
                  </div>
                  {studioPro.file && (
                    <button
                      onClick={handleStudioProUpload}
                      disabled={studioPro.uploading}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {studioPro.uploading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Procesar archivo
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Timeline & Clip Selection */}
            {studioPro.fileId && (
              <div className={darkMode ? "bg-gray-800/40 border border-cyan-400/20 rounded-lg p-4" : "bg-gray-50 border border-orange-200 rounded-lg p-4"}>
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-cyan-300' : 'text-orange-700'}`}>Paso 2: Selecciona tu clip (5-15 segundos recomendado)</h3>

                {/* Timeline Bar */}
                <div className="space-y-3">
                  <div className={darkMode ? "bg-gray-900/60 border border-gray-700 rounded-lg p-3" : "bg-white border border-gray-200 rounded-lg p-3"}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Línea de tiempo</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Duración: {(studioPro.duration / 1000).toFixed(1)}s</p>
                    </div>

                    {/* Timeline visual */}
                    <div className={darkMode ? "bg-gray-800 rounded-full h-2 mb-3 relative cursor-pointer group" : "bg-gray-200 rounded-full h-2 mb-3 relative cursor-pointer group"}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const percent = (e.clientX - rect.left) / rect.width
                        const ms = Math.max(0, Math.min(percent * studioPro.duration, studioPro.duration - 1000))
                        setStudioPro(prev => ({ ...prev, startMs: Math.floor(ms), endMs: Math.floor(ms + 10000) }))
                      }}
                    >
                      {/* Selected range highlight */}
                      <div
                        className="absolute h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                        style={{
                          left: `${(studioPro.startMs / studioPro.duration) * 100}%`,
                          right: `${100 - (studioPro.endMs / studioPro.duration) * 100}%`
                        }}
                      />
                    </div>

                    {/* Time inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inicio (s)</label>
                        <input
                          type="number"
                          min="0"
                          max={studioPro.duration / 1000 - 1}
                          step="0.1"
                          value={(studioPro.startMs / 1000).toFixed(1)}
                          onChange={(e) => {
                            const ms = Math.max(0, parseFloat(e.target.value) * 1000)
                            setStudioPro(prev => ({ ...prev, startMs: Math.floor(ms) }))
                          }}
                          className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-cyan-400" : "w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 text-sm focus:outline-none focus:border-orange-400"}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fin (s)</label>
                        <input
                          type="number"
                          min="0"
                          max={studioPro.duration / 1000}
                          step="0.1"
                          value={(studioPro.endMs / 1000).toFixed(1)}
                          onChange={(e) => {
                            const ms = Math.min(studioPro.duration, parseFloat(e.target.value) * 1000)
                            setStudioPro(prev => ({ ...prev, endMs: Math.floor(ms) }))
                          }}
                          className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-cyan-400" : "w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 text-sm focus:outline-none focus:border-orange-400"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clip duration warning */}
                  <div className={`p-3 rounded-lg ${
                    studioPro.endMs - studioPro.startMs < 5000
                      ? darkMode ? "bg-red-500/20 border border-red-500/30 text-red-300" : "bg-red-50 border border-red-200 text-red-700"
                      : studioPro.endMs - studioPro.startMs > 15000
                      ? darkMode ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300" : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                      : darkMode ? "bg-green-500/20 border border-green-500/30 text-green-300" : "bg-green-50 border border-green-200 text-green-700"
                  }`}>
                    <p className="text-sm font-medium">
                      ⏱️ Duración del clip: <strong>{((studioPro.endMs - studioPro.startMs) / 1000).toFixed(1)}s</strong>
                      {studioPro.endMs - studioPro.startMs < 5000 && " (Muy corto)"}
                      {studioPro.endMs - studioPro.startMs > 15000 && " (Largo)"}
                      {studioPro.endMs - studioPro.startMs >= 5000 && studioPro.endMs - studioPro.startMs <= 15000 && " (Ideal)"}
                    </p>
                  </div>

                  {/* Voice name & language */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={darkMode ? "block text-sm font-medium text-gray-300 mb-1" : "block text-sm font-medium text-gray-700 mb-1"}>Nombre de la voz</label>
                      <input
                        type="text"
                        value={studioPro.voiceName}
                        onChange={(e) => setStudioPro(prev => ({ ...prev, voiceName: e.target.value }))}
                        placeholder="Mi voz Studio Pro"
                        className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400" : "w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-orange-400"}
                      />
                    </div>
                    <div>
                      <label className={darkMode ? "block text-sm font-medium text-gray-300 mb-1" : "block text-sm font-medium text-gray-700 mb-1"}>Idioma</label>
                      <select
                        value={studioPro.langCode}
                        onChange={(e) => setStudioPro(prev => ({ ...prev, langCode: e.target.value }))}
                        className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400" : "w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-orange-400"}
                      >
                        <option value="ES_ES">Español</option>
                        <option value="EN_US">English (USA)</option>
                        <option value="EN_GB">English (UK)</option>
                        <option value="PT_BR">Português</option>
                        <option value="FR_FR">Français</option>
                        <option value="DE_DE">Deutsch</option>
                        <option value="IT_IT">Italiano</option>
                      </select>
                    </div>
                  </div>

                  {/* Extract button */}
                  <button
                    onClick={handleStudioProExtract}
                    disabled={studioPro.processing || !studioPro.voiceName || studioPro.endMs - studioPro.startMs < 1000}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {studioPro.processing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Procesando clip...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Usar este clip
                      </>
                    )}
                  </button>

                  {/* Reset button */}
                  <button
                    onClick={() => setStudioPro({
                      file: null,
                      fileId: null,
                      duration: 0,
                      startMs: 0,
                      endMs: 0,
                      voiceName: '',
                      langCode: 'ES_ES',
                      uploading: false,
                      processing: false
                    })}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    ← Subir otro archivo
                  </button>
                </div>
              </div>
            )}

            {/* Voces creadas con Studio Pro */}
            {renderVoiceList(clonedVoices)}
          </div>

          {/* Messages */}
          {message && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <p className="text-green-50 font-semibold">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-gradient-to-r from-red-500/30 to-rose-500/30 border-2 border-red-400 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-50 font-semibold">{error}</p>
            </div>
          )}
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

      {/* Overlay para usuarios FREE - TRANSPARENTE */}
      {isFreeUser && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-6 pointer-events-auto">
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-white/10' : 'bg-black/5'} backdrop-blur-sm`}>
              <Lock className={`w-20 h-20 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} />
            </div>
            <div className={`text-center px-6 py-4 rounded-xl ${
              darkMode
                ? 'bg-gradient-to-br from-purple-900/60 to-purple-800/40 border border-purple-500/50'
                : 'bg-gradient-to-br from-purple-200/60 to-purple-100/50 border border-purple-400/60'
            }`}>
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Actualiza tu plan
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Acceso al Taller de Voces disponible<br/>
                <span className="font-semibold">desde el plan START</span>
              </p>
            </div>
            <button
              onClick={() => {}}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                darkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
              }`}
            >
              Ver Planes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


