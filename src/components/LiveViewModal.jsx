import { useEffect, useRef, useState } from 'react'

const WS_URL = 'wss://se496-capstone-dashboard-backend.onrender.com/ws/stream/viewer'

const STATUS = {
  connecting: { label: 'Connecting...', color: '#ff9f0a' },
  waiting:    { label: 'Waiting for stream...', color: '#ff9f0a' },
  streaming:  { label: 'Live', color: '#34c759' },
  unavailable:{ label: 'Stream unavailable', color: '#ff3b30' },
}

export default function LiveViewModal({ onClose }) {
  const imgRef = useRef(null)
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => setStatus('waiting')

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'frame' && imgRef.current) {
          imgRef.current.src = `data:image/jpeg;base64,${msg.data}`
          setStatus('streaming')
        }
      } catch {}
    }

    ws.onerror = () => setStatus('unavailable')
    ws.onclose = (e) => { if (e.code !== 1000) setStatus('unavailable') }

    return () => ws.close(1000)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { label, color } = STATUS[status]
  const isStreaming = status === 'streaming'

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{
        position: 'relative',
        width: '90vw',
        maxWidth: '1100px',
        background: '#1c1c1e',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Live View
            </span>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color,
              background: `${color}20`,
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              {isStreaming && (
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                  boxShadow: `0 0 6px ${color}`,
                  animation: 'livePulse 1.5s ease-in-out infinite',
                }} />
              )}
              {label}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Stream area */}
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            ref={imgRef}
            alt="Live camera feed"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: isStreaming ? 'block' : 'none',
            }}
          />

          {!isStreaming && (
            <div style={{ textAlign: 'center', color: '#aeaeb2' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>
                {status === 'unavailable' ? '⚠️' : '📡'}
              </div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color }}>
                {label}
              </p>
              {status !== 'unavailable' && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#636366' }}>
                  Waiting for Jetson to connect…
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
