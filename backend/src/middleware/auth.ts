import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extendemos el tipo Request para agregar el usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Token requerido' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthRequest['user']
    req.user = decoded
    next()
  } catch {
    res.status(403).json({ error: 'Token inválido' })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'No tienes permiso para esto' })
      return
    }
    next()
  }
}