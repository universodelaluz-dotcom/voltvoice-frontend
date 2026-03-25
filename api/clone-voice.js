export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { voiceName, base64Audio, audioFormat = 'audio/mp3' } = req.body;

  if (!voiceName || !base64Audio) {
    return res.status(400).json({ error: 'voiceName and base64Audio required' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    // Convertir base64 a Buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Crear FormData para multipart upload
    const FormData = await import('form-data');
    const form = new FormData.default();
    form.append('name', voiceName);
    form.append('description', `Cloned voice: ${voiceName}`);
    form.append('files', audioBuffer, {
      filename: `voice.${audioFormat === 'audio/mpeg' ? 'mp3' : 'wav'}`,
      contentType: audioFormat
    });

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        ...form.getHeaders()
      },
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[CLONE] ElevenLabs error:', data);
      return res.status(response.status).json({
        error: 'Failed to clone voice',
        detail: data
      });
    }

    console.log('[CLONE] Voice cloned successfully:', data.voice_id);
    
    return res.status(200).json({
      success: true,
      voiceId: data.voice_id,
      voiceName: data.name,
      message: 'Voice cloned successfully!'
    });

  } catch (error) {
    console.error('[CLONE] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
