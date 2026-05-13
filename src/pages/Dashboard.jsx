import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Users, TrendingUp, ClipboardCheck, Phone, RefreshCw } from 'lucide-react'
import DateRangeSelector, { resolveRange, applyRange } from '../components/DateRangeSelector'

export default function Dashboard() {
  const [preset, setPreset] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [stats, setStats] = useState({
    users: 0, conversions: 0, questionnaires: 0, events_in_range: 0,
    recent_conversions: [], recent_users: [],
  })
  const [loading, setLoading] = useState(true)

  const handleCustom = (field, val) => {
    if (field === 'from') setCustomFrom(val)
    else setCustomTo(val)
  }

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const range = resolveRange(preset, customFrom, customTo)

      const [usersRes, convRes, qRes, evRes] = await Promise.all([
        // Users filtered by registration date
        applyRange(
          supabase.from('users').select('id, created_at, nickname', { count: 'exact' }).order('created_at', { ascending: false }).limit(8),
          range
        ),
        // Conversions filtered by date
        applyRange(
          supabase.from('conversions').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(8),
          range
        ),
        // Questionnaires: count funnel_step complete events (source of truth)
        applyRange(
          supabase.from('events').select('*', { count: 'exact', head: true })
            .eq('event_type', 'funnel_step').eq('metadata->>step', 'complete'),
          range
        ),
        // Total events in range
        applyRange(
          supabase.from('events').select('id', { count: 'exact' }),
          range
        ),
      ])

      setStats({
        users: usersRes.count || 0,
        conversions: convRes.count || 0,
        questionnaires: qRes.count || 0,
        events_in_range: evRes.count || 0,
        recent_conversions: convRes.data || [],
        recent_users: usersRes.data || [],
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [preset, customFrom, customTo])

  useEffect(() => { loadStats() }, [loadStats])

  const STAT_CARDS = [
    { label: 'Utenti registrati',     value: stats.users,           icon: Users,         color: '#3b82f6' },
    { label: 'Conversioni',           value: stats.conversions,     icon: Phone,         color: '#e53e3e' },
    { label: 'Questionari completati',value: stats.questionnaires,  icon: ClipboardCheck,color: '#10b981' },
    { label: 'Eventi totali',         value: stats.events_in_range, icon: TrendingUp,    color: '#f59e0b' },
  ]

  const typeLabel = {
    call_request: '📞 Colloquio gratuito',
    quote_request: '📋 Preventivo',
    small_purchase: '💳 Acquisto',
    pro_request: '👩‍⚕️ Professionista',
    community: '👥 Comunità',
  }

  const rangeLabel = {
    today: 'Oggi', yesterday: 'Ieri', '7d': 'Ultimi 7 gg',
    '30d': 'Ultimi 30 gg', all: 'Tutto lo storico', custom: 'Periodo personalizzato',
  }

  return (
    <div>
      {/* Header + date selector */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-sub">{rangeLabel[preset] || 'Periodo selezionato'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DateRangeSelector
            preset={preset}
            onPreset={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustom={handleCustom}
          />
          <button onClick={loadStats} className="btn btn-secondary btn-sm" title="Aggiorna">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div className="stat-value">{loading ? '—' : value.toLocaleString('it')}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Conversioni */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Conversioni recenti</h2>
            <span className="badge badge-red">{stats.conversions} nel periodo</span>
          </div>
          <div>
            {loading ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Caricamento...</p>
            ) : stats.recent_conversions.length === 0 ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Nessuna conversione nel periodo</p>
            ) : (
              <table className="table">
                <thead><tr><th>Tipo</th><th>Schermata</th><th>Data</th></tr></thead>
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

        {/* Utenti */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Utenti registrati</h2>
            <span className="badge badge-blue">{stats.users} nel periodo</span>
          </div>
          <div>
            {loading ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Caricamento...</p>
            ) : stats.recent_users.length === 0 ? (
              <p style={{ padding: '20px', color: 'var(--text-3)', textAlign: 'center' }}>Nessun utente nel periodo</p>
            ) : (
              <table className="table">
                <thead><tr><th>Nickname</th><th>Registrazione</th></tr></thead>
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

      <style>{`
        @media (max-width: 900px) {
          [style*="repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
          [style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
