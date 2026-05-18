/**
 * =====================================================
 * STUDY SESSIONS ROUTES - StudySync API
 * =====================================================
 * 
 * Este archivo define las rutas HTTP para la entidad StudySession.
 * Implementa el patrón MVC donde las rutas actúan como el 'View' 
 * que recibe las solicitudes y delega al 'Controller'.
 * 
 * ARQUITECTURA MVC:
 * - Routes: Definen los endpoints y mapean URLs a controladores
 * - Controller: Contiene la lógica de negocio (sessionController.js)
 * - Modelo: La estructura de datos de cada sesión
 * 
 * ENDPOINTS IMPLEMENTADOS:
 * - GET    /api/sessions          - Listar todas las sesiones (con filtros y paginación)
 * - GET    /api/sessions/:id      - Obtener una sesión específica
 * - POST   /api/sessions          - Crear nueva sesión
 * - PUT    /api/sessions/:id      - Actualizar una sesión
 * - DELETE /api/sessions/:id      - Eliminar una sesión
 * =====================================================
 */

import express from 'express';
// Importamos todas las funciones del controlador
import { 
  getAllSessions, 
  getSessionById, 
  createSession, 
  updateSession, 
  deleteSession 
} from '../controllers/sessionController.js';

// Crear un nuevo router de Express
// Router permite crear rutas modulares y montables
const router = express.Router();

/**
 * RUTA: GET /api/sessions
 * Descripción: Obtiene todas las sesiones de estudio
 * 
 * Parámetros de Query (opcionales):
 * - subject: filtrar por materia
 * - topic: filtrar por tema  
 * - page: número de página (default: 1)
 * - limit: elementos por página (default: 5)
 * 
 * Ejemplo de uso:
 * GET /api/sessions?subject=Matemáticas&page=1&limit=5
 */
router.get('/', getAllSessions);

/**
 * RUTA: GET /api/sessions/:id
 * Descripción: Obtiene una sesión específica por su ID
 * 
 * Parámetros:
 * - id: ID de la sesión (parámetro de ruta)
 * 
 * Ejemplo de uso:
 * GET /api/sessions/1
 */
router.get('/:id', getSessionById);

/**
 * RUTA: POST /api/sessions
 * Descripción: Crea una nueva sesión de estudio
 * 
 * Cuerpo de la solicitud (JSON):
 * {
 *   "subject": "Matemáticas",
 *   "topic": "Álgebra Lineal",
 *   "scheduledDate": "2026-05-20T14:00:00Z",
 *   "duration": 120,
 *   "location": "Biblioteca Central"
 * }
 * 
 * Campos requeridos: subject, topic, scheduledDate, duration, location
 * 
 * Códigos de respuesta:
 * - 201: Sesión creada exitosamente
 * - 400: Error de validación (faltan campos)
 */
router.post('/', createSession);

/**
 * RUTA: PUT /api/sessions/:id
 * Descripción: Actualiza una sesión existente
 * 
 * Parámetros:
 * - id: ID de la sesión a actualizar
 * 
 * Cuerpo de la solicitud (JSON) - todos los campos opcionales:
 * {
 *   "subject": "Matemáticas II",
 *   "duration": 90
 * }
 * 
 * Códigos de respuesta:
 * - 200: Sesión actualizada exitosamente
 * - 400: Datos inválidos
 * - 404: Sesión no encontrada
 */
router.put('/:id', updateSession);

/**
 * RUTA: DELETE /api/sessions/:id
 * Descripción: Elimina una sesión de estudio
 * 
 * Parámetros:
 * - id: ID de la sesión a eliminar
 * 
 * Códigos de respuesta:
 * - 200: Sesión eliminada exitosamente
 * - 404: Sesión no encontrada
 */
router.delete('/:id', deleteSession);

// Exportar el router para usarlo en server.js
// Esto permite que el router se monte en el servidor principal
export default router;