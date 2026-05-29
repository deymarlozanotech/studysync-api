import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import Redis from 'ioredis';

const subscriber = new Redis(process.env.REDIS_URL);

let heartbeatInterval;

const handleNuevoReporte = (event) => {
  console.log('\n[REPORTE NUEVO] Nuevo reporte de daño registrado:');
  console.log(`  Reporte ID: ${event.payload.reporteId}`);
  console.log(`  Tipo de daño: ${event.payload.tipoDano}`);
  console.log(`  Ubicación: ${event.payload.ubicacion}`);
  console.log(`  Descripción: ${event.payload.descripcion}`);
  console.log(`  Estado: ${event.payload.estado}`);
};

const handleEstadoActualizado = (event) => {
  console.log('\n[ESTADO ACTUALIZADO] Estado del reporte modificado:');
  console.log(`  Reporte ID: ${event.payload.reporteId}`);
  console.log(`  Tipo de daño: ${event.payload.tipoDano}`);
  console.log(`  Estado anterior: ${event.payload.estadoAnterior}`);
  console.log(`  Estado nuevo: ${event.payload.estadoNuevo}`);
  console.log(`  Actualizado por: ${event.payload.actualizadoPor}`);
};

subscriber.psubscribe('campus:*');

subscriber.on('pmessage', (pattern, channel, message) => {
  try {
      const event = JSON.parse(message);
    const { tipo, payload } = event;

    if (!tipo || !payload) {
      console.log(`[RAW] Evento recibido en canal ${channel}:`, message);
      return;
    }

    switch (tipo) {
      case 'REPORTE_NUEVO':
        handleNuevoReporte(event);
        break;
      case 'ESTADO_ACTUALIZADO':
        handleEstadoActualizado(event);
        break;
      default:
        console.log(`[DESCONOCIDO] Evento tipo '${tipo}' en canal ${channel}:`, message);
    }
  } catch {
    console.log(`[RAW] Mensaje crudo en canal ${channel}:`, message);
  }
});

subscriber.on('connect', () => {
  console.log('Suscriptor Redis conectado. Escuchando eventos campus:*...');
});

subscriber.on('error', (err) => {
  console.error('Error en suscriptor Redis:', err.message);
});

heartbeatInterval = setInterval(() => {
  subscriber.ping().catch(() => {});
}, 240000);

const gracefulShutdown = () => {
  console.log('\nCerrando suscriptor...');
  clearInterval(heartbeatInterval);
  subscriber.disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('Subscriber de CampusFix iniciado...');
