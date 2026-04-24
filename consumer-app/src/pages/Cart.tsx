import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const MapPicker = lazy(() => import('../components/MapPicker'))

interface CartItem {
  product_id: string
  name: string
  unit_price: number
  quantity: number
}

interface Position {
  lat: number
  lng: number
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>(JSON.parse(localStorage.getItem('cart') || '[]'))
  const [loading, setLoading] = useState<boolean>(false)
  const [msg, setMsg] = useState<string>('')
  const [destination, setDestination] = useState<Position | null>(null)
  const navigate = useNavigate()

  const removeItem = (product_id: string) => {
    const newCart = cart.filter(i => i.product_id !== product_id)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const total = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const storeId = localStorage.getItem('current_store_id')

  const placeOrder = async () => {
    if (!destination) {
      setMsg('Debes seleccionar un punto de entrega en el mapa')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setMsg('Debes iniciar sesión primero')
        setLoading(false)
        navigate('/login')
        return
      }

      await api.post('/api/orders', {
        store_id: storeId,
        items: cart.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        })),
        destination
      })

      localStorage.removeItem('cart')
      localStorage.removeItem('current_store_id')
      setCart([])
      setMsg('Pedido creado correctamente')
      setTimeout(() => navigate('/orders'), 1500)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al crear el pedido'
      if (err.response?.status === 403) {
        setMsg('Sesión expirada, inicia sesión de nuevo')
        setTimeout(() => { localStorage.clear(); navigate('/login') }, 1500)
      } else {
        setMsg(errorMsg)
      }
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button style={s.back} onClick={() => navigate(-1)}>← Volver</button>
        <span style={s.brand}>QuickShop</span>
        <span />
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Carrito</h1>
        {msg && (
          <div style={msg.includes('correctamente') ? s.msgSuccess : s.msgError}>
            {msg}
          </div>
        )}
        {cart.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>Tu carrito está vacío</p>
            <button style={s.btn} onClick={() => navigate('/stores')}>Ver tiendas</button>
          </div>
        ) : (
          <div style={s.layout}>
            <div style={s.left}>
              <div style={s.items}>
                {cart.map(item => (
                  <div key={item.product_id} style={s.item}>
                    <div>
                      <p style={s.itemName}>{item.name}</p>
                      <p style={s.itemSub}>${Number(item.unit_price).toLocaleString()} x {item.quantity}</p>
                    </div>
                    <div style={s.itemRight}>
                      <span style={s.itemTotal}>${(item.unit_price * item.quantity).toLocaleString()}</span>
                      <button style={s.removeBtn} onClick={() => removeItem(item.product_id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mapa para seleccionar destino */}
              <div style={s.mapSection}>
                <h2 style={s.mapTitle}>Selecciona el punto de entrega</h2>
                <p style={s.mapHint}>Haz clic en el mapa para marcar tu ubicación</p>
                {destination && (
                  <p style={s.mapCoords}>
                    Ubicación seleccionada: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                  </p>
                )}
                <Suspense fallback={<div style={s.mapLoading}>Cargando mapa...</div>}>
                  <MapPicker position={destination} onSelect={setDestination} />
                </Suspense>
              </div>
            </div>

            <div style={s.summary}>
              <h2 style={s.summaryTitle}>Resumen</h2>
              <div style={s.summaryRow}>
                <span>Total</span>
                <strong>${Number(total).toLocaleString()}</strong>
              </div>
              <div style={s.summaryRow}>
                <span>Destino</span>
                <span style={{ color: destination ? '#16a34a' : '#dc2626', fontSize: '13px' }}>
                  {destination ? 'Seleccionado' : 'Pendiente'}
                </span>
              </div>
              <button style={s.orderBtn} onClick={placeOrder} disabled={loading || !destination}>
                {loading ? 'Procesando...' : 'Confirmar pedido'}
              </button>
            </div>
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
  content: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  items: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  item: { background: 'white', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '600', marginBottom: '0.2rem' },
  itemSub: { fontSize: '13px', color: '#777', margin: '0' },
  itemRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  itemTotal: { fontWeight: '700' },
  removeBtn: { background: 'none', border: 'none', color: '#dc2626', fontSize: '13px', padding: '0' },
  mapSection: { background: 'white', padding: '1.5rem', borderRadius: '10px', border: '1px solid #eee' },
  mapTitle: { fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' },
  mapHint: { fontSize: '13px', color: '#777', marginBottom: '0.75rem' },
  mapCoords: { fontSize: '13px', color: '#16a34a', marginBottom: '0.75rem', fontWeight: '500' },
  mapLoading: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', background: '#f5f5f5', borderRadius: '10px' },
  summary: { background: 'white', padding: '1.5rem', borderRadius: '10px', border: '1px solid #eee', position: 'sticky', top: '1rem' },
  summaryTitle: { fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '15px' },
  orderBtn: { width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', opacity: 1 },
  empty: { textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '10px', border: '1px solid #eee' },
  emptyText: { color: '#666', marginBottom: '1rem' },
  btn: { padding: '0.6rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600' },
  msgSuccess: { background: '#f0fdf4', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' },
  msgError: { background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }
}