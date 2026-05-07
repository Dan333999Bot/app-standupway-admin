import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, RefreshCw, Save, ChevronDown, ChevronUp } from 'lucide-react'

const PERCORSO_LABELS = {
  alcol: 'Alcol', 'crack-cocaina': 'Crack/Cocaina', ludopatia: 'Ludopatia',
  oppiacei: 'Oppiacei', cannabis: 'Cannabis', 'sesso-pornografia': 'Sesso/Porno', famiglie: 'Famiglie',
}
const PERCORSO_OPTIONS = ['', ...Object.keys(PERCORSO_LABELS)]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

const LABEL = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px' }

export default function Utenti() {
  const [users, setUsers] = useState([])
  const [userStates, setUserStates] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [editState, setEditState] = useState({})
  const [saving, setSaving] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [eventsRes, statesRes] = await Promise.all([
        supabase.from('events').select('user_id, created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('user_state').select('*'),
      ])

      const byUser = {}
      for (const ev of eventsRes.data || []) {
        if (!ev.user_id) continue
        if (!byUser[ev.user_id]) {
          byUser[ev.user_id] = { user_id: ev.user_id, first_seen: ev.created_at, last_seen: ev.created_at, events: 0 }
        }
        byUser[ev.user_id].events++
        if (ev.created_at > byUser[ev.user_id].last_seen) byUser[ev.user_id].last_seen = ev.created_at
        if (ev.created_at < byUser[ev.user_id].first_seen) byUser[ev.user_id].first_seen = ev.created_at
      }

      const statesMap = {}
      for (const s of statesRes.data || []) statesMap[s.user_id] = s

      setUsers(Object.values(byUser).sort((a, b) => b.last_seen.localeCompare(a.last_seen)))
      setUserStates(statesMap)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function openUser(uid) {
    setExpanded(prev => prev === uid ? null : uid)
    if (expanded === uid) return
    const existing = userStates[uid]
    setEditState(v => ({
      ...v,
      [uid]: existing ? { ...existing } : {
        user_id: uid,
        first_colloquio_done: false, first_colloquio_date: null,
        percorso_active: false, percorso_start_date: null,
        percorso_level: null, percorso_type: null, percorso_duration: null,
        preventivo_unlocked: false, clean_date: null, notes: '',
      },
    }))
  }

  async function saveState(uid) {
    setSaving(uid)
    const payload = { ...editState[uid], updated_at: new Date().toISOString() }
    await supabase.from('user_state').upsert(payload, { onConflict: 'user_id' })
    setUserStates(v => ({ ...v, [uid]: payload }))
    setSaving(null)
  }

  function patch(uid, key, value) {
    setEditState(v => ({ ...v, [uid]: { ...v[uid], [key]: value } }))
  }

  const filtered = users.filter(u => !search || u.user_id.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-3)' }}>Caricamento…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Utenti & Percorso</h1>
          <p className="section-sub">{users.length} utenti rilevati — gestisci colloqui e stato percorso</p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Aggiorna</button>
      </div>

      <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '360px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per user_id…" className="input" style={{ paddingLeft: '32px', width: '100%' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.map(u => {
          const st = userStates[u.user_id]
          const es = editState[u.user_id] || {}
          const open = expanded === u.user_id

          return (
            <div key={u.user_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => openUser(u.user_id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.user_id}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '3px', fontSize: '11px', color: 'var(--text-3)' }}>
                    <span>Prima visita: {formatDate(u.first_seen)}</span>
                    <span>Ultima: {formatDate(u.last_seen)}</span>
                    <span>{u.events} eventi</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {st?.percorso_active && <span className="badge badge-green">Percorso attivo</span>}
                  {st?.first_colloquio_done && !st?.percorso_active && <span className="badge badge-yellow">Colloquio ✓</span>}
                  {st?.percorso_type && <span className="badge">{PERCORSO_LABELS[st.percorso_type] || st.percorso_type}</span>}
                </div>
                {open ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
              </button>

              {open && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', background: 'var(--bg)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>

                    <div>
                      <label style={LABEL}>Primo colloquio</label>
                      <select value={es.first_colloquio_done ? '1' : '0'} onChange={e => patch(u.user_id, 'first_colloquio_done', e.target.value === '1')} className="input" style={{ width: '100%' }}>
                        <option value="0">Non ancora</option>
                        <option value="1">Completato ✓</option>
                      </select>
                    </div>

                    <div>
                      <label style={LABEL}>Data colloquio</label>
                      <input type="date" value={es.first_colloquio_date ? es.first_colloquio_date.slice(0, 10) : ''} onChange={e => patch(u.user_id, 'first_colloquio_date', e.target.value || null)} className="input" style={{ width: '100%' }} />
                    </div>

                    <div>
                      <label style={LABEL}>Percorso attivo</label>
                      <select value={es.percorso_active ? '1' : '0'} onChange={e => patch(u.user_id, 'percorso_active', e.target.value === '1')} className="input" style={{ width: '100%' }}>
                        <option value="0">No</option>
                        <option value="1">Sì — iniziato ✓</option>
                      </select>
                    </div>

                    <div>
                      <label style={LABEL}>Data inizio percorso</label>
                      <input type="date" value={es.percorso_start_date ? es.percorso_start_date.slice(0, 10) : ''} onChange={e => patch(u.user_id, 'percorso_start_date', e.target.value || null)} className="input" style={{ width: '100%' }} />
                    </div>

                    <div>
                      <label style={LABEL}>Livello dipendenza</label>
                      <select value={es.percorso_level || ''} onChange={e => patch(u.user_id, 'percorso_level', e.target.value || null)} className="input" style={{ width: '100%' }}>
                        <option value="">— non impostato —</option>
                        <option value="basso">Basso</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto</option>
                      </select>
                    </div>

                    <div>
                      <label style={LABEL}>Tipo dipendenza</label>
                      <select value={es.percorso_type || ''} onChange={e => patch(u.user_id, 'percorso_type', e.target.value || null)} className="input" style={{ width: '100%' }}>
                        {PERCORSO_OPTIONS.map(k => <option key={k} value={k}>{k ? (PERCORSO_LABELS[k] || k) : '— non impostato —'}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={LABEL}>Durata percorso</label>
                      <select value={es.percorso_duration || ''} onChange={e => patch(u.user_id, 'percorso_duration', e.target.value || null)} className="input" style={{ width: '100%' }}>
                        <option value="">— non impostato —</option>
                        <option value="6m">6 mesi</option>
                        <option value="12m">12 mesi</option>
                      </select>
                    </div>

                    <div>
                      <label style={LABEL}>Data clean (contagiorni)</label>
                      <input type="date" value={es.clean_date ? es.clean_date.slice(0, 10) : ''} onChange={e => patch(u.user_id, 'clean_date', e.target.value || null)} className="input" style={{ width: '100%' }} />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={LABEL}>Note interne</label>
                      <textarea value={es.notes || ''} onChange={e => patch(u.user_id, 'notes', e.target.value)} rows={2} className="input" style={{ width: '100%', resize: 'vertical' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button onClick={() => saveState(u.user_id)} disabled={saving === u.user_id} className="btn btn-primary btn-sm">
                      <Save size={14} /> {saving === u.user_id ? 'Salvataggio…' : 'Salva stato utente'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
