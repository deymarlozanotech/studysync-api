/**
 * =====================================================
 * SERVER.JS - StudySync API
 * =====================================================
 * 
 * Punto de entrada principal de la aplicación Express.
 * Configura el servidor, middlewares y monta las rutas.
 * 
 * ARQUITECTURA MVC EN ESTE ARCHIVO:
 * Este archivo funciona como el 'Controller' principal que:
 * - Inicializa Express
 * - Configura middlewares (funciones que procesan requests antes de llegar a los controladores)
 * - Monta las rutas específicas (sessionRoutes)
 * - Define el middleware de errores global
 * 
 * FLUJO DE UNA SOLICITUD HTTP:
 * 1. Request llega al servidor
 * 2. Middleware de parsing JSON procesa el body
 * 3. Router dirige la solicitud al endpoint correcto
 * 4. Controlador procesa la lógica de negocio
 * 5. Response se envía al cliente
 * 6. Si hay error, el middleware de errores lo captura
 * =====================================================
 */

import express from 'express';
import dotenv from 'dotenv';
import sessionRoutes from './routes/sessionRoutes.js';
import { errorHandler } from './controllers/sessionController.js';

// Cargar variables de entorno desde archivo .env
// Esto permite configurar el puerto sin hardcodearlo
dotenv.config();

// Crear instancia de Express
// Express es el framework que maneja el servidor HTTP
const app = express();

/**
 * MIDDLEWARE: express.json()
 * Permite parsear el cuerpo de las solicitudes en formato JSON
 * Sin esto, req.body estaría vacío en POST/PUT
 * 
 * Este middleware es GLOBAL porque se aplica a todas las rutas
 */
app.use(express.json());

/**
 * ENDPOINT BASE: /api
 * Configuramos un prefijo base para todas las rutas de la API
 * Esto permite tener versioning futuro (/api/v1/)
 */
const API_PREFIX = '/api';

/**
 * MOUNT ROUTES: /api/sessions
 * Montamos las rutas de sesiones bajo el prefijo /api
 * Ahora todos los endpoints serán /api/sessions/...
 * 
 * Este es el punto donde el Router de Express se conecta al servidor principal
 */
app.use(`${API_PREFIX}/sessions`, sessionRoutes);

/**
 * ENDPOINT DE BIENVENIDA: GET /
 * Prueba de que el servidor está funcionando
 * 
 * CÓDIGO 200: El servidor responde correctamente
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StudySync API está funcionando',
    version: '1.0.0',
    endpoints: {
      sessions: `${API_PREFIX}/sessions`,
      documentation: 'Ver README.md para más información'
    }
  });
});

/**
 * MIDDLEWARE DE ERRORES GLOBAL
 * Este middleware se ejecuta cuando cualquier ruta lanza un error
 * Debe definirse AL FINAL de todas las rutas
 * 
 * CÓDIGO 500: Error interno del servidor
 * Captura errores no manejados y responde de forma controlada
 */
app.use(errorHandler);

/**
 * CONFIGURACIÓN DEL PUERTO
 * Lee la variable PORT del archivo .env
 * Si no existe, usa 3000 como valor por defecto
 */
const PORT = process.env.PORT || 10000;

/**
 * INICIAR EL SERVIDOR
 * Express comienza a escuchar solicitudes en el puerto configurado
 * 
 * CÓDIGO DE ESTADO: No aplica (el servidor no es una respuesta HTTP)
 */
app.listen(PORT, () => {
  console.log(`🚀 StudySync API ejecutándose en el puerto ${PORT}`);
  console.log(`📚 Documentación: http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles: ${API_PREFIX}/sessions`);
});

// Exportar app para testing (permite usar supertest sin iniciar el servidor)
// Esta es una práctica recomendada para testing automatizado
export default app;