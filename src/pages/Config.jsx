import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Save, RefreshCw, ExternalLink } from 'lucide-react'

const FIELDS = [
  {
    section: 'Stripe – Pagamenti',
    fields: [
      { key: 'stripe_colloquio_url', label: 'URL colloquio (49€)', placeholder: 'https://buy.stripe.com/...' },
      { key: 'stripe_percorso_6m_url', label: 'URL percorso 6 mesi', placeholder: 'https://buy.stripe.com/...' },
      { key: 'stripe_percorso_12m_url', label: 'URL percorso 12 mesi', placeholder: 'https://buy.stripe.com/...' },
    ],
  },
  {
    section: 'Calendly – Prenotazioni',
    note: 'Incolla l\'URL dell\'evento Calendly (es. https://calendly.com/nome-org/colloquio). Verrà mostrato come widget inline nella pagina di prenotazione.',
    fields: [
      { key: 'calendly_embed_url', label: 'URL evento Calendly', placeholder: 'https://calendly.com/...' },
    ],
  },
  {
    section: 'Video Home – Sezione "Guarda in ordine"',
    note: 'Incolla l\'URL embed di YouTube (es. https://www.youtube.com/embed/VIDEO_ID) o Vimeo. Lascia vuoto per nascondere il video.',
    fields: [
      { key: 'home_video_1_title', label: 'Video 1 – Titolo', placeholder: 'Cos\'è StandUpWay' },
      { key: 'home_video_1_url', label: 'Video 1 – URL embed', placeholder: 'https://www.youtube.com/embed/...' },
      { key: 'home_video_2_title', label: 'Video 2 – Titolo', placeholder: 'Come iniziare un percorso' },
      { key: 'home_video_2_url', label: 'Video 2 – URL embed', placeholder: 'https://www.youtube.com/embed/...' },
    ],
  },
]

export default function Config() {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('app_config').select('key,value')
    if (data) {
      const map = {}
      data.forEach(({ key, value }) => { map[key] = value || '' })
      setValues(map)
    }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const upserts = Object.entries(values).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }))
    await supabase.from('app_config').upsert(upserts, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-3)' }}>Caricamento…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Configurazione</h1>
          <p className="section-sub">Stripe URLs, video embed, impostazioni generali</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={load} className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Ricarica</button>
          <button onClick={save} disabled={saving} className="btn btn-primary btn-sm">
            <Save size={14} /> {saving ? 'Salvataggio…' : saved ? 'Salvato ✓' : 'Salva tutto'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {FIELDS.map(({ section, note, fields }) => (
          <div key={section} className="card" style={{ padding: '20px 24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: note ? '6px' : '18px' }}>
              {section}
            </h2>
            {note && <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '18px', lineHeight: 1.5 }}>{note}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {fields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
                    {label}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={values[key] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="input"
                      style={{ flex: 1 }}
                    />
                    {values[key] && (
                      <a href={values[key]} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Apri link">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
