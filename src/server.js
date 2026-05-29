import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import Redis from 'ioredis';
import prisma from './lib/prisma.js';
import publisher from './publisher.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler } from './controllers/reportController.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const socketSubscriber = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

const initSocketSubscriber = async () => {
  try {
    await socketSubscriber.connect();
    await socketSubscriber.psubscribe('campus:*');
    console.log('Socket.io subscriber conectado a Redis');
  } catch (err) {
    console.error('Socket.io subscriber no pudo conectar a Redis:', err.message);
  }
};

socketSubscriber.on('pmessage', (pattern, channel, message) => {
  try {
    const parsed = JSON.parse(message);
    io.emit(channel, parsed);
  } catch {
    io.emit(channel, { raw: message });
  }
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intente de nuevo más tarde.',
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Permite que se descargue el script de Socket.io desde el CDN
        scriptSrc: ["'self'", "https://cdn.socket.io", "'unsafe-inline'"],
        // Permite la conexión WebSocket nativa a tu localhost o a producción
        connectSrc: ["'self'", "ws://localhost:*", "wss://*", "http://localhost:*", "https://*"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.static('public'));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampusFix API',
      version: '1.0.0',
      description:
        'API de Reportes de Infraestructura Universitaria en Tiempo Real. Gestiona reportes de daños en instalaciones universitarias con autenticación JWT, caché Redis y publicación/suscripción en tiempo real.',
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de CampusFix API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reportes', reportRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusFix API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  if (process.env.JEST_WORKER_ID) return;

  await initSocketSubscriber();

  httpServer.listen(PORT, () => {
    console.log(`CampusFix API corriendo en puerto ${PORT}`);
    console.log(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
    console.log(`Dashboard en tiempo real: http://localhost:${PORT}`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} recibido. Iniciando apagado graceful...`);

  io.close(() => {
    console.log('Socket.io cerrado.');
  });

  socketSubscriber.disconnect();
  console.log('Suscripción Redis desconectada.');

  publisher.disconnect();
  console.log('Publicador Redis desconectado.');

  await prisma.$disconnect();
  console.log('Prisma desconectado.');

  httpServer.close(() => {
    console.log('Servidor HTTP cerrado.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Apagado forzado por timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export { app, httpServer, io };
