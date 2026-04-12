import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed.' });
  }

  const { id } = req.query;

  if (!UUID_PATTERN.test(id)) {
    return res.status(400).json({ error: 'Invalid share ID format.' });
  }

  try {
    const data = await redis.get(`share:${id}`);

    if (data == null) {
      return res.status(404).json({ error: 'Share link expired or not found.' });
    }

    if (typeof data === 'object') {
      return res.status(200).json(data);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(data);
  } catch (err) {
    console.error('[share/[id]] Redis error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
