import { useEffect, useRef } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

  const externalEnergyRef = useRef(0)
  const kickPulseRef = useRef(0)
  const recentKickTsRef = useRef(0)
  const lowRmsFramesRef = useRef(0)
  const valuesRef = useRef([])
  const profileRef = useRef([])

  useEffect(() => {
    const target = audioElement
    if (!target) return

    let graph = target[AUDIO_GRAPH_SYMBOL]
    if (!graph || graph.audioCtx?.state === 'closed') {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.88

      try {
        const source = audioCtx.createMediaElementSource(target)
        source.connect(analyser)
        analyser.connect(audioCtx.destination)
        graph = { audioCtx, analyser, source }
      } catch (_) {
        graph = { audioCtx, analyser, source: null }
      }

      target[AUDIO_GRAPH_SYMBOL] = graph
    }

    analyserRef.current = graph.analyser

    const resume = () => {
      if (graph.audioCtx.state === 'suspended') {
        graph.audioCtx.resume().catch(() => {})
      }
    }

    target.addEventListener('play', resume)
    target.addEventListener('canplay', resume)

    return () => {
      target.removeEventListener('play', resume)
      target.removeEventListener('canplay', resume)
    }
  }, [audioElement])

  useEffect(() => {
    const handleKick = (event) => {
      const level = Number(event?.detail?.level)
      const normalized = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0.45
      // Follow incoming energy in real time so movement matches speech rhythm.
      externalEnergyRef.current = normalized
      kickPulseRef.current = normalized
      recentKickTsRef.current = Date.now()
    }

    window.addEventListener('voltvoice:visualizer-kick', handleKick)
    return () => window.removeEventListener('voltvoice:visualizer-kick', handleKick)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const points = 150
    if (!valuesRef.current.length) {
      valuesRef.current = new Array(points).fill(0)
    }
    if (!profileRef.current.length) {
      profileRef.current = Array.from({ length: points }, () => (Math.random() * 2 - 1) * (0.2 + Math.random() * 0.7))
    }

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const midY = H / 2

      const analyser = analyserRef.current
      const kickedRecently = Date.now() - recentKickTsRef.current < 260
      const active = Boolean(isPlaying)

      let signal = new Array(points).fill(0)
      let energy = externalEnergyRef.current

      if (active && analyser) {
        const time = new Float32Array(analyser.fftSize)
        const freq = new Uint8Array(analyser.frequencyBinCount)
        analyser.getFloatTimeDomainData(time)
        analyser.getByteFrequencyData(freq)

        let rms = 0
        let fsum = 0
        for (let i = 0; i < time.length; i++) rms += time[i] * time[i]
        for (let i = 0; i < freq.length; i++) fsum += freq[i]
        rms = Math.sqrt(rms / time.length)
        const spectral = (fsum / freq.length) / 255

        energy = Math.max(energy, Math.min(1, spectral * 1.35))

        // Use frequency energy mapped to a fixed spatial profile.
        // This keeps the line static in place and only "rumbles" vertically.
        for (let i = 0; i < points; i++) {
          const bin = Math.min(freq.length - 1, Math.floor((i / points) * freq.length))
          const mag = (freq[bin] || 0) / 255
          const shape = profileRef.current[i] || 0
          signal[i] = shape * (0.18 + mag * 1.8)
        }

        if (rms < 0.0028) {
          lowRmsFramesRef.current += 1
        } else {
          lowRmsFramesRef.current = 0
        }

        // Local/basic voices may come flat from analyser: use fixed kick profile.
        if (lowRmsFramesRef.current > 1) {
          const kick = Math.max(energy, externalEnergyRef.current, kickPulseRef.current, 0.08)
          for (let i = 0; i < points; i++) {
            signal[i] = profileRef.current[i] * (0.1 + kick * 2.35)
          }
          energy = Math.max(energy, kick)
        }
      } else {
        for (let i = 0; i < points; i++) {
          signal[i] = profileRef.current[i] * 0.025
        }
        energy = 0.03
        lowRmsFramesRef.current = 0
        externalEnergyRef.current = 0
        kickPulseRef.current = 0
      }

      if (active || kickedRecently) {
        externalEnergyRef.current = Math.max(0, externalEnergyRef.current * 0.82)
        kickPulseRef.current = Math.max(0, kickPulseRef.current * 0.8)
      }

      const amp = active ? (14 + energy * 88 + kickPulseRef.current * 16) : 2.6
      const smooth = active ? 0.34 : 0.16

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      ctx.save()
      ctx.shadowBlur = 14
      ctx.shadowColor = '#00dcff'

      // Glow line
      ctx.beginPath()
      ctx.strokeStyle = `rgba(0,220,255,${0.32 + energy * 0.42})`
      ctx.lineWidth = 2.2 + energy * 2.4 + kickPulseRef.current * 1.15
      for (let i = 0; i < points; i++) {
        const prev = valuesRef.current[i] || 0
        const next = prev + (signal[i] - prev) * smooth
        valuesRef.current[i] = next
        const x = (i / (points - 1)) * W
        const y = midY + next * amp * 0.56
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Main baseline that rumbles vertically only
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(190,245,255,0.98)'
      ctx.lineWidth = 1.5 + energy * 1.15 + kickPulseRef.current * 0.55
      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * W
        const y = midY + valuesRef.current[i] * amp
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()

      animationRef.current = requestAnimationFrame(draw)
    }

    animationRef.current = requestAnimationFrame(draw)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ background: '#000', height: 100, border: '1px solid rgba(34,211,238,0.2)' }}>
      <canvas ref={canvasRef} width={1200} height={200} className="w-full h-full" style={{ display: 'block' }} />
    </div>
  )
}
