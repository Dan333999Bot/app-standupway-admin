import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Save, MapPin, Calendar } from 'lucide-react'

const EMPTY = {
  title: '', description: '', event_date: '', location: '',
  city: '', price: 'Gratuito', free: true, max_attendees: null,
  image_url: '', stripe_url: '', active: true,
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EventiLive() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('live_events').select('*').order('event_date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function saveEvent() {
    if (!editing) return
    setSaving(true)
    const payload = { ...editing, updated_at: new Date().toISOString() }
    if (!payload.event_date) payload.event_date = null
    if (payload.id) {
      await supabase.from('live_events').update(payload).eq('id', payload.id)
    } else {
      await supabase.from('live_events').insert(payload)
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  async function toggleActive(ev) {
    await supabase.from('live_events').update({ active: !ev.active }).eq('id', ev.id)
    load()
  }

  async function deleteEvent(id) {
    if (!confirm('Eliminare questo evento?')) return
    await supabase.from('live_events').delete().eq('id', id)
    load()
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-3)' }}>Caricamento…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Incontri & Eventi</h1>
          <p className="section-sub">{events.length} eventi — modifica date, location e prezzi</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn btn-primary btn-sm">
          <Plus size={14} /> Nuovo evento
        </button>
      </div>

      {events.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
          Nessun evento. Clicca "Nuovo evento" per aggiungerne uno.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {events.map((ev) => (
          <div key={ev.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', opacity: ev.active ? 1 : 0.5 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{ev.title}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: 'var(--text-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} />{fmtDate(ev.event_date)}</span>
                {ev.city && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} />{ev.city}{ev.location ? ` · ${ev.location}` : ''}</span>}
                <span style={{ fontWeight: 600, color: ev.free ? '#10b981' : 'var(--primary)' }}>{ev.price}</span>
                {ev.max_attendees && <span>Max {ev.max_attendees} posti</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => toggleActive(ev)} className="btn btn-ghost btn-sm" style={{ color: ev.active ? 'var(--primary)' : 'var(--text-3)' }}>
                {ev.active ? 'Attivo' : 'Nascosto'}
              </button>
              <button onClick={() => setEditing({ ...ev, event_date: ev.event_date ? ev.event_date.slice(0, 16) : '' })} className="btn btn-secondary btn-sm">Modifica</button>
              <button onClick={() => deleteEvent(ev.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {editing.id ? 'Modifica evento' : 'Nuovo evento'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'title', label: 'Titolo *', type: 'text' },
                { key: 'description', label: 'Descrizione', type: 'textarea' },
                { key: 'event_date', label: 'Data e ora', type: 'datetime-local' },
                { key: 'city', label: 'Città', type: 'text' },
                { key: 'location', label: 'Indirizzo / Location', type: 'text' },
                { key: 'price', label: 'Prezzo (es. Gratuito / 25€)', type: 'text' },
                { key: 'max_attendees', label: 'Posti max (opzionale)', type: 'number' },
                { key: 'image_url', label: 'URL immagine', type: 'text' },
                { key: 'stripe_url', label: 'URL Stripe / iscrizione', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px' }}>{label}</label>
                  {type === 'textarea' ? (
                    <textarea value={editing[key] ?? ''} onChange={e => setEditing(v => ({ ...v, [key]: e.target.value }))} rows={2} className="input" style={{ width: '100%', resize: 'vertical' }} />
                  ) : (
                    <input type={type} value={editing[key] ?? ''} onChange={e => setEditing(v => ({ ...v, [key]: type === 'number' ? (parseInt(e.target.value) || null) : e.target.value }))} className="input" style={{ width: '100%' }} />
                  )}
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.free ?? true} onChange={e => setEditing(v => ({ ...v, free: e.target.checked }))} />
                Evento gratuito
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing(v => ({ ...v, active: e.target.checked }))} />
                Visibile nell'app
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} className="btn btn-secondary">Annulla</button>
              <button onClick={saveEvent} disabled={saving || !editing.title} className="btn btn-primary">
                <Save size={14} /> {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
