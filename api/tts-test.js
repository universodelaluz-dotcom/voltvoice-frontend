export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Test con API key manual: /api/tts-test?key=TU_API_KEY
  const manualKey = req.query.key;
  const envKey = process.env.ELEVENLABS_API_KEY;
  const apiKey = manualKey || envKey;

  if (!apiKey) {
    return res.status(400).json({ error: 'No API key. Pass ?key=YOUR_KEY or set ELEVENLABS_API_KEY' });
  }

  try {
    // Test 1: Get user info
    const userResp = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey }
    });
    const userData = await userResp.json();

    // Test 2: Get voices
    const voicesResp = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey }
    });
    const voicesData = await voicesResp.json();

    return res.status(200).json({
      keyUsed: manualKey ? 'manual' : 'env',
      keyPreview: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4),
      keyLength: apiKey.length,
      userEndpoint: { status: userResp.status, data: userData },
      voicesEndpoint: { status: voicesResp.status, voiceCount: voicesData.voices ? voicesData.voices.length : 0, data: voicesData }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
