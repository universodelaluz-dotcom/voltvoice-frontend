// Vercel serverless function for Inworld TTS
// Proxy to Inworld AI backend
// $5 per million characters - 8x cheaper than ElevenLabs

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const apiKey = process.env.INWORLD_API_KEY;
    return res.status(200).json({
      status: 'ok',
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      service: 'Inworld AI TTS'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const text = body && body.text;
    const voiceId = body && body.voiceId;

    if (!text) {
      return res.status(400).json({
        error: 'text is required',
        debug: { bodyType: typeof body, bodyKeys: body ? Object.keys(body) : null }
      });
    }

    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }

    const apiKey = process.env.INWORLD_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'INWORLD_API_KEY not configured' });
    }

    // Call Inworld TTS API
    // Format: "username:password" -> Base64 for Basic Auth
    const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;

    const inworldResponse = await fetch(
      'https://api.inworld.ai/tts/v1/voice:stream',
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice_id: voiceId,
          model_id: 'inworld-tts-1.5-max',
          audio_config: {
            audio_encoding: 'MP3',
            speaking_rate: 1
          },
          temperature: 1
        })
      }
    );

    if (!inworldResponse.ok) {
      let errorDetail;
      try { errorDetail = await inworldResponse.json(); } catch (e) { errorDetail = await inworldResponse.text(); }
      return res.status(inworldResponse.status).json({
        error: 'Inworld API error',
        status: inworldResponse.status,
        detail: errorDetail
      });
    }

    const audioArrayBuffer = await inworldResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    const base64 = audioBuffer.toString('base64');

    return res.status(200).json({
      success: true,
      audio: 'data:audio/mpeg;base64,' + base64,
      audioSize: audioBuffer.length,
      voiceId: voiceId,
      characters: text.length,
      estimatedCost: {
        mini: `$${(text.length / 1000000 * 5).toFixed(6)}`,
        max: `$${(text.length / 1000000 * 10).toFixed(6)}`
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
