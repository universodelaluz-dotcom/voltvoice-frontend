import { useState, useEffect, useRef } from 'react'
import { Upload, Zap, AlertCircle, CheckCircle, Loader, Trash2, Mic2, Edit2, Bot, Lock, Play, Square } from 'lucide-react'
import AIRoleplayWorkshop from './AIRoleplayWorkshop'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || 'https://voltvoice-backend.onrender.com'

export default function VoiceWorkshopPanel({ onCloneSuccess, darkModeOverride, config, updateConfig, user }) {
  const { t, i18n } = useTranslation()
  const isSpanish = String(i18n?.resolvedLanguage || i18n?.language || 'en').toLowerCase().startsWith('es')
  const planKey = String(user?.plan || 'free').toLowerCase()
  const PLAN_MAX_CLONED_VOICES = {
    free: 0,
    start: 1,
    creator: 2,
    premium: 2,
    pro: 5,
    elite: 5,
    on_demand: 999,
    admin: 999
  }
  const planMaxVoices = PLAN_MAX_CLONED_VOICES[planKey] ?? 0
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
  const [maxVoicesAllowed, setMaxVoicesAllowed] = useState(planMaxVoices)
  const [activeTab, setActiveTab] = useState('clone')

  // Modal de renombrar voz existente
  const [editingVoiceId, setEditingVoiceId] = useState(null)
  const [editingVoiceName, setEditingVoiceName] = useState('')

  // Prueba de voz
  const [testVoiceId, setTestVoiceId] = useState(null)
  const [testText, setTestText] = useState(isSpanish ? 'Asi suena tu voz elegida' : 'This is how your selected voice sounds')
  const [testingVoice, setTestingVoice] = useState(false)
  const [testAudioUrl, setTestAudioUrl] = useState(null)
  const [shouldAutoPlayTestAudio, setShouldAutoPlayTestAudio] = useState(false)
  const testAudioRef = useRef(null)
  const testRequestRef = useRef(0)
  const testingVoiceRef = useRef(false)

  // Extractor Pro timeline drag refs
  const timelineRef = useRef(null)
  const dragRef = useRef(null) // { handle: 'start'|'end', initX, initStartMs, initEndMs }
  const studioProRef = useRef({ startMs: 0, endMs: 0, duration: 0 })
  const [studioProPreview, setStudioProPreview] = useState({ loading: false, audioUrl: null })
  const [shouldAutoPlayStudioPreview, setShouldAutoPlayStudioPreview] = useState(false)
  const studioPreviewAudioRef = useRef(null)

  // Extractor Pro section
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
  const [extractorUsageNotice, setExtractorUsageNotice] = useState(null)

  // Keep ref in sync with studioPro state for drag handlers (must be AFTER studioPro declaration)
  useEffect(() => {
    studioProRef.current = {
      startMs: studioPro.startMs,
      endMs: studioPro.endMs,
      duration: studioPro.duration
    }
  }, [studioPro.startMs, studioPro.endMs, studioPro.duration])

  const languageOptions = [
    { code: 'es-ES', label: 'Voz en EspaÃ±ol' },
    { code: 'en-US', label: 'English (USA)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'pt-BR', label: 'PortuguÃªs (Brasil)' },
    { code: 'fr-FR', label: 'FranÃ§ais' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'it-IT', label: 'Italiano' }
  ]

  // Cargar voces del usuario al montar
  useEffect(() => {
    loadUserVoices()
  }, [])

  useEffect(() => {
    setMaxVoicesAllowed(planMaxVoices)
  }, [planMaxVoices])

  // Limpiar audio cuando cambia la voz seleccionada
  useEffect(() => {
    setTestAudioUrl(null)
    setShouldAutoPlayTestAudio(false)
  }, [testVoiceId])

  // Evitar replays automÃ¡ticos al moverte entre pestaÃ±as
  const handleTabChange = (nextTab) => {
    if (testAudioRef.current) {
      testAudioRef.current.pause()
      testAudioRef.current.currentTime = 0
    }
    if (studioPreviewAudioRef.current) {
      studioPreviewAudioRef.current.pause()
      studioPreviewAudioRef.current.currentTime = 0
    }
    setShouldAutoPlayTestAudio(false)
    setShouldAutoPlayStudioPreview(false)
    setActiveTab(nextTab)
  }

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('sv-token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  const loadUserVoices = async () => {
    try {
      const token = sessionStorage.getItem('sv-token')
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
        const apiMax = Number(data.maxVoices)
        const safeApiMax = Number.isFinite(apiMax) ? apiMax : planMaxVoices
        setMaxVoicesAllowed(Math.min(safeApiMax, planMaxVoices))
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
      setError(t('voiceClone.rename.emptyName'))
      return
    }

    try {
      const token = sessionStorage.getItem('sv-token')
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
        setMessage(t('voiceClone.rename.success', { name: editingVoiceName }))
        setEditingVoiceId(null)
        setEditingVoiceName('')
        // Notificar a otros componentes que se actualizÃ³ una voz
        window.dispatchEvent(new CustomEvent('voice-added'))
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(t('voiceClone.rename.error'))
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
    }
  }

  const handleDeleteVoice = async (id, name) => {
    if (!confirm(t('voiceClone.delete.confirm', { name }))) return

    try {
      const token = sessionStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/settings/voices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setUserVoices(prev => prev.filter(v => v.id !== id))
        setMessage(t('voiceClone.delete.success', { name }))
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      setError(t('voiceClone.delete.error'))
    }
  }

  const handleTestVoice = async () => {
    if (testingVoiceRef.current) return

    if (!testVoiceId || !testText.trim()) {
      setError(t('voiceClone.test.selectHint'))
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
      const token = sessionStorage.getItem('sv-token')
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
        setShouldAutoPlayTestAudio(true)
        setMessage(t('voiceClone.test.success'))
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(data.error || t('voiceClone.errors.synthesis'))
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
        setError(t('voiceClone.errors.invalidFile'))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('voiceClone.errors.fileTooLarge'))
        return
      }
      setAudioFile(file)
      setError(null)
    }
  }

  // Extractor Pro: preview selected clip
  const handleStudioProPreview = async () => {
    if (!studioPro.fileId) return
    setStudioProPreview({ loading: true, audioUrl: null })
    try {
      const token = sessionStorage.getItem('sv-token')
      const res = await fetch(`${API_URL}/api/inworld/preview-clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fileId: studioPro.fileId, startMs: studioPro.startMs, endMs: studioPro.endMs })
      })
      const data = await res.json()
      if (res.ok && data.audio) {
        setShouldAutoPlayStudioPreview(true)
        setStudioProPreview({ loading: false, audioUrl: data.audio })
      } else {
        setError(data.error || (isSpanish ? 'Error cargando preview' : 'Error loading preview'))
        setStudioProPreview({ loading: false, audioUrl: null })
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
      setStudioProPreview({ loading: false, audioUrl: null })
    }
  }

  // Extractor Pro timeline drag handlers
  const handleTimelineDragStart = (e, handle) => {
    e.preventDefault()
    const { startMs, endMs, duration } = studioProRef.current
    dragRef.current = { handle, initX: e.clientX, initStartMs: startMs, initEndMs: endMs }

    const onMove = (ev) => {
      if (!dragRef.current || !timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      const dxRatio = (ev.clientX - dragRef.current.initX) / rect.width
      const dMs = dxRatio * duration

      if (dragRef.current.handle === 'start') {
        const newStart = Math.max(0, Math.min(dragRef.current.initStartMs + dMs, dragRef.current.initEndMs - 500))
        setStudioPro(prev => ({ ...prev, startMs: Math.floor(newStart) }))
        setStudioProPreview({ loading: false, audioUrl: null })
      } else {
        const newEnd = Math.max(dragRef.current.initEndMs > 500 ? dragRef.current.initStartMs + 500 : 500, Math.min(dragRef.current.initEndMs + dMs, duration))
        setStudioPro(prev => ({ ...prev, endMs: Math.floor(newEnd) }))
        setStudioProPreview({ loading: false, audioUrl: null })
      }
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMoveTouch)
      window.removeEventListener('touchend', onUp)
    }

    const onMoveTouch = (ev) => onMove(ev.touches[0])

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMoveTouch, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  // Extractor Pro handlers
  const handleStudioProFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska']
      if (!allowedMimes.some(mime => file.type.includes(mime.split('/')[0]))) {
        setError(isSpanish ? 'Formato de archivo no soportado. Usa video (MP4, AVI, MOV) o audio (MP3, WAV)' : 'Unsupported file format. Use video (MP4, AVI, MOV) or audio (MP3, WAV)')
        return
      }
      if (file.size > 150 * 1024 * 1024) {
        setError(isSpanish ? 'El archivo no debe exceder 150MB' : 'File must not exceed 150MB')
        return
      }
      setStudioPro(prev => ({ ...prev, file }))
      setError(null)
    }
  }

  const handleStudioProUpload = async () => {
    if (!studioPro.file) {
      setError(isSpanish ? 'Selecciona un archivo' : 'Select a file')
      return
    }

    const token = sessionStorage.getItem('sv-token')
    if (!token) {
      setError(isSpanish ? 'Debes iniciar sesión' : 'You must sign in')
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
        setMessage(isSpanish ? `Archivo subido exitosamente. Duración: ${(data.duration / 1000).toFixed(1)}s` : `File uploaded successfully. Duration: ${(data.duration / 1000).toFixed(1)}s`)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setError(data.error || t('voiceClone.errors.upload'))
        setStudioPro(prev => ({ ...prev, uploading: false }))
      }
    } catch (err) {
      setError(`Error: ${err.message}`)
      setStudioPro(prev => ({ ...prev, uploading: false }))
    }
  }

  const handleStudioProExtract = async () => {
    if (!studioPro.fileId || !studioPro.voiceName) {
      setError(isSpanish ? 'Ingresa nombre de voz' : 'Enter a voice name')
      return
    }

    const clipDuration = studioPro.endMs - studioPro.startMs
    if (clipDuration < 1000) {
      setError(isSpanish ? 'El clip debe tener al menos 1 segundo' : 'The clip must be at least 1 second long')
      return
    }

    const token = sessionStorage.getItem('sv-token')
    if (!token) {
      setError(isSpanish ? 'Debes iniciar sesión' : 'You must sign in')
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
        const remaining = Number(data?.extractorProUsage?.remaining)
        if (remaining === 2) {
          setExtractorUsageNotice(t('voiceClone.extractor.usesLeft', { n: 2 }))
        } else {
          setExtractorUsageNotice(null)
        }
        setMessage(t('voiceClone.clone.success', { name: studioPro.voiceName }))
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
        setError(data.error || (isSpanish ? 'Error clonando voz' : 'Error cloning voice'))
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
      setError(isSpanish ? 'Ingresa un nombre para la voz' : 'Enter a name for the voice')
      return
    }

    if (!audioFile) {
      setError(isSpanish ? 'Selecciona un archivo de audio' : 'Select an audio file')
      return
    }

    const token = sessionStorage.getItem('sv-token')
    if (!token) {
      setError(isSpanish ? 'Debes iniciar sesión para clonar voces' : 'You must sign in to clone voices')
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
            setMessage(t('voiceClone.clone.success', { name: voiceName }))
            setVoiceName('')
            setAudioFile(null)
            // Recargar lista de voces inmediatamente
            await loadUserVoices()
            // Notificar a otros componentes que se agregÃ³ una voz
            window.dispatchEvent(new CustomEvent('voice-added'))
            // Auto-limpiar mensaje despuÃ©s de 5 segundos
            setTimeout(() => setMessage(null), 5000)
          } else {
            setError(data.error || data.details || t('voiceClone.clone.error'))
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

  // Renderiza la secciÃ³n "Mis Voces Creadas" filtrada
  const renderVoiceList = (voices) => (
    <div className={`${darkMode ? 'bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6' : 'bg-white border border-indigo-200 rounded-lg p-6 shadow-sm'}`}>
      <div className="flex items-center gap-3 mb-4">
        <Mic2 className="w-6 h-6 text-purple-400" />
        <h2 className={darkMode ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>{isSpanish ? 'Mis Voces Creadas' : 'My Created Voices'}</h2>
        <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>
          {voices.length}/{maxVoicesAllowed}
        </span>
      </div>
      {loadingVoices ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-5 h-5 animate-spin text-cyan-400" />
        </div>
      ) : voices.length === 0 ? (
        <p className={`text-sm py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isSpanish ? 'Aún no tienes voces de este tipo. ¡Crea tu primera voz arriba!' : 'You do not have voices of this type yet. Create your first voice above!'}
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
                    <button onClick={handleSaveVoiceEdit} className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-semibold transition-colors flex-shrink-0">{isSpanish ? 'Guardar' : 'Save'}</button>
                    <button onClick={() => { setEditingVoiceId(null); setEditingVoiceName('') }} className="px-2 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded text-xs font-semibold transition-colors flex-shrink-0">{isSpanish ? 'Cancelar' : 'Cancel'}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditVoice(voice)} className="p-1.5 rounded hover:bg-cyan-500/20 transition-colors flex-shrink-0" title={isSpanish ? 'Renombrar voz' : 'Rename voice'}>
                      <Edit2 className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button onClick={() => handleDeleteVoice(voice.id, voice.voice_name)} className="p-1.5 rounded hover:bg-red-500/20 transition-colors flex-shrink-0" title={isSpanish ? 'Eliminar voz' : 'Delete voice'}>
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

  // Renderiza la secciÃ³n "Probar Voz" filtrada
  const renderTestVoice = (voices) => (
      <div className={darkMode ? 'bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6' : 'bg-white border border-indigo-200 rounded-lg p-6 shadow-sm'}>
        <div className="flex items-center gap-3 mb-4">
          <Mic2 className="w-6 h-6 text-cyan-400" />
          <h2 className={darkMode ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>{isSpanish ? 'Probar Voz' : 'Test Voice'}</h2>
        </div>
        <div className="space-y-4">
          {voices.length === 0 && (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isSpanish ? 'Aun no tienes voces clonadas para probar.' : 'You do not have cloned voices to test yet.'}
            </p>
          )}
          <div>
            <label className={darkMode ? 'block text-sm font-medium text-cyan-300 mb-2' : 'block text-sm font-medium text-indigo-600 mb-2'}>{isSpanish ? 'Selecciona una voz' : 'Select a voice'}</label>
            <select
              value={testVoiceId || ''}
              onChange={(e) => setTestVoiceId(e.target.value)}
              disabled={voices.length === 0}
              className={darkMode ? 'w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400' : 'w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500'}
            >
              <option value="">{isSpanish ? '-- Elige una voz --' : '-- Choose a voice --'}</option>
              {voices.map(voice => (
                <option key={voice.id} value={voice.voice_id}>{voice.voice_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={darkMode ? 'block text-sm font-medium text-cyan-300 mb-2' : 'block text-sm font-medium text-indigo-600 mb-2'}>{isSpanish ? 'Escribe un texto para probar' : 'Write text to test'}</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder={isSpanish ? 'Asi suena tu voz elegida' : 'This is how your selected voice sounds'}
              disabled={voices.length === 0}
              className={darkMode ? 'w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 min-h-20' : 'w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500 min-h-20'}
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {testText.length} {isSpanish ? 'caracteres' : 'characters'} · 1 token = 1 {isSpanish ? 'caracter' : 'character'}
            </p>
          </div>
          <button
            onClick={handleTestVoice}
            disabled={testingVoice || voices.length === 0 || !testVoiceId || !testText.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {testingVoice ? <><Loader className="w-5 h-5 animate-spin" />{t('voiceClone.test.generating')}</> : <><Mic2 className="w-5 h-5" />{t('voiceClone.test.btn')}</>}
          </button>
          {testAudioUrl && (
            <div className={darkMode ? 'bg-gray-800/60 border border-gray-700/50 rounded-lg p-4' : 'bg-gray-50 border border-gray-200 rounded-lg p-4'}>
              <p className={`text-sm mb-2 ${darkMode ? 'text-cyan-300' : 'text-gray-700'}`}>{isSpanish ? '🔊 Escucha el resultado:' : '🔊 Listen to the result:'}</p>
              <audio
                key={testAudioUrl}
                ref={testAudioRef}
                controls
                className="w-full"
                autoPlay={shouldAutoPlayTestAudio}
                onPlay={() => setShouldAutoPlayTestAudio(false)}
              >
                <source src={testAudioUrl} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>
      </div>
  )

  // Feature access control
  const userPlan = String(user?.plan || 'free').toLowerCase()
  const isFreeUser = userPlan === 'free'
  const canUseAIAssistant = user?.role === 'admin' || ['pro', 'premium', 'elite', 'on_demand'].includes(userPlan)
  const canUseExtractorPro = user?.role === 'admin' || ['creator', 'pro'].includes(userPlan)

  return (
    <div className={`relative space-y-6 ${isFreeUser ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Tabs */}
      <div className={`flex gap-3 p-1 rounded-lg mb-2 flex-wrap ${darkMode ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
        <button
          onClick={() => handleTabChange('clone')}
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
          {isSpanish ? 'Clonar Voz' : 'Clone Voice'}
        </button>
        <button
          onClick={() => handleTabChange('studio-pro')}
          className={`flex-1 min-w-32 px-6 py-3 rounded-md font-semibold transition-all ${
            activeTab === 'studio-pro'
              ? darkMode
                ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white'
          } ${!canUseExtractorPro ? 'opacity-70' : ''}`}
        >
          <Zap className="inline w-4 h-4 mr-2" />
          Extractor Pro
          {!canUseExtractorPro && <Lock className="inline w-3.5 h-3.5 ml-2" />}
        </button>
        <button
          onClick={() => handleTabChange('ai-assistant')}
          className={`flex-1 min-w-32 px-6 py-3 rounded-md font-semibold transition-all ${
            activeTab === 'ai-assistant'
              ? darkMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
              : darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white'
          } ${!canUseAIAssistant ? 'opacity-70' : ''}`}
        >
          <Bot className="inline w-4 h-4 mr-2" />
          {isSpanish ? 'Asistente IA' : 'AI Assistant'}
          {!canUseAIAssistant && <Lock className="inline w-3.5 h-3.5 ml-2" />}
        </button>
      </div>

      {/* {isSpanish ? 'Clonar Nueva Voz' : 'Clone New Voice'} */}
      {activeTab === 'clone' && (
        <>
        <div className={darkMode ? "bg-[#1a1a2e] border border-cyan-400/30 rounded-lg p-6" : "bg-white border border-indigo-200 rounded-lg p-6 shadow-sm"}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>{isSpanish ? 'Clonar Nueva Voz' : 'Clone New Voice'}</h2>
          </div>

        <form onSubmit={handleCloneVoice} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              {isSpanish ? 'Nombre de la voz' : 'Voice name'}
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder={isSpanish ? 'Ej: Mi voz, Voz profesional...' : 'Ex: My voice, Professional voice...'}
              className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400" : "w-full bg-gray-50 border border-indigo-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-indigo-500"}
              disabled={loading}
            />
          </div>

          {/* Idioma */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              {isSpanish ? 'Idioma de la voz' : 'Voice language'}
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
              {isSpanish ? 'Selecciona el idioma del audio que vas a subir' : 'Select the language of the audio you will upload'}
            </p>
          </div>

          {/* File upload */}
          <div>
            <label className={darkMode ? "block text-sm font-medium text-cyan-300 mb-2" : "block text-sm font-medium text-indigo-600 mb-2"}>
              {isSpanish ? 'Archivo de audio (MP3 o WAV, 10-15 seg ideal)' : 'Audio file (MP3 or WAV, 10-15 sec ideal)'}
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
                  {audioFile ? audioFile.name : (isSpanish ? 'Clic para seleccionar archivo' : 'Click to select a file')}
                </span>
              </label>
            </div>
          </div>

          {/* Requerimientos */}
          <div className={darkMode ? "text-xs text-gray-400 space-y-1" : "text-xs text-gray-500 space-y-1"}>
            <p>{isSpanish ? '✓ Duración ideal: 10-15 segundos (máx 15 seg)' : '✓ Ideal duration: 10-15 seconds (max 15 sec)'}</p>
            <p>{isSpanish ? '✓ Audio claro, sin ruido de fondo ni música' : '✓ Clear audio, without background noise or music'}</p>
            <p>{isSpanish ? '✓ Formato: MP3 o WAV' : '✓ Format: MP3 or WAV'}</p>
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
                {t('voiceClone.clone.cloning')}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {t('voiceClone.clone.btn')}
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

      {/* Probar Voz â€” solo clonadas */}
      {renderTestVoice(clonedVoices)}

      {/* Mis Voces Creadas â€” solo clonadas */}
      {renderVoiceList(clonedVoices)}
        </>
      )}

      {/* Extractor Pro â€” Extract audio from video/long audio */}
      {activeTab === 'studio-pro' && (
        <div className={`relative ${darkMode ? "bg-[#1a1a2e] border border-orange-400/30 rounded-lg p-6" : "bg-white border border-orange-200 rounded-lg p-6 shadow-sm"} ${!canUseExtractorPro ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-orange-400" />
            <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-gray-900"}>Extractor Pro</h2>
            <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-50 text-orange-600'}`}>PRO</span>
          </div>
          {extractorUsageNotice && (
            <p className={`mb-3 text-xs ${darkMode ? 'text-cyan-300/90' : 'text-cyan-700'}`}>
              {extractorUsageNotice}
            </p>
          )}

          <div className="space-y-6">
            {/* Step 1: File Upload */}
            {!studioPro.fileId && (
              <div className={darkMode ? "bg-gray-800/40 border border-cyan-400/20 rounded-lg p-4" : "bg-gray-50 border border-orange-200 rounded-lg p-4"}>
                <h3 className={`font-semibold mb-3 ${darkMode ? 'text-cyan-300' : 'text-orange-700'}`}>{isSpanish ? 'Paso 1: Sube tu archivo' : 'Step 1: Upload your file'}</h3>
                <div className="space-y-3">
                  <div>
                    <label className={darkMode ? "block text-sm font-medium text-gray-300 mb-2" : "block text-sm font-medium text-gray-700 mb-2"}>
                      {isSpanish ? 'Video o Audio (Máx 150MB, 10 min)' : 'Video or Audio (Max 150MB, 10 min)'}
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
                          {studioPro.file ? studioPro.file.name : (isSpanish ? 'Clic para seleccionar' : 'Click to select')}
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
                          {t('voiceClone.upload.processing')}
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          {t('voiceClone.extractor.uploadBtn')}
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
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-cyan-300' : 'text-orange-700'}`}>{isSpanish ? 'Paso 2: Selecciona tu clip (5-15 segundos recomendado)' : 'Step 2: Select your clip (5-15 seconds recommended)'}</h3>

                {/* Timeline Bar â€” YouTube-style trimmer */}
                <div className="space-y-3">
                  <div className={darkMode ? "bg-gray-900/60 border border-gray-700 rounded-lg p-3" : "bg-white border border-gray-200 rounded-lg p-3"}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{isSpanish ? 'Línea de tiempo' : 'Timeline'}</p>
                      <p className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total: {(studioPro.duration / 1000).toFixed(1)}s</p>
                    </div>

                    {/* Timeline trimmer */}
                    <div className="relative select-none" style={{ height: '48px' }}>
                      {/* Full track background */}
                      <div
                        ref={timelineRef}
                        className={`absolute top-1/2 -translate-y-1/2 w-full rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                        style={{ height: '12px' }}
                        onClick={(e) => {
                          if (dragRef.current) return
                          const rect = e.currentTarget.getBoundingClientRect()
                          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                          const clickMs = pct * studioPro.duration
                          const clipLen = Math.min(10000, studioPro.duration - clickMs)
                          setStudioPro(prev => ({ ...prev, startMs: Math.floor(clickMs), endMs: Math.floor(clickMs + clipLen) }))
                          setStudioProPreview({ loading: false, audioUrl: null })
                        }}
                      >
                        {/* Dark overlay left of selection */}
                        <div
                          className={`absolute top-0 left-0 h-full ${darkMode ? 'bg-gray-900/70' : 'bg-gray-400/50'}`}
                          style={{ width: `${(studioPro.startMs / studioPro.duration) * 100}%` }}
                        />
                        {/* Selected region */}
                        <div
                          className="absolute top-0 h-full bg-gradient-to-r from-orange-500 to-orange-400"
                          style={{
                            left: `${(studioPro.startMs / studioPro.duration) * 100}%`,
                            width: `${((studioPro.endMs - studioPro.startMs) / studioPro.duration) * 100}%`
                          }}
                        />
                        {/* Dark overlay right of selection */}
                        <div
                          className={`absolute top-0 right-0 h-full ${darkMode ? 'bg-gray-900/70' : 'bg-gray-400/50'}`}
                          style={{ width: `${((studioPro.duration - studioPro.endMs) / studioPro.duration) * 100}%` }}
                        />
                      </div>

                      {/* Left handle (start) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 cursor-col-resize"
                        style={{ left: `${(studioPro.startMs / studioPro.duration) * 100}%` }}
                        onMouseDown={(e) => handleTimelineDragStart(e, 'start')}
                        onTouchStart={(e) => handleTimelineDragStart(e.touches[0], 'start')}
                      >
                        <div className="w-5 h-8 rounded-sm bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center">
                          <div className="flex flex-col gap-0.5">
                            <div className="w-0.5 h-3 bg-white/80 rounded" />
                          </div>
                        </div>
                      </div>

                      {/* Right handle (end) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 translate-x-1/2 z-10 cursor-col-resize"
                        style={{ right: `${((studioPro.duration - studioPro.endMs) / studioPro.duration) * 100}%` }}
                        onMouseDown={(e) => handleTimelineDragStart(e, 'end')}
                        onTouchStart={(e) => handleTimelineDragStart(e.touches[0], 'end')}
                      >
                        <div className="w-5 h-8 rounded-sm bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center">
                          <div className="flex flex-col gap-0.5">
                            <div className="w-0.5 h-3 bg-white/80 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time labels */}
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className={`text-xs font-mono font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                        â–¶ {(studioPro.startMs / 1000).toFixed(2)}s
                      </span>
                      <span className={`text-xs font-mono font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                        â¹ {(studioPro.endMs / 1000).toFixed(2)}s
                      </span>
                    </div>

                    {/* Preview button + audio player */}
                    <div className="mt-3">
                      <button
                        onClick={handleStudioProPreview}
                        disabled={studioProPreview.loading}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition ${
                          studioProPreview.loading
                            ? 'bg-gray-600 text-gray-400 cursor-wait'
                            : darkMode
                              ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30'
                              : 'bg-orange-50 border border-orange-300 text-orange-700 hover:bg-orange-100'
                        }`}
                      >
                        {studioProPreview.loading ? (
                          <><Loader className="w-4 h-4 animate-spin" /> {isSpanish ? 'Cargando preview...' : 'Loading preview...'}</>
                        ) : (
                          <><Play className="w-4 h-4" /> {isSpanish ? 'Escuchar clip seleccionado' : 'Listen to selected clip'}</>
                        )}
                      </button>
                      {studioProPreview.audioUrl && (
                        <audio
                          key={studioProPreview.audioUrl}
                          ref={studioPreviewAudioRef}
                          controls
                          autoPlay={shouldAutoPlayStudioPreview}
                          onPlay={() => setShouldAutoPlayStudioPreview(false)}
                          className="w-full mt-2 h-9"
                          src={studioProPreview.audioUrl}
                        />
                      )}
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
                      {isSpanish ? '⏱️ Duración del clip:' : '⏱️ Clip duration:'} <strong>{((studioPro.endMs - studioPro.startMs) / 1000).toFixed(1)}s</strong>
                      {studioPro.endMs - studioPro.startMs < 5000 && (isSpanish ? ' (Muy corto)' : ' (Too short)')}
                      {studioPro.endMs - studioPro.startMs > 15000 && (isSpanish ? ' (Largo)' : ' (Long)')}
                      {studioPro.endMs - studioPro.startMs >= 5000 && studioPro.endMs - studioPro.startMs <= 15000 && ' (Ideal)'}
                    </p>
                  </div>

                  {/* Voice name & language */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${!studioPro.voiceName ? 'text-red-400' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isSpanish ? 'Nombre de la voz' : 'Voice name'} {!studioPro.voiceName && <span className="font-bold">{isSpanish ? '← REQUERIDO' : '← REQUIRED'}</span>}
                      </label>
                      <input
                        type="text"
                        value={studioPro.voiceName}
                        onChange={(e) => setStudioPro(prev => ({ ...prev, voiceName: e.target.value }))}
                        placeholder="Ej: Mi voz clonada"
                        className={`w-full rounded px-3 py-2 text-sm focus:outline-none transition ${
                          !studioPro.voiceName
                            ? 'border-2 border-red-500 bg-red-500/10 text-white placeholder-red-400 focus:border-red-400'
                            : darkMode
                              ? 'bg-[#0f0f23] border border-cyan-400/30 text-white focus:border-cyan-400'
                              : 'bg-white border border-gray-300 text-gray-900 focus:border-orange-400'
                        }`}
                      />
                      {!studioPro.voiceName && (
                        <p className="text-red-400 text-xs mt-1">{isSpanish ? '⚠️ Pon un nombre a tu voz antes de continuar' : '⚠️ Name your voice before continuing'}</p>
                      )}
                    </div>
                    <div>
                      <label className={darkMode ? "block text-sm font-medium text-gray-300 mb-1" : "block text-sm font-medium text-gray-700 mb-1"}>{isSpanish ? 'Idioma' : 'Language'}</label>
                      <select
                        value={studioPro.langCode}
                        onChange={(e) => setStudioPro(prev => ({ ...prev, langCode: e.target.value }))}
                        className={darkMode ? "w-full bg-[#0f0f23] border border-cyan-400/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400" : "w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-orange-400"}
                      >
                        <option value="ES_ES">{isSpanish ? 'Español' : 'Spanish'}</option>
                        <option value="EN_US">English (USA)</option>
                        <option value="EN_GB">English (UK)</option>
                        <option value="PT_BR">PortuguÃªs</option>
                        <option value="FR_FR">FranÃ§ais</option>
                        <option value="DE_DE">Deutsch</option>
                        <option value="IT_IT">Italiano</option>
                      </select>
                    </div>
                  </div>

                  {/* Extract button */}
                  <button
                    onClick={() => {
                      if (!studioPro.voiceName.trim()) {
                        setError(isSpanish ? '⚠️ Primero ponle un nombre a tu voz (campo "Nombre de la voz")' : '⚠️ First name your voice ("Voice name" field)')
                        return
                      }
                      handleStudioProExtract()
                    }}
                    disabled={studioPro.processing}
                    className={`w-full font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                      !studioPro.voiceName.trim()
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                    }`}
                  >
                    {studioPro.processing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        {t('voiceClone.extractor.processing')}
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        {studioPro.voiceName.trim() ? t('voiceClone.extractor.useClip') : (isSpanish ? 'Pon un nombre primero ↑' : 'Set a name first ↑')}
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
                    {isSpanish ? '← Subir otro archivo' : '← Upload another file'}
                  </button>
                </div>
              </div>
            )}

            {/* Probar Voz en Extractor Pro */}
            {renderTestVoice(clonedVoices)}

            {/* Voces creadas con Extractor Pro */}
            {renderVoiceList(clonedVoices)}
          </div>
          {!canUseExtractorPro && (
            <div className="absolute inset-0 rounded-lg backdrop-blur-[1px] bg-black/20 flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-gray-900/90 border border-orange-400/40 text-orange-200' : 'bg-white/95 border border-orange-300 text-orange-700'} px-4 py-3 rounded-lg text-center text-sm font-semibold max-w-sm`}>
                {isSpanish ? 'Extractor Pro visible en modo bloqueado.' : 'Extractor Pro shown in locked mode.'}
                <br />
                {isSpanish ? 'Disponible desde plan Creator y Pro.' : 'Available on Creator and Pro plans.'}
              </div>
            </div>
          )}

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

      {/* {isSpanish ? 'Asistente IA' : 'AI Assistant'} â€” Primero Taller, luego Probar Voz */}
      {activeTab === 'ai-assistant' && (
        <div className="relative">
          <div className={`space-y-6 ${!canUseAIAssistant ? 'opacity-70 pointer-events-none select-none' : ''}`}>
            {/* 1. Taller de Asistentes de IA Roleplay */}
            <AIRoleplayWorkshop darkMode={darkMode} config={config || {}} updateConfig={updateConfig || (() => {})} user={user} />
            {/* 2. Probar Voz */}
            {renderTestVoice(userVoices)}
          </div>
          {!canUseAIAssistant && (
            <div className="absolute inset-0 rounded-lg backdrop-blur-[1px] bg-black/20 flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-gray-900/90 border border-cyan-400/40 text-cyan-200' : 'bg-white/95 border border-cyan-300 text-cyan-700'} px-4 py-3 rounded-lg text-center text-sm font-semibold max-w-sm`}>
                {isSpanish ? 'Asistente IA bloqueado en este plan.' : 'AI Assistant is locked on this plan.'}
                <br />
                {isSpanish ? 'Disponible solo en plan Pro.' : 'Available only on Pro plan.'}
              </div>
            </div>
          )}
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
                {isSpanish ? 'Actualiza tu plan' : 'Upgrade your plan'}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {isSpanish ? 'Acceso al Taller de Voces disponible' : 'Voice Workshop access available'}<br/>
                <span className="font-semibold">{isSpanish ? 'desde el plan START' : 'from START plan'}</span>
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







