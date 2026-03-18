import axios, { InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: typeof window !== 'undefined'
    ? (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000'
    : 'http://localhost:4000'
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api