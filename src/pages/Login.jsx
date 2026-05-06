import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CORRECT = import.meta.env.VITE_ADMIN_PASSWORD || 'standupway_admin_2026'

export default function Login() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (password === CORRECT) {
        sessionStorage.setItem('sw_admin_auth', 'true')
        navigate('/dashboard')
      } else {
        setError(true)
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '40px 36px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'var(--primary)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
          }}>
            <span style={{ color: 'white', fontSize: '22px', fontWeight: 800 }}>S</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            StandUpWay Admin
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>Pannello di controllo riservato</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Password di accesso</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              placeholder="••••••••••••"
              autoFocus
              style={{ borderColor: error ? 'var(--danger)' : undefined }}
            />
            {error && (
              <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '4px' }}>
                Password errata. Riprova.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Accesso...' : 'Accedi →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-3)', marginTop: '24px' }}>
          Accesso riservato al team StandUpWay.<br />
          Non condividere questa URL.
        </p>
      </div>
    </div>
  )
}
