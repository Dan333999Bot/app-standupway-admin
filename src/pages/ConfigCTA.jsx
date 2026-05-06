import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'

const DEFAULTS = {
  hero_title: 'Parla con un professionista — è gratis',
  hero_subtitle: 'Un colloquio gratuito di 20 minuti. Nessun impegno, solo ascolto professionale.',
  hero_cta_label: 'Prenota il colloquio gratuito',
  hero_cta_url: '/explore',
  chat_cta_label: 'Prenota il primo colloquio gratuito',
  questionnaire_cta_label: 'Prenota il tuo colloquio gratuito',
  questionnaire_cta_sub: 'Parla con un professionista in totale riservatezza',
  percorsi_cta_label: '📞 Prenota il primo colloquio gratuito',
  social_proof_1: '2.4k+',
  social_proof_1_label: 'Persone nel percorso',
  social_proof_2: '89%',
  social_proof_2_label: 'Soddisfazione',
  social_proof_3: '8',
  social_proof_3_label: 'Città in Italia',
  trust_1: 'Anonimato garantito',
  trust_2: 'Detraibile',
  trust_3: 'Senza giudizi',
  footer_note: 'Già registrato?',
}

const STORAGE_KEY = 'sw_admin_cta'

export default function ConfigCTA() {
  const [values, setValues] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } }
    catch { return DEFAULTS }
  })
  const [saved, setSaved] = useState(false)

  function set(key, val) { setValues(prev => ({ ...prev, [key]: val })) }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function reset() {
    setValues(DEFAULTS)
    localStorage.removeItem(STORAGE_KEY)
  }

  const Field = ({ label, k, helper, multiline }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      {multiline ? (
        <textarea
          className="input textarea"
          value={values[k]}
          onChange={e => set(k, e.target.value)}
        />
      ) : (
        <input className="input" value={values[k]} onChange={e => set(k, e.target.value)} />
      )}
      {helper && <p className="helper">{helper}</p>}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">CTA & Testi</h1>
          <p className="section-sub">Modifica tutti i testi e le call-to-action dell'app senza toccare il codice</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={reset} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} /> Ripristina default
          </button>
          <button onClick={save} className="btn btn-primary btn-sm" style={{ minWidth: '100px' }}>
            <Save size={14} /> {saved ? '✓ Salvato!' : 'Salva'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Hero / Home */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            🏠 Home — CTA principale
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field k="hero_title" label="Titolo banner" multiline />
            <Field k="hero_subtitle" label="Sottotitolo" multiline />
            <Field k="hero_cta_label" label="Testo pulsante CTA" />
            <Field k="hero_cta_url" label="URL destinazione" helper="Es: /explore oppure https://calendly.com/..." />
          </div>
        </div>

        {/* Social proof */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            📊 Social Proof — numeri
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
            {[
              ['social_proof_1', 'social_proof_1_label', 'Statistica 1'],
              ['social_proof_2', 'social_proof_2_label', 'Statistica 2'],
              ['social_proof_3', 'social_proof_3_label', 'Statistica 3'],
            ].map(([vk, lk, title]) => (
              <div key={vk} className="card" style={{ padding: '14px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '10px' }}>{title}</p>
                <Field k={vk} label="Valore" />
                <Field k={lk} label="Etichetta" />
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            🛡️ Trust badges
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
            <Field k="trust_1" label="Badge 1" />
            <Field k="trust_2" label="Badge 2" />
            <Field k="trust_3" label="Badge 3" />
          </div>
        </div>

        {/* Chat */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            💬 Chat — CTA strip
          </h3>
          <Field k="chat_cta_label" label="Testo CTA nella chat (sopra input)" />
        </div>

        {/* Questionario */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            📋 Questionario — risultato
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field k="questionnaire_cta_label" label="Testo pulsante CTA" />
            <Field k="questionnaire_cta_sub" label="Testo secondario" />
          </div>
        </div>

        {/* Percorsi */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            🗺️ Percorsi — banner
          </h3>
          <Field k="percorsi_cta_label" label="Testo pulsante CTA percorsi" />
        </div>

      </div>
    </div>
  )
}
