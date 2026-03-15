import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import storeRoutes from './routes/stores.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// ── Middlewares globales ──────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://rappi-lab-consumer.vercel.app',
    'https://rappi-lab-store.vercel.app',
    'https://rappi-lab-delivery.vercel.app'
  ],
  credentials: true
}));

app.use(express.json())       // Parsea el body como JSON

// ── Rutas ─────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)

// ── Ruta de prueba ────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Rappi Lab API funcionando!' })
})

// ── Iniciar servidor ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`ervidor corriendo en http://localhost:${PORT}`)
})
