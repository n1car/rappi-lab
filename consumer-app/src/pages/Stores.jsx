import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Stores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.get('/api/stores').then(res => {
      setStores(res.data)
      setLoading(false)
    })
  }, [])

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛒 Tiendas disponibles</h1>
        <div>
          <span style={styles.userName}>👋 {user.name}</span>
          <button style={styles.btnSecondary} onClick={() => navigate('/orders')}>Mis pedidos</button>
          <button style={styles.btnLogout} onClick={logout}>Salir</button>
        </div>
      </div>
      {loading ? <p style={styles.loading}>Cargando tiendas...</p> : (
        <div style={styles.grid}>
          {stores.map(store => (
            <div key={store.id} style={styles.card}
              onClick={() => navigate(`/stores/${store.id}/products`)}>
              <h2 style={styles.storeName}>{store.name}</h2>
              <span style={store.is_open ? styles.open : styles.closed}>
                {store.is_open ? '🟢 Abierta' : '🔴 Cerrada'}
              </span>
              <p style={styles.viewProducts}>Ver productos →</p>
            </div>
          ))}
          {stores.length === 0 && <p>No hay tiendas disponibles aún.</p>}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#e74c3c' },
  userName: { marginRight: '1rem', color: '#555' },
  btnSecondary: { marginRight: '0.5rem', padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnLogout: { padding: '0.5rem 1rem', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s' },
  storeName: { margin: '0 0 0.5rem', color: '#2c3e50' },
  open: { color: '#27ae60', fontWeight: 'bold' },
  closed: { color: '#e74c3c', fontWeight: 'bold' },
  viewProducts: { color: '#3498db', marginTop: '1rem', marginBottom: 0 },
  loading: { textAlign: 'center', color: '#666' }
}