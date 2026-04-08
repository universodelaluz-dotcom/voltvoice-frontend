import { useEffect, useRef, useState } from 'react'

const AUDIO_GRAPH_SYMBOL = Symbol.for('voltvoice.audioGraph')

export default function AudioVisualizer({ audioElement, isPlaying }) {
  const analyserRef = useRef(null)
  const phaseRef = useRef(0)
  const rafRef = useRef(0)
  const [detectedPlaying, setDetectedPlaying] = useState(false)
  const [pathMain, setPathMain] = useState('M 0 50 L 600 50')
  const [pathGlow, setPathGlow] = useState('M 0 50 L 600 50')

  useEffect(() => {
    const targetAudio = audioElement
    if (!targetAudio) return

    let graph = targetAudio[AUDIO_GRAPH_SYMBOL]
    if (!graph || graph.audioCtx?.state === 'closed') {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.9

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

  useEffect(() => {
    const points = 96
    const width = 600
    const mid = 50

    const tick = () => {
      const analyser = analyserRef.current
      const active = Boolean(isPlaying || detectedPlaying)

      let values = new Array(points).fill(0)
      let energy = 0

      if (active && analyser) {
        const timeData = new Float32Array(analyser.fftSize)
        const freqData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getFloatTimeDomainData(timeData)
        analyser.getByteFrequencyData(freqData)

        for (let i = 0; i < freqData.length; i++) energy += freqData[i]
        energy = (energy / freqData.length) / 255

        // RMS + ganancia dinámica para evitar espectro "plano"
        let rms = 0
        for (let i = 0; i < timeData.length; i++) rms += timeData[i] * timeData[i]
        rms = Math.sqrt(rms / timeData.length)
        const autoGain = Math.max(1.8, Math.min(9, 0.2 / Math.max(rms, 0.0008)))
        const minEnergyFloor = 0.28

        for (let i = 0; i < points; i++) {
          const idx = Math.min(timeData.length - 1, Math.floor((i / points) * timeData.length))
          const pulse = Math.sin((i * 0.16) + phaseRef.current * 1.2) * 0.12
          values[i] = (timeData[idx] * autoGain) + pulse
        }
        energy = Math.max(minEnergyFloor, energy)
      } else {
        phaseRef.current += 0.035
        for (let i = 0; i < points; i++) {
          const t = i / points
          values[i] =
            Math.sin(t * 11 + phaseRef.current) * 0.28 +
            Math.sin(t * 4.4 + phaseRef.current * 0.82) * 0.14 +
            Math.sin(t * 1.8 + phaseRef.current * 0.45) * 0.08
        }
        energy = 0.32
      }

      const amp = active ? (24 + energy * 34) : 9
      const ampGlow = active ? (16 + energy * 24) : 6

      let main = ''
      let glow = ''

      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * width
        const yMain = mid + values[i] * amp
        const yGlow = mid + values[i] * ampGlow + Math.sin((i * 0.2) + phaseRef.current) * (active ? 1.6 : 0.6)

        main += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${yMain.toFixed(2)} `
        glow += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${yGlow.toFixed(2)} `
      }

      setPathGlow(glow.trim())
      setPathMain(main.trim())

      phaseRef.current += active ? 0.065 : 0.028
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, detectedPlaying])

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black h-[100px] border border-cyan-400/20 flex items-center px-2">
      <svg viewBox="0 0 600 100" className="w-full h-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="vv-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={pathGlow} fill="none" stroke="rgba(0,220,255,0.45)" strokeWidth="2" filter="url(#vv-glow)" />
        <path d={pathMain} fill="none" stroke="rgba(180,245,255,0.96)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
