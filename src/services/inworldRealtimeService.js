/**
 * Inworld Realtime API Service
 * Maneja conexión WebSocket y comunicación con Inworld speech-to-speech API
 *
 * Nota: Requiere:
 * - VITE_INWORLD_API_KEY en .env
 * - VITE_INWORLD_WORKSPACE_ID en .env
 */

export class InworldRealtimeService {
  constructor() {
    this.ws = null
    this.sessionId = null
    this.isConnected = false
    this.sessionInfo = null
    this.audioContext = null
    this.audioQueue = []
    this.isProcessingAudio = false
  }

  /**
   * Iniciar sesión con Inworld
   */
  async startSession(characterId, systemPrompt, workspaceId, apiKey) {
    try {
      // Crear sesión
      const sessionResponse = await fetch('https://api.inworld.ai/v1/sessions:create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspace: `workspaces/${workspaceId}`,
          user: { name: `user_${Date.now()}` }
        })
      })

      const sessionData = await sessionResponse.json()
      this.sessionId = sessionData.session?.name
      this.sessionInfo = sessionData.session

      console.log('[Inworld] Session created:', this.sessionId)

      // Conectar WebSocket
      const wsUrl = sessionData.session?.websocketUri
      if (!wsUrl) {
        throw new Error('No WebSocket URI in session response')
      }

      this.connectWebSocket(wsUrl)
      return this.sessionId
    } catch (err) {
      console.error('[Inworld] Error starting session:', err)
      throw err
    }
  }

  /**
   * Conectar WebSocket
   */
  connectWebSocket(wsUrl) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('[Inworld] WebSocket connected')
          this.isConnected = true
          resolve(true)
        }

        this.ws.onmessage = (event) => {
          this.handleInworldMessage(event.data)
        }

        this.ws.onerror = (err) => {
          console.error('[Inworld] WebSocket error:', err)
          reject(err)
        }

        this.ws.onclose = () => {
          console.log('[Inworld] WebSocket closed')
          this.isConnected = false
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Manejar mensajes de Inworld
   */
  handleInworldMessage(data) {
    try {
      const message = JSON.parse(data)

      // Manejar diferentes tipos de mensajes
      if (message.audioChunk) {
        // Audio response
        this.audioQueue.push(message.audioChunk)
        this.processAudioQueue()
      } else if (message.text) {
        // Text response
        console.log('[Inworld] Response:', message.text)
        // Emitir evento para UI
        window.dispatchEvent(new CustomEvent('inworld-response', {
          detail: { text: message.text, type: 'text' }
        }))
      } else if (message.character) {
        // Character action
        console.log('[Inworld] Character action:', message.character)
      }
    } catch (err) {
      console.error('[Inworld] Error parsing message:', err)
    }
  }

  /**
   * Procesar cola de audio y reproducirlo
   */
  processAudioQueue() {
    if (this.isProcessingAudio || this.audioQueue.length === 0) return

    this.isProcessingAudio = true

    const audioChunk = this.audioQueue.shift()
    const audioElement = new Audio(`data:audio/wav;base64,${audioChunk}`)

    audioElement.onended = () => {
      this.isProcessingAudio = false
      if (this.audioQueue.length > 0) {
        this.processAudioQueue()
      } else {
        // Emitir evento cuando termina
        window.dispatchEvent(new CustomEvent('inworld-audio-complete'))
      }
    }

    audioElement.play()
  }

  /**
   * Enviar mensaje de texto a Inworld
   */
  sendMessage(text) {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected')
    }

    const message = {
      text: {
        text: text,
        finalResponse: true
      }
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * Enviar audio (para entrada de micrófono)
   */
  sendAudio(audioBase64) {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected')
    }

    const message = {
      audioChunk: {
        chunk: audioBase64
      }
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * Cerrar sesión
   */
  closeSession() {
    if (this.ws) {
      this.ws.close()
      this.isConnected = false
      this.sessionId = null
    }
  }

  /**
   * Verificar si está conectado
   */
  isSessionActive() {
    return this.isConnected && this.sessionId !== null
  }
}

export const inworldRealtimeService = new InworldRealtimeService()
export default inworldRealtimeService
