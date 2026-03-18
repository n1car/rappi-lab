import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, store_name } = req.body

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Todos los campos son requeridos' })
      return
    }

    if (!['consumer', 'store', 'delivery'].includes(role)) {
      res.status(400).json({ error: 'Rol inválido' })
      return
    }

    if (role === 'store' && !store_name) {
      res.status(400).json({ error: 'El nombre de la tienda es requerido' })
      return
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      res.status(400).json({ error: 'El email ya está registrado' })
      return
    }

    const password_hash = await bcrypt.hash(password, 10)

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ name, email, password_hash, role })
      .select()
      .single()

    if (userError) throw userError

    if (role === 'store') {
      const { error: storeError } = await supabase
        .from('stores')
        .insert({ user_id: newUser.id, name: store_name })

      if (storeError) throw storeError
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    })

  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' })
      return
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      res.status(401).json({ error: 'Credenciales inválidas' })
      return
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciales inválidas' })
      return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router