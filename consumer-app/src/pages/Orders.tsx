import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../api/client'
import { supabase } from '../lib/supabase'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface OrderItem {
  id: string
  quantity: number
  products?: { name: string }
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  stores?: { name: string }
  order_items?: OrderItem[]
  destination?: { lat: number; lng: number } | string | null
}

interface Position {
  lat: number
  lng: number
}

function MapCenterUpdater({ position }: { position: Position }) {
  const map = useMap()
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom())
  }, [position, map])
  return null
}

function parsePosition(raw: any): Position | null {
  if (!raw) return null
  if (typeof raw === 'object' && raw.lat !== undefined) {
    return { lat: raw.lat, lng: raw.lng }
  }
  try {
    const geo = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (geo?.coordinates) {
      return { lat: geo.coordinates[1], lng: geo.coordinates[0] }
    }
  } catch { }
  return null
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [deliveryPositions, setDeliveryPositions] = useState<Record<string, Position>>({})
  const [arrivedOrders, setArrivedOrders] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const channelsRef = useRef<Record<string, any>>({})
  const navigate = useNavigate()

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const subscribeToOrder = (orderId: string) => {
    if (channelsRef.current[orderId]) return

    const channel = supabase.channel(`order:${orderId}`)

    channel.on('broadcast', { event: 'position-update' }, (payload: any) => {
      const { lat, lng } = payload.payload
      setDeliveryPositions(prev => ({ ...prev, [orderId]: { lat, lng } }))
    })

    channel.on('broadcast', { event: 'order-delivered' }, () => {
      setArrivedOrders(prev => new Set([...prev, orderId]))
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'Entregado' } : o
      ))
    })

    channel.subscribe()
    channelsRef.current[orderId] = channel
  }

  useEffect(() => {
    api.get('/api/orders/my').then(res => {
      const data = res.data
      setOrders(data)
      setLoading(false)

      data.forEach((order: Order) => {
        if (order.status === 'En entrega') {
          subscribeToOrder(order.id)
        }
      })
    })

    return () => {
      Object.values(channelsRef.current).forEach((ch: any) => ch?.unsubscribe())
    }
  }, [])

  const statusStyle: Record<string, React.CSSProperties> = {
    'Creado':     { color: '#d97706', background: '#fffbeb' },
    'En entrega': { color: '#2563eb', background: '#eff6ff' },
    'Entregado':  { color: '#16a34a', background: '#f0fdf4' }
  }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button style={s.back} onClick={() => navigate('/stores')}>← Tiendas</button>
        <span style={s.brand}>QuickShop</span>
        <button style={s.refreshBtn} onClick={() => window.location.reload()}>Actualizar</button>
      </div>
      <div style={s.content}>
        <h1 style={s.title}>Mis pedidos</h1>

        {/* Notificación de llegada */}
        {[...arrivedOrders].map(orderId => (
          <div key={orderId} style={s.toast}>
            Tu repartidor ha llegado al destino
          </div>
        ))}

        {loading ? <p style={s.loading}>Cargando...</p> : (
          orders.length === 0
            ? <div style={s.empty}><p>No tienes pedidos aún.</p></div>
            : <div style={s.list}>
                {orders.map(order => {
                  const deliveryPos = deliveryPositions[order.id]
                  const destPos = parsePosition(order.destination)
                  const showMap = order.status === 'En entrega'
                  const isCollapsed = collapsed.has(order.id)

                  return (
                    <div key={order.id} style={s.card}>
                      <div style={s.cardHeader} onClick={() => toggleCollapse(order.id)}>
                        <span style={s.storeName}>{order.stores?.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ ...s.status, ...statusStyle[order.status] }}>
                            {order.status}
                          </span>
                          <span style={s.collapseBtn}>{isCollapsed ? '▼' : '▲'}</span>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <>
                          <div style={s.products}>
                            {order.order_items?.map(item => (
                              <span key={item.id} style={s.tag}>
                                {item.products?.name} x{item.quantity}
                              </span>
                            ))}
                          </div>

                          {showMap && (
                            <div style={s.mapContainer}>
                              <p style={s.mapLabel}>
                                Tracking en tiempo real
                                {!deliveryPos && <span style={s.waitingText}> — Esperando posición del repartidor...</span>}
                              </p>
                              {(deliveryPos || destPos) && (
                                <MapContainer
                                  center={deliveryPos ? [deliveryPos.lat, deliveryPos.lng] : [destPos!.lat, destPos!.lng]}
                                  zoom={16}
                                  style={{ height: '280px', width: '100%', borderRadius: '8px' }}
                                >
                                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                  {deliveryPos && <MapCenterUpdater position={deliveryPos} />}
                                  {deliveryPos && (
                                    <Marker position={[deliveryPos.lat, deliveryPos.lng]} icon={deliveryIcon}>
                                      <Popup>Repartidor</Popup>
                                    </Marker>
                                  )}
                                  {destPos && (
                                    <Marker position={[destPos.lat, destPos.lng]}>
                                      <Popup>Tu destino</Popup>
                                    </Marker>
                                  )}
                                </MapContainer>
                              )}
                            </div>
                          )}

                          <div style={s.cardFooter}>
                            <span style={s.date}>{new Date(order.created_at).toLocaleDateString()}</span>
                            <span style={s.total}>Total: ${Number(order.total).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
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
  refreshBtn: { padding: '0.4rem 1rem', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  content: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { background: 'white', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid #eee' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', cursor: 'pointer' },
  storeName: { fontWeight: '600', fontSize: '15px' },
  status: { fontSize: '12px', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '20px' },
  collapseBtn: { fontSize: '12px', color: '#999', cursor: 'pointer' },
  products: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' },
  tag: { fontSize: '13px', background: '#f5f5f5', padding: '0.2rem 0.6rem', borderRadius: '6px', color: '#444' },
  mapContainer: { marginBottom: '0.75rem', background: '#f9f9f9', padding: '0.75rem', borderRadius: '8px' },
  mapLabel: { fontSize: '13px', fontWeight: '600', color: '#2563eb', marginBottom: '0.5rem' },
  waitingText: { color: '#999', fontWeight: '400' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' },
  date: { fontSize: '13px', color: '#999' },
  total: { fontSize: '14px', fontWeight: '600' },
  loading: { textAlign: 'center', color: '#666', padding: '2rem' },
  empty: { textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '10px', border: '1px solid #eee', color: '#666' },
  toast: { background: '#16a34a', color: 'white', padding: '1rem 1.5rem', borderRadius: '10px', marginBottom: '1rem', fontWeight: '600', textAlign: 'center', fontSize: '15px' }
}