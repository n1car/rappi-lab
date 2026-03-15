import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

const router = Router()

// ─── REGISTRO ──────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, store_name } = req.body

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    if (!['consumer', 'store', 'delivery'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    if (role === 'store' && !store_name) {
      return res.status(400).json({ error: 'El nombre de la tienda es requerido' })
    }

    // Verificar si el email ya existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }

    // Encriptar la contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Crear el usuario en la BD
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ name, email, password_hash, role })
      .select()
      .single()

    if (userError) throw userError

    // Si el rol es 'store', crear también la tienda
    if (role === 'store') {
      const { error: storeError } = await supabase
        .from('stores')
        .insert({ user_id: newUser.id, name: store_name })

      if (storeError) throw storeError
    }

    // Crear el token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
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

// ─── LOGIN ──────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' })
    }

    // Buscar el usuario por email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Verificar la contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // Crear el token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
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