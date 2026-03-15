import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Stores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.get('/api/stores').then(res => { setStores(res.data); setLoading(false) })
  }, [])

  const logout = () => { localStorage.clear(); navigate('/login') }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <span style={s.brand}>QuickShop</span>
        <div style={s.navRight}>
          <span style={s.navName}>{user.name}</span>
          <button style={s.navBtn} onClick={() => navigate('/orders')}>Mis pedidos</button>
          <button style={s.navBtnGhost} onClick={logout}>Salir</button>
        </div>
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Tiendas</h1>
        <p style={s.sub}>Selecciona una tienda para ver sus productos</p>
        {loading ? <p style={s.loading}>Cargando...</p> : (
          <div style={s.grid}>
            {stores.map(store => (
              <div key={store.id} style={s.card}
                onClick={() => navigate(`/stores/${store.id}/products`)}>
                <div style={s.cardTop}>
                  <span style={store.is_open ? s.open : s.closed}>
                    {store.is_open ? 'Abierta' : 'Cerrada'}
                  </span>
                </div>
                <h2 style={s.storeName}>{store.name}</h2>
                <p style={s.cardLink}>Ver productos →</p>
              </div>
            ))}
            {stores.length === 0 && <p style={s.empty}>No hay tiendas disponibles.</p>}
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
  navRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  navName: { fontSize: '14px', color: '#666' },
  navBtn: { padding: '0.4rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500' },
  navBtnGhost: { padding: '0.4rem 1rem', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.25rem' },
  sub: { color: '#666', fontSize: '14px', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', border: '1px solid #eee' },
  cardTop: { marginBottom: '0.75rem' },
  storeName: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem' },
  open: { fontSize: '12px', fontWeight: '600', color: '#16a34a', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '20px' },
  closed: { fontSize: '12px', fontWeight: '600', color: '#dc2626', background: '#fef2f2', padding: '0.2rem 0.6rem', borderRadius: '20px' },
  cardLink: { fontSize: '13px', color: '#2563eb', margin: 0 },
  loading: { color: '#666', textAlign: 'center', padding: '2rem' },
  empty: { color: '#666', gridColumn: '1/-1' }
}