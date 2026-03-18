import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

interface Product {
  id: string
  name: string
  description?: string
  price: number
}

interface CartItem {
  product_id: string
  name: string
  unit_price: number
  quantity: number
  store_id: string
}

export default function Products() {
  const { storeId } = useParams<{ storeId: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/api/products?store_id=${storeId}`).then(res => { setProducts(res.data); setLoading(false) })
    const saved = localStorage.getItem('cart')
    if (saved) setCart(JSON.parse(saved))
  }, [storeId])

  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product_id === product.id)
    const newCart: CartItem[] = existing
      ? cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...cart, { product_id: product.id, name: product.name, unit_price: product.price, quantity: 1, store_id: storeId! }]
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    localStorage.setItem('current_store_id', storeId!)
  }

  const getQty = (id: string): number => cart.find(i => i.product_id === id)?.quantity || 0
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button style={s.back} onClick={() => navigate('/stores')}>← Tiendas</button>
        <span style={s.brand}>QuickShop</span>
        <button style={s.cartBtn} onClick={() => navigate('/cart')}>
          Carrito {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
        </button>
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Productos</h1>
        {loading ? <p style={s.loading}>Cargando...</p> : (
          <div style={s.grid}>
            {products.map(p => (
              <div key={p.id} style={s.card}>
                <h3 style={s.name}>{p.name}</h3>
                {p.description && <p style={s.desc}>{p.description}</p>}
                <div style={s.cardFooter}>
                  <span style={s.price}>${Number(p.price).toLocaleString()}</span>
                  <button style={getQty(p.id) > 0 ? s.addedBtn : s.addBtn} onClick={() => addToCart(p)}>
                    {getQty(p.id) > 0 ? `Agregar (${getQty(p.id)})` : 'Agregar'}
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p style={s.empty}>Esta tienda no tiene productos aún.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  navbar: { background: 'white', borderBottom: '1px solid #eee', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontWeight: '700', fontSize: '15px', color: '#2563eb' },
  back: { background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', padding: '0' },
  cartBtn: { padding: '0.4rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', position: 'relative' },
  badge: { background: 'white', color: '#2563eb', borderRadius: '10px', padding: '0 5px', marginLeft: '5px', fontWeight: '700', fontSize: '12px' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  card: { background: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #eee', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  name: { fontSize: '1rem', fontWeight: '600', marginBottom: '0.4rem' },
  desc: { fontSize: '13px', color: '#777', marginBottom: '1rem' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' },
  price: { fontWeight: '700', color: '#1a1a1a', fontSize: '1rem' },
  addBtn: { padding: '0.4rem 0.9rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px' },
  addedBtn: { padding: '0.4rem 0.9rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px' },
  loading: { color: '#666', textAlign: 'center', padding: '2rem' },
  empty: { color: '#666', gridColumn: '1/-1' }
}