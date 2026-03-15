import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function AvailableOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchOrders = () => {
    setLoading(true)
    api.get('/api/orders/available').then(res => {
      setOrders(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { fetchOrders() }, [])

  const accept = async (id) => {
    setActing(id)
    try {
      await api.put(`/api/orders/${id}/accept`)
      fetchOrders()
    } catch (err) {
      alert('Error al aceptar la orden')
    }
    setActing(null)
  }

  const decline = async (id) => {
    setActing(id)
    try {
      await api.put(`/api/orders/${id}/decline`)
      fetchOrders()
    } catch (err) {
      alert('Error al rechazar la orden')
    }
    setActing(null)
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚴 Órdenes Disponibles</h1>
        <div>
          <span style={styles.userName}>👋 {user.name}</span>
          <button style={styles.btnSecondary} onClick={() => navigate('/my-orders')}>Mis órdenes</button>
          <button style={styles.btnRefresh} onClick={fetchOrders}>🔄</button>
          <button style={styles.btnLogout} onClick={logout}>Salir</button>
        </div>
      </div>

      {loading ? <p style={styles.loading}>Cargando órdenes...</p> : (
        orders.length === 0
          ? <div style={styles.empty}><p>🎉 No hay órdenes disponibles por ahora.</p><p style={styles.hint}>Vuelve a revisar en unos minutos</p></div>
          : orders.map(order => (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <strong style={styles.storeName}>🏪 {order.stores?.name}</strong>
                  <p style={styles.consumer}>👤 Cliente: {order.users?.name}</p>
                </div>
                <strong style={styles.total}>${Number(order.total).toLocaleString()}</strong>
              </div>
              <p style={styles.date}>📅 {new Date(order.created_at).toLocaleString()}</p>
              <div style={styles.actions}>
                <button
                  style={styles.acceptBtn}
                  onClick={() => accept(order.id)}
                  disabled={acting === order.id}
                >
                  {acting === order.id ? 'Procesando...' : '✅ Aceptar'}
                </button>
                <button
                  style={styles.declineBtn}
                  onClick={() => decline(order.id)}
                  disabled={acting === order.id}
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>
          ))
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { color: '#e67e22', margin: 0 },
  userName: { marginRight: '0.5rem', color: '#555' },
  btnSecondary: { marginRight: '0.5rem', padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnRefresh: { marginRight: '0.5rem', padding: '0.5rem 0.75rem', background: '#ecf0f1', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnLogout: { padding: '0.5rem 1rem', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' },
  storeName: { color: '#2c3e50', fontSize: '1.1rem' },
  consumer: { color: '#777', margin: '0.25rem 0 0', fontSize: '0.9rem' },
  total: { color: '#27ae60', fontSize: '1.2rem' },
  date: { color: '#999', fontSize: '0.85rem', margin: '0 0 1rem' },
  actions: { display: 'flex', gap: '1rem' },
  acceptBtn: { flex: 1, padding: '0.75rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  declineBtn: { flex: 1, padding: '0.75rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  loading: { textAlign: 'center', color: '#666' },
  empty: { textAlign: 'center', padding: '3rem', color: '#666' },
  hint: { color: '#aaa', fontSize: '0.9rem' }
}