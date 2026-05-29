export const checkRole = (allowedRoles) => (req, res, next) => {
  if (!req.usuario || !allowedRoles.includes(req.usuario.rol)) {
    return res.status(403).json({
      error: 'Acceso denegado. Permisos insuficientes.',
    });
  }
  next();
};
