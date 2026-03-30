/**
 * Inworld Realtime WebRTC API Service
 * Handles WebRTC connection with Inworld for speech-to-speech interactions
 *
 * Requires:
 * - VITE_INWORLD_API_KEY in .env
 * - VITE_INWORLD_WORKSPACE_ID in .env
 */

export class InworldRealtimeService {
  constructor() {
    this.peerConnection = null
    this.sessionId = null
    this.dataChannel = null
    this.isConnected = false
    this.dataChannelReady = false
    this.dataChannelResolve = null
    this.audioContext = null
    this.mediaStream = null
    this.audioTracks = []  // Store audio tracks added to peer connection
    this.audioQueue = []
    this.isPlayingAudio = false
    this.eventCallbacks = {}
    this.config = null  // Store config from backend
  }

  /**
   * Fetch config from backend (API key + ICE servers)
   */
  async getConfig(apiUrl = '') {
    try {
      const configUrl = apiUrl ? `${apiUrl}/api/inworld/config` : '/api/inworld/config'
      console.log('[Inworld] Fetching config from:', configUrl)

      const response = await fetch(configUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`)
      }

      this.config = await response.json()
      console.log('[Inworld] Config loaded:', {
        hasApiKey: !!this.config.api_key,
        iceServers: this.config.ice_servers?.length || 0,
        url: this.config.url
      })

      return this.config
    } catch (err) {
      console.error('[Inworld] Error fetching config:', err)
      throw err
    }
  }

  /**
   * Start WebRTC session with Inworld
   */
  async startSession(characterId, systemPrompt, workspaceId, apiUrl = '') {
    try {
      // Fetch config from backend (includes API key + ICE servers)
      if (!this.config) {
        await this.getConfig(apiUrl)
      }

      if (!this.config || !this.config.api_key) {
        throw new Error('No Inworld API key available - check backend config endpoint')
      }

      // Create RTCPeerConnection with ICE servers from config
      const iceServers = this.config.ice_servers || [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
      ]

      this.peerConnection = new RTCPeerConnection({ iceServers })

      // Create audio context for audio processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // IMPORTANT: Create data channel BEFORE creating offer
      this.dataChannel = this.peerConnection.createDataChannel('oai-events', { ordered: true })
      this._setupDataChannel()
      console.log('[Inworld] Data channel created (before offer)')

      // Generate SDP offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // Wait for ICE gathering to complete
      console.log('[Inworld] ICE gathering state:', this.peerConnection.iceGatheringState)

      await new Promise((resolve, reject) => {
        // If already complete, resolve immediately
        if (this.peerConnection.iceGatheringState === 'complete') {
          console.log('[Inworld] ICE gathering already complete')
          resolve()
          return
        }

        let completed = false
        const done = () => {
          if (completed) return
          completed = true
          console.log('[Inworld] ICE gathering complete, SDP size:', this.peerConnection.localDescription?.sdp?.length || 0)
          resolve()
        }

        // Wait for ICE gathering state change to complete
        this.peerConnection.onicegatheringstatechange = () => {
          console.log('[Inworld] ICE gathering state changed to:', this.peerConnection.iceGatheringState)
          if (this.peerConnection.iceGatheringState === 'complete') {
            done()
          }
        }

        // Safety timeout - don't wait forever
        const timeoutId = setTimeout(() => {
          console.warn('[Inworld] ICE gathering timeout, proceeding with current SDP')
          done()
        }, 5000)

        // Store timeout ID to clear if done early
        this._iceTimeout = timeoutId
      })

      console.log('[Inworld] Final SDP size:', this.peerConnection.localDescription.sdp.length, 'bytes')
      console.log('[Inworld] SDP preview:', this.peerConnection.localDescription.sdp.substring(0, 200))

      // Send offer to Inworld - IMPORTANT: Content-Type is application/sdp, body is raw SDP text
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          'Authorization': `Bearer ${this.config.api_key}`
        },
        body: this.peerConnection.localDescription.sdp
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('[Inworld] API error:', response.status, errorData)
        throw new Error(`Inworld API error: ${response.status}`)
      }

      // Receive SDP answer as plain text
      const answerSdp = await response.text()
      console.log('[Inworld] Received SDP answer (', answerSdp.length, 'bytes)')

      // Set remote SDP answer
      const answer = {
        type: 'answer',
        sdp: answerSdp
      }
      await this.peerConnection.setRemoteDescription(answer)

      // Set up connection event handlers
      this.peerConnection.onconnectionstatechange = () => {
        console.log('[Inworld] Connection state:', this.peerConnection.connectionState)
        if (this.peerConnection.connectionState === 'connected') {
          this.isConnected = true
          this._emit('connected')
        } else if (this.peerConnection.connectionState === 'failed' ||
                   this.peerConnection.connectionState === 'disconnected') {
          this.isConnected = false
          this._emit('disconnected')
        }
      }

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[Inworld] New ICE candidate:', event.candidate)
        }
      }

      // Handle audio tracks from Inworld (RTP, not data channel)
      this.peerConnection.ontrack = (event) => {
        console.log('[Inworld] Audio track received:', event.track.kind)
        if (event.track.kind === 'audio') {
          // Create audio element and attach the track
          const audioElement = new Audio()
          audioElement.autoplay = true
          audioElement.srcObject = new MediaStream([event.track])

          // Log when audio plays/ends
          audioElement.onplay = () => {
            console.log('[Inworld] Audio playing')
            this._emit('audio-started')
          }

          audioElement.onended = () => {
            console.log('[Inworld] Audio ended')
            this._emit('audio-complete')
          }

          audioElement.onerror = (err) => {
            console.error('[Inworld] Audio error:', err)
          }
        }
      }

      // Store session info (generate ID if not provided)
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log('[Inworld] Session started:', this.sessionId)

      return this.sessionId
    } catch (err) {
      console.error('[Inworld] Error starting session:', err)
      throw err
    }
  }

  /**
   * Setup data channel event handlers
   */
  _setupDataChannel() {
    if (!this.dataChannel) {
      console.warn('[Inworld] No data channel to setup')
      return
    }

    this.dataChannel.onopen = () => {
      console.log('[Inworld] Data channel opened (state:', this.dataChannel.readyState, ')')
      this.isConnected = true
      this.dataChannelReady = true

      // Send initial session configuration
      try {
        const sessionConfig = {
          type: 'session.update',
          session: {
            type: 'realtime',
            model: 'openai/gpt-4o-mini',
            instructions: 'You are a helpful voice assistant',
            output_modalities: ['audio', 'text'],
            audio: {
              input: {
                turn_detection: {
                  type: 'semantic_vad',
                  eagerness: 'medium',
                  create_response: true,
                  interrupt_response: true
                }
              },
              output: {
                voice: 'Clive',
                model: 'inworld-tts-1.5-mini',
                speed: 1.0
              }
            }
          }
        }
        this.dataChannel.send(JSON.stringify(sessionConfig))
        console.log('[Inworld] Session config sent')
      } catch (err) {
        console.error('[Inworld] Error sending session config:', err)
      }

      // Larger delay to ensure channel is truly ready before resolving
      // WebRTC channels need time to transition to fully open state
      setTimeout(() => {
        if (this.dataChannelResolve) {
          this.dataChannelResolve()
        }
        this._emit('channel-open')
      }, 300)
    }

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message && message.type) {
          console.log('[Inworld] Received event:', message.type)
          this._handleInworldEvent(message)
        } else {
          console.warn('[Inworld] Received message without type:', message)
        }
      } catch (err) {
        console.error('[Inworld] Error parsing message:', err)
      }
    }

    this.dataChannel.onerror = (error) => {
      console.error('[Inworld] Data channel error:', error)
      this._emit('error', error)
    }

    this.dataChannel.onclose = () => {
      console.log('[Inworld] Data channel closed')
      this.isConnected = false
      this.dataChannelReady = false
      this._emit('channel-closed')
    }
  }

  /**
   * Wait for data channel to be ready
   */
  waitForDataChannel(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.dataChannelReady) {
        resolve()
        return
      }

      this.dataChannelResolve = resolve
      const timer = setTimeout(() => {
        reject(new Error('Data channel did not open in time'))
      }, timeout)

      // Fallback in case resolve is called before timer
      const originalResolve = resolve
      this.dataChannelResolve = () => {
        clearTimeout(timer)
        originalResolve()
      }
    })
  }

  /**
   * Handle incoming Inworld events
   */
  _handleInworldEvent(event) {
    if (!event || typeof event !== 'object') {
      console.warn('[Inworld] Invalid event:', event)
      return
    }

    switch (event.type) {
      // Session events
      case 'session.created':
        console.log('[Inworld] Session created')
        break

      case 'session.updated':
        console.log('[Inworld] Session updated')
        this._emit('session-updated', event)
        break

      // Response events
      case 'response.created':
        console.log('[Inworld] Response created')
        break

      case 'response.done':
        console.log('[Inworld] Response done')
        console.log('[Inworld] Full response event:', JSON.stringify(event).substring(0, 500))
        this._emit('response-complete', event)
        break

      // Audio output events
      case 'response.output_audio.delta':
        if (event.delta) {
          this.audioQueue.push(event.delta)
          this._processAudioQueue()
        }
        break

      case 'response.output_audio.done':
        console.log('[Inworld] Audio response complete')
        this._emit('audio-complete')
        break

      // Text output events
      case 'response.text.delta':
        if (event.delta) {
          console.log('[Inworld] Text delta:', event.delta)
        }
        break

      case 'response.text.done':
        if (event.text) {
          console.log('[Inworld] Text response:', event.text)
          this._emit('text-response', { text: event.text })
        }
        break

      // Conversation events
      case 'conversation.item.created':
        console.log('[Inworld] Conversation item created')
        break

      case 'conversation.item.added':
        console.log('[Inworld] Conversation item added')
        break

      case 'conversation.item.done':
        console.log('[Inworld] Conversation item done')
        break

      // Error handling - Inworld may send errors in various formats
      case 'error':
        try {
          let errorMsg = 'Unknown error from Inworld'

          // Try to extract error message from various possible formats
          if (!event.error) {
            // No error object, use generic message
          } else if (typeof event.error === 'string') {
            errorMsg = event.error
          } else if (typeof event.error === 'object') {
            // Try different possible error message properties
            errorMsg = event.error.message ||
                      event.error.text ||
                      event.error.description ||
                      JSON.stringify(event.error).substring(0, 100)
          }

          console.warn('[Inworld] Server error:', errorMsg)
          // Don't emit as fatal error - continue processing
        } catch (parseErr) {
          console.warn('[Inworld] Could not parse error event (non-fatal)')
          // Silently ignore - this is often informational
        }
        break

      default:
        // Log unknown events but don't fail
        console.debug('[Inworld] Unknown event type:', event.type)
    }
  }

  /**
   * Process and play audio queue
   */
  _processAudioQueue() {
    if (this.isPlayingAudio || this.audioQueue.length === 0) return

    this.isPlayingAudio = true
    const audioData = this.audioQueue.shift()

    try {
      // Decode base64 audio
      const binaryString = atob(audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Create audio element and play
      const audioBlob = new Blob([bytes], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audioElement = new Audio(audioUrl)

      audioElement.onended = () => {
        URL.revokeObjectURL(audioUrl)
        this.isPlayingAudio = false
        if (this.audioQueue.length > 0) {
          this._processAudioQueue()
        }
      }

      audioElement.onerror = (err) => {
        console.error('[Inworld] Audio playback error:', err)
        this.isPlayingAudio = false
        if (this.audioQueue.length > 0) {
          this._processAudioQueue()
        }
      }

      audioElement.play().catch(err => {
        console.error('[Inworld] Error playing audio:', err)
        this.isPlayingAudio = false
        if (this.audioQueue.length > 0) {
          this._processAudioQueue()
        }
      })
    } catch (err) {
      console.error('[Inworld] Error processing audio:', err)
      this.isPlayingAudio = false
      if (this.audioQueue.length > 0) {
        this._processAudioQueue()
      }
    }
  }

  /**
   * Send text message to Inworld (with retry logic)
   */
  async sendMessage(text) {
    const maxRetries = 3
    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Check if channel is ready
        if (!this.dataChannel || !['open', 'connecting'].includes(this.dataChannel.readyState)) {
          throw new Error(`Data channel state: ${this.dataChannel?.readyState || 'null'}`)
        }

        // If still connecting, wait a bit more
        if (this.dataChannel.readyState === 'connecting' && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        }

        const event = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: {
              content_type: 'text',
              text: text
            }
          }
        }

        this.dataChannel.send(JSON.stringify(event))
        console.log('[Inworld] Message sent:', text.substring(0, 50))

        // Request response
        this.dataChannel.send(JSON.stringify({
          type: 'response.create'
        }))
        console.log('[Inworld] Response requested')
        return // Success
      } catch (err) {
        lastError = err
        console.warn(`[Inworld] Send attempt ${attempt + 1}/${maxRetries} failed:`, err.message)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    console.error('[Inworld] Failed to send message after', maxRetries, 'attempts')
    throw lastError
  }

  /**
   * Send audio data to Inworld (with retry logic)
   */
  async sendAudio(audioBase64) {
    const maxRetries = 3
    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this.dataChannel || !['open', 'connecting'].includes(this.dataChannel.readyState)) {
          throw new Error(`Data channel state: ${this.dataChannel?.readyState || 'null'}`)
        }

        if (this.dataChannel.readyState === 'connecting' && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        }

        const event = {
          type: 'input_audio_buffer.append',
          audio: audioBase64
        }

        this.dataChannel.send(JSON.stringify(event))
        console.log('[Inworld] Audio sent:', audioBase64.length, 'bytes')
        return // Success
      } catch (err) {
        lastError = err
        console.warn(`[Inworld] Audio send attempt ${attempt + 1}/${maxRetries} failed:`, err.message)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    throw lastError
  }

  /**
   * Commit audio input buffer
   */
  async commitAudio() {
    const maxRetries = 3
    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this.dataChannel || !['open', 'connecting'].includes(this.dataChannel.readyState)) {
          throw new Error(`Data channel state: ${this.dataChannel?.readyState || 'null'}`)
        }

        if (this.dataChannel.readyState === 'connecting' && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        }

        this.dataChannel.send(JSON.stringify({
          type: 'input_audio_buffer.commit'
        }))
        console.log('[Inworld] Audio committed')

        // Request response
        this.dataChannel.send(JSON.stringify({
          type: 'response.create'
        }))
        console.log('[Inworld] Response requested')
        return // Success
      } catch (err) {
        lastError = err
        console.warn(`[Inworld] Commit attempt ${attempt + 1}/${maxRetries} failed:`, err.message)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    throw lastError
  }

  /**
   * Add audio tracks from microphone to WebRTC connection
   */
  addAudioTracks(stream) {
    if (!this.peerConnection || !stream) {
      console.error('[Inworld] Cannot add audio tracks - no peer connection or stream')
      return
    }

    try {
      stream.getAudioTracks().forEach(track => {
        const sender = this.peerConnection.addTrack(track, stream)
        this.audioTracks.push({ track, sender })
        console.log('[Inworld] Audio track added to connection')
      })
    } catch (err) {
      console.error('[Inworld] Error adding audio tracks:', err)
    }
  }

  /**
   * Remove audio tracks from WebRTC connection
   */
  async removeAudioTracks() {
    try {
      for (const { sender } of this.audioTracks) {
        if (sender && this.peerConnection) {
          await this.peerConnection.removeTrack(sender)
        }
      }
      this.audioTracks = []
      console.log('[Inworld] Audio tracks removed')
    } catch (err) {
      console.error('[Inworld] Error removing audio tracks:', err)
    }
  }

  /**
   * Request response from bot (for voice input)
   */
  async requestResponse() {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready for response request')
    }

    try {
      this.dataChannel.send(JSON.stringify({
        type: 'response.create'
      }))
      console.log('[Inworld] Response requested')
    } catch (err) {
      console.error('[Inworld] Error requesting response:', err)
      throw err
    }
  }

  /**
   * Close WebRTC session
   */
  closeSession() {
    if (this.dataChannel) {
      this.dataChannel.close()
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    this.audioTracks = []
    this.isConnected = false
    this.sessionId = null
    this.dataChannel = null
    this.audioQueue = []
  }

  /**
   * Check if session is active
   */
  isSessionActive() {
    return this.isConnected && this.sessionId !== null
  }

  /**
   * Register event callback
   */
  on(event, callback) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = []
    }
    this.eventCallbacks[event].push(callback)
  }

  /**
   * Emit event to listeners
   */
  _emit(event, data) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => {
        callback(data)
      })
    }
  }
}

export const inworldRealtimeService = new InworldRealtimeService()
export default inworldRealtimeService
