import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import publisher from '../publisher.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (req, res) => {
  try {
    const { email, password, nombre, rol } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: email, password, nombre',
      });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rol: rol || 'ESTUDIANTE',
      },
    });

    const { password: _, ...usuarioSinPassword } = usuario;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: usuarioSinPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: email, password',
      });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: { token },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const logout = async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(400).json({
        success: false,
        message: 'Token no proporcionado en el header Authorization',
      });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido',
      });
    }

    const remainingTtl = decoded.exp - Math.floor(Date.now() / 1000);

    if (remainingTtl > 0) {
      await publisher.set(`blacklist:${token}`, 'true', 'EX', remainingTtl);
    }

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente. Token invalidado.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado',
      });
    }

    const token = header.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const blacklisted = await publisher.get(`blacklist:${token}`);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token invalidado. Inicie sesión nuevamente.',
      });
    }

    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, nombre: decoded.nombre, rol: decoded.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const remainingTtl = decoded.exp - Math.floor(Date.now() / 1000);
    if (remainingTtl > 0) {
      await publisher.set(`blacklist:${token}`, 'true', 'EX', Math.max(remainingTtl, 1));
    }

    res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente',
      data: { token: newToken },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};
