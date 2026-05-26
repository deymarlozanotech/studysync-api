/**
 * @openapi
 * /api/sessions:
 *   get:
 *     tags: [Sesiones]
 *     summary: Lista todas las sesiones con filtros y paginación
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *         description: Filtrar por materia
 *       - in: query
 *         name: topic
 *         schema: { type: string }
 *         description: Filtrar por tema
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista paginada de sesiones
 *   post:
 *     tags: [Sesiones]
 *     summary: Crea una sesión y publica evento study:session:created
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, topic, scheduledDate, duration, location]
 *             properties:
 *               subject: { type: string }
 *               topic: { type: string }
 *               scheduledDate: { type: string, format: date-time }
 *               duration: { type: integer }
 *               location: { type: string }
 *     responses:
 *       201: { description: Sesión creada + evento Redis publicado }
 *       400: { description: Error de validación }
 *
 * /api/sessions/{id}:
 *   get:
 *     tags: [Sesiones]
 *     summary: Obtiene una sesión por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Sesión encontrada }
 *       404: { description: No encontrada }
 *   put:
 *     tags: [Sesiones]
 *     summary: Actualiza una sesión existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject: { type: string }
 *               topic: { type: string }
 *               scheduledDate: { type: string, format: date-time }
 *               duration: { type: integer }
 *               location: { type: string }
 *     responses:
 *       200: { description: Sesión actualizada }
 *       400: { description: Datos inválidos }
 *       404: { description: No encontrada }
 *   delete:
 *     tags: [Sesiones]
 *     summary: Elimina una sesión
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Sesión eliminada }
 *       404: { description: No encontrada }
 *
 * /api/events/join:
 *   post:
 *     tags: [Eventos]
 *     summary: Simula unión de usuario y publica study:usuario:unido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, grupo]
 *             properties:
 *               usuario: { type: string }
 *               grupo: { type: string }
 *     responses:
 *       200: { description: Evento USER_JOINED publicado en Redis }
 *       400: { description: Faltan campos requeridos }
 */

import express from 'express';
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';

const router = express.Router();

router.get('/', getAllSessions);
router.get('/:id', getSessionById);
router.post('/', createSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
