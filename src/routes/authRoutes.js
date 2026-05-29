/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registra un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: miClave123
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente (password omitido)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     email: { type: string }
 *                     nombre: { type: string }
 *                     creadoEn: { type: string, format: date-time }
 *       400:
 *         description: Campos requeridos faltantes o email ya registrado
 *
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesión y obtiene un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: miClave123
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso (token JWT)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *       401:
 *         description: Credenciales inválidas
 *
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cierra sesión e invalida el token JWT actual
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token invalidado exitosamente
 *       400:
 *         description: Token no proporcionado o inválido
 *
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Obtiene un nuevo token JWT (renovación)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Nuevo token generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *       401:
 *         description: Token inválido o expirado
 */

import express from 'express';
import { register, login, logout, refreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

export default router;
