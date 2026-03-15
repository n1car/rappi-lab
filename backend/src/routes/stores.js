import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/stores — Lista todas las tiendas (público)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tiendas' })
  }
})

// GET /api/stores/my — Obtener MI tienda (solo rol store)
router.get('/my', authenticate, requireRole(['store']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tu tienda' })
  }
})

// PUT /api/stores/my/toggle — Abrir o cerrar tienda (solo rol store)
router.put('/my/toggle', authenticate, requireRole(['store']), async (req, res) => {
  try {
    // Primero obtenemos el estado actual
    const { data: store } = await supabase
      .from('stores')
      .select('is_open')
      .eq('user_id', req.user.id)
      .single()

    // Cambiamos al estado opuesto
    const { data, error } = await supabase
      .from('stores')
      .update({ is_open: !store.is_open })
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tienda' })
  }
})

export default router