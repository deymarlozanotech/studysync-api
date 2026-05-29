import jwt from 'jsonwebtoken';
import publisher from '../publisher.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso denegado. Token no proporcionado.',
    });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const blacklisted = await publisher.get(`blacklist:${token}`);
    if (blacklisted) {
      return res.status(401).json({
        error: 'Token invalidado. Inicie sesión nuevamente.',
      });
    }

    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Acceso denegado. Token inválido o expirado.',
    });
  }
};
