import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// GET /api/products?store_id=xxx — Productos de una tienda (público)
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query

    let query = supabase.from('products').select('*')
    if (store_id) query = query.eq('store_id', store_id)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// POST /api/products — Crear producto (solo rol store)
router.post('/', authenticate, requireRole(['store']), async (req, res) => {
  try {
    const { name, description, price } = req.body

    if (!name || !price) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' })
    }

    // Obtener la tienda del usuario autenticado
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', req.user.id)
      .single()

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' })
    }

    const { data, error } = await supabase
      .from('products')
      .insert({ store_id: store.id, name, description, price })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

export default router