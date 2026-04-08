import { useEffect, useRef, useState } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const phaseRef = useRef(0)
  const [detectedPlaying, setDetectedPlaying] = useState(false)

  useEffect(() => {
    const target = audioElement
    if (!target) return

    let graph = target[AUDIO_GRAPH_SYMBOL]
    if (!graph || graph.audioCtx?.state === 'closed') {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.9

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
      if (graph.audioCtx.state === 'suspended') graph.audioCtx.resume().catch(() => {})
    }

    target.addEventListener('play', resume)
    target.addEventListener('canplay', resume)

    return () => {
      target.removeEventListener('play', resume)
      target.removeEventListener('canplay', resume)
    }
  }, [audioElement])

  useEffect(() => {
    const check = () => {
      const htmlAudioPlaying = Boolean(audioElement && !audioElement.paused && !audioElement.ended)
      const speechPlaying = Boolean(typeof window !== 'undefined' && window.speechSynthesis?.speaking)
      setDetectedPlaying(htmlAudioPlaying || speechPlaying)
    }

    check()
    const id = setInterval(check, 100)
    return () => clearInterval(id)
  }, [audioElement])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const midY = H / 2
      const active = Boolean(isPlaying || detectedPlaying)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      const analyser = analyserRef.current
      const points = 140
      const values = new Array(points).fill(0)

      if (active && analyser) {
        const time = new Float32Array(analyser.fftSize)
        const freq = new Uint8Array(analyser.frequencyBinCount)
        analyser.getFloatTimeDomainData(time)
        analyser.getByteFrequencyData(freq)

        let rms = 0
        let energy = 0
        for (let i = 0; i < time.length; i++) rms += time[i] * time[i]
        for (let i = 0; i < freq.length; i++) energy += freq[i]
        rms = Math.sqrt(rms / time.length)
        energy = (energy / freq.length) / 255

        const gain = Math.max(2.2, Math.min(10, 0.22 / Math.max(rms, 0.001)))
        const amp = 10 + energy * 26

        for (let i = 0; i < points; i++) {
          const idx = Math.min(time.length - 1, Math.floor((i / points) * time.length))
          const pulse = Math.sin(i * 0.14 + phaseRef.current * 1.1) * 0.08
          values[i] = (time[idx] * gain + pulse) * amp
        }
      } else {
        phaseRef.current += 0.02
        const amp = 6.5
        for (let i = 0; i < points; i++) {
          const t = i / points
          values[i] =
            (Math.sin((t * 11) + phaseRef.current) * 0.8 +
             Math.sin((t * 4.2) + phaseRef.current * 0.7) * 0.4) * amp
        }
      }

      ctx.save()
      ctx.shadowBlur = 16
      ctx.shadowColor = '#00dcff'

      ctx.beginPath()
      ctx.strokeStyle = 'rgba(0,220,255,0.42)'
      ctx.lineWidth = 2.2
      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * W
        const y = midY + values[i] * 0.65
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.beginPath()
      ctx.strokeStyle = 'rgba(190,245,255,0.95)'
      ctx.lineWidth = 1.25
      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * W
        const y = midY + values[i]
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()

      phaseRef.current += active ? 0.055 : 0.025
      animationRef.current = requestAnimationFrame(draw)
    }

    animationRef.current = requestAnimationFrame(draw)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, detectedPlaying])

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ background: '#000', height: 100, border: '1px solid rgba(34,211,238,0.2)' }}>
      <canvas ref={canvasRef} width={1200} height={200} className="w-full h-full" style={{ display: 'block' }} />
    </div>
  )
}
