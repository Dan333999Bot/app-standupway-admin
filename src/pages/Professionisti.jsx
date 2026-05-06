import { useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'sw_admin_pros'

const DEFAULTS = [
  { id: 1, name: 'Dott.ssa Elena Ferretti', role: 'Psicologa clinica', specialties: 'Alcol, Cannabis', city: 'Milano', available: true, slots: 'Lun, Mer, Ven 9-18', photo: '' },
  { id: 2, name: 'Dott. Marco Vitale', role: 'Psichiatra', specialties: 'Oppiacei, Cocaina', city: 'Roma', available: true, slots: 'Mar, Gio 10-19', photo: '' },
  { id: 3, name: 'Dott.ssa Sara Conti', role: 'Psicoterapeuta', specialties: 'Ludopatia, Sesso', city: 'Online', available: false, slots: 'Sab 9-13', photo: '' },
]

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULTS }
  catch { return DEFAULTS }
}

export default function Professionisti() {
  const [pros, setPros] = useState(load)
  const [editing, setEditing] = useState(null) // id being edited
  const [saved, setSaved] = useState(false)

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pros))
    setSaved(true)
    setEditing(null)
    setTimeout(() => setSaved(false), 2500)
  }

  function addPro() {
    const newPro = {
      id: Date.now(), name: '', role: '', specialties: '',
      city: '', available: true, slots: '', photo: '',
    }
    setPros(prev => [...prev, newPro])
    setEditing(newPro.id)
  }

  function updatePro(id, field, val) {
    setPros(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  function deletePro(id) {
    if (!confirm('Rimuovere questo professionista?')) return
    setPros(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Professionisti</h1>
          <p className="section-sub">Gestisci la disponibilità e i profili dei professionisti mostrati agli utenti</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={addPro} className="btn btn-secondary btn-sm">
            <Plus size={14} /> Aggiungi
          </button>
          <button onClick={save} className="btn btn-primary btn-sm">
            <Save size={14} /> {saved ? '✓ Salvato!' : 'Salva'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {pros.map(pro => (
          <div key={pro.id} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              {/* Avatar */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--primary-bg)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', border: '1px solid var(--primary-light)',
              }}>
                👤
              </div>

              <div style={{ flex: 1 }}>
                {editing === pro.id ? (
                  /* Edit mode */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      ['name', 'Nome completo'],
                      ['role', 'Ruolo (es. Psicologa clinica)'],
                      ['specialties', 'Specializzazioni'],
                      ['city', 'Città / Online'],
                      ['slots', 'Disponibilità (es. Lun, Mer 9-18)'],
                    ].map(([field, label]) => (
                      <div key={field} className="form-group" style={{ gridColumn: field === 'slots' ? '1 / -1' : undefined }}>
                        <label className="label">{label}</label>
                        <input
                          className="input"
                          value={pro[field]}
                          onChange={e => updatePro(pro.id, field, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <div className="toggle-wrap">
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={pro.available}
                            onChange={e => updatePro(pro.id, 'available', e.target.checked)}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span className="label" style={{ margin: 0 }}>Disponibile per nuovi utenti</span>
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditing(null)} className="btn btn-secondary btn-sm">Annulla</button>
                      <button onClick={save} className="btn btn-primary btn-sm"><Save size={13} /> Salva</button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{pro.name || 'Nuovo professionista'}</p>
                      <span className={`badge ${pro.available ? 'badge-green' : 'badge-gray'}`}>
                        {pro.available ? 'Disponibile' : 'Non disponibile'}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>{pro.role}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-3)' }}>
                      {pro.city && <span>📍 {pro.city}</span>}
                      {pro.slots && <span>🕐 {pro.slots}</span>}
                      {pro.specialties && <span>🎯 {pro.specialties}</span>}
                    </div>
                  </div>
                )}
              </div>

              {editing !== pro.id && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => setEditing(pro.id)} className="btn btn-secondary btn-sm">Modifica</button>
                  <button onClick={() => deletePro(pro.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
