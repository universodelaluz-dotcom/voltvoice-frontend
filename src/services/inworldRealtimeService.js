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

      // Wait for data channel to open
      this.peerConnection.ondatachannel = (event) => {
        console.log('[Inworld] Data channel received:', event.channel.label)
        if (event.channel.label === 'oai-events') {
          this.dataChannel = event.channel
          this._setupDataChannel()
        }
      }

      // Store session info
      this.sessionId = answerData.sessionId || `session_${Date.now()}`
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
      if (this.dataChannelResolve) {
        this.dataChannelResolve()
      }
      this._emit('channel-open')
    }

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('[Inworld] Received event:', message.type || 'unknown')
        this._handleInworldEvent(message)
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
    switch (event.type) {
      case 'response.output_audio.delta':
        // Audio chunk received
        if (event.delta) {
          this.audioQueue.push(event.delta)
          this._processAudioQueue()
        }
        break

      case 'response.output_audio.done':
        // Audio response complete
        console.log('[Inworld] Audio response complete')
        this._emit('audio-complete')
        break

      case 'conversation.item.created':
        // New conversation item
        console.log('[Inworld] Conversation item created')
        break

      case 'conversation.item.done':
        // Conversation item complete
        console.log('[Inworld] Conversation item done')
        this._emit('response-complete', event)
        break

      case 'response.text.done':
        // Text response complete
        if (event.text) {
          console.log('[Inworld] Text response:', event.text)
          this._emit('text-response', { text: event.text })
        }
        break

      case 'session.updated':
        // Session update
        console.log('[Inworld] Session updated')
        this._emit('session-updated', event)
        break

      case 'error':
        // Error event
        console.error('[Inworld] Error event:', event.error)
        this._emit('error', event.error)
        break

      default:
        console.log('[Inworld] Unknown event type:', event.type)
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
   * Send text message to Inworld
   */
  sendMessage(text) {
    if (!this.isConnected || !this.dataChannel) {
      throw new Error('WebRTC connection not established')
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

    // Request response
    this.dataChannel.send(JSON.stringify({
      type: 'response.create'
    }))
  }

  /**
   * Send audio data to Inworld
   */
  sendAudio(audioBase64) {
    if (!this.isConnected || !this.dataChannel) {
      throw new Error('WebRTC connection not established')
    }

    const event = {
      type: 'input_audio_buffer.append',
      audio: audioBase64
    }

    this.dataChannel.send(JSON.stringify(event))
  }

  /**
   * Commit audio input buffer
   */
  commitAudio() {
    if (!this.isConnected || !this.dataChannel) {
      throw new Error('WebRTC connection not established')
    }

    this.dataChannel.send(JSON.stringify({
      type: 'input_audio_buffer.commit'
    }))

    // Request response
    this.dataChannel.send(JSON.stringify({
      type: 'response.create'
    }))
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
