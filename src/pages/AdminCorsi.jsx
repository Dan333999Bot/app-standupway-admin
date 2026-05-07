import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Save, GripVertical, ExternalLink } from 'lucide-react'

const EMPTY = {
  title: '', description: '', duration: '', lessons: 0,
  price: 'Gratuito', free: true, image_url: '', stripe_url: '',
  sort_order: 0, active: true,
}

export default function AdminCorsi() {
  const [corsi, setCorsi] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // corso object being edited
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('corsi').select('*').order('sort_order')
    setCorsi(data || [])
    setLoading(false)
  }

  async function saveCorso() {
    if (!editing) return
    setSaving(true)
    const payload = { ...editing, updated_at: new Date().toISOString() }
    if (payload.id) {
      await supabase.from('corsi').update(payload).eq('id', payload.id)
    } else {
      const maxOrder = Math.max(0, ...corsi.map(c => c.sort_order))
      payload.sort_order = maxOrder + 1
      await supabase.from('corsi').insert(payload)
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  async function toggleActive(corso) {
    await supabase.from('corsi').update({ active: !corso.active }).eq('id', corso.id)
    load()
  }

  async function deleteCorso(id) {
    if (!confirm('Eliminare questo corso?')) return
    await supabase.from('corsi').delete().eq('id', id)
    load()
  }

  async function moveOrder(corso, dir) {
    const idx = corsi.findIndex(c => c.id === corso.id)
    const swap = corsi[idx + dir]
    if (!swap) return
    await supabase.from('corsi').update({ sort_order: swap.sort_order }).eq('id', corso.id)
    await supabase.from('corsi').update({ sort_order: corso.sort_order }).eq('id', swap.id)
    load()
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-3)' }}>Caricamento…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Corsi</h1>
          <p className="section-sub">{corsi.length} corsi — modifica titoli, prezzi, URL Stripe e ordine</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn btn-primary btn-sm">
          <Plus size={14} /> Nuovo corso
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {corsi.map((corso, idx) => (
          <div key={corso.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', opacity: corso.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button onClick={() => moveOrder(corso, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '1px', fontSize: '10px' }}>▲</button>
              <button onClick={() => moveOrder(corso, 1)} disabled={idx === corsi.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '1px', fontSize: '10px' }}>▼</button>
            </div>
            {corso.image_url && <img src={corso.image_url} alt="" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{corso.title}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {corso.duration} · {corso.lessons} lez. ·{' '}
                <span style={{ fontWeight: 600, color: corso.free ? '#10b981' : 'var(--primary)' }}>{corso.price}</span>
                {corso.stripe_url && <span style={{ marginLeft: '6px', color: 'var(--text-3)' }}>· Stripe ✓</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => toggleActive(corso)} className="btn btn-ghost btn-sm" style={{ color: corso.active ? 'var(--primary)' : 'var(--text-3)' }}>
                {corso.active ? 'Attivo' : 'Nascosto'}
              </button>
              <button onClick={() => setEditing({ ...corso })} className="btn btn-secondary btn-sm">Modifica</button>
              <button onClick={() => deleteCorso(corso.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {editing.id ? 'Modifica corso' : 'Nuovo corso'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'title', label: 'Titolo *', type: 'text' },
                { key: 'description', label: 'Descrizione', type: 'textarea' },
                { key: 'duration', label: 'Durata (es. 2h 30min)', type: 'text' },
                { key: 'lessons', label: 'N° lezioni', type: 'number' },
                { key: 'price', label: 'Prezzo (es. Gratuito / 29€)', type: 'text' },
                { key: 'image_url', label: 'URL immagine copertina', type: 'text' },
                { key: 'stripe_url', label: 'URL Stripe (lascia vuoto se gratuito)', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px' }}>{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={editing[key] ?? ''}
                      onChange={e => setEditing(v => ({ ...v, [key]: e.target.value }))}
                      rows={2}
                      className="input"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  ) : (
                    <input
                      type={type}
                      value={editing[key] ?? ''}
                      onChange={e => setEditing(v => ({ ...v, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.free ?? true} onChange={e => setEditing(v => ({ ...v, free: e.target.checked }))} />
                Corso gratuito
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing(v => ({ ...v, active: e.target.checked }))} />
                Visibile nell'app
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} className="btn btn-secondary">Annulla</button>
              <button onClick={saveCorso} disabled={saving || !editing.title} className="btn btn-primary">
                <Save size={14} /> {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
