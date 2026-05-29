import { Router } from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReportStatus,
  deleteReport,
} from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleAuth.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Reporte:
 *       type: object
 *       required:
 *         - tipoDano
 *         - descripcion
 *         - ubicacion
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         tipoDano:
 *           type: string
 *           example: "Luminaria fundida"
 *         descripcion:
 *           type: string
 *           example: "El foco de la luminaria del pasillo principal está fundido"
 *         ubicacion:
 *           type: string
 *           example: "Aula 202"
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, RESUELTO]
 *           example: PENDIENTE
 *         creadoEn:
 *           type: string
 *           format: date-time
 *         autor:
 *           $ref: '#/components/schemas/Usuario'
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         email:
 *           type: string
 *         rol:
 *           type: string
 *           enum: [ESTUDIANTE, MANTENIMIENTO, ADMIN]
 */

/**
 * @swagger
 * /api/reportes:
 *   get:
 *     summary: Obtener todos los reportes
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: tipoDano
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de daño
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, EN_PROCESO, RESUELTO]
 *         description: Filtrar por estado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de reportes paginada
 */
router.get('/', getAllReports);

/**
 * @swagger
 * /api/reportes/{id}:
 *   get:
 *     summary: Obtener un reporte por ID
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte encontrado
 *       404:
 *         description: Reporte no encontrado
 */
router.get('/:id', getReportById);

/**
 * @swagger
 * /api/reportes:
 *   post:
 *     summary: Crear un nuevo reporte de daño
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipoDano
 *               - descripcion
 *               - ubicacion
 *             properties:
 *               tipoDano:
 *                 type: string
 *                 example: "Luminaria fundida"
 *               descripcion:
 *                 type: string
 *                 example: "El foco de la luminaria del pasillo principal está fundido"
 *               ubicacion:
 *                 type: string
 *                 example: "Aula 202"
 *     responses:
 *       201:
 *         description: Reporte creado exitosamente
 *       400:
 *         description: Campos requeridos faltantes
 *       401:
 *         description: No autorizado
 */
router.post('/', authMiddleware, createReport);

/**
 * @swagger
 * /api/reportes/{id}:
 *   put:
 *     summary: Actualizar el estado de un reporte (solo MANTENIMIENTO)
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [PENDIENTE, EN_PROCESO, RESUELTO]
 *                 example: EN_PROCESO
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Estado inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Reporte no encontrado
 */
router.put('/:id', authMiddleware, checkRole(['MANTENIMIENTO']), updateReportStatus);

/**
 * @swagger
 * /api/reportes/{id}:
 *   delete:
 *     summary: Eliminar un reporte (solo ADMIN)
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Reporte no encontrado
 */
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteReport);

export default router;
