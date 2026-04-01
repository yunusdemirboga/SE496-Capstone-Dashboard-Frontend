import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../api/client'
import { useDetectionFeed } from '../hooks/useDetectionFeed'

const LIMIT = 50

export default function DetectionsPage() {
  useDetectionFeed()

  const [page, setPage] = useState(0)
  const [droneDetected, setDroneDetected] = useState(undefined)
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['detections', page, droneDetected],
    queryFn: () =>
      api.get('/detections/', {
        params: {
          limit: LIMIT,
          offset: page * LIMIT,
          ...(droneDetected !== undefined && { drone_detected: droneDetected }),
        },
      }).then((r) => r.data),
  })

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.03em' }}>
            Detections
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '1rem', color: '#8e8e93' }}>
            {data?.total ?? 0} total records
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { label: 'All', value: undefined },
            { label: 'Detected', value: true },
            { label: 'Clear', value: false },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => { setDroneDetected(value); setPage(0) }}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '999px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: droneDetected === value ? '#007aff' : '#e5e5ea',
                color: droneDetected === value ? '#ffffff' : '#3a3a3c',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#8e8e93', fontSize: '1.05rem' }}>
          Loading detections...
        </div>
      )}
      {isError && (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#ff3b30', fontSize: '1.05rem' }}>
          Failed to load detections.
        </div>
      )}
      {!isLoading && !isError && data?.detections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#8e8e93', fontSize: '1.05rem' }}>
          No detections found.
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.25rem',
      }}>
        {data?.detections.map((d) => (
          <DetectionCard key={d.id} detection={d} onClick={() => navigate(`/detections/${d.id}`)} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' }}>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            style={paginationBtnStyle(page === 0)}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '0.95rem', color: '#8e8e93' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            style={paginationBtnStyle(page + 1 >= totalPages)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

function DetectionCard({ detection, onClick }) {
  const isDetected = detection.drone_detected

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.13)'
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Image */}
      <div style={{ width: '100%', height: '200px', background: '#f2f2f7', overflow: 'hidden' }}>
        {detection.image_url ? (
          <img
            src={detection.image_url}
            alt="detection"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#aeaeb2', fontSize: '0.95rem',
          }}>
            No image
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9rem', color: '#8e8e93', fontWeight: 400 }}>
          {format(new Date(detection.detected_at), 'MMM d, yyyy · HH:mm')}
        </span>
        <span style={{
          padding: '0.3rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 600,
          background: isDetected ? '#fff0f0' : '#f0fff4',
          color: isDetected ? '#ff3b30' : '#34c759',
        }}>
          {isDetected ? 'DETECTED' : 'CLEAR'}
        </span>
      </div>
    </div>
  )
}

function paginationBtnStyle(disabled) {
  return {
    padding: '0.6rem 1.4rem',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 500,
    border: '1.5px solid #d1d1d6',
    background: disabled ? '#f2f2f7' : '#ffffff',
    color: disabled ? '#aeaeb2' : '#3a3a3c',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
