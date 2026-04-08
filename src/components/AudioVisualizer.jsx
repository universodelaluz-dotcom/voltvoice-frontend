import { useEffect, useRef } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)

  const detectedPlayingRef = useRef(false)
  const externalEnergyRef = useRef(0)
  const recentKickTsRef = useRef(0)
  const valuesRef = useRef([])

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
      externalEnergyRef.current = Math.max(externalEnergyRef.current, normalized)
      recentKickTsRef.current = Date.now()
    }

    window.addEventListener('voltvoice:visualizer-kick', handleKick)
    return () => window.removeEventListener('voltvoice:visualizer-kick', handleKick)
  }, [])

  useEffect(() => {
    const check = () => {
      const htmlAudioPlaying = Boolean(audioElement && !audioElement.paused && !audioElement.ended)
      const speechPlaying = Boolean(typeof window !== 'undefined' && window.speechSynthesis?.speaking)
      detectedPlayingRef.current = htmlAudioPlaying || speechPlaying
    }

    check()
    const id = setInterval(check, 110)
    return () => clearInterval(id)
  }, [audioElement])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const points = 150
    if (!valuesRef.current.length) {
      valuesRef.current = new Array(points).fill(0)
    }

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const midY = H / 2

      const analyser = analyserRef.current
      const kickedRecently = Date.now() - recentKickTsRef.current < 260
      const active = Boolean(isPlaying || detectedPlayingRef.current || kickedRecently || externalEnergyRef.current > 0.08)

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

        const gain = Math.max(1.8, Math.min(9.5, 0.2 / Math.max(rms, 0.0009)))
        energy = Math.max(energy, Math.min(1, spectral * 1.4))

        for (let i = 0; i < points; i++) {
          const idx = Math.min(time.length - 1, Math.floor((i / points) * time.length))
          signal[i] = time[idx] * gain
        }

        // Si el analizador viene en silencio (típico en voces locales),
        // forzar retumbe sintético usando energía externa/kicks.
        if (rms < 0.0025) {
          const kick = Math.max(energy, externalEnergyRef.current, 0.35)
          const now = performance.now()
          for (let i = 0; i < points; i++) {
            const wave =
              Math.sin(i * 0.18 + now * 0.013) * 0.7 +
              Math.sin(i * 0.07 + now * 0.009) * 0.3
            signal[i] = wave * 0.9 * kick
          }
          energy = Math.max(energy, kick)
        }
      } else {
        for (let i = 0; i < points; i++) {
          signal[i] = (Math.random() * 2 - 1) * 0.15
        }
        energy = Math.max(energy, 0.08)
      }

      externalEnergyRef.current = Math.max(0, externalEnergyRef.current * 0.93)

      const amp = active ? (16 + energy * 46) : 3.8
      const smooth = active ? 0.28 : 0.16

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      ctx.save()
      ctx.shadowBlur = 14
      ctx.shadowColor = '#00dcff'

      // Glow line
      ctx.beginPath()
      ctx.strokeStyle = `rgba(0,220,255,${0.34 + energy * 0.32})`
      ctx.lineWidth = 2.4 + energy * 1.8
      for (let i = 0; i < points; i++) {
        const prev = valuesRef.current[i] || 0
        const next = prev + (signal[i] - prev) * smooth
        valuesRef.current[i] = next
        const x = (i / (points - 1)) * W
        const y = midY + next * amp * 0.62
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Main static baseline that rumbles
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(190,245,255,0.98)'
      ctx.lineWidth = 1.5 + energy * 0.7
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
