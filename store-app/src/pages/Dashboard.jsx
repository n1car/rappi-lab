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
    api.get('/api/stores/my').then(res => { setStore(res.data); setLoading(false) })
  }, [])

  const toggleStore = async () => {
    setToggling(true)
    const res = await api.put('/api/stores/my/toggle')
    setStore(res.data)
    setToggling(false)
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  if (loading) return <div style={s.loading}>Cargando...</div>

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <span style={s.brand}>StorePanel</span>
        <div style={s.navRight}>
          <span style={s.navName}>{user.name}</span>
          <button style={s.navBtnGhost} onClick={logout}>Salir</button>
        </div>
      </div>
      <div style={s.content}>
        <h1 style={s.title}>{store?.name}</h1>
        <div style={s.statusCard}>
          <div>
            <p style={s.statusLabel}>Estado de la tienda</p>
            <p style={store?.is_open ? s.open : s.closed}>
              {store?.is_open ? 'Abierta' : 'Cerrada'}
            </p>
          </div>
          <button style={store?.is_open ? s.closeBtn : s.openBtn} onClick={toggleStore} disabled={toggling}>
            {toggling ? 'Actualizando...' : store?.is_open ? 'Cerrar tienda' : 'Abrir tienda'}
          </button>
        </div>
        <div style={s.grid}>
          <div style={s.navCard} onClick={() => navigate('/products')}>
            <h3 style={s.navTitle}>Productos</h3>
            <p style={s.navDesc}>Crear y administrar productos</p>
            <span style={s.navLink}>Ver productos →</span>
          </div>
          <div style={s.navCard} onClick={() => navigate('/orders')}>
            <h3 style={s.navTitle}>Pedidos</h3>
            <p style={s.navDesc}>Revisar pedidos entrantes</p>
            <span style={s.navLink}>Ver pedidos →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  navbar: { background: 'white', borderBottom: '1px solid #eee', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontWeight: '700', fontSize: '15px', color: '#7c3aed' },
  navRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  navName: { fontSize: '14px', color: '#666' },
  navBtnGhost: { padding: '0.4rem 1rem', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' },
  content: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  statusCard: { background: 'white', padding: '1.5rem', borderRadius: '10px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  statusLabel: { fontSize: '13px', color: '#777', marginBottom: '0.25rem' },
  open: { fontWeight: '600', color: '#16a34a', margin: 0 },
  closed: { fontWeight: '600', color: '#dc2626', margin: 0 },
  openBtn: { padding: '0.6rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
  closeBtn: { padding: '0.6rem 1.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  navCard: { background: 'white', padding: '1.5rem', borderRadius: '10px', border: '1px solid #eee', cursor: 'pointer' },
  navTitle: { fontWeight: '700', marginBottom: '0.4rem' },
  navDesc: { fontSize: '13px', color: '#777', marginBottom: '0.75rem' },
  navLink: { fontSize: '13px', color: '#7c3aed', fontWeight: '500' },
  loading: { textAlign: 'center', padding: '3rem', color: '#666' }
}