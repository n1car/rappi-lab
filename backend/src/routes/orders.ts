import { Router, Response } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
}

const router = Router()

// POST /api/orders — Crear orden (solo consumidor)
router.post('/', authenticate, requireRole(['consumer']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { store_id, items }: { store_id: string; items: OrderItem[] } = req.body

    if (!store_id || !items || items.length === 0) {
      res.status(400).json({ error: 'store_id e items son requeridos' })
      return
    }

    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ consumer_id: req.user!.id, store_id, total })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    res.status(201).json({ message: 'Orden creada', order })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear orden' })
  }
})

// GET /api/orders/my — Mis órdenes (consumidor)
router.get('/my', authenticate, requireRole(['consumer']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, stores(name), order_items(*, products(name))')
      .eq('consumer_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener órdenes' })
  }
})

// GET /api/orders/store — Órdenes de MI tienda (store)
router.get('/store', authenticate, requireRole(['store']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', req.user!.id)
      .single()

    if (storeError || !store) {
      res.status(404).json({ error: 'Tienda no encontrada' })
      return
    }

    const storeData = store as { id: string }

    const { data, error } = await supabase
      .from('orders')
      .select('*, users!consumer_id(name, email), order_items(*, products(name))')
      .eq('store_id', storeData.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener órdenes de la tienda' })
  }
})

// GET /api/orders/available — Órdenes disponibles para repartir (delivery)
router.get('/available', authenticate, requireRole(['delivery']), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, stores(name), users!consumer_id(name)')
      .eq('status', 'pending')
      .is('delivery_id', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener órdenes disponibles' })
  }
})

// GET /api/orders/delivery — Mis órdenes aceptadas (delivery)
router.get('/delivery', authenticate, requireRole(['delivery']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, stores(name), users!consumer_id(name), order_items(*, products(name))')
      .eq('delivery_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener tus órdenes' })
  }
})

// PUT /api/orders/:id/accept — Aceptar orden (delivery)
router.put('/:id/accept', authenticate, requireRole(['delivery']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ delivery_id: req.user!.id, status: 'accepted' })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    if (!data) {
      res.status(404).json({ error: 'Orden no disponible' })
      return
    }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al aceptar orden' })
  }
})

// PUT /api/orders/:id/decline — Rechazar orden (delivery)
router.put('/:id/decline', authenticate, requireRole(['delivery']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'declined' })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    if (!data) {
      res.status(404).json({ error: 'Orden no disponible' })
      return
    }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al rechazar orden' })
  }
})

export default router