import { useEffect, useRef, useState } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying, darkMode }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationIdRef = useRef(null)
  const [detectedPlaying, setDetectedPlaying] = useState(false)
  const phaseRef = useRef(0)
  const barsRef = useRef([])

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

    analyserRef.current = graph.analyser

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
    const checkPlayback = () => {
      const elementPlaying = Boolean(
        audioElement &&
        !audioElement.paused &&
        !audioElement.ended
      )
      const speechPlaying = Boolean(
        typeof window !== 'undefined' &&
        window.speechSynthesis &&
        window.speechSynthesis.speaking
      )
      setDetectedPlaying(elementPlaying || speechPlaying)
    }

    checkPlayback()
    const interval = setInterval(checkPlayback, 120)
    return () => clearInterval(interval)
  }, [audioElement])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const drawIdle = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      phaseRef.current += 0.02
      const barCount = 36
      const gap = W / barCount

      for (let i = 0; i < barCount; i++) {
        const wave = Math.abs(Math.sin(phaseRef.current + i * 0.22))
        const barH = 8 + wave * 12
        const x = i * gap + 2
        const y = (H - barH) / 2
        ctx.fillStyle = `rgba(0, 210, 255, ${0.16 + wave * 0.18})`
        ctx.fillRect(x, y, Math.max(3, gap - 4), barH)
      }

      animationIdRef.current = requestAnimationFrame(drawIdle)
    }

    const drawActive = () => {
      const analyser = analyserRef.current
      const hasAnalyser = Boolean(analyser)
      const bufferLength = hasAnalyser ? analyser.fftSize : 1024
      const timeData = new Float32Array(bufferLength)
      const freqData = new Uint8Array(Math.max(1, Math.floor(bufferLength / 2)))

      if (hasAnalyser) {
        analyser.getFloatTimeDomainData(timeData)
        analyser.getByteFrequencyData(freqData)
      } else {
        phaseRef.current += 0.04
        for (let i = 0; i < timeData.length; i++) {
          const t = i / timeData.length
          timeData[i] =
            Math.sin((t * 12) + phaseRef.current) * 0.2 +
            Math.sin((t * 4) + phaseRef.current * 1.1) * 0.12
        }
        for (let i = 0; i < freqData.length; i++) {
          const soft = Math.abs(Math.sin(phaseRef.current * 0.9 + i * 0.08))
          freqData[i] = 88 + Math.floor(soft * 88)
        }
      }

      let energy = 0
      for (let i = 0; i < freqData.length; i++) energy += freqData[i]
      energy = energy / freqData.length / 255

      const W = canvas.width
      const H = canvas.height
      const centerY = H / 2

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      phaseRef.current += 0.018

      const bars = 42
      const barW = W / bars
      for (let i = 0; i < bars; i++) {
        const idx = Math.min(freqData.length - 1, Math.floor((i / bars) * freqData.length))
        const v = freqData[idx] / 255
        const pulse = Math.abs(Math.sin(phaseRef.current * 0.7 + i * 0.12))
        const magnitude = Math.max(v * 0.85, pulse * 0.35) * (0.48 + energy * 0.82)
        const targetH = Math.max(8, magnitude * (H * 0.72))
        const prevH = barsRef.current[i] || 8
        const h = prevH + (targetH - prevH) * 0.22
        barsRef.current[i] = h
        const x = i * barW + 1
        const y = centerY - h / 2
        ctx.fillStyle = `rgba(0, 225, 255, ${0.2 + magnitude * 0.35})`
        ctx.fillRect(x, y, Math.max(2, barW - 2), h)
      }

      ctx.strokeStyle = 'rgba(180, 245, 255, 0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(W, centerY)
      ctx.stroke()

      animationIdRef.current = requestAnimationFrame(drawActive)
    }

    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)

    const effectivePlaying = Boolean(isPlaying || detectedPlaying)
    if (effectivePlaying) {
      drawActive()
    } else {
      drawIdle()
    }

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
    }
  }, [isPlaying, detectedPlaying, darkMode])

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
