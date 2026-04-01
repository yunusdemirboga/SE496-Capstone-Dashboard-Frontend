import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import api from '../api/client'

export default function DetectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['detection', id],
    queryFn: () => api.get(`/detections/${id}`).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/detections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detections'] })
      navigate('/detections')
    },
  })

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#8e8e93', fontSize: '1.05rem' }}>Loading...</div>
  )
  if (!data) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#ff3b30', fontSize: '1.05rem' }}>Detection not found.</div>
  )

  const isDetected = data.drone_detected

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/detections')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          marginBottom: '1.5rem', background: 'none', border: 'none',
          cursor: 'pointer', color: '#007aff', fontSize: '1rem', fontWeight: 500, padding: 0,
        }}
      >
        ← Back to Detections
      </button>

      {/* Image */}
      <div style={{
        width: '100%', maxHeight: '500px', borderRadius: '20px',
        overflow: 'hidden', background: '#e5e5ea', marginBottom: '1.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
      }}>
        {data.image_url ? (
          <img
            src={data.image_url}
            alt="detection"
            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            height: '320px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#aeaeb2', fontSize: '1rem',
          }}>
            No image available
          </div>
        )}
      </div>

      {/* Report card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        padding: '2rem',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em' }}>
            Detection Report
          </h2>
          <span style={{
            padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600,
            background: isDetected ? '#fff0f0' : '#f0fff4',
            color: isDetected ? '#ff3b30' : '#34c759',
          }}>
            {isDetected ? 'DRONE DETECTED' : 'CLEAR'}
          </span>
        </div>

        {/* Info grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem',
          background: '#f2f2f7', borderRadius: '14px', padding: '1.25rem',
        }}>
          <InfoItem label="Detected At" value={format(new Date(data.detected_at), 'PPpp')} />
          <InfoItem label="Record Created" value={format(new Date(data.created_at), 'PPpp')} />
          <InfoItem label="Base Station ID" value={data.base_station_id} mono />
        </div>

        {/* Confidence bars */}
        {(data.yolo_confidence !== null || data.acoustic_confidence !== null) && (
          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Confidence Scores
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.yolo_confidence !== null && (
                <ConfidenceBar label="YOLO Vision" value={data.yolo_confidence} />
              )}
              {data.acoustic_confidence !== null && (
                <ConfidenceBar label="Acoustic" value={data.acoustic_confidence} />
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI Report
            </p>
            <p style={{
              margin: 0, fontSize: '1rem', color: '#3a3a3c', lineHeight: 1.75,
              background: '#f2f2f7', borderRadius: '14px', padding: '1.25rem',
            }}>
              {data.description}
            </p>
          </div>
        )}

        {/* Delete */}
        <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #f2f2f7' }}>
          <button
            onClick={() => { if (window.confirm('Delete this detection?')) deleteMutation.mutate() }}
            disabled={deleteMutation.isPending}
            style={{
              padding: '0.65rem 1.4rem', borderRadius: '12px', fontSize: '0.95rem',
              fontWeight: 500, border: '1.5px solid #ffcdd2', background: '#fff5f5',
              color: '#ff3b30', cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: deleteMutation.isPending ? 0.6 : 1,
            }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Detection'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, mono }) {
  return (
    <div>
      <p style={{ margin: '0 0 0.3rem', fontSize: '0.8rem', fontWeight: 600, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '0.95rem', color: '#1c1c1e', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value}
      </p>
    </div>
  )
}

function ConfidenceBar({ label, value }) {
  const pct = (value * 100).toFixed(1)
  const color = value >= 0.75 ? '#ff3b30' : value >= 0.5 ? '#ff9500' : '#34c759'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.95rem', color: '#3a3a3c', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.95rem', color, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: '8px', background: '#e5e5ea', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: '999px', transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}
