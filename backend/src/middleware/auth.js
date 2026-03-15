// Este middleware verifica que el usuario esté autenticado
// Se ejecuta ANTES de las rutas protegidas
import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  // El token viene en el header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // guardamos el usuario en req para usarlo en las rutas
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' })
  }
}

// Middleware para verificar roles específicos
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esto' })
    }
    next()
  }
}