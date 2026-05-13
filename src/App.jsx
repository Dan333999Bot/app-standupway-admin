import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Config from './pages/Config'
import ConfigCTA from './pages/ConfigCTA'
import FeatureFlags from './pages/FeatureFlags'
import Utenti from './pages/Utenti'
import Professionisti from './pages/Professionisti'
import Questionari from './pages/Questionari'
import AdminCorsi from './pages/AdminCorsi'
import EventiLive from './pages/EventiLive'
import Appuntamenti from './pages/Appuntamenti'
import RichiesteCorsi from './pages/RichiesteCorsi'
import FunnelV2 from './pages/FunnelV2'

const AUTH_KEY = 'sw_admin_auth'

function PrivateRoute({ children }) {
  const auth = sessionStorage.getItem(AUTH_KEY)
  return auth === 'true' ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="config" element={<Config />} />
          <Route path="cta" element={<ConfigCTA />} />
          <Route path="flags" element={<FeatureFlags />} />
          <Route path="utenti" element={<Utenti />} />
          <Route path="professionisti" element={<Professionisti />} />
          <Route path="questionari" element={<Questionari />} />
          <Route path="corsi" element={<AdminCorsi />} />
          <Route path="eventi" element={<EventiLive />} />
          <Route path="appuntamenti" element={<Appuntamenti />} />
          <Route path="richieste-corsi" element={<RichiesteCorsi />} />
          <Route path="funnel-v2" element={<FunnelV2 />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
