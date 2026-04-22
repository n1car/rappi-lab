import { Router, Response } from 'express'
import { supabase } from '../config/supabase'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { OrderStatus } from '../types/orderStatus'

interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
}

interface Position {
  lat: number
  lng: number
}

const router = Router()

// POST /api/orders — Crear orden con destino (consumidor)
router.post('/', authenticate, requireRole(['consumer']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { store_id, items, destination }: {
      store_id: string
      items: OrderItem[]
      destination: Position
    } = req.body

    if (!store_id || !items || items.length === 0) {
      res.status(400).json({ error: 'store_id e items son requeridos' })
      return
    }

    if (!destination || destination.lat === undefined || destination.lng === undefined) {
      res.status(400).json({ error: 'El destino es requerido' })
      return
    }

    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        consumer_id: req.user!.id,
        store_id,
        total,
        status: OrderStatus.CREATED,
        destination: `SRID=4326;POINT(${destination.lng} ${destination.lat})`
      })
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

// GET /api/orders/available — Órdenes disponibles (delivery)
router.get('/available', authenticate, requireRole(['delivery']), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, stores(name), users!consumer_id(name)')
      .eq('status', OrderStatus.CREATED)
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

// GET /api/orders/:id — Detalle de una orden
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, stores(name), order_items(*, products(name))')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Error al obtener orden' })
  }
})

// PATCH /api/orders/:id/accept — Aceptar orden (delivery)
router.patch('/:id/accept', authenticate, requireRole(['delivery']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        delivery_id: req.user!.id,
        status: OrderStatus.IN_DELIVERY
      })
      .eq('id', req.params.id)
      .eq('status', OrderStatus.CREATED)
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

// PATCH /api/orders/:id/position — Actualizar posición del repartidor
router.patch('/:id/position', authenticate, requireRole(['delivery']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lat, lng }: Position = req.body

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'lat y lng son requeridos' })
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        delivery_position: `SRID=4326;POINT(${lng} ${lat})`
      })
      .eq('id', req.params.id)
      .eq('delivery_id', req.user!.id)
      .select()
      .single()

    if (error) throw error

    // Verificar si llegó al destino (menos de 5 metros)
    const { data: arrivedData } = await supabase
      .rpc('check_delivery_arrived', { order_id: req.params.id })

    const arrived = arrivedData as boolean

    if (arrived) {
      await supabase
        .from('orders')
        .update({ status: OrderStatus.DELIVERED })
        .eq('id', req.params.id)
    }

    res.json({
      order: data,
      arrived: arrived || false
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar posición' })
  }
})

export default router