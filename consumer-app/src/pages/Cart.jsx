import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Cart() {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'))
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const removeItem = (product_id) => {
    const newCart = cart.filter(i => i.product_id !== product_id)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const total = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const storeId = localStorage.getItem('current_store_id')

  const placeOrder = async () => {
    setLoading(true)
    try {
      await api.post('/api/orders', {
        store_id: storeId,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price }))
      })
      localStorage.removeItem('cart')
      localStorage.removeItem('current_store_id')
      setCart([])
      setMsg('Pedido creado correctamente')
      setTimeout(() => navigate('/orders'), 1500)
    } catch {
      setMsg('Error al crear el pedido')
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button style={s.back} onClick={() => navigate(-1)}>← Volver</button>
        <span style={s.brand}>QuickShop</span>
        <span />
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Carrito</h1>
        {msg && <div style={s.msgBox}>{msg}</div>}
        {cart.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>Tu carrito está vacío</p>
            <button style={s.btn} onClick={() => navigate('/stores')}>Ver tiendas</button>
          </div>
        ) : (
          <div style={s.layout}>
            <div style={s.items}>
              {cart.map(item => (
                <div key={item.product_id} style={s.item}>
                  <div>
                    <p style={s.itemName}>{item.name}</p>
                    <p style={s.itemSub}>${Number(item.unit_price).toLocaleString()} x {item.quantity}</p>
                  </div>
                  <div style={s.itemRight}>
                    <span style={s.itemTotal}>${(item.unit_price * item.quantity).toLocaleString()}</span>
                    <button style={s.removeBtn} onClick={() => removeItem(item.product_id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={s.summary}>
              <h2 style={s.summaryTitle}>Resumen</h2>
              <div style={s.summaryRow}>
                <span>Total</span>
                <strong>${Number(total).toLocaleString()}</strong>
              </div>
              <button style={s.orderBtn} onClick={placeOrder} disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  navbar: { background: 'white', borderBottom: '1px solid #eee', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontWeight: '700', fontSize: '15px', color: '#2563eb' },
  back: { background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', padding: 0 },
  content: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' },
  items: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  item: { background: 'white', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '600', marginBottom: '0.2rem' },
  itemSub: { fontSize: '13px', color: '#777', margin: 0 },
  itemRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  itemTotal: { fontWeight: '700' },
  removeBtn: { background: 'none', border: 'none', color: '#dc2626', fontSize: '13px', padding: 0 },
  summary: { background: 'white', padding: '1.5rem', borderRadius: '10px', border: '1px solid #eee' },
  summaryTitle: { fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '15px' },
  orderBtn: { width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '10px', border: '1px solid #eee' },
  emptyText: { color: '#666', marginBottom: '1rem' },
  btn: { padding: '0.6rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600' },
  msgBox: { background: '#f0fdf4', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }
}