// Serverless function proxy para ElevenLabs TTS
// Frontend llama a este endpoint, que forwarda a ElevenLabs manteniendo la API key segura

export default async function handler(req, res) {
  // Solo POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId, modelId = 'eleven_flash_v2_5' } = req.body;

    // Validaciones básicas
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'text too long (max 5000 characters)' });
    }

    // Obtener API key de variables de entorno (seguro en Vercel)
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error('[TTS PROXY] ELEVENLABS_API_KEY not configured');
      return res.status(500).json({ error: 'TTS service not configured' });
    }

    console.log(`[TTS PROXY] Synthesizing text for voice ${voiceId} using model ${modelId}`);

    // Forwarding request a ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    console.log(`[TTS PROXY] ElevenLabs response status: ${response.status}`);

    // Si ElevenLabs devuelve error
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[TTS PROXY] ElevenLabs error:', errorData);
      return res.status(response.status).json({
        error: 'TTS synthesis failed',
        detail: errorData
      });
    }

    // Obtener audio de ElevenLabs
    const audioBuffer = await response.arrayBuffer();

    console.log(`[TTS PROXY] Audio generated successfully, size: ${audioBuffer.byteLength} bytes`);

    // Convertir a base64 para enviar como JSON
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      audioSize: audioBuffer.byteLength,
      voiceId: voiceId,
      modelId: modelId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TTS PROXY] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
