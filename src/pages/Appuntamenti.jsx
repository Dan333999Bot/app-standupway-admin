import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, Trash2, CalendarDays, Clock, User, Mail, Phone } from 'lucide-react'

export default function Appuntamenti() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
    setRows(data || [])
    setLoading(false)
  }

  async function del(id) {
    if (!confirm('Eliminare questa prenotazione?')) return
    setDeleting(id)
    await supabase.from('appointments').delete().eq('id', id)
    setRows(r => r.filter(x => x.id !== id))
    setDeleting(null)
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const upcoming = rows.filter(r => r.appointment_date >= new Date().toISOString().split('T')[0])
  const past = rows.filter(r => r.appointment_date < new Date().toISOString().split('T')[0])

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-3)' }}>Caricamento…</div>

  const Row = ({ r }) => (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      {/* Data + ora */}
      <div style={{ minWidth: '130px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
          <CalendarDays size={14} style={{ color: 'var(--primary)' }} />
          {formatDate(r.appointment_date)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
          <Clock size={12} /> {r.appointment_time}
        </div>
      </div>

      {/* Nome */}
      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
          <User size={13} style={{ color: 'var(--text-3)' }} />
          {r.name} {r.surname}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
          <Mail size={11} />
          <a href={`mailto:${r.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{r.email}</a>
        </div>
        {r.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            <Phone size={11} /> {r.phone}
          </div>
        )}
      </div>

      {/* Prenotato il */}
      <div style={{ fontSize: '11px', color: 'var(--text-3)', minWidth: '100px' }}>
        Prenotato il<br />
        <span style={{ color: 'var(--text-2)' }}>
          {new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Azioni */}
      <button
        onClick={() => del(r.id)}
        disabled={deleting === r.id}
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--danger)', flexShrink: 0 }}
        title="Elimina"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Appuntamenti</h1>
          <p className="section-sub">{upcoming.length} prossimi · {past.length} passati</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Ricarica
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
          Nessuna prenotazione ancora.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
                Prossimi appuntamenti ({upcoming.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcoming.map(r => <Row key={r.id} r={r} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', marginBottom: '12px' }}>
                Passati ({past.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6 }}>
                {past.map(r => <Row key={r.id} r={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
