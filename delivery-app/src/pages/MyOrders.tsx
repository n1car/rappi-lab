import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

interface OrderItem {
  id: string
  quantity: number
  products?: { name: string }
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  stores?: { name: string }
  users?: { name: string }
  order_items?: OrderItem[]
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/orders/delivery').then(res => { setOrders(res.data); setLoading(false) })
  }, [])

  const statusStyle: Record<string, React.CSSProperties> = {
    accepted:  { color: '#2563eb', background: '#eff6ff' },
    delivered: { color: '#16a34a', background: '#f0fdf4' },
    declined:  { color: '#dc2626', background: '#fef2f2' }
  }
  const statusLabel: Record<string, string> = {
    accepted: 'En camino', delivered: 'Entregado', declined: 'Rechazado'
  }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button style={s.back} onClick={() => navigate('/available')}>← Disponibles</button>
        <span style={s.brand}>DeliveryApp</span>
        <span />
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Mis pedidos</h1>
        {loading ? <p style={s.loading}>Cargando...</p> : (
          orders.length === 0
            ? <div style={s.empty}><p>No has aceptado pedidos aún.</p></div>
            : <div style={s.list}>
                {orders.map(order => (
                  <div key={order.id} style={s.card}>
                    <div style={s.cardHeader}>
                      <div>
                        <p style={s.storeName}>{order.stores?.name}</p>
                        <p style={s.client}>Cliente: {order.users?.name}</p>
                      </div>
                      <span style={{ ...s.status, ...statusStyle[order.status] }}>
                        {statusLabel[order.status]}
                      </span>
                    </div>
                    <div style={s.products}>
                      {order.order_items?.map(item => (
                        <span key={item.id} style={s.tag}>{item.products?.name} x{item.quantity}</span>
                      ))}
                    </div>
                    <div style={s.cardFooter}>
                      <span style={s.date}>{new Date(order.created_at).toLocaleDateString()}</span>
                      <span style={s.total}>Total: ${Number(order.total).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  navbar: { background: 'white', borderBottom: '1px solid #eee', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontWeight: '700', fontSize: '15px', color: '#ea580c' },
  back: { background: 'none', border: 'none', color: '#ea580c', fontSize: '14px', padding: '0' },
  content: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { background: 'white', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid #eee' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  storeName: { fontWeight: '600', marginBottom: '0.15rem' },
  client: { fontSize: '13px', color: '#999', margin: '0' },
  status: { fontSize: '12px', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '20px' },
  products: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' },
  tag: { fontSize: '13px', background: '#f5f5f5', padding: '0.2rem 0.6rem', borderRadius: '6px', color: '#444' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' },
  date: { fontSize: '13px', color: '#999' },
  total: { fontSize: '14px', fontWeight: '600' },
  loading: { textAlign: 'center', color: '#666', padding: '2rem' },
  empty: { textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '10px', border: '1px solid #eee', color: '#666' }
}