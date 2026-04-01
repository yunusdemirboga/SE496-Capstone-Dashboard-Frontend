import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import Navbar from './Navbar'

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7' }}>
      <Navbar />
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
