import { Router, Response } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/stores — Lista todas las tiendas (público)
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener tiendas' })
  }
})

// GET /api/stores/my — Obtener MI tienda (solo rol store)
router.get('/my', authenticate, requireRole(['store']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', req.user!.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener tu tienda' })
  }
})

// PUT /api/stores/my/toggle — Abrir o cerrar tienda (solo rol store)
router.put('/my/toggle', authenticate, requireRole(['store']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('is_open')
      .eq('user_id', req.user!.id)
      .single()

    if (fetchError || !store) {
      res.status(404).json({ error: 'Tienda no encontrada' })
      return
    }

    const currentState = store as { is_open: boolean }

    const { data, error } = await supabase
      .from('stores')
      .update({ is_open: !currentState.is_open })
      .eq('user_id', req.user!.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al actualizar tienda' })
  }
})

export default router