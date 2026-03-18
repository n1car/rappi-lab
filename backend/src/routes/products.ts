import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/products?store_id=xxx
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { store_id } = req.query

    let query = supabase.from('products').select('*')
    if (store_id) query = query.eq('store_id', store_id as string)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// POST /api/products
router.post('/', authenticate, requireRole(['store']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price } = req.body

    if (!name || !price) {
      res.status(400).json({ error: 'Nombre y precio son requeridos' })
      return
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', req.user!.id)
      .single()

    if (!store) {
      res.status(404).json({ error: 'Tienda no encontrada' })
      return
    }

    const { data, error } = await supabase
      .from('products')
      .insert({ store_id: store.id, name, description, price })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

export default router