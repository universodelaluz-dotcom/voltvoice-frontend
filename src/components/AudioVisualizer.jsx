import { useEffect, useRef } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const smoothLineRef = useRef([])

  useEffect(() => {
    const target = audioElement
    if (!target) return

    const createGraph = () => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.5
      const g = { audioCtx, analyser, source: null, usedCaptureStream: false }
      target[AUDIO_GRAPH_SYMBOL] = g
      return g
    }

    const wireSource = (graph) => {
      if (!graph || graph.source) return
      try {
        let source = null
        let usedCaptureStream = false
        try {
          source = graph.audioCtx.createMediaElementSource(target)
        } catch (_) {
          const srcObject = target.srcObject
          if (srcObject && typeof graph.audioCtx.createMediaStreamSource === 'function') {
            source = graph.audioCtx.createMediaStreamSource(srcObject)
            usedCaptureStream = true
          }
          const stream = source ? null : (typeof target.captureStream === 'function' ? target.captureStream() : null)
          if (stream) {
            source = graph.audioCtx.createMediaStreamSource(stream)
            usedCaptureStream = true
          }
        }

        if (!source) return
        source.connect(graph.analyser)
        if (!usedCaptureStream) {
          graph.analyser.connect(graph.audioCtx.destination)
        }
        graph.source = source
        graph.usedCaptureStream = usedCaptureStream
      } catch (_) {
        // Keep silent and retry on next playback event.
      }
    }

    let graph = target[AUDIO_GRAPH_SYMBOL]
    if (!graph || graph.audioCtx?.state === 'closed') {
      graph = createGraph()
    }
    wireSource(graph)

    analyserRef.current = graph.analyser

    const resume = () => {
      if (graph.audioCtx.state === 'suspended') {
        graph.audioCtx.resume().catch(() => {})
      }
      // Retry wiring source when playback starts; fixes bot audio elements that get stream late.
      if (!graph.source) {
        wireSource(graph)
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
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const points = 170
    if (!smoothLineRef.current.length) {
      smoothLineRef.current = new Array(points).fill(0)
    }

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const midY = H / 2

      const analyser = analyserRef.current
      const active = Boolean(isPlaying)

      let signal = new Array(points).fill(0)
      let energy = 0

      if (active && analyser) {
        const time = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(time)

        let rms = 0
        for (let i = 0; i < time.length; i++) rms += time[i] * time[i]
        rms = Math.sqrt(rms / time.length)
        energy = Math.max(0, Math.min(1, (rms - 0.0018) * 52))

        for (let i = 0; i < points; i++) {
          const idx = Math.min(time.length - 1, Math.floor((i / points) * time.length))
          signal[i] = time[idx]
        }
      } else {
        energy = 0
      }

      const amp = active ? (12 + energy * 120) : 1.4
      const smooth = active ? 0.36 : 0.14

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      ctx.save()
      ctx.shadowBlur = 14
      ctx.shadowColor = '#00dcff'

      // Glow line
      ctx.beginPath()
      ctx.strokeStyle = `rgba(0,220,255,${0.26 + energy * 0.62})`
      ctx.lineWidth = 1.8 + energy * 2.2
      for (let i = 0; i < points; i++) {
        const prev = smoothLineRef.current[i] || 0
        const next = prev + (signal[i] - prev) * smooth
        smoothLineRef.current[i] = next
        const x = (i / (points - 1)) * W
        const y = midY + next * amp
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Main baseline that rumbles vertically only
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(190,245,255,0.98)'
      ctx.lineWidth = 1.35 + energy * 1.15
      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * W
        const y = midY + smoothLineRef.current[i] * amp
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
