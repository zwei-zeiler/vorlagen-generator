import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const config = {
  api: { bodyParser: { sizeLimit: '50kb' } },
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Rate limiting
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    const key = `ratelimit:share:${ip}`;
    await redis.set(key, 0, { nx: true, ex: 60 });
    const count = await redis.incr(key);
    if (count > 10) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }

    // Payload validation
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    if (!body.version || !body.design) {
      return res.status(400).json({ error: 'Missing required fields: version and design.' });
    }

    // Store in Redis with 7-day TTL
    const id = crypto.randomUUID();
    await redis.set(`share:${id}`, JSON.stringify(body), { ex: 604800 });

    // Build response
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const url = `${proto}://${host}/s/${id}`;
    const expiresAt = new Date(Date.now() + 604800 * 1000).toISOString();

    return res.status(201).json({ id, url, expiresAt });
  } catch (err) {
    console.error('[share] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
