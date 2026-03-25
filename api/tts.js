export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    return res.status(200).json({
      status: 'ok',
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPreview: apiKey ? apiKey.substring(0, 6) + '...' : 'NOT SET'
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
    const modelId = (body && body.modelId) || 'eleven_flash_v2_5';

    if (!text) {
      return res.status(400).json({
        error: 'text is required',
        debug: { bodyType: typeof body, bodyKeys: body ? Object.keys(body) : null }
      });
    }

    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
    }

    const elevenResponse = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/' + voiceId,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      }
    );

    if (!elevenResponse.ok) {
      let errorDetail;
      try { errorDetail = await elevenResponse.json(); } catch (e) { errorDetail = await elevenResponse.text(); }
      return res.status(elevenResponse.status).json({
        error: 'ElevenLabs API error',
        status: elevenResponse.status,
        detail: errorDetail
      });
    }

    const audioArrayBuffer = await elevenResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    const base64 = audioBuffer.toString('base64');

    return res.status(200).json({
      success: true,
      audio: 'data:audio/mpeg;base64,' + base64,
      audioSize: audioBuffer.length,
      voiceId: voiceId,
      modelId: modelId
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
