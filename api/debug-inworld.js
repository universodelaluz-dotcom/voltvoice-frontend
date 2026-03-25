// Debug endpoint - checks if Inworld API key is configured
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.INWORLD_API_KEY;

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 10) : 'NOT SET',
    environment: process.env.NODE_ENV,
    vercelEnv: !!process.env.VERCEL,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('INWORLD') || k.includes('API')).length
  });
}
