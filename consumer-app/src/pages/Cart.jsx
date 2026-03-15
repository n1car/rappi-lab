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
    if (cart.length === 0) return
    setLoading(true)
    try {
      await api.post('/api/orders', {
        store_id: storeId,
        items: cart.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      })
      localStorage.removeItem('cart')
      localStorage.removeItem('current_store_id')
      setCart([])
      setMsg('✅ ¡Pedido creado exitosamente!')
      setTimeout(() => navigate('/orders'), 1500)
    } catch (err) {
      setMsg('❌ Error al crear el pedido')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate(-1)}>← Volver</button>
        <h1 style={styles.title}>🛒 Mi Carrito</h1>
      </div>
      {msg && <p style={styles.msg}>{msg}</p>}
      {cart.length === 0 ? (
        <div style={styles.empty}>
          <p>Tu carrito está vacío</p>
          <button style={styles.btn} onClick={() => navigate('/stores')}>Ver tiendas</button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.product_id} style={styles.item}>
              <div>
                <strong>{item.name}</strong>
                <p style={styles.itemPrice}>${Number(item.unit_price).toLocaleString()} × {item.quantity}</p>
              </div>
              <div style={styles.itemRight}>
                <strong>${(item.unit_price * item.quantity).toLocaleString()}</strong>
                <button style={styles.removeBtn} onClick={() => removeItem(item.product_id)}>✕</button>
              </div>
            </div>
          ))}
          <div style={styles.total}>
            <strong>Total: ${Number(total).toLocaleString()}</strong>
          </div>
          <button style={styles.orderBtn} onClick={placeOrder} disabled={loading}>
            {loading ? 'Procesando...' : '✅ Confirmar Pedido'}
          </button>
        </>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  title: { color: '#e74c3c', margin: 0 },
  back: { padding: '0.5rem 1rem', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  itemPrice: { color: '#666', margin: '0.25rem 0 0' },
  itemRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  removeBtn: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.1rem' },
  total: { textAlign: 'right', fontSize: '1.3rem', margin: '1.5rem 0' },
  orderBtn: { width: '100%', padding: '1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '3rem' },
  btn: { padding: '0.75rem 2rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '1rem' },
  msg: { padding: '1rem', background: '#f0fff4', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }
}