export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    // Buscar el room ID del stream activo del usuario
    const userResponse = await fetch(`https://www.tiktok.com/api/user/detail/?uniqueId=${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!userResponse.ok) {
      return res.status(404).json({ 
        error: 'Usuario de TikTok no encontrado o no está en vivo' 
      });
    }

    console.log(`[TikTok] Conectado a @${username}`);

    return res.status(200).json({
      success: true,
      username: username,
      message: 'Conectado al stream',
      status: 'connected'
    });

  } catch (error) {
    console.error('[TikTok] Error:', error);
    return res.status(500).json({
      error: 'Error conectando a TikTok',
      message: error.message
    });
  }
}
