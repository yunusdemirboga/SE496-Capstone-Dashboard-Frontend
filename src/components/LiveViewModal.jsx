import { useEffect, useRef, useState } from 'react'

const WS_URL = 'wss://se496-capstone-dashboard-backend.onrender.com/ws/webrtc/viewer'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

const STATUS = {
  connecting:   { label: 'Connecting...',        color: '#ff9f0a' },
  waiting:      { label: 'Waiting for Jetson...', color: '#ff9f0a' },
  live:         { label: 'Live',                  color: '#34c759' },
  ended:        { label: 'Stream ended',          color: '#ff3b30' },
  unavailable:  { label: 'Stream unavailable',    color: '#ff3b30' },
  no_producer:  { label: 'Jetson not connected',  color: '#ff3b30' },
}

export default function LiveViewModal({ onClose }) {
  const videoRef = useRef(null)
  const wsRef    = useRef(null)
  const pcRef    = useRef(null)
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc

    // Send our ICE candidates to the remote peer via signaling
    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type:        'ice-candidate',
          candidate:   e.candidate.candidate,
          sdpMid:      e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
        }))
      }
    }

    // Fix 1: prefer H264 to reduce decode latency
    const preferH264 = (transceiver) => {
      const { codecs } = RTCRtpReceiver.getCapabilities('video')
      const h264 = codecs.filter(c => c.mimeType === 'video/H264')
      const rest = codecs.filter(c => c.mimeType !== 'video/H264')
      transceiver.setCodecPreferences([...h264, ...rest])
    }

    // Fix 2+3: set srcObject then call play() immediately to minimize buffering
    pc.ontrack = (e) => {
      preferH264(e.transceiver)
      if (videoRef.current) {
        videoRef.current.srcObject = e.streams[0]
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        videoRef.current.play().catch(() => {})
        setStatus('live')
      }
    }

    // Only trigger on true failure — 'disconnected' is transient and can recover
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        setStatus('ended')
        pc.close()
      }
    }

    ws.onopen = () => setStatus('waiting')

    ws.onmessage = async (event) => {
      let msg
      try { msg = JSON.parse(event.data) } catch { return }

      if (msg.type === 'no_producer') {
        setStatus('no_producer')
        return
      }

      if (msg.type === 'offer') {
        await pc.setRemoteDescription({ type: msg.sdpType ?? 'offer', sdp: msg.sdp })
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        ws.send(JSON.stringify({
          type:    'answer',
          sdp:     pc.localDescription.sdp,
          sdpType: pc.localDescription.type,
        }))
      } else if (msg.type === 'ice-candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate({
            candidate:     msg.candidate,
            sdpMid:        msg.sdpMid,
            sdpMLineIndex: msg.sdpMLineIndex,
          }))
        } catch {}
      }
    }

    ws.onerror = () => setStatus('unavailable')
    ws.onclose = (e) => { if (e.code !== 1000) setStatus('ended') }

    return () => {
      pc.close()
      ws.close(1000)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { label, color } = STATUS[status]
  const isLive = status === 'live'
  const isError = status === 'ended' || status === 'unavailable'

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
              {isLive && (
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

        {/* Video area */}
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          background: '#000000',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: isLive ? 'block' : 'none',
            }}
          />

          {!isLive && (
            <div style={{ textAlign: 'center', color: '#aeaeb2' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>
                {isError ? '⚠️' : '📡'}
              </div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color }}>
                {label}
              </p>
              {!isError && (
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
