import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

interface Order {
  id: string
  total: number
  created_at: string
  stores?: { name: string }
  users?: { name: string }
}

interface User {
  name: string
}

export default function AvailableOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [acting, setActing] = useState<string | null>(null)
  const navigate = useNavigate()
  const user: User = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchOrders = () => {
    setLoading(true)
    api.get('/api/orders/available').then(res => {
      setOrders(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { fetchOrders() }, [])

  const accept = async (id: string) => {
    setActing(id)
    try {
      await api.patch(`/api/orders/${id}/accept`)
      // Redirigir al mapa de delivery con el id de la orden
      navigate(`/deliver/${id}`)
    } catch {
      alert('Error al aceptar la orden')
      setActing(null)
    }
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <span style={s.brand}>DeliveryApp</span>
        <div style={s.navRight}>
          <span style={s.navName}>{user.name}</span>
          <button style={s.navBtn} onClick={() => navigate('/my-orders')}>Mis pedidos</button>
          <button style={s.refreshBtn} onClick={fetchOrders}>Actualizar</button>
          <button style={s.navBtnGhost} onClick={logout}>Salir</button>
        </div>
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Pedidos disponibles</h1>
        {loading ? <p style={s.loading}>Cargando...</p> : (
          orders.length === 0
            ? <div style={s.empty}>
                <p style={s.emptyTitle}>No hay pedidos disponibles</p>
                <p style={s.emptyDesc}>Vuelve a revisar en unos minutos</p>
              </div>
            : <div style={s.list}>
                {orders.map(order => (
                  <div key={order.id} style={s.card}>
                    <div style={s.cardHeader}>
                      <div>
                        <p style={s.storeName}>{order.stores?.name}</p>
                        <p style={s.client}>Cliente: {order.users?.name}</p>
                      </div>
                      <span style={s.total}>${Number(order.total).toLocaleString()}</span>
                    </div>
                    <p style={s.date}>{new Date(order.created_at).toLocaleString()}</p>
                    <div style={s.actions}>
                      <button
                        style={s.acceptBtn}
                        onClick={() => accept(order.id)}
                        disabled={acting === order.id}
                      >
                        {acting === order.id ? 'Procesando...' : 'Aceptar'}
                      </button>
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
  navRight: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  navName: { fontSize: '14px', color: '#666', marginRight: '0.25rem' },
  navBtn: { padding: '0.4rem 1rem', background: '#ea580c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500' },
  refreshBtn: { padding: '0.4rem 1rem', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' },
  navBtnGhost: { padding: '0.4rem 1rem', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' },
  content: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { background: 'white', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid #eee' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' },
  storeName: { fontWeight: '600', fontSize: '15px', marginBottom: '0.2rem' },
  client: { fontSize: '13px', color: '#777', margin: '0' },
  total: { fontWeight: '700', fontSize: '1.1rem' },
  date: { fontSize: '12px', color: '#aaa', margin: '0.5rem 0 1rem' },
  actions: { display: 'flex', gap: '0.75rem' },
  acceptBtn: { flex: 1, padding: '0.65rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
  loading: { textAlign: 'center', color: '#666', padding: '2rem' },
  empty: { textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '10px', border: '1px solid #eee' },
  emptyTitle: { fontWeight: '600', marginBottom: '0.5rem' },
  emptyDesc: { color: '#999', fontSize: '14px', margin: '0' }
}