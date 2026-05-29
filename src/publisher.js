import dotenv from 'dotenv';
dotenv.config({ quiet: true });
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('[Publisher] REDIS_URL no definida');
  process.exit(1);
}

const publisher = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    console.log(`[Publisher] Reconectando en ${delay}ms (intento ${times})`);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

publisher.on('connect', () => console.log('[Publisher] Conectado a Redis'));
publisher.on('error', (err) => console.error('[Publisher] Error:', err.message));

export const publishEvent = async (channel, tipo, payload) => {
  const message = JSON.stringify({
    tipo,
    payload,
    timestamp: new Date().toISOString(),
    version: '1.0',
  });
  try {
    await publisher.publish(channel, message);
    console.log(`[Publisher] Publicado en ${channel}: ${tipo}`);
  } catch (err) {
    console.error(`[Publisher] Error publicando en ${channel}:`, err.message);
  }
};

export default publisher;
