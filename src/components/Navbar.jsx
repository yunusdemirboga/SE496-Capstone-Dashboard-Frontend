import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function Navbar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(242, 242, 247, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      padding: '0 1.75rem',
      height: '68px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1c1c1e', letterSpacing: '-0.03em' }}>
          UAV Detection
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <NavLink to="/detections">Detections</NavLink>
          <NavLink to="/base-stations">Base Stations</NavLink>
        </div>
      </div>
      <button onClick={handleLogout} style={{
        padding: '0.5rem 1.1rem',
        fontSize: '0.95rem',
        background: 'transparent',
        color: '#8e8e93',
        border: '1.5px solid #d1d1d6',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 500,
      }}>
        Logout
      </button>
    </nav>
  )
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{
      padding: '0.5rem 1rem',
      borderRadius: '10px',
      fontSize: '0.95rem',
      color: '#3a3a3c',
      textDecoration: 'none',
      fontWeight: 500,
    }}>
      {children}
    </Link>
  )
}
