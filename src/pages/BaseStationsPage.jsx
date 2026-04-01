import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../api/client'

export default function BaseStationsPage() {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm()

  const { data: stations, isLoading } = useQuery({
    queryKey: ['base_stations'],
    queryFn: () => api.get('/base_stations/').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/base_stations/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base_stations'] })
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/base_stations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['base_stations'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/base_stations/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['base_stations'] }),
  })

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.03em' }}>
          Base Stations
        </h1>
        <p style={{ margin: '0.3rem 0 0', fontSize: '1rem', color: '#8e8e93' }}>
          Manage registered detection stations
        </p>
      </div>

      {/* Add form */}
      <div style={{
        background: '#ffffff', borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '1.75rem', marginBottom: '1.5rem',
      }}>
        <p style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 600, color: '#1c1c1e' }}>
          Add New Station
        </p>
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            {...register('name')}
            placeholder="Station name"
            required
            style={inputStyle}
          />
          <input
            {...register('latitude', { valueAsNumber: true })}
            placeholder="Latitude"
            type="number"
            step="any"
            required
            style={{ ...inputStyle, maxWidth: '140px' }}
          />
          <input
            {...register('longitude', { valueAsNumber: true })}
            placeholder="Longitude"
            type="number"
            step="any"
            required
            style={{ ...inputStyle, maxWidth: '140px' }}
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            style={{
              padding: '0.7rem 1.4rem', borderRadius: '12px', fontSize: '0.95rem',
              fontWeight: 600, border: 'none', background: '#007aff', color: '#ffffff',
              cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: createMutation.isPending ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Station'}
          </button>
        </form>
        {createMutation.isError && (
          <p style={{ margin: '0.75rem 0 0', color: '#ff3b30', fontSize: '0.9rem' }}>
            {createMutation.error?.response?.data?.detail || 'Failed to add station.'}
          </p>
        )}
      </div>

      {/* List */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8e8e93', fontSize: '1.05rem' }}>
          Loading stations...
        </div>
      )}
      {!isLoading && (!stations || stations.length === 0) && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8e8e93', fontSize: '1.05rem' }}>
          No stations yet.
        </div>
      )}

      {stations && stations.length > 0 && (
        <div style={{ background: '#ffffff', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {stations.map((s, i) => (
            <StationRow
              key={s.id}
              station={s}
              isLast={i === stations.length - 1}
              onDelete={() => { if (window.confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id) }}
              onSave={(data) => updateMutation.mutate({ id: s.id, data })}
              isSaving={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StationRow({ station, isLast, onDelete, onSave, isSaving }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(station.name)
  const [latitude, setLatitude] = useState(station.latitude)
  const [longitude, setLongitude] = useState(station.longitude)

  const handleSave = () => {
    onSave({ name, latitude: parseFloat(latitude), longitude: parseFloat(longitude) })
    setEditing(false)
  }

  const handleCancel = () => {
    setName(station.name)
    setLatitude(station.latitude)
    setLongitude(station.longitude)
    setEditing(false)
  }

  return (
    <div style={{
      padding: '1.1rem 1.5rem',
      borderBottom: isLast ? 'none' : '1px solid #f2f2f7',
    }}>
      {editing ? (
        /* Edit mode */
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Station name"
              style={inputStyle}
            />
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude"
              type="number"
              step="any"
              style={{ ...inputStyle, maxWidth: '140px' }}
            />
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude"
              type="number"
              step="any"
              style={{ ...inputStyle, maxWidth: '140px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '10px', fontSize: '0.9rem',
                fontWeight: 600, border: 'none', background: '#007aff', color: '#fff',
                cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '10px', fontSize: '0.9rem',
                fontWeight: 500, border: '1.5px solid #e5e5ea', background: 'transparent',
                color: '#3a3a3c', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#1c1c1e', fontSize: '1rem' }}>{station.name}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#8e8e93', fontFamily: 'monospace' }}>
              {station.latitude}, {station.longitude}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.9rem',
                fontWeight: 500, border: '1.5px solid #d1d1d6', background: '#f2f2f7',
                color: '#3a3a3c', cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.9rem',
                fontWeight: 500, border: '1.5px solid #ffcdd2', background: '#fff5f5',
                color: '#ff3b30', cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  flex: 1,
  minWidth: '160px',
  padding: '0.7rem 1rem',
  fontSize: '0.95rem',
  border: '1.5px solid #e5e5ea',
  borderRadius: '12px',
  outline: 'none',
  color: '#1c1c1e',
  background: '#f2f2f7',
}
