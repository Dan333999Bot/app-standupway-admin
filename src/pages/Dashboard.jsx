import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, TrendingUp, ClipboardCheck, Phone, ArrowUpRight } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0, conversions: 0, questionnaires: 0, events_today: 0,
    recent_conversions: [], recent_users: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [usersRes, convRes, qRes, evRes] = await Promise.all([
        supabase.from('users').select('id, created_at, nickname', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
        supabase.from('conversions').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(8),
        supabase.from('questionnaire_responses').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }).gte('created_at', today),
      ])

      setStats({
        users: usersRes.count || 0,
        conversions: convRes.count || 0,
        questionnaires: qRes.count || 0,
        events_today: evRes.count || 0,
        recent_conversions: convRes.data || [],
        recent_users: usersRes.data || [],
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const STAT_CARDS = [
    { label: 'Utenti totali',        value: stats.users,          icon: Users,          color: '#3b82f6' },
    { label: 'Conversioni totali',   value: stats.conversions,    icon: Phone,          color: '#e53e3e' },
    { label: 'Questionari completati', value: stats.questionnaires, icon: ClipboardCheck, color: '#10b981' },
    { label: 'Eventi oggi',          value: stats.events_today,   icon: TrendingUp,     color: '#f59e0b' },
  ]

  const typeLabel = {
    call_request: '📞 Colloquio gratuito',
    quote_request: '📋 Preventivo',
    small_purchase: '💳 Acquisto',
    pro_request: '👩‍⚕️ Professionista',
    community: '👥 Comunità',
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-sub">Panoramica in tempo reale — aggiornata ora</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div className="stat-value">{loading ? '—' : value.toLocaleString('it')}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Conversioni recenti */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Conversioni recenti</h2>
            <span className="badge badge-red">{stats.conversions} totali</span>
          </div>
          <div>
            {loading ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Caricamento...</p>
            ) : stats.recent_conversions.length === 0 ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Nessuna conversione ancora</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Schermata</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_conversions.map(c => (
                    <tr key={c.id}>
                      <td>{typeLabel[c.conversion_type] || c.conversion_type}</td>
                      <td><span className="badge badge-gray">{c.source_screen}</span></td>
                      <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                        {new Date(c.created_at).toLocaleDateString('it')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Utenti recenti */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Ultimi utenti</h2>
            <span className="badge badge-blue">{stats.users} totali</span>
          </div>
          <div>
            {loading ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Caricamento...</p>
            ) : stats.recent_users.length === 0 ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Nessun utente ancora</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Nickname</th>
                    <th>Registrazione</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.nickname || '—'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                        {new Date(u.created_at).toLocaleDateString('it')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Responsive fix */}
      <style>{`
        @media (max-width: 900px) {
          [style*="repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
          [style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
