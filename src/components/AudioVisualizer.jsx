import { useEffect, useRef, useState } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying, darkMode }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationIdRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const phaseRef = useRef(0)

  useEffect(() => {
    const targetAudio = audioElement
    if (!targetAudio) return

    let graph = targetAudio[AUDIO_GRAPH_SYMBOL]
    if (!graph || graph.audioCtx?.state === 'closed') {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.85

      try {
        const source = audioCtx.createMediaElementSource(targetAudio)
        source.connect(analyser)
        analyser.connect(audioCtx.destination)
        graph = { audioCtx, analyser, source, isReady: true }
      } catch (_) {
        graph = { audioCtx, analyser, source: null, isReady: false }
      }

      targetAudio[AUDIO_GRAPH_SYMBOL] = graph
    }

    audioCtxRef.current = graph.audioCtx
    analyserRef.current = graph.analyser
    sourceRef.current = graph.source
    setIsReady(Boolean(graph.isReady))

    const resumeCtx = () => {
      if (graph.audioCtx.state === 'suspended') {
        graph.audioCtx.resume().catch(() => {})
      }
    }
    targetAudio.addEventListener('play', resumeCtx)
    targetAudio.addEventListener('canplay', resumeCtx)

    return () => {
      targetAudio.removeEventListener('play', resumeCtx)
      targetAudio.removeEventListener('canplay', resumeCtx)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
    }
  }, [audioElement])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const drawIdle = () => {
      // Onda suave en reposo
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      phaseRef.current += 0.03

      ctx.save()
      ctx.shadowBlur = 18
      ctx.shadowColor = '#00e5ff'

      for (let layer = 0; layer < 3; layer++) {
        const amplitude = [4, 6, 3][layer]
        const freq = [0.012, 0.018, 0.009][layer]
        const alpha = [0.25, 0.15, 0.1][layer]

        ctx.beginPath()
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`
        ctx.lineWidth = 1.5

        for (let x = 0; x < W; x++) {
          const y = H / 2 + Math.sin(x * freq + phaseRef.current + layer * 1.5) * amplitude
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()

      animationIdRef.current = requestAnimationFrame(drawIdle)
    }

    const drawActive = () => {
      if (!analyserRef.current) {
        animationIdRef.current = requestAnimationFrame(drawActive)
        return
      }

      const analyser = analyserRef.current
      const bufferLength = analyser.fftSize
      const timeData = new Float32Array(bufferLength)
      const freqData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getFloatTimeDomainData(timeData)
      analyser.getByteFrequencyData(freqData)

      // Calcular energía para escalar la amplitud
      let energy = 0
      for (let i = 0; i < freqData.length; i++) energy += freqData[i]
      energy = energy / freqData.length / 255

      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      phaseRef.current += 0.04

      const centerY = H / 2
      const maxAmp = (H / 2) * 0.85

      // ── Glow layers (outer → inner) ──
      const layers = [
        { blur: 40, color: 'rgba(0,180,255,0.08)', width: 8 },
        { blur: 22, color: 'rgba(0,220,255,0.18)', width: 5 },
        { blur: 10, color: 'rgba(0,240,255,0.45)', width: 2.5 },
        { blur: 0,  color: 'rgba(200,240,255,0.9)', width: 1.2 },
      ]

      layers.forEach(({ blur, color, width }) => {
        ctx.save()
        ctx.shadowBlur = blur
        ctx.shadowColor = '#00e5ff'
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.lineJoin = 'round'
        ctx.beginPath()

        const sliceWidth = W / bufferLength
        let x = 0
        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i]
          const y = centerY + v * maxAmp * (0.6 + energy * 1.4)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          x += sliceWidth
        }
        ctx.stroke()
        ctx.restore()
      })

      // Mirror waveform (symmetric reflection with lower opacity)
      ctx.save()
      ctx.shadowBlur = 12
      ctx.shadowColor = '#00b4ff'
      ctx.strokeStyle = 'rgba(0,180,255,0.12)'
      ctx.lineWidth = 2
      ctx.beginPath()
      let x2 = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i]
        const y = centerY - v * maxAmp * (0.4 + energy)
        i === 0 ? ctx.moveTo(x2, y) : ctx.lineTo(x2, y)
        x2 += W / bufferLength
      }
      ctx.stroke()
      ctx.restore()

      animationIdRef.current = requestAnimationFrame(drawActive)
    }

    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)

    if (isPlaying && isReady) {
      drawActive()
    } else {
      drawIdle()
    }

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
    }
  }, [isPlaying, isReady, darkMode])

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ background: '#000', height: 100 }}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={200}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
