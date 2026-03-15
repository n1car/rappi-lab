import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// POST /api/orders — Crear orden (solo consumidor)
router.post('/', authenticate, requireRole(['consumer']), async (req, res) => {
  try {
    const { store_id, items } = req.body
    // items = [{ product_id, quantity, unit_price }, ...]

    if (!store_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'store_id e items son requeridos' })
    }

    // Calcular el total
    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ consumer_id: req.user.id, store_id, total })
      .select()
      .single()

    if (orderError) throw orderError

    // Crear los items de la orden
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
router.get('/my', authenticate, requireRole(['consumer']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, stores(name), order_items(*, products(name))`)
      .eq('consumer_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes' })
  }
})

// GET /api/orders/store — Órdenes de MI tienda (store)
router.get('/store', authenticate, requireRole(['store']), async (req, res) => {
  try {
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', req.user.id)
      .single()

    const { data, error } = await supabase
      .from('orders')
      .select(`*, users!consumer_id(name, email), order_items(*, products(name))`)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes de la tienda' })
  }
})

// GET /api/orders/available — Órdenes disponibles para repartir (delivery)
router.get('/available', authenticate, requireRole(['delivery']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, stores(name), users!consumer_id(name)`)
      .eq('status', 'pending')
      .is('delivery_id', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes disponibles' })
  }
})

// GET /api/orders/delivery — Mis órdenes aceptadas (delivery)
router.get('/delivery', authenticate, requireRole(['delivery']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, stores(name), users!consumer_id(name), order_items(*, products(name))`)
      .eq('delivery_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tus órdenes' })
  }
})

// PUT /api/orders/:id/accept — Aceptar orden (delivery)
router.put('/:id/accept', authenticate, requireRole(['delivery']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ delivery_id: req.user.id, status: 'accepted' })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Orden no disponible' })
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al aceptar orden' })
  }
})

// PUT /api/orders/:id/decline — Rechazar orden (delivery)
router.put('/:id/decline', authenticate, requireRole(['delivery']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'declined' })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Orden no disponible' })
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar orden' })
  }
})

export default router