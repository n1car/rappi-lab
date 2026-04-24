import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para el ícono de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Position {
  lat: number
  lng: number
}

interface MapPickerProps {
  position: Position | null
  onSelect: (pos: Position) => void
}

// Componente interno que captura el click en el mapa
function ClickHandler({ onSelect }: { onSelect: (pos: Position) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

export default function MapPicker({ position, onSelect }: MapPickerProps) {
  // Coordenadas de Cali, Colombia como centro por defecto
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : [3.4516, -76.5320]

  return (
    <div style={{ height: '300px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #ddd' }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <ClickHandler onSelect={onSelect} />
        {position && (
          <Marker position={[position.lat, position.lng]} />
        )}
      </MapContainer>
    </div>
  )
}