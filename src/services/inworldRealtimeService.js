/**
 * Inworld Realtime WebRTC API Service
 * Handles WebRTC connection with Inworld for speech-to-speech interactions
 */

import chatStore from './chatStore.js'

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
    this.microphoneSender = null
    this.outputAudioElement = null
    this.remoteAudioStream = null
    this.sessionInstructions = 'You are a helpful voice assistant. Respond in Spanish. Keep responses concise.'
    this.sessionVoice = 'Clive'
    this.pendingAudioResponse = false
    this.pendingAudioResponseTimer = null
    this.pendingAudioComplete = false
    this.remoteAnalyser = null
    this.remoteSourceNode = null
    this.remoteAnalysisFrameId = null
    this.remoteSpeaking = false
    this.remoteSilenceFrames = 0
    this.remoteStartThreshold = 0.02
    this.remoteStopThreshold = 0.008
    this.remoteSilenceFrameTarget = 3
    this.transmissionComplete = false // Signal-based: switch silence threshold when transmission done
    this.SILENCE_THRESHOLD_NORMAL = 3 // During active transmission: 3 frames (allows inter-syllable gaps)
    this.SILENCE_THRESHOLD_POST_TX = 8 // After transmission complete: 8 frames (rejects inter-syllable gaps)
    this._assistantResponseState = {
      active: false,
      hasAudio: false,
      audioDone: false,
      responseDone: false
    }
  }

  _beginAssistantResponse() {
    this._assistantResponseState = {
      active: true,
      hasAudio: false,
      audioDone: false,
      responseDone: false
    }
    this.transmissionComplete = false
    this.remoteSilenceFrameTarget = this.SILENCE_THRESHOLD_NORMAL
    this._emit('assistant-response-start')
  }

  _markAssistantResponseHasAudio() {
    if (!this._assistantResponseState.active) return
    this._assistantResponseState.hasAudio = true
  }

  _markAssistantResponseAudioDone() {
    if (!this._assistantResponseState.active) return
    this._assistantResponseState.audioDone = true
    this.transmissionComplete = true
    this.remoteSilenceFrameTarget = this.SILENCE_THRESHOLD_POST_TX
    console.log('[Inworld] Transmission complete - switching to stricter silence detection (', this.SILENCE_THRESHOLD_POST_TX, 'frames)')
    this._maybeCompleteAssistantResponse()
  }

  _markAssistantResponseDone() {
    if (!this._assistantResponseState.active) return
    this._assistantResponseState.responseDone = true
    this._maybeCompleteAssistantResponse()
  }

  _maybeCompleteAssistantResponse() {
    const s = this._assistantResponseState
    if (!s.active) return
    if (!s.responseDone) return
    if (s.hasAudio && !s.audioDone) return
    this._assistantResponseState = {
      active: false,
      hasAudio: false,
      audioDone: false,
      responseDone: false
    }
    this._emit('assistant-response-end')
  }

  _isSupportedRealtimeVoice(voiceId = '') {
    const normalized = String(voiceId || '').trim()
    if (!normalized) {
      return false
    }

    // Inworld realtime accepts Inworld voice names/ids, not Google fallback voices like es-ES.
    if (/^[a-z]{2}-[A-Z]{2}$/.test(normalized)) {
      return false
    }

    return true
  }

  _normalizeApiUrl(apiUrl = '') {
    if (!apiUrl || apiUrl.startsWith('http://') || apiUrl.startsWith('https://') || apiUrl.startsWith('/')) {
      return apiUrl
    }

    console.warn('[Inworld] Ignoring invalid apiUrl value, falling back to relative backend path')
    return ''
  }

  _getAuthorizationHeader(apiKey = '') {
    const normalizedKey = apiKey.replace(/^(Basic|Bearer)\s+/i, '').trim()

    if (!normalizedKey) {
      throw new Error('No Inworld API key available - check backend config endpoint')
    }

    return `Bearer ${normalizedKey}`
  }

  _ensureOutputAudioElement() {
    if (this.outputAudioElement) {
      return this.outputAudioElement
    }

    const audioElement = document.createElement('audio')
    audioElement.autoplay = true
    audioElement.playsInline = true
    audioElement.style.display = 'none'
    document.body.appendChild(audioElement)

    audioElement.onplay = () => {
      console.log('[Inworld] Audio playing')
      this._emit('audio-started')
    }

    audioElement.onended = () => {
      console.log('[Inworld] Audio ended')
      this._emit('audio-complete')
      this._emit('audio-playback-ended')
    }

    audioElement.onpause = () => {
      console.log('[Inworld] Audio paused')
      this._emit('audio-playback-ended')
    }

    audioElement.onerror = (err) => {
      console.error('[Inworld] Audio error:', err)
      this._emit('error', err)
    }

    this.outputAudioElement = audioElement
    return audioElement
  }

  _sendResponseCreate(overrides = {}) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready for response request')
    }

    const payload = {
      type: 'response.create',
      response: {
        output_modalities: ['audio', 'text'],
        ...overrides
      }
    }

    this.dataChannel.send(JSON.stringify(payload))
    console.log('[Inworld] Response requested')
  }

  _setRemoteSpeaking(isSpeaking, rms = 0) {
    if (this.remoteSpeaking === isSpeaking) {
      return
    }
    this.remoteSpeaking = isSpeaking
    if (isSpeaking) {
      console.log('[RMS] SPEAKING detected, RMS:', rms.toFixed(4))
      this._emit('audio-energy-speaking', { rms })
    } else {
      console.log('[RMS] SILENT detected, RMS:', rms.toFixed(4))
      this._emit('audio-energy-silent', { rms })
    }
  }

  _stopRemoteAudioEnergyMonitor() {
    if (this.remoteAnalysisFrameId) {
      cancelAnimationFrame(this.remoteAnalysisFrameId)
      this.remoteAnalysisFrameId = null
    }

    if (this.remoteSourceNode) {
      try { this.remoteSourceNode.disconnect() } catch (error) { /* noop */ }
      this.remoteSourceNode = null
    }

    if (this.remoteAnalyser) {
      try { this.remoteAnalyser.disconnect() } catch (error) { /* noop */ }
      this.remoteAnalyser = null
    }

    this.remoteSilenceFrames = 0
    this._setRemoteSpeaking(false, 0)
  }

  _startRemoteAudioEnergyMonitor(audioElement, fallbackStream) {
    if (!this.audioContext || (!audioElement && !fallbackStream)) {
      return
    }

    this._stopRemoteAudioEnergyMonitor()

    try {
      const analyzedStream = (audioElement && typeof audioElement.captureStream === 'function')
        ? audioElement.captureStream()
        : fallbackStream

      if (!analyzedStream) {
        return
      }

      this.remoteSourceNode = this.audioContext.createMediaStreamSource(analyzedStream)
      this.remoteAnalyser = this.audioContext.createAnalyser()
      this.remoteAnalyser.fftSize = 8192
      this.remoteSourceNode.connect(this.remoteAnalyser)
      this.remoteSilenceFrames = 0

      const samples = new Float32Array(this.remoteAnalyser.fftSize)
      const tick = () => {
        if (!this.remoteAnalyser) {
          return
        }

        this.remoteAnalyser.getFloatTimeDomainData(samples)
        let sum = 0
        for (let i = 0; i < samples.length; i++) {
          sum += samples[i] * samples[i]
        }
        const rms = Math.sqrt(sum / samples.length)

        if (rms >= this.remoteStartThreshold) {
          this.remoteSilenceFrames = 0
          this._setRemoteSpeaking(true, rms)
        } else {
          if (this.remoteSpeaking && rms <= this.remoteStopThreshold) {
            this.remoteSilenceFrames += 1
            if (this.remoteSilenceFrames >= this.remoteSilenceFrameTarget) {
              console.log('[RMS-ANALYSIS] FIRING SILENT EVENT: frames=', this.remoteSilenceFrames, 'threshold=', this.remoteSilenceFrameTarget, 'txComplete=', this.transmissionComplete)
              this._setRemoteSpeaking(false, rms)
            }
          } else {
            this.remoteSilenceFrames = 0
          }
        }

        this.remoteAnalysisFrameId = requestAnimationFrame(tick)
      }

      this.audioContext.resume().catch(() => {})
      this.remoteAnalysisFrameId = requestAnimationFrame(tick)
    } catch (error) {
      console.warn('[Inworld] Remote audio energy monitor unavailable:', error?.message || error)
    }
  }

  /**
   * Fetch config from backend (API key + ICE servers)
   */
  async getConfig(apiUrl = '') {
    try {
      const normalizedApiUrl = this._normalizeApiUrl(apiUrl)
      const configUrl = normalizedApiUrl ? `${normalizedApiUrl}/api/inworld/config` : '/api/inworld/config'
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
  async startSession(characterId, systemPrompt, workspaceId, apiUrl = '', voiceId = null) {
    try {
      this.sessionInstructions = systemPrompt?.trim() || this.sessionInstructions
      this.sessionVoice = this._isSupportedRealtimeVoice(voiceId) ? voiceId.trim() : 'Clive'

      if (this.peerConnection && this.dataChannelReady && this.sessionId) {
        return this.sessionId
      }

      if (this.peerConnection && !this.dataChannelReady) {
        await this.waitForDataChannel(5000)
        if (this.sessionId) {
          return this.sessionId
        }
      }

      const normalizedApiUrl = this._normalizeApiUrl(apiUrl)

      // Fetch config from backend (includes API key + ICE servers)
      if (!this.config) {
        await this.getConfig(normalizedApiUrl)
      }

      const authHeader = this._getAuthorizationHeader(this.config?.api_key)

      // Create RTCPeerConnection with ICE servers from config
      const iceServers = this.config.ice_servers || [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
      ]

      this.peerConnection = new RTCPeerConnection({ iceServers })

      // Create audio context for audio processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Register connection handlers before signaling so we do not miss early RTP tracks.
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

      this.peerConnection.ontrack = (event) => {
        console.log('[Inworld] Audio track received:', event.track.kind, 'readyState:', event.track.readyState)
        if (event.track.kind === 'audio') {
          const audioElement = this._ensureOutputAudioElement()
          if (!this.remoteAudioStream) {
            this.remoteAudioStream = new MediaStream()
            audioElement.srcObject = this.remoteAudioStream
          }

          this.remoteAudioStream.addTrack(event.track)

          // Monitor track state changes (silent monitoring - only log if track ends)
          const stateCheckInterval = setInterval(() => {
            if (event.track.readyState === 'ended') {
              clearInterval(stateCheckInterval)
              console.log('[Track State] TRACK ENDED - audio should be done')
            }
          }, 500)

          this._startRemoteAudioEnergyMonitor(audioElement, this.remoteAudioStream)
          event.track.onunmute = () => {
            console.log('[Inworld] Audio track unmuted')
            this._emit('audio-track-unmuted')
          }
          event.track.onmute = () => {
            console.log('[Inworld] Audio track muted')
            this._emit('audio-track-muted')
            this._emit('audio-playback-ended')
          }
          event.track.onended = () => {
            clearInterval(stateCheckInterval)
            console.log('[Inworld] Audio track ended (WebRTC stream stopped)')
            this.remoteAudioStream?.removeTrack(event.track)
            this._emit('audio-complete')
            this._emit('audio-track-muted')
            this._emit('audio-playback-ended')
          }

          audioElement.play().catch((err) => {
            console.warn('[Inworld] Remote audio autoplay blocked, will retry on next user gesture:', err.message)
          })
        }
      }

      // IMPORTANT: Create data channel BEFORE creating offer
      this.dataChannel = this.peerConnection.createDataChannel('oai-events', { ordered: true })
      this._setupDataChannel()
      console.log('[Inworld] Data channel created (before offer)')

      // Reserve an audio sender so push-to-talk can attach tracks later without renegotiating.
      const audioTransceiver = this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' })
      this.microphoneSender = audioTransceiver.sender

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
        let firstCandidateSeen = false
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

        const originalOnIceCandidate = this.peerConnection.onicecandidate
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[Inworld] New ICE candidate:', event.candidate)
            if (!firstCandidateSeen) {
              firstCandidateSeen = true
              setTimeout(() => {
                if (!completed && this.peerConnection?.iceGatheringState !== 'complete') {
                  console.log('[Inworld] Proceeding after first ICE candidate')
                  done()
                }
              }, 350)
            }
          }

          if (typeof originalOnIceCandidate === 'function') {
            originalOnIceCandidate(event)
          }
        }

        // Safety timeout - don't wait forever
        const timeoutId = setTimeout(() => {
          console.warn('[Inworld] ICE gathering timeout, proceeding with current SDP')
          done()
        }, 1500)

        // Store timeout ID to clear if done early
        this._iceTimeout = timeoutId
      })

      console.log('[Inworld] Final SDP size:', this.peerConnection.localDescription.sdp.length, 'bytes')
      console.log('[Inworld] SDP preview:', this.peerConnection.localDescription.sdp.substring(0, 200))

      // Send offer to Inworld - IMPORTANT: Content-Type is application/sdp, body is raw SDP text
      // Use Bearer token with base64-encoded API key from portal
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          'Authorization': authHeader
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

      // Send session configuration - REQUIRED for Realtime API
      try {
        const sessionConfig = {
          type: 'session.update',
          session: {
            type: 'realtime',
            model: 'openai/gpt-4o-mini',
            instructions: this.sessionInstructions,
            output_modalities: ['audio', 'text'],
            audio: {
              input: {
                turn_detection: {
                  type: 'semantic_vad',
                  eagerness: 'medium',
                  create_response: false,
                  interrupt_response: true
                }
              },
              output: {
                voice: this.sessionVoice,
                model: 'inworld-tts-1.5-mini'
              }
            },
            tools: []
          }
        }
        this.dataChannel.send(JSON.stringify(sessionConfig))
        console.log('[Inworld] Session config sent with model:', sessionConfig.session.model, 'voice:', this.sessionVoice, 'tools:', sessionConfig.session.tools.length)
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
      const startedAt = Date.now()

      const checkReady = () => {
        if (this.dataChannel?.readyState === 'open' || this.dataChannelReady) {
          this.dataChannelReady = true
          resolve()
          return
        }

        if (Date.now() - startedAt >= timeout) {
          reject(new Error('Data channel did not open in time'))
          return
        }

        setTimeout(checkReady, 100)
      }

      checkReady()
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
        this._beginAssistantResponse()
        this._emit('response-created', event)
        break

      case 'response.output_item.added':
        if (event.item?.type === 'function_call') {
          this._pendingToolCall = {
            callId: event.item.call_id || event.call_id,
            name: event.item.name || event.name,
            args: ''
          }
          console.log('[Inworld] Tool call started:', this._pendingToolCall.name, this._pendingToolCall.callId)
        }
        break

      case 'response.done':
        console.log('[Inworld] Response done - Full event:')
        console.log('[Inworld] Status:', event.response?.status)
        console.log('[Inworld] Status details:', event.response?.status_details)
        console.log('[Inworld] Output:', event.response?.output)
        if (event.response?.status === 'failed') {
          console.error('[Inworld] Response failed:', JSON.stringify(event).substring(0, 500))
        }
        this._markAssistantResponseDone()
        this._emit('response-complete', event)
        break

      // Audio output events
      case 'response.output_audio.delta':
        if (event.delta) {
          this._markAssistantResponseHasAudio()
          this._emit('response-audio-activity', event)
          this.audioQueue.push(event.delta)
          this._processAudioQueue()
        }
        break

      case 'response.output_audio.done':
        console.log('[Inworld] Audio response complete')
        this._markAssistantResponseHasAudio()
        this._markAssistantResponseAudioDone()
        this._emit('response-audio-done', event)
        this.pendingAudioComplete = true
        this._maybeEmitAudioComplete()
        break

      case 'response.output_audio_transcript.delta':
        if (event.delta) {
          this._markAssistantResponseHasAudio()
          console.log('[Inworld] Audio transcript delta:', event.delta)
          this._emit('response-audio-activity', event)
          this._emit('text-delta', { text: event.delta })
        }
        break

      // Text output events
      case 'response.output_text.delta':
        if (event.delta) {
          console.log('[Inworld] Text delta:', event.delta)
          this._emit('text-delta', { text: event.delta })
        }
        break

      case 'response.output_text.done':
        console.log('[Inworld] Text done event received:', event.text ? `"${event.text}"` : 'NO TEXT')
        if (event.text) {
          console.log('[Inworld] Text response:', event.text)
          this._emit('text-response', { text: event.text })
        } else {
          console.warn('[Inworld] Text done event had no text content - NOT emitting text-response')
        }
        break

      case 'response.output_audio_transcript.done':
        console.log('[Inworld] Audio transcript done event received:', event.transcript ? `"${event.transcript}"` : 'NO TRANSCRIPT')
        if (event.transcript) {
          console.log('[Inworld] Audio transcript:', event.transcript)
          this._emit('text-response', { text: event.transcript })
        } else {
          console.warn('[Inworld] Audio transcript event had no transcript - NOT emitting text-response')
        }
        break

      case 'conversation.item.input_audio_transcription.delta':
        if (event.delta) {
          console.log('[Inworld] Input transcription delta:', event.delta)
          this._emit('input-transcript-delta', { text: event.delta })
        }
        break

      case 'conversation.item.input_audio_transcription.completed':
        console.log('[Inworld] Input transcription complete:', event.transcript)
        this._emit('input-transcript-complete', { text: event.transcript, itemId: event.item_id })
        if (this.pendingAudioResponse) {
          clearTimeout(this.pendingAudioResponseTimer)
          this.pendingAudioResponseTimer = null
          this.pendingAudioResponse = false
          setTimeout(() => {
            try {
              this._sendResponseCreate()
            } catch (error) {
              console.error('[Inworld] Delayed response request failed:', error)
              this._emit('error', error)
            }
          }, 250)
        }
        break

      // Tool call events (function calling)
      case 'response.function_call_arguments.delta':
        // Accumulate function call arguments
        if (!this._pendingToolCall) {
          this._pendingToolCall = { callId: event.call_id, name: event.name, args: '' }
        }
        if (event.call_id && !this._pendingToolCall.callId) {
          this._pendingToolCall.callId = event.call_id
        }
        if (event.name && !this._pendingToolCall.name) {
          this._pendingToolCall.name = event.name
        }
        if (event.delta) {
          this._pendingToolCall.args += event.delta
        }
        break

      case 'response.function_call_arguments.done':
        console.log('[Inworld] Tool call complete:', event.name, event.arguments)
        this._executeToolCall(
          event.call_id || this._pendingToolCall?.callId,
          event.name || this._pendingToolCall?.name,
          event.arguments || this._pendingToolCall?.args || '{}'
        )
        this._pendingToolCall = null
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

      case 'input_audio_buffer.speech_started':
        console.log('[Inworld] Speech started')
        break

      case 'input_audio_buffer.speech_stopped':
        console.log('[Inworld] Speech stopped')
        break

      case 'input_audio_buffer.committed':
        console.log('[Inworld] Input audio committed:', event.item_id)
        this._emit('input-audio-committed', { itemId: event.item_id })
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
        } else {
          this._maybeEmitAudioComplete()
        }
      }

      audioElement.onerror = (err) => {
        console.error('[Inworld] Audio playback error:', err)
        this.isPlayingAudio = false
        if (this.audioQueue.length > 0) {
          this._processAudioQueue()
        } else {
          this._maybeEmitAudioComplete()
        }
      }

      audioElement.play().catch(err => {
        console.error('[Inworld] Error playing audio:', err)
        this.isPlayingAudio = false
        if (this.audioQueue.length > 0) {
          this._processAudioQueue()
        } else {
          this._maybeEmitAudioComplete()
        }
      })
    } catch (err) {
      console.error('[Inworld] Error processing audio:', err)
      this.isPlayingAudio = false
      if (this.audioQueue.length > 0) {
        this._processAudioQueue()
      } else {
        this._maybeEmitAudioComplete()
      }
    }
  }

  _maybeEmitAudioComplete() {
    if (this.pendingAudioComplete && !this.isPlayingAudio && this.audioQueue.length === 0) {
      this.pendingAudioComplete = false
      this._emit('audio-complete')
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
            content: [
              {
                type: 'input_text',
                text
              }
            ]
          }
        }

        this.dataChannel.send(JSON.stringify(event))
        console.log('[Inworld] Message sent:', text.substring(0, 50))

        // Request response
        this._sendResponseCreate()
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
      const [track] = stream.getAudioTracks()
      if (!track) {
        console.warn('[Inworld] No audio track found in stream')
        return
      }

      if (this.microphoneSender) {
        this.microphoneSender.replaceTrack(track)
        this.audioTracks = [{ track, sender: this.microphoneSender }]
        console.log('[Inworld] Audio track attached to reserved sender')
        return
      }

      const sender = this.peerConnection.addTrack(track, stream)
      this.audioTracks = [{ track, sender }]
      console.log('[Inworld] Audio track added to connection')
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
        if (sender === this.microphoneSender) {
          await this.microphoneSender.replaceTrack(null)
        } else if (sender && this.peerConnection) {
          this.peerConnection.removeTrack(sender)
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
        type: 'input_audio_buffer.commit'
      }))
      console.log('[Inworld] Audio buffer commit requested')

      this.pendingAudioResponse = true
      console.log('[Inworld] Queued audio response request')
      clearTimeout(this.pendingAudioResponseTimer)
      this.pendingAudioResponseTimer = setTimeout(() => {
        if (!this.pendingAudioResponse) {
          return
        }

        console.warn('[Inworld] Audio transcription did not complete in time')
        this.pendingAudioResponse = false
        this.pendingAudioResponseTimer = null
        this._emit('error', { message: 'No se pudo finalizar la transcripcion del audio a tiempo.' })
      }, 7000)
    } catch (err) {
      console.error('[Inworld] Error requesting response:', err)
      throw err
    }
  }

  /**
   * Get tool definitions for Inworld session
   */
  _getToolDefinitions() {
    return [
      {
        type: 'function',
        name: 'read_chat',
        description: 'Lee los mensajes recientes del chat de TikTok. Usa esto cuando el streamer pregunte sobre el chat, quién dijo algo, o qué están diciendo.',
        parameters: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Cantidad de mensajes a leer (default 20, max 50)' }
          }
        }
      },
      {
        type: 'function',
        name: 'search_chat',
        description: 'Busca mensajes en el chat que contengan una palabra o frase específica.',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string', description: 'Palabra o frase a buscar en el chat' },
            count: { type: 'number', description: 'Cantidad máxima de resultados (default 10)' }
          },
          required: ['keyword']
        }
      },
      {
        type: 'function',
        name: 'get_questions',
        description: 'Obtiene las preguntas recientes del chat (mensajes con signos de interrogación o palabras interrogativas).',
        parameters: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Cantidad de preguntas a obtener (default 10)' }
          }
        }
      },
      {
        type: 'function',
        name: 'get_user_messages',
        description: 'Obtiene los mensajes de un usuario específico del chat.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Nombre de usuario de TikTok' },
            count: { type: 'number', description: 'Cantidad de mensajes (default 10)' }
          },
          required: ['username']
        }
      },
      {
        type: 'function',
        name: 'get_chat_stats',
        description: 'Obtiene estadísticas del chat: total de mensajes, usuarios activos, baneados, etc.',
        parameters: {
          type: 'object',
          properties: {
            include_banned: {
              type: 'boolean',
              description: 'Si es true, incluye usuarios baneados en el resumen de estadisticas.'
            }
          },
          additionalProperties: false
        }
      },
      {
        type: 'function',
        name: 'get_active_users',
        description: 'Obtiene la lista de usuarios más activos en el chat en los últimos minutos.',
        parameters: {
          type: 'object',
          properties: {
            minutes: { type: 'number', description: 'Ventana de tiempo en minutos (default 5)' }
          }
        }
      },
      {
        type: 'function',
        name: 'ban_user',
        description: 'Banea a un usuario del chat de TikTok. El usuario no podrá ser leído por el TTS.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Nombre de usuario a banear' }
          },
          required: ['username']
        }
      },
      {
        type: 'function',
        name: 'unban_user',
        description: 'Desbanea a un usuario previamente baneado del chat.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Nombre de usuario a desbanear' }
          },
          required: ['username']
        }
      },
      {
        type: 'function',
        name: 'highlight_user',
        description: 'Resalta los mensajes de un usuario en el chat con un color específico para que destaquen visualmente.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Nombre de usuario a resaltar' },
            color: { type: 'string', description: 'Color hexadecimal (default #06b6d4). Opciones: #06b6d4 cyan, #a855f7 morado, #f59e0b dorado, #ef4444 rojo, #22c55e verde, #ec4899 rosa' }
          },
          required: ['username']
        }
      },
      {
        type: 'function',
        name: 'remove_highlight',
        description: 'Remueve el resaltado de un usuario en el chat.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Nombre de usuario' }
          },
          required: ['username']
        }
      },
      {
        type: 'function',
        name: 'set_nickname',
        description: 'Cambia el apodo/nickname con el que se lee un usuario en el TTS. Útil para nombres difíciles de pronunciar.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Nombre de usuario original de TikTok' },
            nickname: { type: 'string', description: 'Nuevo apodo para el TTS' }
          },
          required: ['username', 'nickname']
        }
      }
    ]
  }

  /**
   * Execute a tool call from Inworld and return the result
   */
  async _executeToolCall(callId, name, argsString) {
    let args = {}
    try {
      args = JSON.parse(argsString)
    } catch (e) {
      console.error('[Inworld] Invalid tool call args:', argsString)
    }

    console.log('[Inworld] Executing tool:', name, args)
    let result = { error: 'Unknown tool' }

    try {
      switch (name) {
        case 'read_chat': {
          const count = Math.min(args.count || 20, 50)
          const msgs = chatStore.getRecentMessages(count)
          result = {
            messages: msgs.map(m => ({
              user: m.user,
              text: m.text,
              isQuestion: m.isQuestion,
              isModerator: m.isModerator,
              timeAgo: Math.round((Date.now() - m.timestamp) / 1000) + 's ago'
            })),
            total: msgs.length
          }
          break
        }

        case 'search_chat': {
          const msgs = chatStore.searchMessages(args.keyword, args.count || 10)
          result = {
            keyword: args.keyword,
            messages: msgs.map(m => ({ user: m.user, text: m.text })),
            total: msgs.length
          }
          break
        }

        case 'get_questions': {
          const questions = chatStore.getQuestions(args.count || 10)
          result = {
            questions: questions.map(m => ({ user: m.user, text: m.text })),
            total: questions.length
          }
          break
        }

        case 'get_user_messages': {
          const msgs = chatStore.getUserMessages(args.username, args.count || 10)
          result = {
            username: args.username,
            messages: msgs.map(m => ({ text: m.text, timeAgo: Math.round((Date.now() - m.timestamp) / 1000) + 's ago' })),
            total: msgs.length
          }
          break
        }

        case 'get_chat_stats':
          result = chatStore.getChatStats()
          break

        case 'get_active_users':
          result = { users: chatStore.getActiveUsers(args.minutes || 5) }
          break

        case 'ban_user':
          result = await chatStore.banUser(args.username)
          break

        case 'unban_user':
          result = await chatStore.unbanUser(args.username)
          break

        case 'highlight_user':
          result = chatStore.highlightUser(args.username, args.color || '#06b6d4')
          break

        case 'remove_highlight':
          result = chatStore.removeHighlight(args.username)
          break

        case 'set_nickname':
          result = await chatStore.setNickname(args.username, args.nickname)
          break

        default:
          result = { error: `Tool "${name}" not found` }
      }
    } catch (err) {
      console.error('[Inworld] Tool execution error:', err)
      result = { error: err.message }
    }

    console.log('[Inworld] Tool result:', name, result)

    // Send tool result back to Inworld
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      // Send function call output
      this.dataChannel.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(result)
        }
      }))

      // Request a new response so the bot speaks the result
      this._sendResponseCreate({
        instructions: 'Resume brevemente el resultado de la herramienta en espanol para el streamer. Da una confirmacion clara y corta de la accion o del hallazgo.'
      })
      console.log('[Inworld] Tool result sent back, requesting response')
    }

    // Emit event for UI
    this._emit('tool-executed', { name, args, result })
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
    this.microphoneSender = null
    this.isConnected = false
    this.dataChannelReady = false
    this.sessionId = null
    this.dataChannel = null
    this.audioQueue = []
    this.remoteAudioStream = null
    this.pendingAudioResponse = false
    clearTimeout(this.pendingAudioResponseTimer)
    this.pendingAudioResponseTimer = null
    this.sessionVoice = 'Clive'
    this.pendingAudioComplete = false
    this._stopRemoteAudioEnergyMonitor()

    if (this.outputAudioElement) {
      this.outputAudioElement.pause()
      this.outputAudioElement.srcObject = null
    }
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

  off(event, callback) {
    if (!this.eventCallbacks[event]) {
      return
    }

    this.eventCallbacks[event] = this.eventCallbacks[event].filter((cb) => cb !== callback)
  }

  async resumeOutputAudio() {
    const audioElement = this._ensureOutputAudioElement()
    await audioElement.play()
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
