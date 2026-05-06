import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Megaphone, ToggleLeft, Users,
  UserCheck, ClipboardList, LogOut, Menu, X,
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { path: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/cta',            label: 'CTA & Testi',     icon: Megaphone },
  { path: '/flags',          label: 'Feature Flags',   icon: ToggleLeft },
  { path: '/utenti',         label: 'Utenti & Lead',   icon: Users },
  { path: '/professionisti', label: 'Professionisti',  icon: UserCheck },
  { path: '/questionari',    label: 'Questionari',     icon: ClipboardList },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  function logout() {
    sessionStorage.removeItem('sw_admin_auth')
    navigate('/login')
  }

  const Sidebar = () => (
    <aside style={{
      width: '240px', minHeight: '100vh', background: 'var(--sidebar)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      padding: '20px 12px', flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '28px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'var(--primary)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>S</span>
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>StandUpWay</p>
          <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setMobileOpen(false) }}
              className={`nav-link${active ? ' active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <button onClick={logout} className="nav-link" style={{ marginTop: '8px', color: 'var(--danger)' }}>
        <LogOut size={17} />
        Esci
      </button>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>
      <Sidebar />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 40, display: 'none',
          }}
        />
      )}

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Mobile top bar */}
        <div style={{
          display: 'none', alignItems: 'center', gap: '12px',
          padding: '14px 16px', background: 'var(--sidebar)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button onClick={() => setMobileOpen(true)} className="btn-ghost">
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>StandUpWay Admin</span>
        </div>

        <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
