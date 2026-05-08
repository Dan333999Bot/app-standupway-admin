import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, BookOpen, Mail, User } from 'lucide-react'

export default function RichiesteCorsi() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('course_access_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  // Conta richieste per corso
  const byCorso = rows.reduce((acc, r) => {
    const k = r.corso_title || 'Sconosciuto'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title">Richieste Corsi</h1>
          <p className="section-sub">Utenti che hanno richiesto accesso ai corsi in uscita</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Aggiorna
        </button>
      </div>

      {/* Riepilogo per corso */}
      {Object.keys(byCorso).length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
            Interesse per corso
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(byCorso).sort((a, b) => b[1] - a[1]).map(([title, count]) => (
              <div key={title} style={{
                padding: '10px 16px', borderRadius: '10px',
                background: 'var(--primary)18', border: '1px solid var(--primary)30',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{title}</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabella richieste */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
            Richieste ({rows.length})
          </h3>
        </div>

        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>Caricamento...</p>
        ) : rows.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
            Nessuna richiesta ricevuta ancora
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Corso', 'Email', 'User ID', 'Data'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{r.corso_title || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    {r.email ? (
                      <a href={`mailto:${r.email}`} style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {r.email}
                      </a>
                    ) : <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <code style={{ fontSize: '11px', color: 'var(--text-3)' }}>{r.user_id || 'anonimo'}</code>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: '12px', color: 'var(--text-3)' }}>
                    {new Date(r.created_at).toLocaleDateString('it')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
