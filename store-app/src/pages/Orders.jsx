import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/orders/store').then(res => {
      setOrders(res.data)
      setLoading(false)
    })
  }, [])

  const statusColor = { pending: '#f39c12', accepted: '#3498db', delivered: '#27ae60', declined: '#e74c3c' }
  const statusLabel = { pending: '⏳ Pendiente', accepted: '🚴 En camino', delivered: '✅ Entregado', declined: '❌ Rechazado' }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/dashboard')}>← Volver</button>
        <h1 style={styles.title}>📋 Pedidos de mi tienda</h1>
      </div>
      {loading ? <p>Cargando pedidos...</p> : (
        orders.length === 0 ? <p style={styles.empty}>No hay pedidos aún.</p> :
        orders.map(order => (
          <div key={order.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <strong>Cliente: {order.users?.name}</strong>
                <p style={styles.email}>{order.users?.email}</p>
              </div>
              <span style={{ ...styles.status, color: statusColor[order.status] }}>
                {statusLabel[order.status]}
              </span>
            </div>
            <div style={styles.items}>
              {order.order_items?.map(item => (
                <span key={item.id} style={styles.item}>
                  {item.products?.name} x{item.quantity}
                </span>
              ))}
            </div>
            <div style={styles.cardFooter}>
              <span style={styles.date}>{new Date(order.created_at).toLocaleDateString()}</span>
              <strong style={styles.total}>Total: ${Number(order.total).toLocaleString()}</strong>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  title: { color: '#8e44ad', margin: 0 },
  back: { padding: '0.5rem 1rem', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  email: { color: '#999', fontSize: '0.85rem', margin: '0.25rem 0 0' },
  status: { fontWeight: 'bold' },
  items: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' },
  item: { background: '#f5eef8', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.9rem' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '0.75rem' },
  date: { color: '#999', fontSize: '0.9rem' },
  total: { color: '#27ae60' },
  empty: { textAlign: 'center', color: '#666', padding: '2rem' }
}