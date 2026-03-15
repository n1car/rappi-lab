import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Dashboard() {
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.get('/api/stores/my').then(res => {
      setStore(res.data)
      setLoading(false)
    })
  }, [])

  const toggleStore = async () => {
    setToggling(true)
    const res = await api.put('/api/stores/my/toggle')
    setStore(res.data)
    setToggling(false)
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (loading) return <p style={styles.loading}>Cargando...</p>

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🏪 {store?.name}</h1>
        <div>
          <span style={styles.userName}>👋 {user.name}</span>
          <button style={styles.btnLogout} onClick={logout}>Salir</button>
        </div>
      </div>

      {/* Status Card */}
      <div style={styles.statusCard}>
        <div>
          <h2 style={styles.statusTitle}>Estado de la tienda</h2>
          <p style={store?.is_open ? styles.open : styles.closed}>
            {store?.is_open ? '🟢 Abierta — Los clientes pueden verte' : '🔴 Cerrada — No apareces en el listado'}
          </p>
        </div>
        <button
          style={store?.is_open ? styles.closeBtn : styles.openBtn}
          onClick={toggleStore}
          disabled={toggling}
        >
          {toggling ? 'Actualizando...' : store?.is_open ? 'Cerrar Tienda' : 'Abrir Tienda'}
        </button>
      </div>

      {/* Nav Cards */}
      <div style={styles.grid}>
        <div style={styles.navCard} onClick={() => navigate('/products')}>
          <span style={styles.navIcon}>📦</span>
          <h3>Mis Productos</h3>
          <p style={styles.navDesc}>Crear y ver productos</p>
        </div>
        <div style={styles.navCard} onClick={() => navigate('/orders')}>
          <span style={styles.navIcon}>📋</span>
          <h3>Pedidos</h3>
          <p style={styles.navDesc}>Ver pedidos entrantes</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#8e44ad', margin: 0 },
  userName: { marginRight: '1rem', color: '#555' },
  btnLogout: { padding: '0.5rem 1rem', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  statusCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  statusTitle: { margin: '0 0 0.5rem', color: '#2c3e50' },
  open: { color: '#27ae60', fontWeight: 'bold', margin: 0 },
  closed: { color: '#e74c3c', fontWeight: 'bold', margin: 0 },
  openBtn: { padding: '0.75rem 1.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  closeBtn: { padding: '0.75rem 1.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  navCard: { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' },
  navIcon: { fontSize: '2.5rem' },
  navDesc: { color: '#777', margin: '0.5rem 0 0' },
  loading: { textAlign: 'center', padding: '3rem', color: '#666' }
}