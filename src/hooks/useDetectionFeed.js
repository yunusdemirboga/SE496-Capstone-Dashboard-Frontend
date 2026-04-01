import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const WS_URL = import.meta.env.VITE_API_URL.replace('http', 'ws') + '/ws/feed'

export function useDetectionFeed() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const ws = new WebSocket(WS_URL)

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'new_detection') {
        queryClient.invalidateQueries({ queryKey: ['detections'] })
      }
    }

    ws.onerror = () => ws.close()

    return () => ws.close()
  }, [queryClient])
}
