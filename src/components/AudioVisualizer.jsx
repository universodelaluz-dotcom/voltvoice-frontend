import { useEffect, useMemo, useRef, useState } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')
const BAR_COUNT = 56

export default function AudioVisualizer({ audioElement, isPlaying }) {
  const analyserRef = useRef(null)
  const phaseRef = useRef(0)
  const [detectedPlaying, setDetectedPlaying] = useState(false)
  const [levels, setLevels] = useState(() => Array(BAR_COUNT).fill(0.14))

  useEffect(() => {
    const targetAudio = audioElement
    if (!targetAudio) return

    let graph = targetAudio[AUDIO_GRAPH_SYMBOL]
    if (!graph || graph.audioCtx?.state === 'closed') {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.86

      try {
        const source = audioCtx.createMediaElementSource(targetAudio)
        source.connect(analyser)
        analyser.connect(audioCtx.destination)
        graph = { audioCtx, analyser, source }
      } catch (_) {
        graph = { audioCtx, analyser, source: null }
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
    const interval = setInterval(checkPlayback, 120)
    return () => clearInterval(interval)
  }, [audioElement])

  const effectivePlaying = Boolean(isPlaying || detectedPlaying)

  useEffect(() => {
    let raf = 0

    const tick = () => {
      const analyser = analyserRef.current
      const next = new Array(BAR_COUNT)

      if (effectivePlaying) {
        if (analyser) {
          const freq = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(freq)
          for (let i = 0; i < BAR_COUNT; i++) {
            const idx = Math.min(freq.length - 1, Math.floor((i / BAR_COUNT) * freq.length * 0.55))
            const raw = freq[idx] / 255
            const pulse = Math.abs(Math.sin((phaseRef.current * 0.75) + i * 0.13))
            next[i] = Math.max(0.1, Math.min(1, raw * 0.95 + pulse * 0.18))
          }
        } else {
          for (let i = 0; i < BAR_COUNT; i++) {
            const wave = Math.abs(Math.sin((phaseRef.current * 0.9) + i * 0.14))
            next[i] = 0.16 + wave * 0.5
          }
        }
      } else {
        for (let i = 0; i < BAR_COUNT; i++) {
          const wave = Math.abs(Math.sin((phaseRef.current * 0.35) + i * 0.11))
          next[i] = 0.08 + wave * 0.16
        }
      }

      setLevels((prev) => prev.map((v, i) => v + (next[i] - v) * 0.25))
      phaseRef.current += effectivePlaying ? 0.07 : 0.03
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [effectivePlaying])

  const bars = useMemo(() => levels.map((level, i) => {
    const h = 8 + level * 52
    const alpha = 0.25 + level * 0.55
    return {
      key: i,
      h,
      alpha
    }
  }), [levels])

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black h-[100px] border border-cyan-400/15">
      <div className="h-full w-full flex items-center gap-[2px] px-2">
        {bars.map((b) => (
          <div
            key={b.key}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${b.h}px`,
              background: `rgba(0, 220, 255, ${b.alpha})`,
              boxShadow: '0 0 8px rgba(0, 220, 255, 0.25)',
              transition: 'height 90ms linear, opacity 90ms linear'
            }}
          />
        ))}
      </div>
    </div>
  )
}
