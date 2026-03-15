import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Products() {
  const [products, setProducts] = useState([])
  const [store, setStore] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/stores/my').then(res => {
      setStore(res.data)
      return api.get(`/api/products?store_id=${res.data.id}`)
    }).then(res => {
      setProducts(res.data)
      setLoading(false)
    })
  }, [])

  const createProduct = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const res = await api.post('/api/products', form)
      setProducts([res.data, ...products])
      setForm({ name: '', description: '', price: '' })
      setMsg('✅ Producto creado exitosamente')
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error al crear producto'))
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/dashboard')}>← Volver</button>
        <h1 style={styles.title}>📦 Mis Productos</h1>
      </div>

      {/* Formulario crear producto */}
      <div style={styles.formCard}>
        <h2 style={styles.formTitle}>Agregar nuevo producto</h2>
        {msg && <p style={msg.includes('✅') ? styles.success : styles.error}>{msg}</p>}
        <form onSubmit={createProduct}>
          <input style={styles.input} type="text" placeholder="Nombre del producto"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input style={styles.input} type="text" placeholder="Descripción (opcional)"
            value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <input style={styles.input} type="number" placeholder="Precio"
            value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min="0" step="0.01" />
          <button style={styles.button} type="submit">+ Crear Producto</button>
        </form>
      </div>

      {/* Lista de productos */}
      <h2 style={styles.listTitle}>Productos actuales ({products.length})</h2>
      {loading ? <p>Cargando...</p> : (
        <div style={styles.grid}>
          {products.map(p => (
            <div key={p.id} style={styles.card}>
              <h3 style={styles.productName}>{p.name}</h3>
              {p.description && <p style={styles.desc}>{p.description}</p>}
              <p style={styles.price}>${Number(p.price).toLocaleString()}</p>
            </div>
          ))}
          {products.length === 0 && <p style={styles.empty}>No tienes productos aún.</p>}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  title: { color: '#8e44ad', margin: 0 },
  back: { padding: '0.5rem 1rem', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
  formCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '2rem' },
  formTitle: { color: '#2c3e50', marginTop: 0 },
  input: { width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
  success: { color: '#27ae60', background: '#f0fff4', padding: '0.5rem', borderRadius: '6px', marginBottom: '1rem' },
  error: { color: '#e74c3c', background: '#ffeaea', padding: '0.5rem', borderRadius: '6px', marginBottom: '1rem' },
  listTitle: { color: '#2c3e50', marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  card: { background: 'white', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  productName: { margin: '0 0 0.5rem', color: '#2c3e50' },
  desc: { color: '#777', fontSize: '0.9rem' },
  price: { color: '#27ae60', fontWeight: 'bold', fontSize: '1.1rem', margin: 0 },
  empty: { color: '#666', gridColumn: '1/-1' }
}