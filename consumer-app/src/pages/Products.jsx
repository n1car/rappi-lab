import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Products() {
  const { storeId } = useParams()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/api/products?store_id=${storeId}`).then(res => {
      setProducts(res.data)
      setLoading(false)
    })
    // Cargar carrito guardado
    const saved = localStorage.getItem('cart')
    if (saved) setCart(JSON.parse(saved))
  }, [storeId])

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id)
    let newCart
    if (existing) {
      newCart = cart.map(i => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1 } : i)
    } else {
      newCart = [...cart, { product_id: product.id, name: product.name,
        unit_price: product.price, quantity: 1, store_id: storeId }]
    }
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    localStorage.setItem('current_store_id', storeId)
  }

  const getQty = (id) => cart.find(i => i.product_id === id)?.quantity || 0
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/stores')}>← Volver</button>
        <h1 style={styles.title}>🛍️ Productos</h1>
        <button style={styles.cartBtn} onClick={() => navigate('/cart')}>
          🛒 Carrito {totalItems > 0 && <span style={styles.badge}>{totalItems}</span>}
        </button>
      </div>
      {loading ? <p>Cargando productos...</p> : (
        <div style={styles.grid}>
          {products.map(p => (
            <div key={p.id} style={styles.card}>
              <h3 style={styles.productName}>{p.name}</h3>
              {p.description && <p style={styles.desc}>{p.description}</p>}
              <p style={styles.price}>${Number(p.price).toLocaleString()}</p>
              <button style={styles.addBtn} onClick={() => addToCart(p)}>
                {getQty(p.id) > 0 ? `✅ Agregar (${getQty(p.id)})` : '+ Agregar al carrito'}
              </button>
            </div>
          ))}
          {products.length === 0 && <p>Esta tienda aún no tiene productos.</p>}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#e74c3c' },
  back: { padding: '0.5rem 1rem', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
  cartBtn: { padding: '0.5rem 1rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', position: 'relative' },
  badge: { background: 'white', color: '#e74c3c', borderRadius: '50%', padding: '0 6px', marginLeft: '6px', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' },
  card: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  productName: { margin: '0 0 0.5rem', color: '#2c3e50' },
  desc: { color: '#777', fontSize: '0.9rem' },
  price: { color: '#27ae60', fontWeight: 'bold', fontSize: '1.2rem' },
  addBtn: { width: '100%', padding: '0.6rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '0.5rem' }
}