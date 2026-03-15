import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Products() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/stores/my').then(res =>
      api.get(`/api/products?store_id=${res.data.id}`)
    ).then(res => { setProducts(res.data); setLoading(false) })
  }, [])

  const createProduct = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const res = await api.post('/api/products', form)
      setProducts([res.data, ...products])
      setForm({ name: '', description: '', price: '' })
      setMsg('success')
    } catch {
      setMsg('error')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <span style={s.brand}>StorePanel</span>
        <span />
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Productos</h1>
        <div style={s.layout}>
          <div>
            <div style={s.formCard}>
              <h2 style={s.formTitle}>Nuevo producto</h2>
              {msg === 'success' && <div style={s.success}>Producto creado correctamente</div>}
              {msg === 'error' && <div style={s.error}>Error al crear el producto</div>}
              <form onSubmit={createProduct}>
                <label style={s.label}>Nombre</label>
                <input style={s.input} type="text" placeholder="Nombre del producto"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                <label style={s.label}>Descripción</label>
                <input style={s.input} type="text" placeholder="Descripción (opcional)"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <label style={s.label}>Precio</label>
                <input style={s.input} type="number" placeholder="0.00"
                  value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min="0" step="0.01" />
                <button style={s.btn} type="submit">Crear producto</button>
              </form>
            </div>
          </div>
          <div>
            <h2 style={s.listTitle}>Lista ({products.length})</h2>
            {loading ? <p style={s.loading}>Cargando...</p> : (
              <div style={s.list}>
                {products.map(p => (
                  <div key={p.id} style={s.productCard}>
                    <div>
                      <p style={s.productName}>{p.name}</p>
                      {p.description && <p style={s.productDesc}>{p.description}</p>}
                    </div>
                    <span style={s.price}>${Number(p.price).toLocaleString()}</span>
                  </div>
                ))}
                {products.length === 0 && <p style={s.empty}>No hay productos aún.</p>}
              </div>
            )}
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
  back: { background: 'none', border: 'none', color: '#7c3aed', fontSize: '14px', padding: 0 },
  content: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  layout: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' },
  formCard: { background: 'white', padding: '1.5rem', borderRadius: '10px', border: '1px solid #eee' },
  formTitle: { fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem', outline: 'none', background: '#fafafa' },
  btn: { width: '100%', padding: '0.7rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px' },
  success: { background: '#f0fdf4', color: '#16a34a', padding: '0.6rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '0.6rem', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' },
  listTitle: { fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  productCard: { background: 'white', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontWeight: '600', marginBottom: '0.15rem' },
  productDesc: { fontSize: '13px', color: '#777', margin: 0 },
  price: { fontWeight: '700', color: '#1a1a1a', whiteSpace: 'nowrap' },
  loading: { color: '#666', fontSize: '14px' },
  empty: { color: '#999', fontSize: '14px' }
}