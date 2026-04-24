import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

interface Position {
  lat: number
  lng: number
}

function MapUpdater({ position }: { position: Position }) {
  const map = useMap()
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom())
  }, [position, map])
  return null
}

const STEP = 0.00005

function randomNearby(center: Position, radiusDeg: number = 0.004): Position {
  const angle = Math.random() * 2 * Math.PI
  const distance = (Math.random() * 0.5 + 0.5) * radiusDeg
  return {
    lat: center.lat + distance * Math.cos(angle),
    lng: center.lng + distance * Math.sin(angle)
  }
}

export default function DeliverMap() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const [position, setPosition] = useState<Position>({ lat: 3.4516, lng: -76.5320 })
  const [destination, setDestination] = useState<Position | null>(null)
  const [delivered, setDelivered] = useState<boolean>(false)
  const [storeName, setStoreName] = useState<string>('')
  const [mapReady, setMapReady] = useState<boolean>(false)

  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPosition = useRef<Position>({ lat: 3.4516, lng: -76.5320 })
  const channelRef = useRef<any>(null)
  const orderIdRef = useRef<string>(orderId || '')

  // Suscribir canal una sola vez
  useEffect(() => {
    orderIdRef.current = orderId || ''
    const ch = supabase.channel(`order:${orderId}`)
    ch.subscribe((status: string) => {
      console.log('Canal delivery status:', status)
    })
    channelRef.current = ch

    return () => {
      ch.unsubscribe()
    }
  }, [orderId])

  useEffect(() => {
    api.get(`/api/orders/${orderId}`).then(res => {
      const order = res.data
      setStoreName(order.stores?.name || '')

      if (order.destination?.lat && order.destination?.lng) {
        const dest: Position = {
          lat: order.destination.lat,
          lng: order.destination.lng
        }
        setDestination(dest)

        const startPos = randomNearby(dest, 0.004)
        setPosition(startPos)
        pendingPosition.current = startPos
        setMapReady(true)
      } else {
        setMapReady(true)
      }
    })
  }, [orderId])

  const updatePosition = useCallback(async (pos: Position) => {
    try {
      console.log('Enviando posición:', pos)
      const res = await api.patch(`/api/orders/${orderIdRef.current}/position`, pos)
      console.log('Respuesta BD:', res.data)

      const sendResult = await channelRef.current?.send({
        type: 'broadcast',
        event: 'position-update',
        payload: { lat: pos.lat, lng: pos.lng }
      })
      console.log('Broadcast resultado:', sendResult)

      if (res.data.arrived) {
        console.log('LLEGÓ AL DESTINO!')
        setDelivered(true)
        await channelRef.current?.send({
          type: 'broadcast',
          event: 'order-delivered',
          payload: {}
        })
      }
    } catch (err) {
      console.error('Error actualizando posición:', err)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      let { lat, lng } = pendingPosition.current

      switch (e.key) {
        case 'ArrowUp':    lat += STEP; break
        case 'ArrowDown':  lat -= STEP; break
        case 'ArrowLeft':  lng -= STEP; break
        case 'ArrowRight': lng += STEP; break
        default: return
      }

      e.preventDefault()

      const newPos = { lat, lng }
      setPosition(newPos)
      pendingPosition.current = newPos

      console.log('Tecla presionada, nueva pos:', newPos)

      if (throttleRef.current) return

      throttleRef.current = setTimeout(() => {
        console.log('Throttle disparado, enviando:', pendingPosition.current)
        updatePosition(pendingPosition.current)
        throttleRef.current = null
      }, 1000)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (throttleRef.current) clearTimeout(throttleRef.current)
    }
  }, [updatePosition]) // solo depende de updatePosition que es estable

  if (delivered) {
    return (
      <div style={s.deliveredPage}>
        <div style={s.deliveredCard}>
          <h1 style={s.deliveredTitle}>Pedido entregado</h1>
          <p style={s.deliveredText}>Has llegado al destino correctamente.</p>
          <button style={s.btn} onClick={() => navigate('/available')}>
            Ver más pedidos
          </button>
        </div>
      </div>
    )
  }

  if (!mapReady) {
    return (
      <div style={s.deliveredPage}>
        <p style={{ color: '#666' }}>Cargando mapa...</p>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button style={s.back} onClick={() => navigate('/available')}>← Volver</button>
        <span style={s.brand}>DeliveryApp</span>
        <span />
      </div>
      <div style={s.content}>
        <div style={s.info}>
          <div>
            <h1 style={s.title}>Entregando pedido</h1>
            {storeName && <p style={s.subtitle}>Tienda: {storeName}</p>}
          </div>
          <div style={s.badge}>En entrega</div>
        </div>

        <div style={s.instructions}>
          Usa las teclas <kbd style={s.kbd}>↑</kbd> <kbd style={s.kbd}>↓</kbd> <kbd style={s.kbd}>←</kbd> <kbd style={s.kbd}>→</kbd> para moverte hacia el destino
        </div>

        <div style={s.mapWrapper}>
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={16}
            style={{ height: '500px', width: '100%', borderRadius: '10px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <MapUpdater position={position} />

            <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
              <Popup>Tu posición</Popup>
            </Marker>

            {destination && (
              <Marker position={[destination.lat, destination.lng]}>
                <Popup>Destino del cliente</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div style={s.coords}>
          Tu posición: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          {destination && (
            <span style={{ marginLeft: '1rem', color: '#2563eb' }}>
              Destino: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  navbar: { background: 'white', borderBottom: '1px solid #eee', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontWeight: '700', fontSize: '15px', color: '#ea580c' },
  back: { background: 'none', border: 'none', color: '#ea580c', fontSize: '14px', padding: '0' },
  content: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  info: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.25rem' },
  subtitle: { fontSize: '14px', color: '#666', margin: '0' },
  badge: { background: '#eff6ff', color: '#2563eb', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  instructions: { background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #eee', marginBottom: '1rem', fontSize: '14px', color: '#444', textAlign: 'center' },
  kbd: { background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 8px', fontSize: '13px', fontFamily: 'monospace' },
  mapWrapper: { borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  coords: { fontSize: '13px', color: '#999', textAlign: 'center' },
  deliveredPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  deliveredCard: { background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  deliveredTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', marginBottom: '1rem' },
  deliveredText: { color: '#666', marginBottom: '1.5rem' },
  btn: { padding: '0.75rem 2rem', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }
}