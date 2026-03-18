import express, { Application } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import storeRoutes from './routes/stores'
import productRoutes from './routes/products'
import orderRoutes from './routes/orders'

dotenv.config()

const app: Application = express()
const PORT: number = parseInt(process.env.PORT || '4000')

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://rappi-lab-consumer-three.vercel.app',
    'https://rappi-lab-store-zeta.vercel.app',
    'https://rappi-lab-delivery-six.vercel.app'
  ],
  credentials: true
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)

app.get('/', (_req, res) => {
  res.json({ message: 'Rappi Lab API funcionando!' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})