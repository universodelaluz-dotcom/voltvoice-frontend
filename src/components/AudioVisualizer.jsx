import { useEffect, useRef, useState } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying, darkMode }) {
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animationIdRef = useRef(null)
  const phaseRef = useRef(0)
  const [detectedPlaying, setDetectedPlaying] = useState(false)

  useEffect(() => {
    const targetAudio = audioElement
    if (!targetAudio) return

    let graph = targetAudio[AUDIO_GRAPH_SYMBOL]
    if (!graph || graph.audioCtx?.state === 'closed') {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.88

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
      const elementPlaying = Boolean(audioElement && !audioElement.paused && !audioElement.ended)
      const speechPlaying = Boolean(
        typeof window !== 'undefined' &&
        window.speechSynthesis &&
        window.speechSynthesis.speaking
      )
      setDetectedPlaying(elementPlaying || speechPlaying)
    }

    checkPlayback()
    const interval = setInterval(checkPlayback, 140)
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

      phaseRef.current += 0.03

      ctx.save()
      ctx.shadowBlur = 14
      ctx.shadowColor = '#00d5ff'

      const layers = [
        { amp: 4.2, freq: 0.013, alpha: 0.42, width: 1.4 },
        { amp: 2.6, freq: 0.02, alpha: 0.26, width: 1.1 }
      ]

      for (const layer of layers) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(0, 210, 255, ${layer.alpha})`
        ctx.lineWidth = layer.width
        for (let x = 0; x <= W; x++) {
          const y = H / 2 + Math.sin(x * layer.freq + phaseRef.current) * layer.amp
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()

      animationIdRef.current = requestAnimationFrame(drawIdle)
    }

    const drawActive = () => {
      const W = canvas.width
      const H = canvas.height
      const centerY = H / 2

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
        for (let i = 0; i < bufferLength; i++) {
          const t = i / bufferLength
          timeData[i] =
            Math.sin((t * 12) + phaseRef.current) * 0.3 +
            Math.sin((t * 5.2) + phaseRef.current * 0.9) * 0.14
        }
        for (let i = 0; i < freqData.length; i++) {
          const wave = Math.abs(Math.sin(phaseRef.current * 0.8 + i * 0.09))
          freqData[i] = 90 + Math.floor(wave * 110)
        }
      }

      let energy = 0
      for (let i = 0; i < freqData.length; i++) energy += freqData[i]
      energy = energy / freqData.length / 255

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      const amplitude = (H * 0.34) * (0.72 + energy * 0.9)

      const strokes = [
        { blur: 18, color: 'rgba(0, 205, 255, 0.28)', width: 2.3 },
        { blur: 9, color: 'rgba(0, 220, 255, 0.5)', width: 1.6 },
        { blur: 0, color: 'rgba(190, 245, 255, 0.95)', width: 1.1 }
      ]

      for (const s of strokes) {
        ctx.save()
        ctx.shadowBlur = s.blur
        ctx.shadowColor = '#00d5ff'
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.width
        ctx.beginPath()

        const step = W / bufferLength
        let x = 0
        for (let i = 0; i < bufferLength; i++) {
          const y = centerY + (timeData[i] * amplitude)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
          x += step
        }
        ctx.stroke()
        ctx.restore()
      }

      animationIdRef.current = requestAnimationFrame(drawActive)
    }

    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)

    const effectivePlaying = Boolean(isPlaying || detectedPlaying)
    if (effectivePlaying) drawActive()
    else drawIdle()

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
