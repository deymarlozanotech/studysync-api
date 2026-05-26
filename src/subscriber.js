import dotenv from 'dotenv';
dotenv.config();
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('[Subscriber] REDIS_URL no definida');
  process.exit(1);
}

const subscriber = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    console.log(`[Subscriber] Reconectando en ${delay}ms (intento ${times})`);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

subscriber.on('connect', () => console.log('[Subscriber] Conectado a Redis'));
subscriber.on('error', (err) => console.error('[Subscriber] Error:', err.message));

subscriber.psubscribe('study:*', (err, count) => {
  if (err) return console.error('[Subscriber] Error al suscribirse:', err.message);
  console.log(`[Subscriber] Suscrito a patrón study:* (${count})`);
});

subscriber.on('pmessage', (pattern, channel, message) => {
  try {
    const event = JSON.parse(message);
    console.log(`[Subscriber] Canal: ${channel} | Tipo: ${event.tipo}`);

    if (channel === 'study:session:created') {
      console.log('[Subscriber] Acción: Disparar alertas WebSockets');
    } else if (channel === 'study:usuario:unido') {
      console.log('[Subscriber] Acción: Enviar notificación email');
    }
  } catch (err) {
    console.error('[Subscriber] Error procesando mensaje:', err.message);
  }
});

setInterval(async () => {
  try {
    const res = await subscriber.ping();
    console.log(`[Subscriber] Heartbeat PING: ${res}`);
  } catch (err) {
    console.error('[Subscriber] Heartbeat falló:', err.message);
  }
}, 4 * 60 * 1000);

console.log('[Subscriber] Escuchando canales study:*...');
