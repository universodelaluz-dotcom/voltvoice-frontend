import { useEffect, useRef, useState } from 'react'

export default function AudioVisualizer({ audioUrl, isPlaying, darkMode }) {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const analyserRef = useRef(null)
  const animationIdRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Crear AudioContext para análisis
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    const source = audioContext.createMediaElementAudioSource(audio)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    analyserRef.current = { analyser, audioContext, audio }
    setIsReady(true)

    return () => {
      // Cleanup
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [audioUrl])

  // Dibujar visualizador
  useEffect(() => {
    if (!isReady || !canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { analyser } = analyserRef.current

    const draw = () => {
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyser.getByteFrequencyData(dataArray)

      // Limpiar canvas
      ctx.fillStyle = darkMode ? '#1f2937' : '#f3f4f6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dibujar forma de onda
      const barWidth = canvas.width / bufferLength * 2.5
      let x = 0

      dataArray.forEach((value, index) => {
        // Normalizar valor
        const percent = value / 255
        const height = canvas.height * percent

        // Gradiente de color
        const hue = (index / bufferLength) * 360
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
        ctx.fillRect(x, canvas.height - height, barWidth, height)

        x += barWidth + 1
      })

      if (isPlaying) {
        animationIdRef.current = requestAnimationFrame(draw)
      }
    }

    if (isPlaying) {
      draw()
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isPlaying, isReady, darkMode])

  return (
    <div className={`w-full rounded-lg overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className="w-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
