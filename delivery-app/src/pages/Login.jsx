import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/login', form)
      if (res.data.user.role !== 'delivery') { setError('Esta app es solo para repartidores'); setLoading(false); return }
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/available')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>DeliveryApp</div>
        <h1 style={s.title}>Iniciar sesión</h1>
        <p style={s.sub}>Accede al panel de repartidor</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Correo electrónico</label>
          <input style={s.input} type="email" placeholder="tu@email.com"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <label style={s.label}>Contraseña</label>
          <input style={s.input} type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <p style={s.footer}>No tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: 'white', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  brand: { fontSize: '13px', fontWeight: '600', color: '#ea580c', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' },
  sub: { color: '#666', fontSize: '14px', marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem', outline: 'none', background: '#fafafa' },
  btn: { width: '100%', padding: '0.75rem', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', marginTop: '0.25rem' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', fontSize: '14px', marginBottom: '1rem' },
  footer: { textAlign: 'center', marginTop: '1.25rem', fontSize: '14px', color: '#666' }
}