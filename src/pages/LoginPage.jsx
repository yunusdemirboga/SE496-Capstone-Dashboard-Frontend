import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/auth'

export default function LoginPage() {
  const { register, handleSubmit } = useForm()
  const { setToken } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', data)
      setToken(res.data.access_token)
      navigate('/detections')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: '#f2f2f7',
    }}>
      <div style={{
        background: '#ffffff', padding: '2.5rem 2rem', borderRadius: '24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)', width: '360px', display: 'flex',
        flexDirection: 'column', gap: '1rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px', background: '#007aff',
            margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.75rem' }}>📡</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em' }}>
            UAV Detection
          </h2>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.95rem', color: '#8e8e93' }}>
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <input
            {...register('username')}
            placeholder="Username"
            required
            style={inputStyle}
          />
          <input
            {...register('password')}
            type="password"
            placeholder="Password"
            required
            style={inputStyle}
          />
          {error && (
            <p style={{ color: '#ff3b30', margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.85rem', fontSize: '1rem', fontWeight: 600,
              backgroundColor: '#007aff', color: 'white', border: 'none',
              borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: '0.25rem',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '0.85rem 1rem',
  fontSize: '1rem',
  border: '1.5px solid #e5e5ea',
  borderRadius: '14px',
  outline: 'none',
  color: '#1c1c1e',
  background: '#f2f2f7',
}
