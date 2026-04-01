import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DetectionsPage from './pages/DetectionsPage'
import DetectionDetailPage from './pages/DetectionDetailPage'
import BaseStationsPage from './pages/BaseStationsPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/detections" element={<DetectionsPage />} />
          <Route path="/detections/:id" element={<DetectionDetailPage />} />
          <Route path="/base-stations" element={<BaseStationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/detections" />} />
      </Routes>
    </BrowserRouter>
  )
}
