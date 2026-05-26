import express from 'express';
import dotenv from 'dotenv';

// 🚨 ¡MUEVE ESTO AQUÍ ARRIBA! Debe ejecutarse antes de importar el publisher
dotenv.config(); 

import sessionRoutes from './routes/sessionRoutes.js';
import { errorHandler, joinEvent } from './controllers/sessionController.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import publisher from './publisher.js'; // Ahora sí leerá la URL perfectamente

const app = express();
// ... (el resto del código se queda exactamente igual)

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudySync API',
      version: '1.0.0',
      description: 'API de coordinación académica con Redis Pub/Sub',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 10000}`, description: 'Local' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(express.json());

const API_PREFIX = '/api';
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.post(`${API_PREFIX}/events/join`, joinEvent);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StudySync API está funcionando',
    version: '1.0.0',
    endpoints: {
      sessions: `${API_PREFIX}/sessions`,
      events: `${API_PREFIX}/events/join`,
      docs: '/api-docs',
    },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await publisher.connect();
    const pong = await publisher.ping();
    console.log(`[Redis] Conexión validada: ${pong}`);

    app.listen(PORT, () => {
      console.log(`StudySync API ejecutándose en el puerto ${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('[Redis] Error al conectar:', err.message);
    process.exit(1);
  }
};

startServer();

export default app;
